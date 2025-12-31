import './src/utils/shim';
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, ActivityIndicator, ScrollView, Linking, TextInput, ToastAndroid, Platform, Image, Animated, Easing } from 'react-native';
import { Audio } from 'expo-av';
import { MusicPlayer } from './src/components/MusicPlayer'; 
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { styled } from 'nativewind';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Input } from './src/components/Input';
import { Card } from './src/components/Card';
import { RegionSelector } from './src/components/RegionSelector';
import { ResultsScreen } from './src/components/ResultsScreen';
import { generateAccount, AccountData } from './src/core/api';
import { saveBatch, setRootUri, loadSavedUri, getRootUri, loadHistoricalAccounts } from './src/core/storage';
import { sendTelegramMessage, formatAccountForTelegram } from './src/core/telegram';
import { calculateRarityScore } from './src/core/utils';
import { StorageAccessFramework } from 'expo-file-system/legacy';
import { CustomAlert } from './src/components/CustomAlert';
import { parseProxyInput, fetchPublicProxies, ProxyNode, checkAllProxies } from './src/core/proxy';
import { UtilityCard } from './src/components/UtilityCard';
import { LinearGradient } from 'expo-linear-gradient';

const StyledSafeArea = styled(SafeAreaView);
const StyledText = styled(Text);
const StyledTouch = styled(TouchableOpacity);
const StyledView = styled(View);
const StyledTextInput = styled(TextInput);
import { StatsDashboard } from './src/components/StatsDashboard';

import { LoginScreen } from './src/components/LoginScreen';

