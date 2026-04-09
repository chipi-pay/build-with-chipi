import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { MW_COLORS, MW_RADIUS, MW_SHADOWS } from '@/constants/morgan-theme';

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
        state.pressed && !disabled && styles.buttonPressed,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}>
      <Text style={[styles.label, disabled && styles.labelDisabled]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: MW_RADIUS.pill,
    backgroundColor: MW_COLORS.accentDeep,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F7931A99',
    ...MW_SHADOWS.orangeGlow,
  },
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  buttonDisabled: {
    backgroundColor: '#3A2B18',
    borderColor: '#6A4C22',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: MW_COLORS.foreground,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  labelDisabled: {
    color: '#9D8E79',
  },
});
