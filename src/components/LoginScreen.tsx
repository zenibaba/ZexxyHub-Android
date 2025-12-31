import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Linking, Modal, TextInput, Switch } from 'react-native';
import { styled } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';
import { Input } from './Input';
import { authService } from '../services/KeyAuth';
import * as Clipboard from 'expo-clipboard';

const StyledText = styled(Text);
const StyledTouch = styled(TouchableOpacity);
const StyledView = styled(View);

interface LoginScreenProps {
    onLoginSuccess: (expiry?: string) => void;
}

export const LoginScreen = ({ onLoginSuccess }: LoginScreenProps) => {
    const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
    
    // Form State
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [key, setKey] = useState(''); // Only for Register
    const [rememberMe, setRememberMe] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [errorPopupVisible, setErrorPopupVisible] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Check for saved session
    React.useEffect(() => {
        const checkSession = async () => {
            try {
                const savedUser = await AsyncStorage.getItem('SAVED_USER');
                const savedPass = await AsyncStorage.getItem('SAVED_PASS');
                const savedTime = await AsyncStorage.getItem('SAVED_TIMESTAMP');
                
                if (savedUser && savedPass && savedTime) {
                    const now = Date.now();
                    const diff = now - parseInt(savedTime);
                    const hours = diff / (1000 * 60 * 60);
                    
                    if (hours < 24) {
                        setUsername(savedUser);
                        setPassword(savedPass);
                        setRememberMe(true);
                        // Optional: Auto-login could go here if requested, 
                        // but auto-filling is safer to start.
                    } else {
                        // Expired
                        await AsyncStorage.multiRemove(['SAVED_USER', 'SAVED_PASS', 'SAVED_TIMESTAMP']);
                    }
                }
            } catch(e) {}
        };
        checkSession();
    }, []);

    const handleAction = async () => {
        if (!username || !password) {
            setErrorMsg("Please enter username and password.");
            setErrorPopupVisible(true);
            return;
        }

        if (mode === 'REGISTER' && !key) {
             setErrorMsg("License key is required for registration.");
             setErrorPopupVisible(true);
             return;
        }

        setLoading(true);
        try {
            // Ensure Init
            await authService.init(); 

            let response;
            if (mode === 'LOGIN') {
                response = await authService.loginUser(username, password);
            } else {
                response = await authService.register(username, password, key);
            }

            if (response.success) {
                // Save Session if Remember Me is checked
                if (rememberMe && mode === 'LOGIN') {
                    await AsyncStorage.multiSet([
                        ['SAVED_USER', username],
                        ['SAVED_PASS', password],
                        ['SAVED_TIMESTAMP', Date.now().toString()]
                    ]);
                } else {
                    // Clear if not checked
                     await AsyncStorage.multiRemove(['SAVED_USER', 'SAVED_PASS', 'SAVED_TIMESTAMP']);
                }

                // Success Action: Open Telegram Channel
                Linking.openURL("https://t.me/ZENIBYBOT").catch(err => console.error("Could not open URL", err));
                onLoginSuccess(response.expiry);
            } else {
                // ... error handling ...
                // Custom Error Mapping
                const msg = response.message?.toLowerCase() || "";
                if (msg.includes("not found") || msg.includes("invalid user") || msg.includes("doesn't exist")) {
                    setErrorMsg("Register using keys first");
                } else if (msg.includes("hwid") || msg.includes("device")) {
                    setErrorMsg("Use old device to login");
                } else {
                    setErrorMsg(response.message || "Authentication Failed");
                }
                setErrorPopupVisible(true);
            }
        } catch (e: any) {
            setErrorMsg(e.message || "Connection failed");
            setErrorPopupVisible(true);
        } finally {
            setLoading(false);
        }
    };

    const copyHWID = async () => {
        try {
            const hwid = await authService.getLocalHWID();
            await Clipboard.setStringAsync(hwid);
            Alert.alert("Copied", "Device ID (HWID) copied to clipboard.");
        } catch (e) {
            Alert.alert("Error", "Could not fetch HWID.");
        }
    };

    const isHwidError = errorMsg.toLowerCase().includes('device') || errorMsg.toLowerCase().includes('hwid') || errorMsg.toLowerCase().includes('register');

    return (
        <View className="flex-1 bg-[#0f1014] items-center justify-center p-6">
             <LinearGradient
                colors={['#0f1014', '#13151a']}
                className="absolute w-full h-full"
            />
            
            <View className="w-full max-w-md"> 
                {/* Header */}
                <View className="items-center mb-10">
                     <StyledText className="text-4xl font-black text-white tracking-[8px] italic">
                        ZEXXY
                    </StyledText>
                    <View className="h-[2px] w-12 bg-blue-500 mt-2 rounded-full"/>
                </View>

                {/* Main Card */}
                <View className="bg-[#1a1d24] p-8 rounded-[30px] border border-slate-800/50 shadow-xl">
                    
                    {/* Tabs */}
                    <View className="flex-row mb-8 bg-slate-900/50 p-1 rounded-xl">
                        <StyledTouch 
                            onPress={() => setMode('LOGIN')}
                            className={`flex-1 py-3 rounded-lg ${mode === 'LOGIN' ? 'bg-blue-600' : 'bg-transparent'}`}
                        >
                            <StyledText className={`text-center font-bold text-xs uppercase tracking-widest ${mode === 'LOGIN' ? 'text-white' : 'text-slate-500'}`}>
                                Login
                            </StyledText>
                        </StyledTouch>
                        <StyledTouch 
                            onPress={() => setMode('REGISTER')}
                            className={`flex-1 py-3 rounded-lg ${mode === 'REGISTER' ? 'bg-blue-600' : 'bg-transparent'}`}
                        >
                            <StyledText className={`text-center font-bold text-xs uppercase tracking-widest ${mode === 'REGISTER' ? 'text-white' : 'text-slate-500'}`}>
                                Register
                            </StyledText>
                        </StyledTouch>
                    </View>

                    <Input 
                        label="USERNAME"
                        placeholder="User..."
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                    />
                    
                    <Input 
                        label="PASSWORD"
                        placeholder="Pass..."
                        value={password}
                        onChangeText={setPassword}
                        autoCapitalize="none"
                        secureTextEntry
                    />

                    {/* Remember Me Toggle */}
                    {mode === 'LOGIN' && (
                        <View className="flex-row items-center justify-between mt-2 mb-2 px-1">
                             <StyledText className="text-slate-400 font-bold text-[10px] tracking-widest uppercase">Remember Me (24h)</StyledText>
                             <Switch 
                                value={rememberMe}
                                onValueChange={setRememberMe}
                                trackColor={{false: '#1e293b', true: '#2563eb'}}
                                thumbColor={rememberMe ? '#ffffff' : '#94a3b8'}
                             />
                        </View>
                    )}

                    {mode === 'REGISTER' && (
                        <Input 
                            label="LICENSE KEY"
                            placeholder="ZEXXY-..."
                            value={key}
                            onChangeText={setKey}
                            autoCapitalize="none"
                            secureTextEntry
                        />
                    )}

                    <StyledTouch
                        onPress={handleAction}
                        disabled={loading}
                        className="mt-6 w-full overflow-hidden rounded-2xl shadow-blue-500/10 shadow-lg"
                    >
                        <LinearGradient
                            colors={['#3b82f6', '#2563eb']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="py-4 items-center justify-center bg-blue-600"
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <StyledText className="text-white font-black text-xs tracking-[3px] uppercase">
                                    {mode === 'LOGIN' ? 'AUTHENTICATE' : 'ACTIVATE KEY'}
                                </StyledText>
                            )}
                        </LinearGradient>
                    </StyledTouch>
                </View>
            </View>

            {/* Error Popup */}
            <Modal transparent visible={errorPopupVisible} animationType="fade" onRequestClose={() => setErrorPopupVisible(false)}>
                <StyledView className="flex-1 justify-center items-center bg-black/80 px-8">
                     <View className="w-full bg-[#1a1d24] border border-red-500/30 rounded-3xl p-6 shadow-2xl items-center">
                        <View className="w-12 h-12 bg-red-500/10 rounded-full items-center justify-center mb-4">
                             <StyledText className="text-xl">🛑</StyledText>
                        </View>
                        
                        <StyledText className="text-red-500 font-bold text-lg tracking-widest uppercase mb-2">
                            Authorization Failed
                        </StyledText>
                        
                        <StyledText className="text-slate-400 text-center text-xs mb-6 font-mono leading-5">
                            {errorMsg}
                        </StyledText>

                        {isHwidError && (
                            <StyledTouch 
                                onPress={copyHWID}
                                className="w-full bg-slate-800 py-3 rounded-xl mb-3 border border-slate-700"
                            >
                                <StyledText className="text-white text-center font-bold text-[10px] tracking-widest uppercase">
                                    Copy Error / HWID
                                </StyledText>
                            </StyledTouch>
                        )}
                        
                        <StyledTouch 
                            onPress={() => Linking.openURL("https://t.me/ZENIBYBOT")}
                            className="w-full bg-slate-800 py-3 rounded-xl mb-3 border border-slate-700"
                        >
                            <StyledText className="text-white text-center font-bold text-[10px] tracking-widest uppercase">
                                Join Channel
                            </StyledText>
                        </StyledTouch>

                        <StyledTouch 
                            onPress={() => Linking.openURL("https://t.me/MASTERZENI")}
                            className="w-full bg-blue-600 py-3 rounded-xl mb-4"
                        >
                             <StyledText className="text-white text-center font-bold text-[10px] tracking-widest uppercase">
                                Purchase Key @MASTERZENI
                            </StyledText>
                        </StyledTouch>

                        <StyledTouch onPress={() => setErrorPopupVisible(false)}>
                            <StyledText className="text-slate-600 text-[10px]">Close</StyledText>
                        </StyledTouch>
                     </View>
                </StyledView>
            </Modal>
        </View>
    );
};
