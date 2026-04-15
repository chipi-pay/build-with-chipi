import { Chain, useCreateWallet } from '@chipi-stack/chipi-expo';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SimpleInput } from '@/components/ui/SimpleInput';
import { chipiBaseStyles } from '@/constants/chipi-section-styles';
import { MW_COLORS, MW_FONTS, MW_TYPE } from '@/constants/morgan-theme';

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
    <View style={chipiBaseStyles.section}>
      <Text style={chipiBaseStyles.kicker}>Feature: Create wallet (biometric-gated PIN)</Text>
      <Text style={chipiBaseStyles.hook}>Hook: useCreateWallet · SecureStore requireAuthentication for PIN</Text>
      <Text style={chipiBaseStyles.subtitle}>PIN encrypts the wallet; retrieving the PIN prompts biometrics.</Text>

      <SimpleInput
        placeholder="Enter your PIN (min 4 digits)"
        value={pin}
        onChangeText={setPin}
        keyboardType="numeric"
        maxLength={6}
      />

      {error ? <Text style={chipiBaseStyles.error}>{error}</Text> : null}

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
          <Text style={chipiBaseStyles.mono} numberOfLines={2}>
            {walletAddress}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  walletDetails: {
    marginTop: 16,
    padding: 12,
    backgroundColor: MW_COLORS.muted,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: MW_COLORS.border,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailTitle: {
    fontSize: MW_TYPE.section,
    fontWeight: '700',
    color: MW_COLORS.foreground,
    fontFamily: MW_FONTS.display,
  },
  link: {
    fontSize: MW_TYPE.bodySm,
    color: MW_COLORS.foreground,
    fontWeight: '700',
    fontFamily: MW_FONTS.bodySemi,
    textDecorationLine: 'underline',
  },
});
