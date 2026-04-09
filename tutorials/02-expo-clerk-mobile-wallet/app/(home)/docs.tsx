import { type ReactNode } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MW_COLORS, MW_RADIUS, MW_SHADOWS } from '@/constants/morgan-theme';

// not necessary for the workshop or to include in video, but all of the hooks docs are here
export default function DocsScreen() {
  const insets = useSafeAreaInsets();
  const open = (url: string) => void Linking.openURL(url);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + 16,
          paddingBottom: Math.max(insets.bottom + 20, 36),
        },
      ]}
    >
      <Text style={styles.kicker}>MORGAN`S WALLET</Text>
      <Text style={styles.title}>Workshop Notes & References</Text>
      <Text style={styles.sub}>Quick links you can use during your SDK documentation workshop.</Text>

      <Card title="Docs under test" body="Use these pages while reviewing examples against the running app.">
        <LinkButton label="Gasless quickstart" onPress={() => open('https://docs.chipipay.com/sdk/expo/gasless-quickstart')} />
        <LinkButton
          label="Gasless + Clerk setup"
          onPress={() => open('https://docs.chipipay.com/sdk/expo/gasless-clerk-setup')}
        />
        <LinkButton label="Expo biometrics guide" onPress={() => open('https://docs.chipipay.com/sdk/expo/use-biometrics')} />
        <LinkButton label="Expo passkeys guide" onPress={() => open('https://docs.chipipay.com/sdk/expo/use-passkeys')} />
        <LinkButton
          label="Hook: useCreateWallet"
          onPress={() => open('https://docs.chipipay.com/sdk/expo/hooks/use-create-wallet')}
        />
        <LinkButton label="Hook: useGetWallet" onPress={() => open('https://docs.chipipay.com/sdk/expo/hooks/use-get-wallet')} />
        <LinkButton
          label="Hook: useGetTokenBalance"
          onPress={() => open('https://docs.chipipay.com/sdk/expo/hooks/use-get-token-balance')}
        />
        <LinkButton label="Hook: useTransfer" onPress={() => open('https://docs.chipipay.com/sdk/expo/hooks/use-transfer')} />
        <LinkButton
          label="Hook: useGetTransactionList"
          onPress={() => open('https://docs.chipipay.com/sdk/expo/hooks/use-get-transaction-list')}
        />
        <LinkButton
          label="Hook: useMigrateWalletToPasskey"
          onPress={() => open('https://docs.chipipay.com/sdk/expo/hooks/use-migrate-wallet-to-passkey')}
        />
      </Card>

      <Card title="Hooks checklist" body="All validation sections are on the Home screen and cover these hooks/APIs.">
        <Text style={styles.mono}>useCreateWallet • useGetWallet • useGetTokenBalance • useTransfer</Text>
        <Text style={styles.mono}>useGetTransactionList • useMigrateWalletToPasskey</Text>
        <Text style={styles.mono}>useChipiWallet (composite helper)</Text>
        <Text style={styles.mono}>isNativeBiometricSupported • createNativeWalletPasskey</Text>
      </Card>
    </ScrollView>
  );
}

function Card({ title, body, children }: { title: string; body: string; children: ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardBody}>{body}</Text>
      <View style={{ gap: 10 }}>{children}</View>
    </View>
  );
}

function LinkButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.linkButton} onPress={onPress}>
      <Text style={styles.linkText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: MW_COLORS.background },
  content: { paddingHorizontal: 20, gap: 14 },
  kicker: { color: MW_COLORS.gold, fontWeight: '700', letterSpacing: 2, fontSize: 11 },
  title: { color: MW_COLORS.foreground, fontSize: 28, lineHeight: 34, fontWeight: '800' },
  sub: { color: MW_COLORS.muted, fontSize: 15, lineHeight: 22, marginBottom: 8 },
  card: {
    backgroundColor: MW_COLORS.surface,
    borderRadius: MW_RADIUS.lg,
    borderWidth: 1,
    borderColor: MW_COLORS.border,
    padding: 16,
    gap: 8,
    ...MW_SHADOWS.softCard,
  },
  cardTitle: { color: MW_COLORS.foreground, fontSize: 18, fontWeight: '700' },
  cardBody: { color: MW_COLORS.muted, fontSize: 14, lineHeight: 20 },
  mono: { color: MW_COLORS.foreground, fontFamily: 'monospace', fontSize: 12 },
  linkButton: {
    backgroundColor: '#141922',
    borderWidth: 1,
    borderColor: '#F7931A77',
    borderRadius: MW_RADIUS.pill,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  linkText: { color: MW_COLORS.foreground, fontWeight: '700' },
});
