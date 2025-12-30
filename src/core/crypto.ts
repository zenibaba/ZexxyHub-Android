import CryptoJS from 'crypto-js';

// Constants from xgenvf.py
const HEX_KEY = "32656534343831396539623435393838343531343130363762323831363231383734643064356437616639643866376530306331653534373135623764316533";

// The AES Key and IV are hardcoded byte arrays in the python script.
// Key: bytes([89, 103, 38, 116, 99, 37, 68, 69, 117, 104, 54, 37, 90, 99, 94, 56])
// IV:  bytes([54, 111, 121, 90, 68, 114, 50, 50, 69, 51, 121, 99, 104, 106, 77, 37])
// Converting these to Latin1 strings for CryptoJS

const AES_KEY_BYTES = [89, 103, 38, 116, 99, 37, 68, 69, 117, 104, 54, 37, 90, 99, 94, 56];
const AES_IV_BYTES = [54, 111, 121, 90, 68, 114, 50, 50, 69, 51, 121, 99, 104, 106, 77, 37];

function bytesToString(bytes: number[]): string {
    return String.fromCharCode(...bytes);
}

const AES_KEY = CryptoJS.enc.Latin1.parse(bytesToString(AES_KEY_BYTES));
const AES_IV = CryptoJS.enc.Latin1.parse(bytesToString(AES_IV_BYTES));

/**
 * Generates HMAC signature for registration
 */
export const generateSignature = (message: string): string => {
    // hex_key is hex string, need to use it as bytes for key
    const secret = CryptoJS.enc.Hex.parse(HEX_KEY);
    const hmac = CryptoJS.HmacSHA256(message, secret);
    return hmac.toString(CryptoJS.enc.Hex);
};

/**
 * Encrypts payload using AES-CBC
 * Matches E_AEs and encrypt_api from python
 */
export const encryptAES = (dataHex: string): string => {
    // Python implementation takes hex string, converts to bytes, then encrypts
    const dataWords = CryptoJS.enc.Hex.parse(dataHex);
    
    // Check if we need to pad manually or if CryptoJS handles it. 
    // Python uses pad(Z, AES.block_size) which is PKCS7. CryptoJS uses Pkcs7 by default.
    
    const encrypted = CryptoJS.AES.encrypt(dataWords, AES_KEY, {
        iv: AES_IV,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });

    // Python returns R (encrypted bytes). We need to return hex of that?
    // Python's E_AEs returns R (bytes). 
    // However, in ultra_turbo_major_register:
    // encrypted_payload = E_AEs(payload_bytes.hex())
    // response = TURBO_SESSION.post(..., data=encrypted_payload, ...)
    // So the POST body is the raw binary bytes of the encrypted data.
    
    // CryptoJS.AES.encrypt returns a CipherParams object.
    // .ciphertext is the WordArray of the encrypted data.
    return encrypted.ciphertext.toString(CryptoJS.enc.Hex); // Return as Hex, we will convert to Blob/Buffer for sending if needed, or just send Hex if API accepts it (Python sends raw bytes)
    
    // Wait, requests.post(data=bytes) sends raw bytes. 
    // React Native fetch body will need to be Blob or similar for raw bytes.
    // For now let's return Hex, logic elsewhere will handle conversion to ArrayBuffer/Blob.
};

export const getKeyBytes = () => HEX_KEY;
