import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PaperTextureOverlay } from '@/components/ui/PaperTexture';
import { MW_BORDER, MW_COLORS, MW_FONTS, MW_TYPE } from '@/constants/morgan-theme';

export default function ModalScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 20,
          paddingBottom: Math.max(insets.bottom + 20, 20),
        },
      ]}>
      <PaperTextureOverlay />
      <View style={styles.card}>
        <View style={styles.rule} />
        <Text style={styles.kicker}>MORGAN`S WALLET</Text>
        <Text style={styles.title}>About this build</Text>
        <Text style={styles.body}>
          This MVP is intentionally simple for workshops: each section maps directly to one SDK feature and one hook.
        </Text>
      </View>
      <Link href="/" dismissTo style={styles.link}>
        <Text style={styles.linkText}>← Back to wallet</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MW_COLORS.background,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 0,
    borderWidth: 1,
    borderColor: MW_COLORS.border,
    backgroundColor: MW_COLORS.card,
    padding: 22,
    gap: 12,
  },
  rule: {
    width: 48,
    height: MW_BORDER.medium,
    backgroundColor: MW_COLORS.foreground,
    marginBottom: 4,
  },
  kicker: {
    color: MW_COLORS.foreground,
    fontSize: MW_TYPE.kicker,
    letterSpacing: 3,
    fontWeight: '600',
    fontFamily: MW_FONTS.mono,
  },
  title: {
    color: MW_COLORS.foreground,
    fontSize: MW_TYPE.pageTitle,
    fontWeight: '700',
    fontFamily: MW_FONTS.display,
    letterSpacing: -0.5,
  },
  body: {
    color: MW_COLORS.mutedForeground,
    fontSize: MW_TYPE.bodySm,
    lineHeight: 24,
    fontFamily: MW_FONTS.body,
  },
  link: {
    marginTop: 20,
    paddingVertical: 14,
    alignSelf: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  linkText: {
    color: MW_COLORS.foreground,
    fontWeight: '700',
    fontSize: MW_TYPE.body,
    fontFamily: MW_FONTS.bodySemi,
    textDecorationLine: 'underline',
  },
});
