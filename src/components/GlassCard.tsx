import { View, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { styled } from 'nativewind';

const StyledBlur = styled(BlurView);
const StyledView = styled(View);

interface GlassCardProps extends ViewProps {
  intensity?: number;
}

export const GlassCard = ({ children, style, intensity = 20, ...props }: GlassCardProps) => {
  return (
    <View style={[{ borderRadius: 16, overflow: 'hidden' }, style]} {...props}>
      <StyledBlur 
        intensity={intensity} 
        tint="dark" 
        className="absolute inset-0 bg-white/10"
      />
      <StyledView className="p-4 border border-white/20 rounded-xl">
        {children}
      </StyledView>
    </View>
  );
};
