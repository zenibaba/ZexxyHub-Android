import { TextInput, TextInputProps, View, Text } from 'react-native';
import { styled } from 'nativewind';

interface InputProps extends TextInputProps {
  label: string;
}

const StyledInput = styled(TextInput);
const StyledText = styled(Text);
const StyledView = styled(View);

export const Input = ({ label, ...props }: InputProps) => {
  return (
    <StyledView className="mb-5">
      <StyledText className="text-slate-500 mb-2 ml-1 font-bold text-[10px] uppercase tracking-[2px]">{label}</StyledText>
      <StyledView className="bg-slate-950 rounded-xl border border-slate-800/50 h-14 flex-row items-center overflow-hidden shadow-inner">
        {/* Glowing Indicator Line on the left */}
        <View className="w-1.5 h-full bg-blue-500/80" />
        <StyledInput 
           className="text-white text-base h-full flex-1 px-4 font-semibold" 
           placeholderTextColor="#334155"
           selectionColor="#60a5fa"
           {...props} 
        />
      </StyledView>
    </StyledView>
  );
};
