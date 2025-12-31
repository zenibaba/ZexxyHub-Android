import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration interface
interface KeyAuthConfig {
    name: string;
    ownerid: string;
    version: string;
}

// Response interface from KeyAuth API
interface KeyAuthResponse {
    success: boolean;
    message: string;
    info?: any;
    expiry?: string; // Add expiry to response
    [key: string]: any;
}

export class KeyAuth {
    private config: KeyAuthConfig;
    private sessionid: string | null = null;
    private initialized: boolean = false;
    private readonly API_URL = "https://keyauth.win/api/1.2/";

    constructor(config: KeyAuthConfig) {
        this.config = config;
    }

    /**
     * Get or Generate HWID (Soft Lock)
     */
    private async getHWID(): Promise<string> {
        try {
            let hwid = await AsyncStorage.getItem('DEVICE_HWID');
            // Ensure HWID meets new length requirement (>= 20 chars)
            if (!hwid || hwid.length < 20) {
                // Generate a random 32-char string as HWID
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                hwid = '';
                for (let i = 0; i < 32; i++) {
                    hwid += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                await AsyncStorage.setItem('DEVICE_HWID', hwid);
            }
            return hwid;
        } catch {
            return "UNKNOWN_DEVICE_ID_ERROR";
        }
    }

    /**
     * Public getter for UI to copy HWID
     */
    async getLocalHWID(): Promise<string> {
        return this.getHWID();
    }

    /**
     * Initialize the session (Required before login)
     */
    async init(): Promise<KeyAuthResponse> {
        if (this.initialized) return { success: true, message: "Already initialized" };

        try {
            const params = new URLSearchParams({
                type: 'init',
                ver: this.config.version,
                name: this.config.name,
                ownerid: this.config.ownerid,
                platform: Platform.OS
            });

            const response = await fetch(`${this.API_URL}?${params.toString()}`);
            const data = await response.json();

            if (data.success) {
                this.sessionid = data.sessionid;
                this.initialized = true;
            }

            return data;
        } catch (error: any) {
            return { success: false, message: error.message || "Connection failed" };
        }
    }

    /**
     * Login with license key
     */
    /**
     * Register new user (Step 1 & 2 combined usually in KeyAuth, acting as Activate)
     * Or if we want separate register then activate:
     * KeyAuth 'register' takes (user, pass, license). 
     */
    async register(username: string, pass: string, key: string): Promise<KeyAuthResponse> {
        if (!this.initialized) await this.init();
        
        try {
            const hwid = await this.getHWID();
            const params = new URLSearchParams({
                type: 'register',
                username: username,
                pass: pass,
                key: key,
                hwid: hwid,
                sessionid: this.sessionid || '',
                name: this.config.name,
                ownerid: this.config.ownerid
            });

            const response = await fetch(`${this.API_URL}?${params.toString()}`);
            const data = await response.json();
            
            // Standardize response
            return {
                ...data,
                expiry: this.extractExpiry(data)
            };
        } catch (e: any) {
             return { success: false, message: e.message || "Connection failed" };
        }
    }

    /**
     * Login with Username/Password (Step 3: Login Verification)
     */
    async loginUser(username: string, pass: string): Promise<KeyAuthResponse> {
        if (!this.initialized) await this.init();

        try {
            const hwid = await this.getHWID();
            const params = new URLSearchParams({
                type: 'login',
                username: username,
                pass: pass,
                hwid: hwid,
                sessionid: this.sessionid || '',
                name: this.config.name,
                ownerid: this.config.ownerid
            });

            const response = await fetch(`${this.API_URL}?${params.toString()}`);
            const data = await response.json();
            
            return {
                ...data,
                expiry: this.extractExpiry(data)
            };
        } catch (e: any) {
            return { success: false, message: e.message || "Connection failed" };
        }
    }

    // Helper to extract expiry
    private extractExpiry(data: any): string | undefined {
         if (data.success && data.info) {
             // Check subscription expiry
             if (data.info.subscriptions && data.info.subscriptions[0]) {
                 const sub = data.info.subscriptions[0];
                 const date = new Date(sub.expiry * 1000);
                 const isLifetime = sub.expiry > 2000000000;
                 return isLifetime ? "LIFETIME" : date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
             }
        }
        return undefined;
    }

    /**
     * Legacy/Direct Key Login (kept for backward compat or if desired)
     */
    async login(key: string): Promise<KeyAuthResponse> {
        // ... implementation existing ...
        // We will wrap the existing login logic but add the helper usage
        if (!this.initialized) {
            const initRes = await this.init();
            if (!initRes.success) return initRes;
        }

        try {
            const hwid = await this.getHWID();
            const params = new URLSearchParams({
                type: 'license',
                key: key,
                hwid: hwid,
                sessionid: this.sessionid || '',
                name: this.config.name,
                ownerid: this.config.ownerid
            });

            const response = await fetch(`${this.API_URL}?${params.toString()}`);
            const data = await response.json();
            
            return {
                 ...data,
                 expiry: this.extractExpiry(data)
            };
        } catch (error: any) {
             return { success: false, message: error.message || "Connection failed" };
        }
    }
}

// Export a singleton instance or the class
export const authService = new KeyAuth({
    name: "ADD YOUR APP NAME FROM KEY AUTH,
    ownerid: "YOUR ID",
    version: "1.0",
});
