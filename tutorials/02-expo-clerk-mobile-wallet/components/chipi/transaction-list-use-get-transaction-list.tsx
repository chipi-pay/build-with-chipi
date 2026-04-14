import { useGetTransactionList, useGetWallet } from '@chipi-stack/chipi-expo';
import { useAuth } from '@clerk/clerk-expo';
import { useEffect } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import { chipiBaseStyles } from '@/constants/chipi-section-styles';
import { MW_COLORS } from '@/constants/morgan-theme';

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
    <View style={chipiBaseStyles.section}>
      <Text style={chipiBaseStyles.kicker}>Feature: Transaction history</Text>
      <Text style={chipiBaseStyles.hookTight}>Hook: useGetTransactionList (address from useGetWallet)</Text>

      {!walletAddress && !walletLoading ? (
        <View style={chipiBaseStyles.card}>
          <Text style={chipiBaseStyles.muted}>Create or fetch a wallet first to load transactions.</Text>
          <TouchableOpacity style={[chipiBaseStyles.secondaryButton, { marginTop: 8 }]} onPress={() => void refetchWallet()} accessibilityRole="button">
            <Text style={chipiBaseStyles.secondaryButtonText}>Refetch wallet</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {walletLoading || (isLoading && Boolean(walletAddress)) ? (
        <ActivityIndicator style={chipiBaseStyles.spinner} color={MW_COLORS.foreground} />
      ) : error ? (
        <Text style={chipiBaseStyles.error}>{error.message}</Text>
      ) : data ? (
        <View style={chipiBaseStyles.card}>
          <Text style={chipiBaseStyles.meta}>
            {data.data?.length ?? 0} transaction(s) on this page
          </Text>
          {(data.data ?? []).slice(0, 5).map((tx) => (
            <View key={tx.id} style={chipiBaseStyles.txRow}>
              <Text style={chipiBaseStyles.txType}>{tx.type}</Text>
              <Text style={chipiBaseStyles.txStatus}>{tx.status}</Text>
              <Text style={chipiBaseStyles.mono} numberOfLines={1}>
                {tx.transactionHash}
              </Text>
            </View>
          ))}
          <TouchableOpacity style={[chipiBaseStyles.secondaryButton, { marginTop: 8 }]} onPress={() => void refetch()} accessibilityRole="button">
            <Text style={chipiBaseStyles.secondaryButtonText}>Refetch list</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}
