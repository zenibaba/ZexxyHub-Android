import { TextInput, TextInputProps, View, Text } from 'react-native';
import { styled } from 'nativewind';
import { GlassCard } from './GlassCard';

interface GlassInputProps extends TextInputProps {
  label: string;
}

const StyledInput = styled(TextInput);
const StyledText = styled(Text);

export const GlassInput = ({ label, ...props }: GlassInputProps) => {
  return (
    <View className="mb-4">
      <StyledText className="text-white/80 mb-2 ml-1 font-semibold">{label}</StyledText>
      <GlassCard className="h-14 justify-center" intensity={10}>
         <StyledInput 
            className="text-white text-lg h-full px-2" 
            placeholderTextColor="rgba(255,255,255,0.4)"
            {...props} 
         />
      </GlassCard>
    </View>
  );
};
