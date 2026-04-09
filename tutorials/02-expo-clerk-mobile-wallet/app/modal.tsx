import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MW_COLORS, MW_RADIUS, MW_SHADOWS } from '@/constants/morgan-theme';

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
      ]}
    >
      <View style={styles.card}>
        <Text style={styles.kicker}>MORGAN`S WALLET</Text>
        <Text style={styles.title}>About this build</Text>
        <Text style={styles.body}>
          This MVP is intentionally simple for workshops: each section maps directly to one SDK feature and one hook.
        </Text>
      </View>
      <Link href="/" dismissTo style={styles.link}>
        <Text style={styles.linkText}>Back to wallet</Text>
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
    borderRadius: MW_RADIUS.lg,
    borderWidth: 1,
    borderColor: MW_COLORS.border,
    backgroundColor: MW_COLORS.surface,
    padding: 18,
    gap: 10,
    ...MW_SHADOWS.softCard,
  },
  kicker: { color: MW_COLORS.accent, fontSize: 12, letterSpacing: 2, fontWeight: '700' },
  title: { color: MW_COLORS.foreground, fontSize: 28, fontWeight: '800' },
  body: { color: MW_COLORS.muted, fontSize: 15, lineHeight: 22 },
  link: {
    marginTop: 15,
    paddingVertical: 12,
    alignSelf: 'center',
  },
  linkText: { color: MW_COLORS.accent, fontWeight: '700', fontSize: 16 },
});
