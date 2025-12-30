import * as FileSystem from 'expo-file-system';
import { StorageAccessFramework } from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccountData } from '../core/api';
import { calculateRarityScore } from '../core/utils';

const STORAGE_KEY_ROOT_URI = 'GENAPP_ROOT_URI';
const STORAGE_KEY_PROJECT_URI = 'GENAPP_PROJECT_URI';
const PROJECT_FOLDER_NAME = "ZEXXY ACCOUNTS"; 

let ROOT_URI: string | null = null;
let PROJECT_URI: string | null = null;

// --- EXPORTED STATE MANAGERS ---

export const loadSavedUri = async (): Promise<string | null> => {
    try {
        const savedRoot = await AsyncStorage.getItem(STORAGE_KEY_ROOT_URI);
        const savedProject = await AsyncStorage.getItem(STORAGE_KEY_PROJECT_URI);
        
        if (savedRoot) ROOT_URI = savedRoot;
        if (savedProject) PROJECT_URI = savedProject;
        
        return savedProject || savedRoot;
    } catch (e) {
        console.warn("Failed to load saved URI", e);
    }
    return null;
};

export const setRootUri = async (uri: string) => {
    ROOT_URI = uri;
    // When root changes, reset project URI until we confirm it exists
    PROJECT_URI = null; 
    try {
        await AsyncStorage.setItem(STORAGE_KEY_ROOT_URI, uri);
        await AsyncStorage.removeItem(STORAGE_KEY_PROJECT_URI);
    } catch (e) {
        console.warn("Failed to save URI", e);
    }
};

export const getRootUri = () => ROOT_URI;

// --- INTERNAL HELPERS ---

/**
 * Ensures the main 'ZEXXY ACCOUNTS' folder exists inside the User's picked Root.
 */
const ensureProjectFolder = async (parentUri: string): Promise<string | null> => {
    if (PROJECT_URI) {
        return PROJECT_URI;
    }

    try {
        // 1. Try to list directory to find it
        const children = await StorageAccessFramework.readDirectoryAsync(parentUri);
        const found = children.find(uri => decodeURIComponent(uri).endsWith(PROJECT_FOLDER_NAME));
        
        if (found) {
            PROJECT_URI = found;
            AsyncStorage.setItem(STORAGE_KEY_PROJECT_URI, found);
            return found;
        }

        // 2. Create if not found
        const newUri = await StorageAccessFramework.makeDirectoryAsync(parentUri, PROJECT_FOLDER_NAME);
        PROJECT_URI = newUri;
        AsyncStorage.setItem(STORAGE_KEY_PROJECT_URI, newUri);
        return newUri;

    } catch (e) {
        console.log("ensureProjectFolder error", e);
        // Fallback: If we can't create the subfolder, we likely can't write to this root.
        return null; 
    }
};

/**
 * Ensures a sub-subfolder (e.g., "ALL_GENERATED") exists inside ZEXXY ACCOUNTS.
 */
const ensureSubFolder = async (parentUri: string, subName: string): Promise<string | null> => {
    try {
        const children = await StorageAccessFramework.readDirectoryAsync(parentUri);
        const found = children.find(uri => decodeURIComponent(uri).endsWith(subName));
        if (found) return found;
        return await StorageAccessFramework.makeDirectoryAsync(parentUri, subName);
    } catch (e) {
        console.warn(`Failed to ensure subfolder ${subName}`, e);
        return null;
    }
};

const appendToFile = async (folderUri: string, filename: string, newAccounts: AccountData[]) => {
    try {
         let targetFileUri = null;
         try {
             // Try to find file
             const children = await StorageAccessFramework.readDirectoryAsync(folderUri);
             targetFileUri = children.find(uri => decodeURIComponent(uri).endsWith(filename));
         } catch (e) {}

         if (targetFileUri) {
             // Append
             let existingData: any[] = [];
             try {
                 const content = await StorageAccessFramework.readAsStringAsync(targetFileUri);
                 existingData = JSON.parse(content);
             } catch {}
             
             const newData = [...existingData, ...newAccounts];
             await StorageAccessFramework.writeAsStringAsync(targetFileUri, JSON.stringify(newData, null, 2));
         } else {
             // Create
             const newUri = await StorageAccessFramework.createFileAsync(folderUri, filename, 'application/json');
             await StorageAccessFramework.writeAsStringAsync(newUri, JSON.stringify(newAccounts, null, 2));
         }
    } catch (e) {
        console.error(`Failed to save ${filename}`, e);
        throw e; // Propagate error
    }
};

// --- MAIN EXPORTED FUNCTION ---

// --- LOADING ACCOUNTS ---

export const loadHistoricalAccounts = async (): Promise<AccountData[]> => {
    if (!ROOT_URI) return [];

    let allAccounts: AccountData[] = [];
    
    try {
        const projectUri = await ensureProjectFolder(ROOT_URI);
        if (!projectUri) return [];
        
        // We only read from ALL_GENERATED to avoid duplicates from RARE_ACCOUNTS
        const allUri = await ensureSubFolder(projectUri, "ALL_GENERATED");
        if (!allUri) return [];

        const files = await StorageAccessFramework.readDirectoryAsync(allUri);
        
        for (const fileUri of files) {
            if (decodeURIComponent(fileUri).endsWith('.json')) {
                try {
                    const content = await StorageAccessFramework.readAsStringAsync(fileUri);
                    const data = JSON.parse(content);
                    if (Array.isArray(data)) {
                        allAccounts = [...allAccounts, ...data];
                    }
                } catch (readErr) {
                    console.warn("Failed to read account file", fileUri, readErr);
                }
            }
        }
    } catch (e) {
        console.warn("Error loading history", e);
    }
    
    return allAccounts;
};

export const saveBatch = async (accounts: AccountData[]) => {
    if (!ROOT_URI || accounts.length === 0) return;
    
    try {
        const projectsFolderUri = await ensureProjectFolder(ROOT_URI);
        
        if (!projectsFolderUri) {
             console.error("CRITICAL: Cannot write to ZEXXY ACCOUNTS folder.");
             throw new Error("Storage Restricted: Please select 'Documents' or 'Internal Storage', NOT Downloads root.");
        }
        
        // Ensure Subfolders
        const allUri = await ensureSubFolder(projectsFolderUri, "ALL_GENERATED");
        const rareUri = await ensureSubFolder(projectsFolderUri, "RARE_ACCOUNTS");
        
        if (!allUri) throw new Error("Failed to create subfolders.");

        // Grouping
        const groups: {[key: string]: AccountData[]} = {};
        const rareAccounts: AccountData[] = [];

        for (const account of accounts) {
             const isGhost = account.region === 'GHOST';
             const prefix = isGhost ? 'GHOST' : account.region;
             const filename = isGhost ? `accounts_ghost.json` : `accounts_${prefix}.json`;
             
             if(!groups[filename]) groups[filename] = [];
             groups[filename].push(account);
             
             const rarity = calculateRarityScore(account.account_id);
             if (rarity >= 6) {
                 rareAccounts.push(account);
             }
        }

        // Save ALL
        for (const [filename, groupAccs] of Object.entries(groups)) {
             await appendToFile(allUri, filename, groupAccs);
        }

        // Save RARE if any
        if (rareAccounts.length > 0 && rareUri) {
             await appendToFile(rareUri, "rare_gems.json", rareAccounts);
        }
        
    } catch (e: any) {
        console.error("Batch Save Error", e);
        throw e;
    }
};
