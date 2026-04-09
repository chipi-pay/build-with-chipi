import { ChainToken, useChipiWallet } from '@chipi-stack/chipi-expo';
import { useAuth } from '@clerk/clerk-expo';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

/**
 * High-level wallet dashboard using `useChipiWallet`.
 * Aggregates wallet fetch, balance fetch, and create-wallet action into one hook.
 */
export function WalletOverviewUseChipiWalletSection() {
  const { userId, getToken } = useAuth();
  const [pin, setPin] = useState('');

  const {
    wallet,
    hasWallet,
    formattedBalance,
    isLoadingWallet,
    walletError,
    createWallet,
    isCreating,
    refetchAll,
  } = useChipiWallet({
    externalUserId: userId ?? null,
    getBearerToken: getToken,
    defaultToken: ChainToken.USDC,
    enabled: Boolean(userId),
  });

  return (
    <View style={styles.section}>
      <Text style={styles.kicker}>Feature: Wallet overview</Text>
      <Text style={styles.hook}>Hook: useChipiWallet</Text>

      {isLoadingWallet ? (
        <ActivityIndicator style={styles.spinner} />
      ) : walletError ? (
        <Text style={styles.error}>{walletError.message}</Text>
      ) : hasWallet && wallet ? (
        <View style={styles.card}>
          <Text style={styles.label}>Address</Text>
          <Text style={styles.mono} numberOfLines={2}>
            {wallet.normalizedPublicKey ?? wallet.publicKey}
          </Text>
          <Text style={styles.short}>{wallet.shortAddress}</Text>
          <View style={styles.row}>
            <Text style={styles.label}>USDC: </Text>
            <Text style={styles.value}>{formattedBalance}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Session keys: </Text>
            <Text style={styles.value}>{wallet.supportsSessionKeys ? 'Yes' : 'No'}</Text>
          </View>
          <TouchableOpacity style={styles.secondary} onPress={() => void refetchAll()}>
            <Text style={styles.secondaryText}>Refetch wallet + balance</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.muted}>No wallet on server for this user yet.</Text>
          <TextInput
            style={styles.input}
            value={pin}
            onChangeText={setPin}
            placeholder="PIN for createWallet (min 4)"
            keyboardType="numeric"
            maxLength={8}
            secureTextEntry
          />
          <TouchableOpacity
            style={[styles.button, (pin.length < 4 || isCreating) && styles.buttonDisabled]}
            disabled={pin.length < 4 || isCreating}
            onPress={() => void createWallet({ encryptKey: pin })}>
            <Text style={styles.buttonText}>{isCreating ? 'Creating…' : 'Create via useChipiWallet'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondary} onPress={() => void refetchAll()}>
            <Text style={styles.secondaryText}>Refetch wallet + balance</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#0F1115',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  kicker: { fontSize: 12, fontWeight: '700', color: '#F7931A', marginBottom: 4, letterSpacing: 1 },
  hook: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', marginBottom: 12 },
  spinner: { marginVertical: 12 },
  error: { color: '#F87171' },
  card: { gap: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  label: { fontWeight: '600', color: '#94A3B8' },
  value: { fontSize: 16, color: '#FFFFFF' },
  mono: { fontFamily: 'monospace', fontSize: 11, color: '#E2E8F0' },
  short: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
  muted: { color: '#94A3B8', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#090B10',
    color: '#FFFFFF',
  },
  button: {
    backgroundColor: '#EA580C',
    borderRadius: 999,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F7931A99',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '600' },
  secondary: { marginTop: 8, padding: 10, alignItems: 'center' },
  secondaryText: { color: '#F7931A', fontWeight: '600' },
});
