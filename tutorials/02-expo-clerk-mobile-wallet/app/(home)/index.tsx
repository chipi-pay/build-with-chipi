import { useClerk, useUser } from '@clerk/clerk-expo';
import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CreateWalletWithBiometricPinSection } from '@/components/chipi/create-wallet-with-biometric-pin';
import { CreateWalletWithPasskeyNativeSection } from '@/components/chipi/create-wallet-with-passkey-native';
import { MigrateWalletToPasskeySection } from '@/components/chipi/migrate-wallet-to-passkey';
import { NativeBiometricDiagnosticsSection } from '@/components/chipi/native-biometric-diagnostics';
import { SendUsdcBiometricPinSection } from '@/components/chipi/send-usdc-biometric-pin';
import { SendUsdcPasskeyParamsSection } from '@/components/chipi/send-usdc-passkey-params';
import { TokenBalanceUseGetTokenBalanceSection } from '@/components/chipi/token-balance-use-get-token-balance';
import { TransactionListUseGetTransactionListSection } from '@/components/chipi/transaction-list-use-get-transaction-list';
import { WalletDetailsUseGetWalletSection } from '@/components/chipi/wallet-details-use-get-wallet';
import { WalletOverviewUseChipiWalletSection } from '@/components/chipi/wallet-overview-use-chipi-wallet';
import { MW_COLORS, MW_RADIUS, MW_SHADOWS } from '@/constants/morgan-theme';

export default function HomePage() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingTop: insets.top + 16,
          paddingBottom: Math.max(insets.bottom + 28, 48),
        },
      ]}
    >
      <View style={[styles.ambientTopGlow, { top: insets.top - 64 }]} />
      <View style={styles.gridMask} />
      <Text style={styles.kicker}>MORGAN`S WALLET</Text>
      <Text style={styles.pageTitle}>Bitcoin DeFi Validation Suite</Text>
      <Text style={styles.pageSubtitle}>Sign in to run every Chipi flow against your live project in one place.</Text>
      <SignedInHeader />
   {/*    <CreateWalletWithBiometricPinSection /> */}
      <CreateWalletWithPasskeyNativeSection />
    {/*   <SendUsdcBiometricPinSection /> */}
      <SendUsdcPasskeyParamsSection />
      <WalletOverviewUseChipiWalletSection />
      <WalletDetailsUseGetWalletSection />
      <TokenBalanceUseGetTokenBalanceSection />
      <TransactionListUseGetTransactionListSection />
      {/* <MigrateWalletToPasskeySection /> */}
 {/*      <NativeBiometricDiagnosticsSection /> */}
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
        <TouchableOpacity style={styles.docsBtn}>
          <Text style={styles.docsText}>Docs</Text>
        </TouchableOpacity>
      </Link>
      <TouchableOpacity style={styles.signOutBtn} onPress={() => void signOut()}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: MW_COLORS.background },
  scrollContent: { paddingHorizontal: 20 },
  ambientTopGlow: {
    position: 'absolute',
    top: -80,
    left: -40,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: '#EA580C44',
  },
  gridMask: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderColor: '#1E293B33',
    borderWidth: 1,
    borderRadius: MW_RADIUS.lg,
    opacity: 0.2,
  },
  kicker: {
    color: MW_COLORS.gold,
    fontSize: 11,
    letterSpacing: 2.2,
    fontWeight: '700',
    marginBottom: 8,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: MW_COLORS.foreground,
    marginBottom: 8,
    lineHeight: 38,
  },
  pageSubtitle: { fontSize: 15, color: MW_COLORS.muted, marginBottom: 20, lineHeight: 22 },
  signedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 14,
    backgroundColor: MW_COLORS.surface,
    borderRadius: MW_RADIUS.md,
    gap: 10,
    borderWidth: 1,
    borderColor: MW_COLORS.border,
    ...MW_SHADOWS.softCard,
  },
  signedLabel: { fontSize: 12, fontWeight: '700', color: MW_COLORS.accent },
  signedUser: { fontSize: 15, color: MW_COLORS.foreground, marginTop: 4 },
  docsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#141922',
    borderRadius: MW_RADIUS.sm,
    borderWidth: 1,
    borderColor: '#F7931A80',
  },
  docsText: { fontWeight: '700', color: MW_COLORS.foreground },
  signOutBtn: {
    backgroundColor: MW_COLORS.accentDeep,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: MW_RADIUS.sm,
    borderWidth: 1,
    borderColor: '#F7931A80',
  },
  signOutText: { fontWeight: '700', color: MW_COLORS.foreground },
});
