import React, { useState, useEffect } from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Audio } from 'expo-av';
import { styled } from 'nativewind';

const StyledTouch = styled(TouchableOpacity);
const StyledText = styled(Text);

// Define asset map to require commonly used assets safely
// In a real scenario, we might want to check if the file exists, but execute-time checks are harder in RN.
// We'll trust the user provided 'song.mp3' in assets.
const musicSource = require('../../assets/song.mp3'); 

export const MusicPlayer = () => {
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        loadSound();
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, []);

    const loadSound = async () => {
        try {
            // Configure Audio Mode for robust playback
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
                shouldDuckAndroid: true,
                allowsRecordingIOS: false,
            });

            const { sound: newSound } = await Audio.Sound.createAsync(
                musicSource,
                { isLooping: true, shouldPlay: false, volume: 1.0 } 
            );
            setSound(newSound);
            setIsLoaded(true);
        } catch (error) {
            console.warn("Failed to load sound:", error);
        }
    };

    const togglePlayback = async () => {
        if (!sound || !isLoaded) return;

        try {
            if (isPlaying) {
                await sound.pauseAsync();
                setIsPlaying(false);
            } else {
                await sound.playAsync();
                setIsPlaying(true);
            }
        } catch (error) {
            console.error("Playback error:", error);
        }
    };

    // if (!isLoaded) return null; // REMOVED: Always render to ensure visibility

    return (
        <View className="absolute top-4 right-4 z-50">
             <StyledTouch 
                onPress={togglePlayback}
                disabled={!isLoaded} // Disable interaction if not loaded
                className={`flex-row items-center px-3 py-1.5 rounded-full border ${isPlaying ? 'bg-green-500/20 border-green-500' : 'bg-slate-800 border-slate-700'} ${!isLoaded ? 'opacity-50' : ''}`}
             >
                <StyledText className="text-lg mr-2">
                    {isLoaded ? (isPlaying ? '🔊' : '🔇') : '⏳'}
                </StyledText>
                <StyledText className={`text-[10px] font-bold tracking-widest uppercase ${isPlaying ? 'text-green-400' : 'text-slate-500'}`}>
                    {isLoaded ? (isPlaying ? 'PLAYING' : 'MUSIC') : 'LOADING...'}
                </StyledText>
             </StyledTouch>
        </View>
    );
};
