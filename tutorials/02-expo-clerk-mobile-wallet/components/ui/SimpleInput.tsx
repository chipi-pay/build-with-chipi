import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { MW_COLORS, MW_FONTS, MW_TYPE } from '@/constants/morgan-theme';

type Props = TextInputProps;

export function SimpleInput({ style, placeholderTextColor, ...rest }: Props) {
  return (
    <TextInput
      style={[styles.input, style]}
      placeholderTextColor={placeholderTextColor ?? MW_COLORS.mutedForeground}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 0,
    borderBottomWidth: 2,
    borderBottomColor: MW_COLORS.border,
    borderRadius: 0,
    paddingVertical: 12,
    paddingHorizontal: 0,
    fontSize: MW_TYPE.bodySm,
    color: MW_COLORS.foreground,
    backgroundColor: MW_COLORS.background,
    fontFamily: MW_FONTS.body,
  },
});
