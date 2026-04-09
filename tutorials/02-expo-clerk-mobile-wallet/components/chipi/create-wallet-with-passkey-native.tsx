import { Chain, type CreateWalletResponse, useCreateWallet } from '@chipi-stack/chipi-expo';
import { useAuth } from '@clerk/clerk-expo';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { setWalletStorage } from '@/utils/secureStorage';

/**
 * Creates a wallet with native passkeys from the start (`usePasskey: true`).
 * Stores the returned wallet JSON for transfer and migration demos.
 */
export function CreateWalletWithPasskeyNativeSection() {
  const { getToken, userId } = useAuth();
  const { createWalletAsync, isLoading, error } = useCreateWallet();
  const [created, setCreated] = useState<CreateWalletResponse | null>(null);

  const handleCreate = async () => {
    try {
      const token = await getToken();
      if (!token || !userId) {
        Alert.alert('Error', 'No auth token or user ID found.');
        return;
      }

      const result = await createWalletAsync({
        params: {
          usePasskey: true,
          externalUserId: userId,
          chain: Chain.STARKNET,
        },
        bearerToken: token,
      });

      await setWalletStorage(userId, JSON.stringify(result));
      setCreated(result);
      Alert.alert('Success', 'Wallet created and secured with device biometrics.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : String(err));
    }
  };

  const displayKey = created?.normalizedPublicKey ?? created?.publicKey;

  return (
    <View style={styles.section}>
      <Text style={styles.kicker}>Feature: Create wallet (native passkey / PRF-style key)</Text>
      <Text style={styles.hook}>Hook: useCreateWallet · params.usePasskey: true</Text>
      <Text style={styles.subtitle}>Uses expo-local-authentication + expo-secure-store via Chipi Expo adapter.</Text>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={() => void handleCreate()}
        disabled={isLoading}>
        <Text style={styles.buttonText}>{isLoading ? 'Creating...' : 'Create with biometrics'}</Text>
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error.message}</Text> : null}
      {displayKey ? (
        <Text style={styles.address} numberOfLines={2}>
          {displayKey}
        </Text>
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
  hook: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#94A3B8', marginBottom: 16 },
  button: { backgroundColor: '#EA580C', borderRadius: 999, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#F7931A99' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  error: { color: '#F87171', marginTop: 12 },
  address: { fontFamily: 'monospace', fontSize: 12, marginTop: 16, color: '#E2E8F0' },
});