type Tab = 'GENERATOR' | 'RESULTS';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('GENERATOR');
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [expiryDate, setExpiryDate] = useState<string | undefined>(undefined);

  // --- Garena Clicker State ---
  const [garenaClicks, setGarenaClicks] = useState(0);
  const clickAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const clickTimer = useRef<NodeJS.Timeout | null>(null);
  const [clickSound, setClickSound] = useState<Audio.Sound | null>(null);

  // Load Click Sound
  // Load Click Sound
  useEffect(() => {
    async function loadClick() {
        try {
            // Fix: Configure audio to play in silent mode/background
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
                shouldDuckAndroid: true,
            });

            const { sound } = await Audio.Sound.createAsync(
                require('./assets/click.mp3') 
            );
            setClickSound(sound);
        } catch(e) { }
    }
    loadClick();
  }, []);

  const handleGarenaClick = async () => {
      // Play Sound
      if (clickSound) {
          try { 
              await clickSound.stopAsync(); // Stop previous for overlapping clicks
              await clickSound.playAsync(); 
          } catch(e) {}
      }
      
      setGarenaClicks(prev => prev + 1);

      // Reset Animation
      clickAnim.setValue(0);
      fadeAnim.setValue(1);

      // Animate Up and Fade Out
      Animated.parallel([
          Animated.timing(clickAnim, {
              toValue: -100,
              duration: 800,
              useNativeDriver: true,
              easing: Easing.out(Easing.ease)
          }),
          Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true
          })
      ]).start();

      // Reset Timer
      if (clickTimer.current) clearTimeout(clickTimer.current);
      clickTimer.current = setTimeout(() => {
          setGarenaClicks(0);
      }, 5000);
  };
  
  const [amount, setAmount] = useState('10');
  const [namePrefix, setNamePrefix] = useState('ZENI');
  const [passPrefix, setPassPrefix] = useState('ZEXXU');
  const [region, setRegion] = useState('IND');
  const [isGhost, setIsGhost] = useState(false);
  const [useProxy, setUseProxy] = useState(false);
  const [threads, setThreads] = useState('10'); 
  
  // Telegram Settings
  const [tgBotToken, setTgBotToken] = useState('');
  const [tgChatId, setTgChatId] = useState('');
  const [minRarity, setMinRarity] = useState('6');
  const [showTgSettings, setShowTgSettings] = useState(false);

  // Proxy Settings
  const [proxyList, setProxyList] = useState<ProxyNode[]>([]);
  const [rawProxyInput, setRawProxyInput] = useState('');
  const [showProxyManager, setShowProxyManager] = useState(false);
  const [currentIp, setCurrentIp] = useState('Checking...');
  const [showIpDisplay, setShowIpDisplay] = useState(true);
  const [showAppDisplay, setShowAppDisplay] = useState(true);
  const [isCheckingProxies, setIsCheckingProxies] = useState(false);
  const [proxyCheckProgress, setProxyCheckProgress] = useState(0);
  
  // Analytics
  const [totalErrors, setTotalErrors] = useState(0);
  const [sessionStart] = useState(Date.now());
  const [lifetimeCount, setLifetimeCount] = useState(0);
  const [fastestTime, setFastestTime] = useState(Infinity);

  // Alert State
  const [alertConfig, setAlertConfig] = useState<{visible: boolean, title: string, msg: string, type: 'info' | 'success' | 'error' | 'warning'}>({
      visible: false, title: '', msg: '', type: 'info'
  });

  // Game Version
  const [gameVersion, setGameVersion] = useState('Ob51');
  const versions = ['Ob51', 'Ob52', 'Ob53', 'Ob54', 'Ob55', 'BITCH'];

  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<AccountData[]>([]);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [lastStatus, setLastStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
  
  const scrollViewRef = useRef<ScrollView>(null);
  const generationRef = useRef(false);

  // --- Helpers ---
  const showAlert = (title: string, msg: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
      setAlertConfig({ visible: true, title, msg, type });
  };
  
  const closeAlert = () => {
      setAlertConfig(prev => ({...prev, visible: false}));
  };

  // Load Saved config on start
  useEffect(() => {
      console.log('[ZEXXY] App started, loading saved data...');
      loadSavedUri().then(async (uri) => {
          console.log('[ZEXXY] Saved URI:', uri);
          if (uri) {
              const history = await loadHistoricalAccounts();
              console.log('[ZEXXY] Loaded accounts from storage:', history?.length || 0);
              if (history && history.length > 0) {
                  setResults(history);
                  console.log('[ZEXXY] Set results with', history.length, 'accounts');
              }
          } else {
              console.log('[ZEXZY] No storage URI found');
          }
      }).catch(err => {
          console.error('[ZEXXY] Error loading storage:', err);
      });
      AsyncStorage.multiGet(['TG_BOT', 'TG_CHAT', 'MIN_RARITY', 'LIFETIME_COUNT', 'FASTEST_TIME']).then(values => {
          if(values[0][1]) setTgBotToken(values[0][1]);
          if(values[1][1]) setTgChatId(values[1][1]);
          if(values[2][1]) setMinRarity(values[2][1]);
          if(values[3][1]) setLifetimeCount(parseInt(values[3][1]) || 0);
          if(values[4][1]) setFastestTime(parseFloat(values[4][1]) || Infinity);
          console.log('[ZEXXY] Loaded Settings & Stats');
      }).catch(err => {
          console.error('[ZEXXY] Error loading settings:', err);
      });
      fetchIp();
  }, []);

  const fetchIp = async () => {
      try {
          const res = await fetch('https://api.ipify.org?format=json');
          const data = await res.json();
          setCurrentIp(data.ip);
      } catch (e) {
          setCurrentIp('Failed');
      }
  };

  const openFlightModeSettings = () => {
      if (Platform.OS === 'android') {
          Linking.sendIntent('android.settings.AIRPLANE_MODE_SETTINGS');
      } else {
          Linking.openURL('App-Prefs:root=AIRPLANE_MODE');
      }
  };

  const addLog = (msg: string) => {
      const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const entry = `[${time}] ${msg}`;
      setLogs(prev => [...prev.slice(-49), entry]); // Keep last 50
      if (msg.includes('-> 200')) setLastStatus('SUCCESS');
      else if (msg.includes('Status 403') || msg.includes('Status 500') || msg.includes('ERROR')) setLastStatus('ERROR');
  };

  const clearLogs = () => setLogs([]);

  const saveTgSettings = () => {
      AsyncStorage.setItem('TG_BOT', tgBotToken);
      AsyncStorage.setItem('TG_CHAT', tgChatId);
      AsyncStorage.setItem('MIN_RARITY', minRarity);
      setShowTgSettings(false);
      showAlert("Success", "Telegram settings saved!", 'success');
  };

  const openTelegramDev = () => {
      Linking.openURL('https://t.me/MASTERZENI');
  };
  
  const cycleVersion = () => {
      const idx = versions.indexOf(gameVersion);
      const nextIdx = (idx + 1) % versions.length;
      setGameVersion(versions[nextIdx]);
  };

  const handleCheckProxies = async () => {
      if (proxyList.length === 0) {
          showAlert("Error", "No proxies to check. Save a list first.", 'error');
          return;
      }
      setIsCheckingProxies(true);
      setProxyCheckProgress(0);
      try {
          const checked = await checkAllProxies(proxyList, (count) => {
              setProxyCheckProgress(count);
          });
          setProxyList(checked);
          const live = checked.filter(p => p.isLive).length;
          showAlert("Check Complete", `Found ${live} Live proxies / ${checked.length} Total.`, 'success');
      } catch (e) {
         showAlert("Error", "Failed to check proxies.", 'error');
      } finally {
          setIsCheckingProxies(false);
      }
  };

  const handleProxyImport = async () => {
      if (rawProxyInput) {
          const parsed = parseProxyInput(rawProxyInput);
          setProxyList(parsed);
          showAlert("Proxies Added", `Loaded ${parsed.length} proxies from input!`, 'success');
      } else {
          const publicP = await fetchPublicProxies();
          setProxyList(publicP);
          showAlert("Public Proxies", `Fetched ${publicP.length} public proxies!`, 'success');
      }
      setShowProxyManager(false);
  };

  const startGeneration = async () => {
    console.log('[ZEXXY] Starting account generation...');
    if (isGenerating) {
      console.log('[ZEXXY] Generation already in progress');
      return;
    }

    // Validate Proxy
    if (useProxy) {
        if (proxyList.length === 0) {
            showAlert("Proxy Error", "Please add at least 1 proxy in settings!", 'error');
            setShowProxyManager(true);
            return;
        }
        // Ideally checking availability here
        // const liveProxies = await Promise.all(proxyList.map(checkProxy)); ....
    }
    
    generationRef.current = true;
    
    const count = parseInt(amount);
    const threadCount = parseInt(threads) || 1;
    
    const currentUri = getRootUri();
    if (!currentUri) {
         try {
            const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
            if (permissions.granted) {
                await setRootUri(permissions.directoryUri);
            } else {
                showAlert("Error", "Storage needed to save files.", 'error');
                return;
            }
        } catch(e) { return; }
    }
    
    setIsGenerating(true);
    setGeneratedCount(0);

    let totalSuccesses = 0;
    const threadLimit = parseInt(threads) || 1;
    let proxyIndex = 0;
    
    // Simple Round-Robin
    const getNextProxy = () => {
        if (proxyList.length === 0) return undefined;
        const p = proxyList[proxyIndex % proxyList.length];
        proxyIndex++;
        return p;
    };
    
    try {
        let consecutiveFailures = 0;
        while (totalSuccesses < count && generationRef.current) { 
            const remaining = count - totalSuccesses;
            const thisBatch = Math.min(remaining, threadLimit);
            
            const promises = [];
            for(let i=0; i<thisBatch; i++) {
                 // Measure individual generation time for stats
                 const p = (async () => {
                     // Proxy Rotation Logic for this thread
                     // We try up to 3 different proxies if we get 403s
                     let currentProxy = useProxy && proxyList.length > 0 ? getNextProxy() : undefined;
                     let res: AccountData | null = null;
                     
                     for (let attempt = 0; attempt < 3; attempt++) {
                        const startT = Date.now();
                        try {
                            // Only use proxy if enabled and list available
                            res = await generateAccount(
                                region, 
                                namePrefix, 
                                passPrefix, 
                                isGhost, 
                                gameVersion, 
                                addLog,
                                currentProxy
                            );
                            
                            if (res) {
                                const dur = Date.now() - startT;
                                setFastestTime(prev => {
                                    const newFast = Math.min(prev, dur);
                                    AsyncStorage.setItem('FASTEST_TIME', String(newFast));
                                    return newFast;
                                });
                                break; // Success
                            }
                        } catch (err: any) {
                             if (err.message === 'PROXY_BANNED' && useProxy) {
                                  addLog(`[AUTO-ROTATE] Proxy Banned! Switching...`);
                                  currentProxy = getNextProxy();
                                  continue; // Retry loop
                             }
                             // Other errors, we just stop this thread
                             break;
                        }
                     }
                     return res;
                 })();
                 promises.push(p);
            }
            
            const batchResults = await Promise.all(promises);
            
            // Check for failures and status codes
            const validAccounts: AccountData[] = [];
            for (const res of batchResults) {
                if (res) {
                    validAccounts.push(res);
                }
            }
            
            validAccounts.forEach(acc => {
                const rarity = calculateRarityScore(acc.account_id);
                const minRarityNum = parseInt(minRarity) || 6;
                if (tgBotToken && tgChatId && rarity >= minRarityNum) {
                    sendTelegramMessage(tgBotToken, tgChatId, formatAccountForTelegram(acc, rarity));
                }
                // Reset failures on success
                consecutiveFailures = 0;
            });

            if (validAccounts.length > 0) {
                totalSuccesses += validAccounts.length;
                setResults(prev => [...prev, ...validAccounts]);
                setGeneratedCount(prev => prev + validAccounts.length);
                setLifetimeCount(prev => {
                    const newVal = prev + validAccounts.length;
                    AsyncStorage.setItem('LIFETIME_COUNT', String(newVal));
                    return newVal;
                });
                try {
                    await saveBatch(validAccounts);
                } catch (saveErr: any) {
                    showAlert("Storage Error", saveErr.message, 'error');
                }
            } else {
                // No successes in this batch
                 consecutiveFailures++;
                 const delaySeconds = Math.min(Math.pow(2, consecutiveFailures), 30); // Cap at 30s
                 addLog(`[WARN] Batch failed. Retrying in ${delaySeconds}s...`);
                 
                 if (consecutiveFailures >= 5) {
                    addLog(`[TIP] Constant failures? Try Flight Mode to change IP.`);
                 }
                 
                 await new Promise(r => setTimeout(r, delaySeconds * 1000));
                 continue; // Skip the standard delay
            }
            
            // Optimized Loop for High Speed (No delays, aggressive refill)
            if (generationRef.current && (count - totalSuccesses) > 0) {
                 // Zero delay for maximum speed as requested
                 await new Promise(r => setTimeout(r, 0)); 
            }
        }
    } catch (err: any) {
        console.error("[ZEXXY] Generation Error:", err);
        const errorMsg = err?.message || String(err);
        
        if (errorMsg.includes('403')) {
            ToastAndroid.show("ERROR 403: Site Blocked! CHANGE IP (FLIGHT MODE) ✈️", ToastAndroid.LONG);
        } else if (errorMsg.includes('500')) {
            ToastAndroid.show("ERROR 500: Server Busy! Try again later or change IP.", ToastAndroid.LONG);
        } else {
             ToastAndroid.show(`Generation Failed: ${errorMsg.substring(0, 50)}`, ToastAndroid.SHORT);
        }

        showAlert(
            "Generation Failed", 
            `Error: ${errorMsg}\n\n💡 TIP: Try switching the Game Version (OB51/OB52) or toggle Flight Mode to change IP!`,
            'error'
        );
    } finally {
        console.log('[ZEXXY] Generation completed. Count:', generatedCount);
        setIsGenerating(false);
        generationRef.current = false; 
        if (generatedCount > 0) {
             showAlert("Generation Complete", `Generated ${generatedCount} accounts.`, 'success');
             setActiveTab('RESULTS');
        }
    }
  };
  
  const stopGeneration = () => {
      generationRef.current = false; 
      setIsGenerating(false);
  };

  // --- RENDER ---
  
  if (!isAuthenticated) {
      return (
          <SafeAreaProvider>
             <ExpoStatusBar style="light" />
             <LoginScreen onLoginSuccess={(expiry) => {
                 setIsAuthenticated(true);
                 if (expiry) setExpiryDate(expiry);
             }} />
          </SafeAreaProvider>
      );
  }

  return (
    <SafeAreaProvider>
    <StyledView className="flex-1 bg-slate-950">
      <ExpoStatusBar style="light" />
      <SafeAreaView className="flex-1">
         
         <CustomAlert 
            visible={alertConfig.visible} 
            title={alertConfig.title} 
            message={alertConfig.msg} 
            type={alertConfig.type}
            onClose={closeAlert}
         />

         {/* Main Content Area */}
         <StyledView className="flex-1">
             {activeTab === 'GENERATOR' ? (
                <View className="flex-1 bg-slate-950">
                     {/* Music Player Fixed at Top - Explicit Z-Index */}
                     <View className="absolute top-2 right-4 z-50 pointer-events-box-none">
                            <MusicPlayer />
                     </View>

                     <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 40 }}>
                          {/* Header */}
                         <View className="items-center mt-6 mb-8">
                            <StyledText className="text-4xl font-black text-white tracking-[4px] uppercase italic">
                                ZEXXY <StyledText className="text-blue-500">HUB</StyledText>
                            </StyledText>
                            <StyledTouch onPress={openTelegramDev}>
                                <StyledText className="text-[10px] text-slate-600 font-bold tracking-[3px] mt-1 uppercase">
                                    Developer • @MASTERZENI
                                </StyledText>
                            </StyledTouch>
                         </View>

                         {/* Utility Grid 2x2 */}
                         <View className="flex-row flex-wrap justify-between mb-8">
                             <UtilityCard 
                                label="TG Config" 
                                icon={<Text className="text-lg">⚙️</Text>}
                                value={showTgSettings}
                                onValueChange={setShowTgSettings}
                                colors={['#f97316', '#ef4444']} 
                             />
                             <UtilityCard 
                                label="PROXY MODE" 
                                icon={<Text className="text-lg">🌐</Text>}
                                value={useProxy}
                                onValueChange={(val) => {
                                    setUseProxy(val);
                                    if(val) {
                                        setShowIpDisplay(true);
                                        // Open manager if list is empty or strictly requested
                                        if (proxyList.length === 0) setShowProxyManager(true);
                                    }
                                }}
                                colors={['#6366f1', '#3b82f6']} 
                                onPress={() => setShowProxyManager(true)} // Allow clicking card body to open manager
                             />
                             <View className="w-full h-1" />
                             <UtilityCard 
                                label="Logs" 
                                icon={<Text className="text-lg">📋</Text>}
                                value={showLogs}
                                onValueChange={setShowLogs}
                                colors={['#10b981', '#3b82f6']} 
                              />
                             <UtilityCard 
                                label="Flight Mode" 
                                icon={<Text className="text-lg">✈️</Text>}
                                value={false}
                                onValueChange={() => openFlightModeSettings()}
                                colors={['#d946ef', '#ec4899']} 
                                onPress={openFlightModeSettings}
                             />
                         </View>

                         {/* IP Display Row (Blur/Reveal) */}
                         {useProxy && (
                             <StyledTouch 
                                activeOpacity={0.7}
                                onPress={() => setShowIpDisplay(!showIpDisplay)}
                                className="flex-row items-center border-b border-slate-900 pb-2 mb-6"
                             >
                                 <View className={`w-2 h-2 rounded-full ${showIpDisplay ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,1)]' : 'bg-slate-600'} mr-2`} />
                                 <StyledText className="text-slate-500 text-[10px] font-bold tracking-widest mr-2 uppercase">Live Public IP:</StyledText>
                                 
                                 {showIpDisplay ? (
                                    <StyledText className="text-blue-400 text-xs font-mono font-bold">
                                        {currentIp || 'Loading...'}
                                    </StyledText>
                                 ) : (
                                    <View className="bg-slate-800/50 px-2 py-0.5 rounded">
                                        <StyledText className="text-slate-500 text-[10px] font-bold tracking-widest blur-sm">HIDDEN (TAP TO REVEAL)</StyledText>
                                    </View>
                                 )}

                                 {/* Only show expiry if revealed */}
                                 {showIpDisplay && expiryDate && (
                                     <>
                                         <View className="w-[1px] h-3 bg-slate-800 mx-2" />
                                         <StyledText className="text-slate-500 text-[10px] font-bold tracking-widest mr-2 uppercase">Expires:</StyledText>
                                         <StyledText className="text-pink-400 text-xs font-mono font-bold">{expiryDate}</StyledText>
                                     </>
                                 )}
                             </StyledTouch>
                         )}

                         {/* Console Log UI */}
                         {showLogs && (
                             <Card variant="secondary" className="mb-4 bg-slate-950/80 border-slate-800/50 h-44 px-2 py-1">
                                 <View className="flex-row justify-between items-center mb-1 pb-1 border-b border-white/5">
                                     <StyledText className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">System Logs</StyledText>
                                     <StyledTouch onPress={clearLogs} className="px-2 py-0.5 rounded-md bg-red-950/20">
                                         <StyledText className="text-red-500/80 text-[9px] font-bold">CLEAR</StyledText>
                                     </StyledTouch>
                                 </View>
                                 <ScrollView 
                                     ref={scrollViewRef}
                                     onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({animated: true})}
                                     showsVerticalScrollIndicator={false}
                                     className="flex-1"
                                 >
                                     {logs.length === 0 ? (
                                         <View className="flex-1 items-center justify-center pt-10">
                                             <StyledText className="text-slate-800 text-[10px] italic">Idle... waiting for output</StyledText>
                                         </View>
                                     ) : (
                                         logs.map((log, i) => (
                                             <StyledText key={i} className={`text-[10px] font-mono leading-tight mb-0.5 ${log.includes('CRITICAL') || log.includes('ERROR') ? 'text-red-400/90' : log.includes('-> 200') ? 'text-green-400/90' : 'text-slate-500'}`}>
                                                 {log}
                                             </StyledText>
                                         ))
                                     )}
                                 </ScrollView>
                             </Card>
                         )}

                         {/* TG Config Section */}
                         <View className="flex-row items-center mb-6 mt-4">
                             <StyledText className="text-blue-500 font-black text-xl mr-3 uppercase italic">TG Config</StyledText>
                             <View className="flex-1 flex-row items-center h-4">
                                 <View className="w-8 h-[2px] bg-blue-500" />
                                 <View className="w-6 h-[2px] bg-blue-500/50 rotate-[-45deg] -translate-x-1" />
                                 <LinearGradient
                                     colors={['#3b82f6', '#ec4899']}
                                     start={{ x: 0, y: 0 }}
                                     end={{ x: 1, y: 0 }}
                                     className="flex-1 h-[2px]"
                                 />
                             </View>
                         </View>

                         {showTgSettings && (
                             <Card variant="secondary" className="mb-6 border-blue-900/30 bg-slate-900/50">
                                 <StyledText className="text-blue-400 font-bold mb-4 uppercase tracking-widest text-xs">Security Settings</StyledText>
                                 <Input label="Bot Token" value={tgBotToken} onChangeText={setTgBotToken} placeholder="123:AA..." />
                                 <View className="h-2"/>
                                 <Input label="Chat ID" value={tgChatId} onChangeText={setTgChatId} placeholder="-100..." />
                                 <View className="h-2"/>
                                 <Input 
                                     label="Min Rarity (3-10)" 
                                     value={minRarity} 
                                     onChangeText={(val) => {
                                         const num = parseInt(val) || 3;
                                         if (num >= 3 && num <= 10) setMinRarity(val);
                                     }} 
                                     keyboardType="numeric"
                                     placeholder="6"
                                 />
                                 <StyledText className="text-slate-400 text-xs mt-1">Send alerts for accounts with rarity {minRarity}+</StyledText>
                                 
                                 <View className="flex-row justify-end mt-3">
                                     <StyledTouch onPress={async () => {
                                         if(!tgBotToken || !tgChatId) {
                                             showAlert("Error", "Please enter Bot Token and Chat ID first.", 'error');
                                             return;
                                         }
                                         try {
                                             const ok = await sendTelegramMessage(tgBotToken, tgChatId, "🔔 *ZEXXY HUB* \nTest Notification Success!");
                                             if(ok) showAlert("Success", "Test message sent!", 'success');
                                             else showAlert("Failed", "Could not send message. Check Token/ID.", 'error');
                                         } catch(e) {
                                             showAlert("Error", "Connection failed.", 'error');
                                         }
                                     }} className="bg-slate-800 p-3 rounded-xl mr-2">
                                         <StyledText className="text-white font-bold text-xs">TEST</StyledText>
                                     </StyledTouch>
                                     <StyledTouch onPress={saveTgSettings} className="bg-blue-600 p-3 rounded-xl px-6">
                                         <StyledText className="text-white font-bold text-xs">SAVE CONFIG</StyledText>
                                     </StyledTouch>
                                 </View>
                             </Card>
                         )}
                         
                         {/* Mini Dashboard (Compact) */}
                         <View className="mb-6 mx-1">
                             <View className="flex-row justify-between mb-2">
                                <StyledText className="text-white font-bold text-[10px] uppercase tracking-widest pl-1">Session Analytics</StyledText>
                                <StyledText className="text-slate-500 font-bold text-[10px] uppercase tracking-widest pr-1">LIFETIME: {lifetimeCount}</StyledText>
                             </View>
                             <View className="flex-row">
                                 {/* Success Card */}
                                 <View className="flex-1 bg-slate-900 border border-slate-800 rounded-l-xl p-3 items-center border-r-0">
                                     <StyledText className="text-green-400 font-black text-xl">{generatedCount}</StyledText>
                                     <StyledText className="text-slate-500 text-[8px] font-bold uppercase tracking-widest mt-1">SUCCESS</StyledText>
                                 </View>
                                 
                                 {/* Failed Card */}
                                 <View className="flex-1 bg-slate-900 border border-slate-800 p-3 items-center border-x-slate-800/50">
                                     <StyledText className="text-red-400 font-black text-xl">{totalErrors}</StyledText>
                                     <StyledText className="text-slate-500 text-[8px] font-bold uppercase tracking-widest mt-1">FAILED</StyledText>
                                 </View>

                                 {/* Total Card */}
                                 <View className="flex-1 bg-slate-900 border border-slate-800 rounded-r-xl p-3 items-center border-l-0">
                                     <StyledText className="text-blue-400 font-black text-xl">{generatedCount + totalErrors}</StyledText>
                                     <StyledText className="text-slate-500 text-[8px] font-bold uppercase tracking-widest mt-1">TOTAL</StyledText>
                                 </View>
                             </View>
                         </View>

                         {/* Main Controls Overlay */}
                         <View className="mb-4">
                             <View className="flex-row justify-between">
                                 <View className="flex-1 mr-2">
                                    <Input label="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" />
                                 </View>
                                 <View className="flex-1 ml-2">
                                     <Input label="Thread" value={threads} onChangeText={setThreads} keyboardType="numeric" />
                                 </View>
                             </View>
                             
                             <Input label="Name Prefix" value={namePrefix} onChangeText={setNamePrefix} />
                             <Input label="Pass Prefix" value={passPrefix} onChangeText={setPassPrefix} />
                             
                             <RegionSelector selectedRegion={region} onSelect={setRegion} />
                             
                             {/* Bottom Settings Row */}
                             <View className="flex-row justify-between items-center mt-6 px-2 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 shadow-inner">
                                 <View className="flex-row items-center">
                                     <Switch 
                                       value={isGhost} 
                                       onValueChange={setIsGhost} 
                                       trackColor={{true: '#ec4899', false: '#1e293b'}} 
                                       thumbColor={'#ffffff'} 
                                     />
                                     <StyledText className="text-slate-400 font-bold ml-2 text-[10px] tracking-widest uppercase">GHOST</StyledText>
                                 </View>
                                 
                                 <StyledTouch 
                                    onPress={cycleVersion}
                                    className="ml-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 items-center justify-center min-w-[50px]"
                                 >
                                     <StyledText className="text-blue-400 font-black text-[10px]">{gameVersion}</StyledText>
                                 </StyledTouch>
                             </View>
                         </View>

                         {/* Proxy Manager UI */}
                         {useProxy && showProxyManager && (
                             <View className="mt-4 p-4 bg-slate-900 rounded-2xl border border-slate-800 shadow-inner">
                                 <StyledText className="text-white font-bold mb-4 uppercase tracking-[2px] text-[10px]">Proxy Manager</StyledText>
                                 <StyledTextInput 
                                    multiline
                                    numberOfLines={4}
                                    value={rawProxyInput}
                                    onChangeText={setRawProxyInput}
                                    placeholder="1.2.3.4:8080 (One per line)"
                                    placeholderTextColor="#334155"
                                    className="bg-slate-950 text-white p-4 rounded-xl mb-4 text-xs h-32 border border-slate-800/50"
                                    style={{textAlignVertical: 'top'}}
                                 />
                                 <View className="mb-4">
                                     <View className="flex-row justify-between mb-2">
                                          <StyledTouch onPress={() => handleProxyImport()} className="bg-slate-800 p-3 rounded-xl flex-1 mr-1 border border-slate-700">
                                              <StyledText className="text-white text-center text-[10px] font-bold uppercase">Public API</StyledText>
                                          </StyledTouch>
                                          <StyledTouch onPress={() => handleCheckProxies()} className={`p-3 rounded-xl flex-1 ml-1 border border-slate-700 ${isCheckingProxies ? 'bg-slate-700' : 'bg-purple-600'}`}>
                                              <StyledText className="text-white text-center text-[10px] font-bold uppercase">
                                                  {isCheckingProxies ? `Checking ${Math.round(proxyCheckProgress)}%` : 'Check Speed'}
                                              </StyledText>
                                          </StyledTouch>
                                     </View>
                                     
                                     {/* Proxy Stats */}
                                     {proxyList.length > 0 && (
                                         <View className="flex-row justify-between bg-slate-950/50 p-2 rounded-lg mb-2 border border-slate-800">
                                             <StyledText className="text-slate-400 text-[10px] font-bold">Total: <StyledText className="text-white">{proxyList.length}</StyledText></StyledText>
                                             <StyledText className="text-green-400 text-[10px] font-bold">Live: {proxyList.filter(p => p.isLive).length}</StyledText>
                                             <StyledText className="text-red-400 text-[10px] font-bold">Dead: {proxyList.filter(p => !p.isLive).length}</StyledText>
                                         </View>
                                     )}

                                      <StyledTouch onPress={() => handleProxyImport()} className="bg-blue-600 p-3 rounded-xl w-full">
                                          <StyledText className="text-white text-center text-[10px] font-bold uppercase">Save List</StyledText>
                                      </StyledTouch>
                                 </View>
                             </View>
                         )}

                         {/* Live Status Bar */}
                         {isGenerating && (
                             <View className="mt-8 px-4 py-3 bg-slate-900 border border-slate-800/50 rounded-t-[20px] flex-row items-center justify-between">
                                 <View className="flex-row items-center">
                                     <View className={`w-2 h-2 rounded-full mr-2 ${lastStatus === 'SUCCESS' ? 'bg-green-500 shadow-[0_0_10px_green]' : lastStatus === 'ERROR' ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-blue-500 shadow-[0_0_10px_blue]'}`} />
                                     <StyledText className="text-slate-400 text-[10px] font-bold tracking-widest uppercase italic">
                                         {lastStatus === 'SUCCESS' ? 'Status: Syncing' : lastStatus === 'ERROR' ? 'Status: Blocked' : 'Status: Linking'}
                                     </StyledText>
                                 </View>
                                 <StyledText className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                                     REMAINING: <StyledText className="text-blue-500">{(parseInt(amount) || 0) - generatedCount}</StyledText>
                                 </StyledText>
                             </View>
                         )}

                         <StyledTouch
                             onPress={isGenerating ? stopGeneration : startGeneration}
                             className={`w-full overflow-hidden shadow-2xl shadow-blue-500/20 ${isGenerating ? 'rounded-b-[20px]' : 'rounded-[20px] mt-8'}`}
                         >
                             <LinearGradient
                                 colors={['#ec4899', '#3b82f6']}
                                 start={{ x: 0, y: 0 }}
                                 end={{ x: 1, y: 0 }}
                                 className="py-5 items-center justify-center"
                             >
                                 {isGenerating ? (
                                    <View className="flex-row items-center">
                                        <ActivityIndicator color="white" className="mr-3" size="small" />
                                        <StyledText className="text-white font-black text-xl tracking-[4px] uppercase italic">
                                            STOPPING... ({generatedCount})
                                        </StyledText>
                                    </View>
                                 ) : (
                                    <StyledText className="text-white font-black text-xl tracking-[5px] uppercase italic">
                                        GENERATE ACCOUNT
                                    </StyledText>
                                 )}
                             </LinearGradient>
                         </StyledTouch>

                         <View className="items-center mt-12 mb-8 opacity-20">
                             <View className="bg-slate-800 px-4 py-1.5 rounded-full border border-slate-700">
                                 <StyledText className="text-slate-400 text-[9px] font-bold tracking-[3px] uppercase italic">ZEXXY HUB v2.0-STABLE</StyledText>
                             </View>
                         </View>
                         
                         <View className="h-20" />
                     </ScrollView>
                </View>
             ) : (
                <View className="flex-1 bg-slate-950">
                    <ResultsScreen 
                        visible={true}
                        accounts={results} 
                        onClose={() => setActiveTab('GENERATOR')} 
                    />
                </View>
             )}
         </StyledView>

         {/* Bottom Navigation Bar - Improved Layout */}
         <View className="bg-slate-900 border-t border-slate-800 h-20 flex-row items-center justify-between px-10 pb-2">
             <StyledTouch 
                onPress={() => setActiveTab('GENERATOR')}
                className="items-center justify-center -top-1"
             >
                 <StyledText className={`text-2xl mb-1 ${activeTab === 'GENERATOR' ? 'text-blue-500' : 'text-slate-600'}`}>⚡</StyledText>
                 <StyledText className={`font-bold text-[10px] tracking-widest ${activeTab === 'GENERATOR' ? 'text-blue-500' : 'text-slate-600'}`}>
                    GEN
                 </StyledText>
             </StyledTouch>

            {/* Garena Clicker Button - Floating Center */}
            <View className="items-center relative -top-8">
                {/* Floating Counter */}
                {garenaClicks > 0 && (
                    <Animated.View 
                       style={{ 
                           transform: [{ translateY: clickAnim }], 
                           opacity: fadeAnim,
                           position: 'absolute',
                           top: -50,
                           zIndex: 100
                       }}
                    >
                        <StyledText className="text-yellow-400 font-black text-3xl shadow-lg drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">+{garenaClicks}</StyledText>
                    </Animated.View>
                )}

                <StyledTouch 
                   onPress={handleGarenaClick}
                   activeOpacity={0.9}
                   className="w-20 h-20 bg-slate-800 rounded-full border-[6px] border-slate-900 items-center justify-center shadow-2xl elevation-10 overflow-hidden"
                >
                    <Image 
                       source={require('./assets/garena.png')} 
                       style={{ width: '100%', height: '100%' }} 
                       resizeMode="cover"
                    />
                </StyledTouch>
            </View>


             <StyledTouch 
                onPress={() => setActiveTab('RESULTS')}
                className="items-center justify-center -top-1"
             >
                 <StyledText className={`text-2xl mb-1 ${activeTab === 'RESULTS' ? 'text-blue-500' : 'text-slate-600'}`}>📝</StyledText>
                 <StyledText className={`font-bold text-[10px] tracking-widest ${activeTab === 'RESULTS' ? 'text-blue-500' : 'text-slate-600'}`}>
                    RESULTS
                 </StyledText>
             </StyledTouch>
         </View>

      </SafeAreaView>
    </StyledView>
    </SafeAreaProvider>
  );
}
