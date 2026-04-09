import { useGetTransactionList, useGetWallet } from '@chipi-stack/chipi-expo';
import { useAuth } from '@clerk/clerk-expo';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/**
 * Transaction history demo using `useGetTransactionList`.
 * Pulls wallet first, then fetches paginated transactions and logs the payload for debugging.
 */
export function TransactionListUseGetTransactionListSection() {
  const { userId, getToken } = useAuth();

  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet } = useGetWallet({
    params: { externalUserId: userId || '' },
    getBearerToken: getToken,
    queryOptions: { enabled: Boolean(userId) },
  });

  const walletAddress = wallet?.normalizedPublicKey ?? wallet?.publicKey ?? '';

  const { data, isLoading, error, refetch } = useGetTransactionList({
    query: { page: 1, limit: 8, walletAddress },
    getBearerToken: getToken,
    queryOptions: {
      enabled: Boolean(userId && walletAddress),
    },
  });

  useEffect(() => {
    if (!walletAddress || !data) return;
    console.log('[useGetTransactionList] transactions list', data.data ?? []);
    console.log('[useGetTransactionList] payload', {
      walletAddress,
      count: data.data?.length ?? 0,
      data,
    });
  }, [walletAddress, data]);

  return (
    <View style={styles.section}>
      <Text style={styles.kicker}>Feature: Transaction history</Text>
      <Text style={styles.hook}>Hook: useGetTransactionList (address from useGetWallet)</Text>

      {!walletAddress && !walletLoading ? (
        <View style={styles.card}>
          <Text style={styles.muted}>Create or fetch a wallet first to load transactions.</Text>
          <TouchableOpacity style={styles.button} onPress={() => void refetchWallet()}>
            <Text style={styles.buttonText}>Refetch wallet</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {walletLoading || (isLoading && Boolean(walletAddress)) ? (
        <ActivityIndicator style={styles.spinner} />
      ) : error ? (
        <Text style={styles.error}>{error.message}</Text>
      ) : data ? (
        <View style={styles.card}>
          <Text style={styles.meta}>
            {data.data?.length ?? 0} transaction(s) on this page
          </Text>
          {(data.data ?? []).slice(0, 5).map((tx) => (
            <View key={tx.id} style={styles.txRow}>
              <Text style={styles.txType}>{tx.type}</Text>
              <Text style={styles.txStatus}>{tx.status}</Text>
              <Text style={styles.mono} numberOfLines={1}>
                {tx.transactionHash}
              </Text>
            </View>
          ))}
          <TouchableOpacity style={styles.button} onPress={() => void refetch()}>
            <Text style={styles.buttonText}>Refetch list</Text>
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
  muted: { color: '#94A3B8' },
  spinner: { marginVertical: 12 },
  error: { color: '#F87171' },
  card: { gap: 8 },
  meta: { fontSize: 13, color: '#94A3B8' },
  txRow: {
    padding: 10,
    backgroundColor: '#090B10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 4,
  },
  txType: { fontWeight: '700', color: '#FFFFFF' },
  txStatus: { fontSize: 12, color: '#F7931A' },
  mono: { fontFamily: 'monospace', fontSize: 11, color: '#E2E8F0' },
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
