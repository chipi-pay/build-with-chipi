import { Chain, ChainToken, useGetTokenBalance, useGetWallet } from '@chipi-stack/chipi-expo';
import { useAuth } from '@clerk/clerk-expo';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/**
 * Token balance demo using `useGetTokenBalance`.
 * Resolves wallet address first via `useGetWallet`, then fetches USDC balance on Starknet.
 */
export function TokenBalanceUseGetTokenBalanceSection() {
  const { userId, getToken } = useAuth();

  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet } = useGetWallet({
    params: { externalUserId: userId || '' },
    getBearerToken: getToken,
    queryOptions: { enabled: Boolean(userId) },
  });

  const walletPublicKey = wallet?.normalizedPublicKey ?? wallet?.publicKey ?? '';

  const { data, isLoading, error, refetch } = useGetTokenBalance({
    params: {
      chainToken: ChainToken.USDC,
      chain: Chain.STARKNET,
      walletPublicKey,
    },
    getBearerToken: getToken,
    queryOptions: {
      enabled: Boolean(userId && walletPublicKey),
    },
  });

  return (
    <View style={styles.section}>
      <Text style={styles.kicker}>Feature: Token balance</Text>
      <Text style={styles.hook}>Hook: useGetTokenBalance (USDC on STARKNET)</Text>

      {!walletPublicKey && !walletLoading ? (
        <View style={styles.card}>
          <Text style={styles.muted}>Create or fetch a wallet first to load token balance.</Text>
          <TouchableOpacity style={styles.button} onPress={() => void refetchWallet()}>
            <Text style={styles.buttonText}>Refetch wallet</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {walletLoading || (isLoading && Boolean(walletPublicKey)) ? (
        <ActivityIndicator style={styles.spinner} />
      ) : error ? (
        <Text style={styles.error}>{error.message}</Text>
      ) : data ? (
        <View style={styles.card}>
          <Text style={styles.value}>{data.balance ?? '0'}</Text>
          <Text style={styles.label}>USDC (raw token balance from API)</Text>
          <TouchableOpacity style={styles.button} onPress={() => void refetch()}>
            <Text style={styles.buttonText}>Refetch balance</Text>
          </TouchableOpacity>
        </View>
      ) : null}
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
  muted: { color: '#94A3B8' },
  error: { color: '#F87171' },
  card: { gap: 6 },
  value: { color: '#FFFFFF', fontSize: 28, fontWeight: '800' },
  label: { color: '#94A3B8', fontSize: 12 },
  button: {
    marginTop: 8,
    backgroundColor: '#141922',
    borderRadius: 999,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F7931A80',
  },
  buttonText: { color: '#fff', fontWeight: '700' },
});
