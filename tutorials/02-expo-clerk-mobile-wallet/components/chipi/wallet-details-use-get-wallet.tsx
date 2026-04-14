import { useGetWallet } from '@chipi-stack/chipi-expo';
import { useAuth } from '@clerk/clerk-expo';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import { chipiBaseStyles } from '@/constants/chipi-section-styles';
import { MW_COLORS } from '@/constants/morgan-theme';

/**
 * Low-level wallet details using `useGetWallet`.
 * Good for showing raw API fields like public keys and wallet type.
 */
export function WalletDetailsUseGetWalletSection() {
  const { userId, getToken } = useAuth();

  const { data, isLoading, error, refetch } = useGetWallet({
    params: { externalUserId: userId || '' },
    getBearerToken: getToken,
    queryOptions: {
      enabled: Boolean(userId),
    },
  });

  return (
    <View style={chipiBaseStyles.section}>
      <Text style={chipiBaseStyles.kicker}>Feature: Wallet record</Text>
      <Text style={chipiBaseStyles.hookTight}>Hook: useGetWallet</Text>

      {isLoading ? (
        <ActivityIndicator style={chipiBaseStyles.spinner} color={MW_COLORS.foreground} />
      ) : error ? (
        <Text style={chipiBaseStyles.error}>{error.message}</Text>
      ) : !data ? (
        <View style={chipiBaseStyles.card}>
          <Text style={chipiBaseStyles.muted}>No wallet returned (404 or empty).</Text>
          <TouchableOpacity style={[chipiBaseStyles.secondaryButton, { marginTop: 8 }]} onPress={() => void refetch()} accessibilityRole="button">
            <Text style={chipiBaseStyles.secondaryButtonText}>Refetch</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={chipiBaseStyles.card}>
          <Row label="publicKey" value={data.publicKey ?? ''} />
          <Row label="normalizedPublicKey" value={data.normalizedPublicKey ?? ''} />
          <Row label="chain" value={String(data.chain ?? '')} />
          <Row label="deployed" value={String(data.isDeployed)} />
          <Row label="walletType" value={data.walletType ?? ''} />
          <TouchableOpacity style={[chipiBaseStyles.secondaryButton, { marginTop: 8 }]} onPress={() => void refetch()} accessibilityRole="button">
            <Text style={chipiBaseStyles.secondaryButtonText}>Refetch</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={chipiBaseStyles.fieldLabel}>{label}</Text>
      <Text style={chipiBaseStyles.mono} numberOfLines={3}>
        {value}
      </Text>
    </View>
  );
}
