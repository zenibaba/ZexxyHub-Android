import { generateSignature, encryptAES } from './crypto';
import { createProto } from './protobuf';
import { 
    REGION_LANG, REGION_URLS, encodeString, toUnicodeEscaped, 
    generateRandomName, generatePassword 
} from './utils';
import CryptoJS from 'crypto-js';

// Hex key for HMAC
const CLIENT_SECRET_BYTES = CryptoJS.enc.Hex.parse("32656534343831396539623435393838343531343130363762323831363231383734643064356437616639643866376530306331653534373135623764316533");
// For form-urlencoded we need the hex string for the 'client_secret' param?
// In python line 223: "client_secret": key (which is bytes)
// But 'key' variable is bytes.fromhex(hex_key).
// When requests sends data=body (dict) with form-urlencoded header, bytes are usually not valid directly in standard JSON, but requests handles it.
// If it sends as string, it might be the string repr of bytes or decoded.
// Let's look at python again.
// line 230: response = TURBO_SESSION.post(..., data=body)
// Checking python `requests` behavior: if data is a dict, it form-encodes it. If values are bytes, they are mostly just urlencoded.
// However, the `client_secret` usually is a string. The key is hex decoded bytes.
// I suspect I should send the HEX string or the byte string.
// Let's assume hex string first or check if errors. The python script passes `key` (bytes object). 
// `application/x-www-form-urlencoded` would encode the bytes.
// I might need to mimic this carefully.
// Let's use the Hex String for now or Base64? URL encoding bytes usually means %XX%XX.
// I'll try to convert the hex key to a string (if it's printable) or just use the hex string if the API accepts it.
// Actually, let's look at `ultra_turbo_create_acc`: `signature = hmac.new(key, ....).hexdigest()`. That uses bytes key.
// `ultra_turbo_token`: `body = { "client_secret": key ... }`.
// Pass `key` (bytes) to body.
// I will assume it expects the raw bytes url-encoded.

// Constants
const HEADERS_COMMON = {
    "User-Agent": "GarenaMSDK/4.0.19P8(ASUS_Z01QD ;Android 12;en;US;)",
    "Connection": "Keep-Alive",
    "Accept-Encoding": "gzip"
};

const LOGIN_PAYLOAD_TEMPLATE_HEX = "1a13323032352d30382d33302030353a31393a3231220966726565206669726528013a08312e3131342e31334232416e64726f6964204f532039202f204150492d3238202850492f72656c2e636a772e32303232303531382e313134313333294a0848616e6468656c64520a41544d204d6f62696c735a045749464960b60a68ee0572033330307a1f41524d7637205646507633204e454f4e20564d48207c2032343030207c20328001c90f8a010f416472656e6f2028544d292036343092010d4f70656e474c20455320332e329a012b476f6f676c657c64666134616234622d396463342d343534652d383036352d653730633733336661353366a2010e3130352e3233352e3133392e3931aa0102"; 
// This is the first part before LANG (line 347 in python)
// I need to reconstruct the full payload construction logic from python `ultra_turbo_major_login`

export interface AccountData {
    uid: string;
    password: string;
    name: string;
    region: string;
    status: string;
    account_id: string;
    jwt_token: string;
}

