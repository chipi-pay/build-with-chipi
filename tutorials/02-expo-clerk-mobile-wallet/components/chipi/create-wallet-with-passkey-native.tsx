import { Chain, type CreateWalletResponse, useCreateWallet } from '@chipi-stack/chipi-expo';
import { useAuth } from '@clerk/clerk-expo';
import { useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

import { chipiBaseStyles } from '@/constants/chipi-section-styles';

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
    <View style={chipiBaseStyles.section}>
      <Text style={chipiBaseStyles.kicker}>Feature: Create wallet (native passkey / PRF-style key)</Text>
      <Text style={chipiBaseStyles.hook}>Hook: useCreateWallet · params.usePasskey: true</Text>
      <Text style={chipiBaseStyles.subtitle}>Uses expo-local-authentication + expo-secure-store via Chipi Expo adapter.</Text>

      <TouchableOpacity
        style={[chipiBaseStyles.primaryButton, isLoading && chipiBaseStyles.primaryButtonDisabled]}
        onPress={() => void handleCreate()}
        disabled={isLoading}
        accessibilityRole="button">
        <Text style={chipiBaseStyles.primaryButtonText}>{isLoading ? 'Creating...' : 'Create with biometrics →'}</Text>
      </TouchableOpacity>

      {error ? <Text style={chipiBaseStyles.error}>{error.message}</Text> : null}
      {displayKey ? (
        <Text style={chipiBaseStyles.address} numberOfLines={2}>
          {displayKey}
        </Text>
      ) : null}
    </View>
  );
}
