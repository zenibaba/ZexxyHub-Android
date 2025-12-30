import { View, ViewProps } from 'react-native';
import { styled } from 'nativewind';

const StyledView = styled(View);

interface CardProps extends ViewProps {
  variant?: 'primary' | 'secondary';
}

export const Card = ({ children, style, variant = 'primary', ...props }: CardProps) => {
  const bgClass = variant === 'primary' ? 'bg-slate-900' : 'bg-slate-950';
  const borderClass = variant === 'primary' ? 'border-slate-800' : 'border-slate-900';
  
  return (
    <StyledView 
      className={`${bgClass} rounded-2xl p-5 shadow-2xl ${borderClass} border-[0.5px]`}
      style={[{ 
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 20
      }, style]}
      {...props}
    >
      {children}
    </StyledView>
  );
};
