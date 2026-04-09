import { StyleSheet, TextInput, type TextInputProps } from 'react-native';
import { MW_COLORS, MW_RADIUS } from '@/constants/morgan-theme';

type Props = TextInputProps;

export function SimpleInput({ style, placeholderTextColor, ...rest }: Props) {
  return (
    <TextInput
      style={[styles.input, style]}
      placeholderTextColor={placeholderTextColor ?? '#7A879B'}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: MW_RADIUS.sm,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: MW_COLORS.foreground,
    backgroundColor: '#090B10',
  },
});