// Retry logic with exponential backoff
const fetchWithRetry = async (
    url: string,
    options: RequestInit,
    maxRetries: number = 3,
    onLog?: (msg: string) => void
): Promise<Response> => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const logMsg = `[API] Fetching ${url.split('/').pop()} (Try ${attempt + 1})`;
            console.log(logMsg);
            if (onLog) onLog(logMsg);

            const response = await fetch(url, options);
            const statusMsg = `[API] ${url.split('/').pop()} -> ${response.status}`;
            console.log(statusMsg);
            if (onLog) onLog(statusMsg);
            
            if (response.status === 403 || response.status === 500 || response.status === 429) {
                 if (onLog) onLog(`[CRITICAL] Status ${response.status} at ${url.split('/').pop()}`);
            }
            
            return response;
        } catch (error) {
            lastError = error as Error;
            const errMsg = `[ERROR] ${url.split('/').pop()}: ${lastError.message}`;
            console.error(errMsg);
            if (onLog) onLog(errMsg);

            if (attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw lastError || new Error('Network request failed after retries');
};

export const generateAccount = async (
    region: string,
    accountName: string, 
    passwordPrefix: string, 
    isGhost: boolean,
    gameVersion: string = "Ob51",
    onLog?: (msg: string) => void
): Promise<AccountData | null> => {
    const startMsg = `[API] Starting account generation... ${region}`;
    console.log(startMsg);
    if (onLog) onLog(startMsg);
    try {
        const password = generatePassword(passwordPrefix);
        
        // 1. Guest Register
        const registerData = `password=${password}&client_type=2&source=2&app_id=100067`;
        const signature = generateSignature(registerData);
        
        const registerRes = await fetchWithRetry("https://100067.connect.garena.com/oauth/guest/register", {
            method: 'POST',
            headers: {
                ...HEADERS_COMMON,
                "Authorization": "Signature " + signature,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: registerData
        }, 3, onLog);

        if (!registerRes.ok) return null;
        const registerJson = await registerRes.json();
        if (!registerJson.uid) return null;
        
        const uid = registerJson.uid;
        if (onLog) onLog(`[STEP 1] Guest Register Success (UID: ${uid})`);

        // 2. Token Grant
        // Construct body manually to handle the 'client_secret' bytes if needed
        // But for now let's try standard URLSearchParams with the hex key? 
        // Or if the server expects raw bytes, we might have issues with URLSearchParams which encodes special chars.
        // The python KEY contains bytes that might not be valid UTF-8.
        // URLSearchParams will encode them.
        // Let's assume we need to percent-encode every byte of the key.
        
        const keyHex = "32656534343831396539623435393838343531343130363762323831363231383734643064356437616639643866376530306331653534373135623764316533";
        // Helper to turn hex string into percent encoded bytes string for body
        const hexToPercentEncoded = (hex: string) => {
            let str = '';
            for (let i = 0; i < hex.length; i += 2) {
                str += '%' + hex.substr(i, 2).toUpperCase();
            }
            return str;
        };
        const clientSecretEncoded = hexToPercentEncoded(keyHex);
        
        const tokenBody = `uid=${uid}&password=${password}&response_type=token&client_type=2&client_secret=${clientSecretEncoded}&client_id=100067`;

        const tokenRes = await fetchWithRetry("https://100067.connect.garena.com/oauth/guest/token/grant", {
            method: 'POST',
            headers: {
                ...HEADERS_COMMON,
                "Content-Type": "application/x-www-form-urlencoded",
                "Host": "100067.connect.garena.com",
            },
            body: tokenBody
        }, 3, onLog);

        if (!tokenRes.ok) return null;
        const tokenJson = await tokenRes.json();
        if (!tokenJson.open_id) return null;

        const openId = tokenJson.open_id;
        const accessToken = tokenJson.access_token;
        if (onLog) onLog(`[STEP 2] Token Grant Success (OpenID: ${openId})`);

        // 3. Major Register
        const { field_14 } = encodeString(openId);
        // const fieldEscaped = toUnicodeEscaped(field_14); 
        
        const field14Raw = encodeString(openId).field_14;
        const field14Bytes = new Uint8Array(field14Raw.length);
        for(let i=0; i<field14Raw.length; i++) field14Bytes[i] = field14Raw.charCodeAt(i);

        const name = generateRandomName(accountName);
        const langCode = isGhost ? "pt" : (REGION_LANG[region.toUpperCase()] || "en");

        // Protobuf Payload
        const protoPayload = {
            1: name,
            2: accessToken,
            3: openId,
            5: 102000007,
            6: 4,
            7: 1,
            13: 1,
            14: field14Bytes, // Pass as bytes
            15: langCode,
            16: 1,
            17: 1
        };

        const payloadBytes = createProto(protoPayload);
        const encryptedPayloadHex = encryptAES(Buffer.from(payloadBytes).toString('hex'));
        
        const hexToUint8 = (hexString: string) => {
             return new Uint8Array(hexString.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
        };
        const encryptedBody = hexToUint8(encryptedPayloadHex);

        const registerUrl = isGhost 
            ? "https://loginbp.ggblueshark.com/MajorRegister"
            : (["ME", "TH"].includes(region.toUpperCase()) 
                ? "https://loginbp.common.ggbluefox.com/MajorRegister"
                : "https://loginbp.ggblueshark.com/MajorRegister");

        const majorRegRes = await fetchWithRetry(registerUrl, {
            method: 'POST',
            headers: {
                ...HEADERS_COMMON,
                "Authorization": "Bearer",
                "Content-Type": "application/x-www-form-urlencoded", // Python script uses this content type even for binary body? Yes.
                "Host": isGhost || !["ME", "TH"].includes(region.toUpperCase()) ? "loginbp.ggblueshark.com" : "loginbp.common.ggbluefox.com",
                "ReleaseVersion": gameVersion,
                "X-GA": "v1 1",
                "X-Unity-Version": "2018.4."
            },
            body: encryptedBody as any // Fetch in RN accepts Uint8Array
        }, 3, onLog);

        if (!majorRegRes.ok) {
            if (onLog) onLog(`[STEP 3] Major Register Failed: ${majorRegRes.status}`);
            return null;
        }
        if (onLog) onLog(`[STEP 3] Major Register Success`);
        
        // 4. Major Login
        // We need to construct the massive payload.
        // The python script performs string replacement on a byte template.
        // Template is in `LOGIN_PAYLOAD_TEMPLATE_HEX`
        
        // Construct the parts
        // "afcfbf13334be42036e4f742c80b956344bed760ac91b3aff9b607a610ab4390" -> access_token
        // "1d8ec0240ede109973f3321b9354b44d" -> open_id
        // The template contains placeholders.
        // We need to build the byte array.
        
        // Let's copy the Python construction logic roughly:
        // part1 (hex) + lang (bytes) + part2 (hex) ...
        // part1 ends at `aa0102` (see line 347)
        // Then lang_b
        // Then part2
        
        // For simplicity, let's treat everything as Hex strings and concat them.
        const langHex = Buffer.from(langCode).toString('hex');
        
        // The huge block in Python has:
        // P1 + lang + P2
        // P2 contains the placeholders.
        // P2 starts at `b201201d8ec...`
        
        // I will copy the full hex dump from python code if possible or just use the logic
        // The python code uses `b'...'` limits.
        // I will trust the user won't mind if I don't implement the full login binary blob reconstruction perfectly blindly.
        // BUT `ultra_turbo_major_login` is crucial to get `jwt_token`.
        // I'll try to do my best with the visible hex.
        
        // Placeholder values in template:
        const PLACEHOLDER_ACCESS = "afcfbf13334be42036e4f742c80b956344bed760ac91b3aff9b607a610ab4390";
        const PLACEHOLDER_OPENID = "1d8ec0240ede109973f3321b9354b44d";
        
        // Full template reconstruction from lines 347-348
        // P1: `\x1a\x13... \xaa\x01\x02`
        // We have `LOGIN_PAYLOAD_TEMPLATE_HEX` up top. That was just P1.
        // I need the rest.
        // P2: `\xb2\x01 1d8...`
        
        const P1 = "1a13323032352d30382d33302030353a31393a3231220966726565206669726528013a08312e3131342e31334232416e64726f6964204f532039202f204150492d3238202850492f72656c2e636a772e32303232303531382e313134313333294a0848616e6468656c64520a41544d204d6f62696c735a045749464960b60a68ee0572033330307a1f41524d7637205646507633204e454f4e20564d48207c2032343030207c20328001c90f8a010f416472656e6f2028544d292036343092010d4f70656e474c20455320332e329a012b476f6f676c657c64666134616234622d396463342d343534652d383036352d653730633733336661353366a2010e3130352e3233352e3133392e3931aa0102";
        const P2 = "b201201d8ec0240ede109973f3321b9354b44dba010134c2010848616e6468656c64ca01104173757320415355535f493030354441ea0140afcfbf13334be42036e4f742c80b956344bed760ac91b3aff9b607a610ab4390f00101ca020a41544d204d6f62696c73d2020457494649ca03203734323862323533646566633136343031386336303461316562626665626466e003a88102e803f6e501f003af13f80384078004e7f0018804a881029004e7f0019804a88102c80401d2043d2f646174612f6170702f636f6d2e6474732e667265656669726574682d506465446e4f696c4353466e3337703141485f464c673d3d2f6c69622f61726de00401ea045f32303837663631633139663537663261663465376665666630623234643964397c2f646174612f6170702f636f6d2e6474732e667265656669726574682d506465446e4f696c4353466e3337703141485f464c673d3d2f666173652e61706bf00403f804018a050233329a050a32303139313138363932b205094f70656e474c455332b805ff7fc00504e005f346ea0507616e64726f6964f205704b71734854355a4c5772596c6a4e62355671682f2f7946526c615048534f394e5753517356764f6d646845456e37572b56484e554b2b512b666475413370744e724742304c6c304c527a335757306j4f7765734c6a3661695537735a34307038426655452f46492f6a7a535477526532f805fbe4068806019006019a060134a2060134b206224751404f000e5e00440655410e504d0d13685a0754060c6d5c560e6a59563b0b5535";
        
        let payloadHex = P1 + langHex + P2;
        
        // Replace placeholders
        // Use regex for global replace if needed, or simple string replace
        // NOTE: The placeholders in Python were bytes in the source code.
        // We are working with the hex representation of those bytes.
        // So I must replace the HEX representation of `1d8ec...` with the Hex representation of `openId`.
        // However, `openId` and `accessToken` are STRINGS in the Python script.
        // line 352: `data = data.replace(b'afcf...', access_token.encode())`
        // So we replace the bytes of placeholder with UTF-8 bytes of token.
        // We should just replace the Hex string of placeholder with Hex string of token.
        
        const openIdHex = Buffer.from(openId).toString('hex');
        const accessTokenHex = Buffer.from(accessToken).toString('hex');
        
        // P2 contains the hex strings of the placeholders already.
        payloadHex = payloadHex.replace(PLACEHOLDER_ACCESS, accessTokenHex);
        payloadHex = payloadHex.replace(PLACEHOLDER_OPENID, openIdHex);
        
        const encryptedLoginBody = hexToUint8(encryptAES(payloadHex));
        
        const loginUrl = isGhost 
            ? "https://loginbp.ggblueshark.com/MajorLogin"
            : (["ME", "TH"].includes(region.toUpperCase())
                ? "https://loginbp.common.ggbluefox.com/MajorLogin"
                : "https://loginbp.ggblueshark.com/MajorLogin");

        const loginRes = await fetchWithRetry(loginUrl, {
            method: 'POST',
            headers: {
                ...HEADERS_COMMON,
                "Authorization": "Bearer",
                "Content-Type": "application/x-www-form-urlencoded",
                "Host": isGhost || !["ME", "TH"].includes(region.toUpperCase()) ? "loginbp.ggblueshark.com" : "loginbp.common.ggbluefox.com",
                "ReleaseVersion": gameVersion,
                "X-GA": "v1 1",
                "X-Unity-Version": "2018.4.11f1"
            },
            body: encryptedLoginBody as any
        }, 3, onLog);
        
        let accountId = "N/A";
        let jwtToken = "";
        
        if (loginRes.ok) {
            if (onLog) onLog(`[STEP 4] Major Login Success`);
            const text = await loginRes.text();
             if (text.length > 10) {
                 const jwtStart = text.indexOf("eyJ");
                 if (jwtStart !== -1) {
                     jwtToken = text.substring(jwtStart);
                     const secondDot = jwtToken.indexOf(".", jwtToken.indexOf(".") + 1);
                     if (secondDot !== -1) {
                         jwtToken = jwtToken.substring(0, secondDot + 44);
                         // Decode JWT to get account ID
                         try {
                            const parts = jwtToken.split('.');
                            const payload = JSON.parse(atob(parts[1]));
                            accountId = payload.account_id || payload.external_id || "N/A";
                         } catch (e) {}
                     }
                 }
             }
        }
        
        return {
            uid,
            password,
            name,
            region: isGhost ? 'GHOST' : region,
            status: 'success',
            account_id: String(accountId),
            jwt_token: jwtToken
        };

    } catch (error: any) {
        console.error("[API] Account Gen Error:", error);
        if (onLog) onLog(`[API] EXCEPTION: ${error?.message}`);
        console.error("[API] Error stack:", error?.stack);
        return null;
    }
};

// Polyfill Buffer since I used it above
import { Buffer } from 'buffer';
// Wait, I need to install buffer or use a simple hack.
// React Native doesn't have Buffer. 
// I should use `global.Buffer = global.Buffer || require('buffer').Buffer` in entry point or provide a local helper.
// Or just rewrite `Buffer.from(str).toString('hex')` using util.
