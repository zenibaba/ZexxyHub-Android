import React from 'react';
import { View, Text } from 'react-native';
import { styled } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';

const StyledText = styled(Text);
const StyledView = styled(View);

interface StatCardProps {
    label: string;
    value: string | number;
    icon?: string;
    colorFrom?: string;
    colorTo?: string;
    fullWidth?: boolean;
}

const StatCard = ({ label, value, icon, colorFrom = '#1e293b', colorTo = '#0f172a', fullWidth }: StatCardProps) => (
    <StyledView className={`mb-3 ${fullWidth ? 'w-full' : 'w-[31%]'} overflow-hidden rounded-xl shadow-lg border border-white/5`}>
        <LinearGradient
            colors={[colorFrom, colorTo]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-3 items-center justify-center h-24"
        >
            {icon && <StyledText className="text-xl mb-1">{icon}</StyledText>}
            <StyledText className="text-white font-black text-xl italic shadow-black">{value}</StyledText>
            <StyledText className="text-slate-400 text-[9px] font-bold tracking-widest uppercase mt-1 text-center">{label}</StyledText>
        </LinearGradient>
    </StyledView>
);

interface StatsDashboardProps {
    sessionCount: number; // Renamed from totalGenerated to match App.tsx usage
    lifetimeCount: number;
    totalErrors: number; // Make sure to map this correctly if prop names changed
    successRate: string;
    rpm: string;
    fastestTime: string | number;
    errors: number; // App.tsx passes 'errors', ensuring compatibility
}

export const StatsDashboard = ({ sessionCount, lifetimeCount, successRate, rpm, fastestTime, errors }: StatsDashboardProps) => {
    
    // Parse success rate for visual bar
    const rateNum = parseFloat(successRate) || 0;

    return (
        <View className="mb-4 pt-2 px-1">
            
            {/* Live Indicator Header */}
            <View className="flex-row items-center justify-between mb-4 px-2">
                <StyledText className="text-white font-black text-xs uppercase tracking-[4px] italic">
                    Live <StyledText className="text-blue-500">Analytics</StyledText>
                </StyledText>
                <View className="flex-row items-center bg-green-900/30 px-2 py-1 rounded-full border border-green-500/30">
                    <View className="w-1.5 h-1.5 rounded-full bg-green-400 mr-2 animate-pulse" />
                    <StyledText className="text-green-400 text-[9px] font-bold tracking-widest">ONLINE</StyledText>
                </View>
            </View>
            
            <View className="flex-row flex-wrap justify-between">
                {/* Primary Stats */}
                <StatCard 
                    label="Session" 
                    value={sessionCount} 
                    icon="⚡"
                    colorFrom="#3b82f6" 
                    colorTo="#1d4ed8" 
                />
                 <StatCard 
                    label="Lifetime" 
                    value={lifetimeCount} 
                    icon="🌍"
                    colorFrom="#8b5cf6" 
                    colorTo="#6d28d9" 
                />
                 <StatCard 
                    label="Success" 
                    value={`${successRate}%`} 
                    icon="🎯"
                    colorFrom={rateNum > 80 ? '#22c55e' : rateNum > 50 ? '#eab308' : '#ef4444'} 
                    colorTo={rateNum > 80 ? '#15803d' : rateNum > 50 ? '#ca8a04' : '#b91c1c'} 
                />

                {/* Secondary Stats Row */}
                <StatCard 
                    label="Speed (RPM)" 
                    value={rpm} 
                    colorFrom="#1e293b" 
                    colorTo="#0f172a" 
                />
                <StatCard 
                    label="Errors" 
                    value={errors} 
                    colorFrom="#1e293b" // Darker for errors
                    colorTo="#450a0a"   // Red tint
                />
                <StatCard 
                    label="Fastest Gen" 
                    value={`${fastestTime}s`} 
                    colorFrom="#1e293b" 
                    colorTo="#0f172a" 
                />
            </View>

            {/* Visual Success Bar */}
            <View className="mt-2 mx-1">
                <View className="flex-row justify-between mb-1">
                     <StyledText className="text-slate-500 text-[8px] font-bold uppercase tracking-widest">Efficiency</StyledText>
                     <StyledText className="text-slate-400 text-[8px] font-bold">{successRate}%</StyledText>
                </View>
                <View className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex-row border border-slate-700">
                    <LinearGradient
                        colors={['#4ade80', '#22c55e']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ flex: rateNum || 1 }} 
                    />
                    <View style={{ flex: 100 - (rateNum || 1) }} className="bg-transparent" />
                </View>
            </View>
        </View>
    );
};
