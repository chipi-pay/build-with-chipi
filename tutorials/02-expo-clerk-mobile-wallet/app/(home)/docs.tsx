import { type ReactNode } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PaperTextureOverlay } from '@/components/ui/PaperTexture';
import { MW_BORDER, MW_COLORS, MW_FONTS, MW_TYPE } from '@/constants/morgan-theme';

export default function DocsScreen() {
  const insets = useSafeAreaInsets();
  const open = (url: string) => void Linking.openURL(url);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + 20,
          paddingBottom: Math.max(insets.bottom + 20, 36),
        },
      ]}>
      <PaperTextureOverlay />
      <View style={styles.rule} />
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
    <TouchableOpacity style={styles.linkButton} onPress={onPress} accessibilityRole="button">
      <Text style={styles.linkText}>{label} →</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: MW_COLORS.background },
  content: { paddingHorizontal: 20, gap: 20 },
  rule: {
    height: MW_BORDER.thick,
    backgroundColor: MW_COLORS.foreground,
    marginBottom: 20,
  },
  kicker: {
    color: MW_COLORS.foreground,
    fontWeight: '600',
    letterSpacing: 3,
    fontSize: MW_TYPE.kicker,
    fontFamily: MW_FONTS.mono,
  },
  title: {
    color: MW_COLORS.foreground,
    fontSize: MW_TYPE.pageTitle,
    lineHeight: 38,
    fontWeight: '700',
    fontFamily: MW_FONTS.display,
    letterSpacing: -0.5,
  },
  sub: {
    color: MW_COLORS.mutedForeground,
    fontSize: MW_TYPE.bodySm,
    lineHeight: 22,
    marginBottom: 4,
    fontFamily: MW_FONTS.body,
  },
  card: {
    backgroundColor: MW_COLORS.card,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: MW_COLORS.border,
    padding: 18,
    gap: 10,
  },
  cardTitle: {
    color: MW_COLORS.foreground,
    fontSize: MW_TYPE.section,
    fontWeight: '700',
    fontFamily: MW_FONTS.display,
  },
  cardBody: {
    color: MW_COLORS.mutedForeground,
    fontSize: MW_TYPE.bodySm,
    lineHeight: 22,
    fontFamily: MW_FONTS.body,
  },
  mono: {
    color: MW_COLORS.foreground,
    fontFamily: MW_FONTS.mono,
    fontSize: MW_TYPE.mono,
  },
  linkButton: {
    backgroundColor: MW_COLORS.background,
    borderWidth: 2,
    borderColor: MW_COLORS.border,
    borderRadius: 0,
    paddingVertical: 14,
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: 'center',
  },
  linkText: {
    color: MW_COLORS.foreground,
    fontWeight: '700',
    fontFamily: MW_FONTS.bodySemi,
  },
});
