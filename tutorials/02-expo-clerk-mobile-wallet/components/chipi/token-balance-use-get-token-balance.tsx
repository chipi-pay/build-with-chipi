import { Chain, ChainToken, useGetTokenBalance, useGetWallet } from '@chipi-stack/chipi-expo';
import { useAuth } from '@clerk/clerk-expo';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import { chipiBaseStyles } from '@/constants/chipi-section-styles';
import { MW_COLORS } from '@/constants/morgan-theme';

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
    <View style={chipiBaseStyles.section}>
      <Text style={chipiBaseStyles.kicker}>Feature: Token balance</Text>
      <Text style={chipiBaseStyles.hookTight}>Hook: useGetTokenBalance (USDC on STARKNET)</Text>

      {!walletPublicKey && !walletLoading ? (
        <View style={chipiBaseStyles.card}>
          <Text style={chipiBaseStyles.muted}>Create or fetch a wallet first to load token balance.</Text>
          <TouchableOpacity style={[chipiBaseStyles.secondaryButton, { marginTop: 8 }]} onPress={() => void refetchWallet()} accessibilityRole="button">
            <Text style={chipiBaseStyles.secondaryButtonText}>Refetch wallet</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {walletLoading || (isLoading && Boolean(walletPublicKey)) ? (
        <ActivityIndicator style={chipiBaseStyles.spinner} color={MW_COLORS.foreground} />
      ) : error ? (
        <Text style={chipiBaseStyles.error}>{error.message}</Text>
      ) : data ? (
        <View style={chipiBaseStyles.card}>
          <Text style={chipiBaseStyles.balanceValue}>{data.balance ?? '0'}</Text>
          <Text style={chipiBaseStyles.balanceLabel}>USDC (raw token balance from API)</Text>
          <TouchableOpacity style={[chipiBaseStyles.secondaryButton, { marginTop: 8 }]} onPress={() => void refetch()} accessibilityRole="button">
            <Text style={chipiBaseStyles.secondaryButtonText}>Refetch balance</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}
