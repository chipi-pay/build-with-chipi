import { useGetWallet } from '@chipi-stack/chipi-expo';
import { useAuth } from '@clerk/clerk-expo';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
    <View style={styles.section}>
      <Text style={styles.kicker}>Feature: Wallet record</Text>
      <Text style={styles.hook}>Hook: useGetWallet</Text>

      {isLoading ? (
        <ActivityIndicator style={styles.spinner} />
      ) : error ? (
        <Text style={styles.error}>{error.message}</Text>
      ) : !data ? (
        <View style={styles.card}>
          <Text style={styles.muted}>No wallet returned (404 or empty).</Text>
          <TouchableOpacity style={styles.button} onPress={() => void refetch()}>
            <Text style={styles.buttonText}>Refetch</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          <Row label="publicKey" value={data.publicKey} />
          <Row label="normalizedPublicKey" value={data.normalizedPublicKey} />
          <Row label="chain" value={data.chain} />
          <Row label="deployed" value={String(data.isDeployed)} />
          <Row label="walletType" value={data.walletType} />
          <TouchableOpacity style={styles.button} onPress={() => void refetch()}>
            <Text style={styles.buttonText}>Refetch</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.mono} numberOfLines={3}>
        {value}
      </Text>
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
  muted: { color: '#94A3B8' },
  card: { gap: 8 },
  row: { gap: 4 },
  label: { fontSize: 12, fontWeight: '700', color: '#94A3B8' },
  mono: { fontFamily: 'monospace', fontSize: 12, color: '#E2E8F0' },
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
