import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { styled } from 'nativewind';
import { Card } from './Card';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouch = styled(TouchableOpacity);

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message: string;
    onClose: () => void;
    type?: 'success' | 'error' | 'info' | 'warning';
}

export const CustomAlert = ({ visible, title, message, onClose, type = 'info' }: CustomAlertProps) => {
    
    let borderColor = 'border-blue-500';
    let bgColor = 'bg-slate-900';
    let titleColor = 'text-blue-400';
    let icon = 'ℹ️';

    if (type === 'error') {
        borderColor = 'border-red-500';
        titleColor = 'text-red-400';
        icon = '🛑';
    } else if (type === 'success') {
        borderColor = 'border-green-500';
        titleColor = 'text-green-400';
        icon = '✅';
    } else if (type === 'warning') {
        borderColor = 'border-yellow-500';
        titleColor = 'text-yellow-400';
        icon = '⚠️';
    }

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <StyledView className="flex-1 justify-center items-center bg-black/70 px-6">
                <Card className={`w-full max-w-sm border-2 ${borderColor} ${bgColor}`}>
                    <View className="items-center mb-4">
                        <StyledText className="text-4xl mb-2">{icon}</StyledText>
                        <StyledText className={`text-xl font-bold ${titleColor} text-center uppercase tracking-wider`}>
                            {title}
                        </StyledText>
                    </View>
                    
                    <StyledText className="text-slate-300 text-center mb-6 font-medium leading-5">
                        {message}
                    </StyledText>
                    
                    <StyledTouch 
                        onPress={onClose}
                        className={`w-full py-3 rounded-lg ${type === 'error' ? 'bg-red-600' : 'bg-blue-600'}`}
                    >
                        <StyledText className="text-white text-center font-bold uppercase">Dismiss</StyledText>
                    </StyledTouch>
                </Card>
            </StyledView>
        </Modal>
    );
};
