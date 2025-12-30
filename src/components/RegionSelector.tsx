import React, { useState } from 'react';
import { Modal, TouchableOpacity, ScrollView, View, Text } from 'react-native';
import { styled } from 'nativewind';
import { Card } from './Card'; // Updated import
import { REGION_URLS } from '../core/utils';

const StyledTouch = styled(TouchableOpacity);
const StyledText = styled(Text);
const StyledView = styled(View);

interface RegionSelectorProps {
    selectedRegion: string;
    onSelect: (region: string) => void;
}

export const RegionSelector = ({ selectedRegion, onSelect }: RegionSelectorProps) => {
    const [visible, setVisible] = useState(false);
    const regions = Object.keys(REGION_URLS);

    return (
        <View className="mb-4">
             <StyledText className="text-slate-300 mb-2 ml-1 font-semibold text-sm uppercase tracking-wider">Region</StyledText>
             <StyledTouch onPress={() => setVisible(true)}>
                <View className="bg-slate-900 rounded-xl border border-slate-700 h-14 justify-center px-4">
                    <StyledText className="text-white text-lg font-medium">
                        {selectedRegion}
                    </StyledText>
                </View>
             </StyledTouch>

             <Modal
                transparent
                visible={visible}
                animationType="fade"
                onRequestClose={() => setVisible(false)}
             >
                 <StyledView className="flex-1 justify-center items-center bg-black/90">
                     <View className="w-4/5 h-3/4">
                        <Card className="w-full h-full bg-slate-800">
                            <StyledText className="text-white text-2xl font-bold text-center mb-6 mt-2 border-b border-slate-700 pb-4">
                                SELECT REGION
                            </StyledText>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {regions.map(r => (
                                    <StyledTouch 
                                        key={r} 
                                        onPress={() => {
                                            onSelect(r);
                                            setVisible(false);
                                        }}
                                        className={`p-4 mb-3 rounded-xl border ${r === selectedRegion ? 'bg-blue-600 border-blue-400' : 'bg-slate-700 border-slate-600'}`}
                                    >
                                        <StyledText className="text-white text-center font-bold text-lg tracking-wide">{r}</StyledText>
                                    </StyledTouch>
                                ))}
                            </ScrollView>
                            <StyledTouch 
                                onPress={() => setVisible(false)}
                                className="mt-4 p-4 bg-red-500 rounded-xl shadow-lg"
                            >
                                <StyledText className="text-white text-center font-bold text-lg">CANCEL</StyledText>
                            </StyledTouch>
                        </Card>
                     </View>
                 </StyledView>
             </Modal>
        </View>
    );
};
