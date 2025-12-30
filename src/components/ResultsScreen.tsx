import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { styled } from 'nativewind';
import { AccountData } from '../core/api';
import { calculateRarityScore } from '../core/utils';
import { Card } from './Card';
import { Input } from './Input';
import * as Clipboard from 'expo-clipboard';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouch = styled(TouchableOpacity);

interface ResultsScreenProps {
    visible: boolean;
    onClose: () => void;
    accounts: AccountData[];
}

export const ResultsScreen = ({ visible, onClose, accounts }: ResultsScreenProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [minRarity, setMinRarity] = useState<number>(0);
    const [sortOrder, setSortOrder] = useState<'rarity_desc' | 'rarity_asc' | 'id_asc'>('rarity_desc');

    const filteredAccounts = useMemo(() => {
        let res = (accounts || []).filter(acc => {
            const matchesSearch = 
                acc.account_id.includes(searchQuery) || 
                acc.uid.includes(searchQuery) ||
                acc.name.toLowerCase().includes(searchQuery.toLowerCase());
            
            const rarity = calculateRarityScore(acc.account_id);
            const matchesRarity = rarity >= minRarity;

            return matchesSearch && matchesRarity;
        });

        // Sorting
        return res.sort((a, b) => {
            if (sortOrder === 'rarity_desc') {
                return calculateRarityScore(b.account_id) - calculateRarityScore(a.account_id);
            } else if (sortOrder === 'rarity_asc') {
                 return calculateRarityScore(a.account_id) - calculateRarityScore(b.account_id);
            } else {
                return a.account_id.localeCompare(b.account_id);
            }
        });
    }, [accounts, searchQuery, minRarity, sortOrder]);

    const copyToClipboard = async (str: string) => {
        await Clipboard.setStringAsync(str);
    };

    const renderItem = ({ item }: { item: AccountData }) => {
        const rarity = calculateRarityScore(item.account_id);
        const isRare = rarity >= 3;
        
        return (
             <Card className={`mb-3 ${isRare ? 'border-yellow-600 bg-yellow-900/10' : 'bg-slate-900 border-slate-800'}`}>
                <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                        <View className="flex-row items-center mb-1">
                             <StyledText className="text-white font-bold text-lg mr-2">{item.name}</StyledText>
                             {isRare && (
                                <View className="bg-yellow-600 px-2 py-0.5 rounded">
                                    <StyledText className="text-black text-xs font-bold">RARE {rarity}</StyledText>
                                </View>
                             )}
                        </View>
                        
                        <StyledText className="text-slate-400 text-xs mb-1">{item.region} | UID: {item.uid}</StyledText>
                        
                        <View className="flex-row items-center mt-1">
                             <StyledText className={`font-mono text-base ${isRare ? 'text-yellow-400 font-bold' : 'text-slate-300'}`}>
                                ID: {item.account_id} 
                             </StyledText>
                             {!isRare && (
                                 <StyledText className="text-slate-600 text-xs ml-2 font-bold">Rarity: {rarity}</StyledText>
                             )}
                        </View>
                        <StyledText className="text-slate-500 text-xs mt-1">Pass: {item.password}</StyledText>
                    </View>
                    
                    <View className="flex-col space-y-2">
                        <StyledTouch 
                            onPress={() => copyToClipboard(item.account_id)}
                            className="bg-blue-600 px-3 py-2 rounded shadow active:bg-blue-700"
                        >
                            <StyledText className="text-white text-xs font-bold text-center">Copy ID</StyledText>
                        </StyledTouch>
                        <StyledTouch 
                            onPress={() => copyToClipboard(`UID:${item.uid}|PASS:${item.password}|ID:${item.account_id}|KEY:${item.jwt_token}`)}
                            className="bg-slate-800 px-3 py-2 rounded shadow active:bg-slate-700 mt-2 border border-slate-700"
                        >
                            <StyledText className="text-slate-300 text-xs font-bold text-center">Full Info</StyledText>
                        </StyledTouch>
                    </View>
                </View>
             </Card>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <StyledView className="flex-1 bg-slate-950">
                <View className="p-4 bg-slate-900 border-b border-slate-800 flex-row justify-between items-center pt-6">
                     <StyledText className="text-xl font-bold text-white">GENERATED ACCOUNTS</StyledText>
                     <StyledTouch onPress={onClose} className="bg-slate-800 p-2 rounded-full">
                         <StyledText className="text-slate-400 font-bold px-2">CLOSE</StyledText>
                     </StyledTouch>
                </View>

                <View className="p-4">
                    <Input 
                        label="Search (ID, UID, Name)" 
                        value={searchQuery} 
                        onChangeText={setSearchQuery} 
                        placeholder="Search..." 
                    />
                    
                    <View className="flex-row items-center mb-4 overflow-hidden">
                        <StyledText className="text-slate-400 font-bold mr-3 uppercase text-xs">Min Rarity:</StyledText>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {[0, 3, 4, 5, 6].map(level => (
                                <StyledTouch 
                                    key={level} 
                                    onPress={() => setMinRarity(level)}
                                    className={`mr-2 px-4 py-2 rounded-lg border ${minRarity === level ? 'bg-blue-600 border-blue-400' : 'bg-slate-800 border-slate-700'}`}
                                >
                                    <StyledText className={`${minRarity === level ? 'text-white' : 'text-slate-400'} font-bold`}>
                                        {level === 0 ? 'ALL' : `${level}+`}
                                    </StyledText>
                                </StyledTouch>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Sorting Controls */}
                    <View className="flex-row items-center mb-4">
                        <StyledText className="text-slate-400 font-bold mr-3 uppercase text-xs">Sort By:</StyledText>
                         <StyledTouch 
                            onPress={() => setSortOrder('rarity_desc')}
                            className={`mr-2 px-3 py-1 rounded border ${sortOrder === 'rarity_desc' ? 'bg-purple-600 border-purple-400' : 'bg-slate-800 border-slate-700'}`}
                        >
                            <StyledText className="text-white text-xs font-bold">Rare ↓</StyledText>
                        </StyledTouch>
                        <StyledTouch 
                            onPress={() => setSortOrder('rarity_asc')}
                            className={`mr-2 px-3 py-1 rounded border ${sortOrder === 'rarity_asc' ? 'bg-purple-600 border-purple-400' : 'bg-slate-800 border-slate-700'}`}
                        >
                            <StyledText className="text-white text-xs font-bold">Rare ↑</StyledText>
                        </StyledTouch>
                        <StyledTouch 
                            onPress={() => setSortOrder('id_asc')}
                            className={`mr-2 px-3 py-1 rounded border ${sortOrder === 'id_asc' ? 'bg-purple-600 border-purple-400' : 'bg-slate-800 border-slate-700'}`}
                        >
                            <StyledText className="text-white text-xs font-bold">ID A-Z</StyledText>
                        </StyledTouch>
                    </View>
                </View>

                <FlatList
                    data={filteredAccounts}
                    renderItem={renderItem}
                    keyExtractor={item => item.uid}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    ListEmptyComponent={
                        <View className="items-center justify-center py-10">
                            <StyledText className="text-slate-600 font-bold text-lg">NO ACCOUNTS FOUND</StyledText>
                        </View>
                    }
                />
                
                <View className="absolute bottom-0 w-full bg-slate-900 border-t border-slate-800 p-4">
                     <StyledText className="text-slate-400 text-center font-bold">
                         Showing {filteredAccounts.length} / {accounts.length} Accounts
                     </StyledText>
                </View>
            </StyledView>
        </Modal>
    );
};
