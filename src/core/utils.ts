// Helper utilities ported from Python

export const REGION_LANG: {[key: string]: string} = {
    "ME": "ar", "IND": "hi", "ID": "id", "VN": "vi", "TH": "th",
    "BD": "bn", "PK": "ur", "TW": "zh", "CIS": "ru", "SAC": "es", "BR": "pt"
};

export const REGION_URLS: {[key: string]: string} = {
    "IND": "https://client.ind.freefiremobile.com/",
    "ID": "https://clientbp.ggblueshark.com/",
    "BR": "https://client.us.freefiremobile.com/",
    "ME": "https://clientbp.common.ggbluefox.com/",
    "VN": "https://clientbp.ggblueshark.com/",
    "TH": "https://clientbp.common.ggbluefox.com/",
    "CIS": "https://clientbp.ggblueshark.com/",
    "BD": "https://clientbp.ggblueshark.com/",
    "PK": "https://clientbp.ggblueshark.com/",
    "SG": "https://clientbp.ggblueshark.com/",
    "SAC": "https://client.us.freefiremobile.com/",
    "TW": "https://clientbp.ggblueshark.com/"
};

// to_unicode_escaped
// matches: ''.join(c if 32 <= ord(c) <= 126 else f'\\u{ord(c):04x}' for c in s)
export function toUnicodeEscaped(s: string): string {
    let result = '';
    for (let i = 0; i < s.length; i++) {
        const c = s.charCodeAt(i);
        if (c >= 32 && c <= 126) {
            result += s[i];
        } else {
            result += '\\u' + c.toString(16).padStart(4, '0');
        }
    }
    return result;
}

// encode_string (XOR Cipher)
// Keystream from line 1059
const KEYSTREAM = [
    0x30, 0x30, 0x30, 0x32, 0x30, 0x31, 0x37, 0x30, 0x30, 0x30, 0x30, 0x30, 0x32, 0x30, 0x31, 0x37,
    0x30, 0x30, 0x30, 0x30, 0x30, 0x32, 0x30, 0x31, 0x37, 0x30, 0x30, 0x30, 0x30, 0x30, 0x32, 0x30
];

export function encodeString(original: string): { open_id: string, field_14: string } {
    let encoded = "";
    for (let i = 0; i < original.length; i++) {
        const origByte = original.charCodeAt(i);
        const keyByte = KEYSTREAM[i % KEYSTREAM.length];
        const resultByte = origByte ^ keyByte;
        encoded += String.fromCharCode(resultByte);
    }
    return { open_id: original, field_14: encoded };
}

// generate_custom_password
export function generatePassword(prefix: string): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomPart = "";
    for (let i = 0; i < 11; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}_${randomPart}`;
}

// generate_exponent_number
function generateExponentNumber(): string {
    const exponentDigits: {[key: string]: string} = {
        '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
        '5': '5', '6': '6', '7': '7', '8': '8', '9': '9'
    };
    // The python script maps 0-9 to 0-9 string chars which implies no change?
    // Wait, line 849: exponent_digits = {'0': '0', '1': '1'...}
    // Why did the original script map '0' to '0'? Maybe they intended to use superscript chars but forgot or reverted?
    // I entered the code exactly as shown in view_file.
    // However, I should check if I missed special characters in the view_file output.
    // Line 849: exponent_digits = {'0': '0'...}
    // It seems it does nothing special currently. I will implement as is.
    
    // logic: number = random.randint(1, 99999); number_str = f"{number:05d}"; ...
    const number = Math.floor(Math.random() * 99999) + 1;
    const numberStr = number.toString().padStart(5, '0');
    let exponentStr = "";
    for (const char of numberStr) {
        exponentStr += exponentDigits[char] || char; // Safe fallback
    }
    return exponentStr;
}

// generate_random_name
export function generateRandomName(baseName: string): string {
    const exponentPart = generateExponentNumber();
    return `${baseName.slice(0, 7)}${exponentPart}`;
}

// calculate_rarity_score
// Copied logic from lines 770-791
export function calculateRarityScore(accountId: string | number): number {
    if (!accountId || accountId === "N/A") return 0;
    const accountStr = String(accountId);
    let score = 0;
    
    // Patterns
    // (\d)\1{3,} -> 4 identical digits
    if (/(\d)\1{3,}/.test(accountStr)) score += 3;
    
    // (\d)\1{2,} -> 3 identical digits
    if (/(\d)\1{2,}/.test(accountStr)) score += 2;
    
    // Sequences
    if (/0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321|3210/.test(accountStr)) score += 2;
    
    // Starts with [1-9]000 or 9999...1111 exact matches (length 4)
    if (/^[1-9]000$|^9999$|^8888$|^7777$|^6666$|^5555$|^4444$|^3333$|^2222$|^1111$/.test(accountStr)) score += 3;
    
    // Ends with 888, 999...
    if (/888$|999$|777$|666$/.test(accountStr)) score += 1;
    
    // Starts with 88, 99...
    if (/^88|^99|^66|^77/.test(accountStr)) score += 1;
    
    // Specific numbers
    if (/1314|520|521|3344|2013|2014/.test(accountStr)) score += 1;
    
    // Palindrome (len >= 4)
    const reversed = accountStr.split('').reverse().join('');
    if (accountStr === reversed && accountStr.length >= 4) score += 3;
    
    // Short ID (< 8)
    if (accountStr.length < 8) score += 2;
    
    return score;
}
