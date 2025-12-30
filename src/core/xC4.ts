import CryptoJS from 'crypto-js';
import { Buffer } from 'buffer';

// Hardcoded Keys from xC4.py
// Key: [89, 103, 38, 116, 99, 37, 68, 69, 117, 104, 54, 37, 90, 99, 94, 56]
// IV:  [54, 111, 121, 90, 68, 114, 50, 50, 69, 51, 121, 99, 104, 106, 77, 37]

const KEY_BYTES = [89, 103, 38, 116, 99, 37, 68, 69, 117, 104, 54, 37, 90, 99, 94, 56];
const IV_BYTES = [54, 111, 121, 90, 68, 114, 50, 50, 69, 51, 121, 99, 104, 106, 77, 37];

const KEY_HEX = Buffer.from(KEY_BYTES).toString('hex');
const IV_HEX = Buffer.from(IV_BYTES).toString('hex');

const KEY_WORD_ARRAY = CryptoJS.enc.Hex.parse(KEY_HEX);
const IV_WORD_ARRAY = CryptoJS.enc.Hex.parse(IV_HEX);

// --- AES Helpers ---

export const EnC_AEs = (hexData: string): string => {
    // Input hex -> WordArray
    const dataWords = CryptoJS.enc.Hex.parse(hexData);
    const encrypted = CryptoJS.AES.encrypt(dataWords, KEY_WORD_ARRAY, {
        iv: IV_WORD_ARRAY,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.ciphertext.toString(CryptoJS.enc.Hex);
};

export const DEc_AEs = (hexData: string): string => {
    const encryptedParams = CryptoJS.lib.CipherParams.create({
        ciphertext: CryptoJS.enc.Hex.parse(hexData)
    });
    const decrypted = CryptoJS.AES.decrypt(encryptedParams, KEY_WORD_ARRAY, {
        iv: IV_WORD_ARRAY,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return decrypted.toString(CryptoJS.enc.Hex);
};

export const EnC_PacKeT = (hexData: string): string => {
    // Same as EnC_AEs but specific naming from python
    return EnC_AEs(hexData); 
};

// --- Custom Protobuf Encoder Port ---

export const EnC_Uid = (h: number, type: 'Uid' = 'Uid'): string => {
    let e = [];
    let H = h;
    while (H > 0) {
        let byte = (H & 0x7F);
        H >>= 7;
        if (H > 0) byte |= 0x80;
        e.push(byte);
    }
    if (e.length === 0) e.push(0); // Handle 0 case
    return Buffer.from(e).toString('hex');
};

const EnC_Vr = (n: number): string => {
    let H = [];
    if (n === 0) return '00';
    while (true) {
        let byte = n & 0x7F;
        n >>>= 7; // Unsigned right shift
        if (n > 0) byte |= 0x80;
        H.push(byte);
        if (n === 0) break;
    }
    return Buffer.from(H).toString('hex');
};

const CrEaTe_VarianT = (fieldNumber: number, value: number): string => {
    const fieldHeader = (fieldNumber << 3) | 0;
    return EnC_Vr(fieldHeader) + EnC_Vr(value);
};

const CrEaTe_LenGTh = (fieldNumber: number, value: string | Buffer): string => {
    const fieldHeader = (fieldNumber << 3) | 2;
    // If string, assume utf8
    const valBuffer = Buffer.isBuffer(value) ? value : Buffer.from(value, 'utf-8');
    const length = valBuffer.length;
    return EnC_Vr(fieldHeader) + EnC_Vr(length) + valBuffer.toString('hex');
};

export const CrEaTe_ProTo = (fields: any): string => {
    let packet = '';
    
    // Iterate over keys sorted numerically to ensure order (optional but good practice)
    Object.keys(fields).map(Number).sort((a,b)=>a-b).forEach(field => {
        const value = fields[field];
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // Nested Dict
            const nestedPacket = CrEaTe_ProTo(value);
            // Recursively create length delimited field
            // Length header needs to act on the HEX string length in bytes
            const nestedBuffer = Buffer.from(nestedPacket, 'hex');
            packet += CrEaTe_LenGTh(field, nestedBuffer);
        } else if (typeof value === 'number') {
            packet += CrEaTe_VarianT(field, value);
        } else if (typeof value === 'string') {
            packet += CrEaTe_LenGTh(field, value);
        }
    });

    return packet;
};

export const GeneRaTePk = (pkHex: string, packetType: string): string => {
    const encryptedPk = EnC_PacKeT(pkHex);
    // Length calculation logic from python: int(len(PkEnc) // 2)
    const length = encryptedPk.length / 2;
    
    // Hex of length
    let lenHex = length.toString(16);
    // Logic from python:
    // if len(_) == 2: HeadEr = N + "000000" ...
    // This looks like simple padding to ensure header structure
    // We can just construct it.
    
    // Fix hex string length
    if (lenHex.length % 2 !== 0) lenHex = '0' + lenHex;
    
    // Construct Header: PacketType + 6 bytes of padding/length info?
    // Python: HeadEr = N + "000000" if len is 2 chars (1 byte)
    // Actually the python logic is adding "0" padding based on hex string length of length
    
    let headerPadding = "";
    if (lenHex.length === 2) headerPadding = "000000";
    else if (lenHex.length === 3) headerPadding = "00000";
    else if (lenHex.length === 4) headerPadding = "0000";
    else if (lenHex.length === 5) headerPadding = "000";
    
    const header = packetType + headerPadding;
    
    return header + lenHex + encryptedPk;
};
