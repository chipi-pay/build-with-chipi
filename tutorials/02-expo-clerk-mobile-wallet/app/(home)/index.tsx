import { useClerk, useUser } from '@clerk/clerk-expo';
import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CreateWalletWithPasskeyNativeSection } from '@/components/chipi/create-wallet-with-passkey-native';
import { SendUsdcPasskeyParamsSection } from '@/components/chipi/send-usdc-passkey-params';
import { TokenBalanceUseGetTokenBalanceSection } from '@/components/chipi/token-balance-use-get-token-balance';
import { TransactionListUseGetTransactionListSection } from '@/components/chipi/transaction-list-use-get-transaction-list';
import { WalletDetailsUseGetWalletSection } from '@/components/chipi/wallet-details-use-get-wallet';
import { WalletOverviewUseChipiWalletSection } from '@/components/chipi/wallet-overview-use-chipi-wallet';
import { PaperTextureOverlay } from '@/components/ui/PaperTexture';
import { MW_BORDER, MW_COLORS, MW_FONTS, MW_TYPE } from '@/constants/morgan-theme';

export default function HomePage() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingTop: insets.top + 24,
          paddingBottom: Math.max(insets.bottom + 28, 48),
        },
      ]}>
      <PaperTextureOverlay />
      <View style={styles.heroRuleRow}>
        <View style={styles.heroRule} />
        <View style={styles.heroSquare} />
      </View>
      <Text style={styles.kicker}>MORGAN`S WALLET</Text>
      <Text style={styles.pageTitle} maxFontSizeMultiplier={1.2}>
        Bitcoin DeFi Validation Suite
      </Text>
      <Text style={styles.pageSubtitle}>
        Sign in to run every Chipi flow against your live project in one place.
      </Text>
      <View style={styles.sectionDivider} />
      <SignedInHeader />
      {/* <CreateWalletWithBiometricPinSection /> */}
      <CreateWalletWithPasskeyNativeSection />
      {/* <SendUsdcBiometricPinSection /> */}
      <SendUsdcPasskeyParamsSection />
      <WalletOverviewUseChipiWalletSection />
      <WalletDetailsUseGetWalletSection />
      <TokenBalanceUseGetTokenBalanceSection />
      <TransactionListUseGetTransactionListSection />
      {/* <MigrateWalletToPasskeySection /> */}
      {/* <NativeBiometricDiagnosticsSection /> */}
    </ScrollView>
  );
}

function SignedInHeader() {
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <View style={styles.signedHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.signedLabel}>Signed in</Text>
        <Text style={styles.signedUser} numberOfLines={2}>
          {user?.primaryEmailAddress?.emailAddress ?? user?.id}
        </Text>
      </View>
      <Link href="/(home)/docs" asChild>
        <TouchableOpacity style={styles.docsBtn} accessibilityRole="button">
          <Text style={styles.docsText}>DOCS →</Text>
        </TouchableOpacity>
      </Link>
      <TouchableOpacity style={styles.signOutBtn} onPress={() => void signOut()} accessibilityRole="button">
        <Text style={styles.signOutText}>SIGN OUT</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: MW_COLORS.background },
  scrollContent: { paddingHorizontal: 20 },
  heroRuleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  heroRule: {
    flex: 1,
    height: MW_BORDER.ultra,
    backgroundColor: MW_COLORS.foreground,
  },
  heroSquare: {
    width: 14,
    height: 14,
    borderWidth: 2,
    borderColor: MW_COLORS.foreground,
    backgroundColor: MW_COLORS.background,
  },
  kicker: {
    color: MW_COLORS.foreground,
    fontSize: MW_TYPE.kicker,
    letterSpacing: 3,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: MW_FONTS.mono,
  },
  pageTitle: {
    fontSize: MW_TYPE.hero,
    fontWeight: '700',
    color: MW_COLORS.foreground,
    marginBottom: 16,
    lineHeight: MW_TYPE.hero * 1.05,
    letterSpacing: -1,
    fontFamily: MW_FONTS.display,
  },
  pageSubtitle: {
    fontSize: MW_TYPE.body,
    color: MW_COLORS.mutedForeground,
    marginBottom: 8,
    lineHeight: 26,
    fontFamily: MW_FONTS.body,
  },
  sectionDivider: {
    height: MW_BORDER.thick,
    backgroundColor: MW_COLORS.foreground,
    marginVertical: 28,
  },
  signedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: MW_COLORS.invertedBackground,
    borderWidth: 0,
    gap: 10,
  },
  signedLabel: {
    fontSize: MW_TYPE.kicker,
    fontWeight: '600',
    color: MW_COLORS.invertedForeground,
    letterSpacing: 2,
    fontFamily: MW_FONTS.mono,
    textTransform: 'uppercase',
  },
  signedUser: {
    fontSize: MW_TYPE.bodySm,
    color: MW_COLORS.invertedForeground,
    marginTop: 6,
    fontFamily: MW_FONTS.body,
  },
  docsBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: MW_COLORS.invertedForeground,
    borderWidth: 2,
    borderColor: MW_COLORS.invertedForeground,
  },
  docsText: {
    fontWeight: '700',
    color: MW_COLORS.invertedBackground,
    fontSize: MW_TYPE.kicker,
    letterSpacing: 1.4,
    fontFamily: MW_FONTS.mono,
  },
  signOutBtn: {
    backgroundColor: 'transparent',
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: MW_COLORS.invertedForeground,
  },
  signOutText: {
    fontWeight: '700',
    color: MW_COLORS.invertedForeground,
    fontSize: MW_TYPE.kicker,
    letterSpacing: 1.4,
    fontFamily: MW_FONTS.mono,
  },
});
