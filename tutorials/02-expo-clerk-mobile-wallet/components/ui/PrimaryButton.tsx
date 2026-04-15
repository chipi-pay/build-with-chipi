import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { MW_COLORS, MW_FONTS, MW_TYPE } from '@/constants/morgan-theme';

type Props = Omit<PressableProps, 'children'> & {
  title: string;
  /** When false, button is visually disabled and does not call onPress */
  active?: boolean;
};

export function PrimaryButton({ title, active = true, onPress, style, ...rest }: Props) {
  const disabled = !active;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
      style={(state): StyleProp<ViewStyle> => [
        styles.button,
        disabled && styles.buttonDisabled,
        !disabled && state.pressed && styles.buttonPressed,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}>
      {({ pressed }) => (
        <Text
          style={[
            styles.label,
            disabled && styles.labelDisabled,
            !disabled && pressed && styles.labelPressed,
          ]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 20,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 0,
    backgroundColor: MW_COLORS.foreground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: MW_COLORS.foreground,
  },
  buttonPressed: {
    backgroundColor: MW_COLORS.background,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: MW_TYPE.label,
    fontWeight: '600',
    color: MW_COLORS.accentForeground,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    fontFamily: MW_FONTS.mono,
  },
  labelDisabled: {
    color: MW_COLORS.mutedForeground,
  },
  labelPressed: {
    color: MW_COLORS.foreground,
  },
});
