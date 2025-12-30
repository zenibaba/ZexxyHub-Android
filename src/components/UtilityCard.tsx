import React from 'react';
import { View, Text, Switch, TouchableOpacity } from 'react-native';
import { styled } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouch = styled(TouchableOpacity);

interface UtilityCardProps {
    label: string;
    icon: React.ReactNode;
    value: boolean;
    onValueChange: (val: boolean) => void;
    colors: [string, string, ...string[]];
    onPress?: () => void;
}

export const UtilityCard = ({ label, icon, value, onValueChange, colors, onPress }: UtilityCardProps) => {
    return (
        <StyledTouch 
            onPress={onPress}
            activeOpacity={0.8}
            className="flex-1 m-1.5"
        >
            <LinearGradient
                colors={colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-[24px] p-0.5 shadow-lg shadow-black/50"
            >
                <StyledView className="bg-slate-900/40 rounded-[23px] p-4 flex-row justify-between items-start h-[100px]">
                    <View className="flex-1 justify-between h-full">
                        <View className="bg-white/10 w-10 h-10 rounded-xl items-center justify-center">
                            {icon}
                        </View>
                        <StyledText className="text-white font-bold text-sm tracking-tight">{label}</StyledText>
                    </View>
                    
                    <Switch 
                        value={value} 
                        onValueChange={onValueChange}
                        trackColor={{ true: 'rgba(255,255,255,0.3)', false: 'rgba(0,0,0,0.2)' }}
                        thumbColor={value ? '#ffffff' : '#475569'}
                        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                    />
                </StyledView>
            </LinearGradient>
            
            {/* Soft inner shadow/glow underneath for depth */}
            <View className="absolute -bottom-1 left-2 right-2 h-2 bg-black/20 rounded-b-full blur-sm" />
        </StyledTouch>
    );
};
