import { Chain, useCreateWallet } from '@chipi-stack/chipi-expo';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SimpleInput } from '@/components/ui/SimpleInput';
import { setPinStorage, setWalletStorage } from '@/utils/secureStorage';

/**
 * Creates a wallet with a PIN and stores both wallet JSON and PIN in SecureStore.
 * This is the "PIN + biometrics gate" flow for later transaction signing.
 */
export function CreateWalletWithBiometricPinSection() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const userId = user?.id;
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { createWalletAsync, isLoading } = useCreateWallet();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const handleCreateWallet = async () => {
    try {
      setError('');
      const token = await getToken();
      if (!token) {
        setError('No bearer token found');
        return;
      }
      if (!userId) {
        setError('No signed-in user');
        return;
      }

      const result = await createWalletAsync({
        params: {
          encryptKey: pin,
          externalUserId: userId,
          chain: Chain.STARKNET,
        },
        bearerToken: token,
      });

      await setWalletStorage(userId, JSON.stringify(result));
      await setPinStorage(userId, pin);

      setWalletAddress(result.normalizedPublicKey ?? result.publicKey);
      Alert.alert('Success', 'Wallet successfully created!');
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(`Error creating wallet: ${message}`);
    }
  };

  const openStarkscan = (address: string) => {
    void Linking.openURL(`https://starkscan.co/contract/${address}`);
  };

  return (
    <View style={styles.section}>
      <Text style={styles.kicker}>Feature: Create wallet (biometric-gated PIN)</Text>
      <Text style={styles.hook}>Hook: useCreateWallet · SecureStore requireAuthentication for PIN</Text>
      <Text style={styles.subtitle}>PIN encrypts the wallet; retrieving the PIN prompts biometrics.</Text>

      <SimpleInput
        placeholder="Enter your PIN (min 4 digits)"
        value={pin}
        onChangeText={setPin}
        keyboardType="numeric"
        maxLength={6}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <PrimaryButton
        title={isLoading ? 'Creating...' : 'Create Wallet'}
        active={pin.length >= 4 && !isLoading && Boolean(userId)}
        onPress={() => void handleCreateWallet()}
      />

      {walletAddress ? (
        <View style={styles.walletDetails}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>Wallet</Text>
            <Text style={styles.link} onPress={() => openStarkscan(walletAddress)}>
              Starkscan →
            </Text>
          </View>
          <Text style={styles.mono} numberOfLines={2}>
            {walletAddress}
          </Text>
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
  hook: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#94A3B8', marginBottom: 12 },
  errorText: { color: '#F87171', fontSize: 14, marginTop: 8 },
  walletDetails: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#090B10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  link: { fontSize: 14, color: '#F7931A', fontWeight: '700' },
  mono: { fontFamily: 'monospace', fontSize: 13, color: '#E2E8F0' },
});
