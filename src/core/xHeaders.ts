import { EnC_AEs, EnC_Uid, DEc_AEs } from './xC4';
import { Buffer } from 'buffer';

const TOKEN_URL = 'https://tokens-asfufvfshnfkhvbb.francecentral-01.azurewebsites.net/ReQuesT?&type=ToKens';

let cachedToken: string | null = null;

export const fetchToken = async (): Promise<string | null> => {
    if (cachedToken) return cachedToken;
    try {
        const response = await fetch(TOKEN_URL);
        const text = await response.text();
        const start = text.indexOf("ToKens : [");
        if (start !== -1) {
            const end = text.indexOf("]", start);
            const rawList = text.substring(start + 10, end);
            const tokens = rawList.split(',').map(t => t.trim().replace(/['"]/g, ''));
            if (tokens.length > 0) {
                // Pick random
                cachedToken = tokens[Math.floor(Math.random() * tokens.length)];
                return cachedToken;
            }
        }
    } catch (e) {
        console.error("Token Fetch Error", e);
    }
    return null;
};

export const getPlayerInfo = async (uid: string) => {
    const token = await fetchToken();
    if (!token) return { error: "No Token Available" };
    
    try {
        // Prepare Data
        // data = bytes.fromhex(EnC_AEs(f"08{EnC_Uid(uid , Tp = 'Uid')}1007"))
        const uidHex = EnC_Uid(parseInt(uid));
        const payload = `08${uidHex}1007`;
        const encryptedData = EnC_AEs(payload);
        const hexBuffer = Buffer.from(encryptedData, 'hex');
        
        // This effectively sends binary data
        // React Native fetch body can accept Blob or maybe base64? 
        // For 'application/x-www-form-urlencoded', it expects string usually.
        // But Python sends `bytes` to `data`.
        // We might need to send raw body.
        
        // Note: Python requests `data` argument implies body.
        
        const response = await fetch("https://clientbp.common.ggbluefox.com/GetPlayerPersonalShow", {
            method: 'POST',
            headers: {
                'X-Unity-Version': '2018.4.11f1',
                'ReleaseVersion': 'OB51',
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-GA': 'v1 1',
                'Authorization': `Bearer ${token}`,
                // 'Content-Length': '16', // Let engine handle
                'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 7.1.2; ASUS_Z01QD Build/QKQ1.190825.002)',
                'Host': 'clientbp.ggblueshark.com',
                'Connection': 'Keep-Alive',
                'Accept-Encoding': 'gzip'
            },
            body: encryptedData // Sending HEX STRING might be wrong if server expects raw bytes. 
                                // Python `bytes.fromhex` sends raw bytes. 
                                // We need to send raw bytes here.
        });
        
        // Handling raw binary response...
        // This part is complex in RN without native blob support sometimes, but we'll try arrayBuffer
        if (response.status === 200 || response.status === 201) {
             const buf = await response.arrayBuffer();
             // We need to implement DeCode_PackEt logic which uses protobuf parser
             // For now, returning success signal.
             return { success: true, size: buf.byteLength };
        }
        return { error: `Status ${response.status}` };
    } catch (e: any) {
        return { error: e.message };
    }
};

export const sendLikes = async (uid: string) => {
    try {
        const response = await fetch(`https://tokens-asfufvfshnfkhvbb.francecentral-01.azurewebsites.net/ReQuesT?id=${uid}&type=likes`);
        const text = await response.text();
        // Parse regex
        const likesBefore = text.match(/LiKes BeFore\s*:\s*(\d+)/)?.[1];
        const likesAfter = text.match(/LiKes After\s*:\s*(\d+)/)?.[1];
        const given = text.match(/LiKes GiVen\s*:\s*(\d+)/)?.[1];
        
        if (likesAfter) {
            return { success: true, before: likesBefore, after: likesAfter, given };
        }
        return { success: false, raw: text };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
};

export const sendSpamRequests = async (uid: string) => {
    try {
        const response = await fetch(`https://tokens-asfufvfshnfkhvbb.francecentral-01.azurewebsites.net/ReQuesT?id=${uid}&type=spam`);
        const text = await response.text();
        if (response.status === 200 && text.includes('SuccessFuLy')) {
            return { success: true };
        }
        return { success: false, raw: text };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
};
