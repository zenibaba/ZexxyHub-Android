import './src/utils/shim';
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, ActivityIndicator, ScrollView, Linking, TextInput, ToastAndroid, Platform } from 'react-native';
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
import { parseProxyInput, fetchPublicProxies, ProxyNode } from './src/core/proxy';
import { UtilityCard } from './src/components/UtilityCard';
import { LinearGradient } from 'expo-linear-gradient';

const StyledSafeArea = styled(SafeAreaView);
const StyledText = styled(Text);
const StyledTouch = styled(TouchableOpacity);
const StyledView = styled(View);
const StyledTextInput = styled(TextInput);

type Tab = 'GENERATOR' | 'RESULTS';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('GENERATOR');
  
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
      AsyncStorage.multiGet(['TG_BOT', 'TG_CHAT', 'MIN_RARITY']).then(values => {
          if(values[0][1]) setTgBotToken(values[0][1]);
          if(values[1][1]) setTgChatId(values[1][1]);
          if(values[2][1]) setMinRarity(values[2][1]);
          console.log('[ZEXXY] Loaded Telegram settings');
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
    
    try {
        let consecutiveFailures = 0;
        while (totalSuccesses < count && generationRef.current) { 
            const remaining = count - totalSuccesses;
            const thisBatch = Math.min(remaining, threadLimit);
            
            const promises = [];
            for(let i=0; i<thisBatch; i++) {
                 promises.push(generateAccount(region, namePrefix, passPrefix, isGhost, gameVersion, addLog));
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
            
            const pending = count - totalSuccesses;
            if (pending > 0 && generationRef.current) {
                 await new Promise(r => setTimeout(r, 500)); // Standard 500ms delay between successful batches
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
                <View className="flex-1 px-5 pt-4">
                     <ScrollView showsVerticalScrollIndicator={false}>
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
                                label="IP Display" 
                                icon={<Text className="text-lg">🌐</Text>}
                                value={showIpDisplay}
                                onValueChange={setShowIpDisplay}
                                colors={['#6366f1', '#3b82f6']} 
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

                         {/* IP Display Row (Conditional) */}
                         {showIpDisplay && (
                             <View className="flex-row items-center border-b border-slate-900 pb-2 mb-6">
                                 <View className="w-2 h-2 rounded-full bg-blue-500 mr-2 shadow-[0_0_8px_rgba(59,130,246,1)]" />
                                 <StyledText className="text-slate-500 text-[10px] font-bold tracking-widest mr-2 uppercase">Live Public IP:</StyledText>
                                 <StyledText className="text-blue-400 text-xs font-mono font-bold">{currentIp}</StyledText>
                             </View>
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
                                 
                                 <View className="flex-row items-center ml-2 border-l border-slate-800 pl-4">
                                     <Switch 
                                        value={useProxy} 
                                        onValueChange={(val) => {
                                            setUseProxy(val);
                                            if(val) setShowProxyManager(true);
                                        }} 
                                        trackColor={{true: '#3b82f6', false: '#1e293b'}} 
                                        thumbColor={'#ffffff'} 
                                     />
                                     <StyledText className="text-slate-400 font-bold ml-2 text-[10px] tracking-widest uppercase">PROXY</StyledText>
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
                                 <View className="flex-row justify-between">
                                      <StyledTouch onPress={() => handleProxyImport()} className="bg-slate-800 p-3 rounded-xl flex-1 mr-2 border border-slate-700">
                                          <StyledText className="text-white text-center text-[10px] font-bold uppercase">Public API</StyledText>
                                      </StyledTouch>
                                      <StyledTouch onPress={() => handleProxyImport()} className="bg-blue-600 p-3 rounded-xl flex-1 ml-2">
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

         {/* Bottom Navigation Bar */}
         <View className="bg-slate-900 border-t border-slate-800 flex-row pb-2 pt-2">
             <StyledTouch 
                onPress={() => setActiveTab('GENERATOR')}
                className={`flex-1 p-4 items-center justify-center border-b-2 ${activeTab === 'GENERATOR' ? 'border-blue-500' : 'border-transparent'}`}
             >
                 <StyledText className={`font-bold text-xs ${activeTab === 'GENERATOR' ? 'text-blue-500' : 'text-slate-500'}`}>
                    GENERATOR
                 </StyledText>
             </StyledTouch>
             
             <StyledTouch 
                onPress={() => setActiveTab('RESULTS')}
                className={`flex-1 p-4 items-center justify-center border-b-2 ${activeTab === 'RESULTS' ? 'border-blue-500' : 'border-transparent'}`}
             >
                 <StyledText className={`font-bold text-xs ${activeTab === 'RESULTS' ? 'text-blue-500' : 'text-slate-500'}`}>
                    RESULTS
                 </StyledText>
             </StyledTouch>
         </View>

      </SafeAreaView>
    </StyledView>
    </SafeAreaProvider>
  );
}
