import { useMigrateWalletToPasskey, type WalletData } from '@chipi-stack/chipi-expo';
import { useAuth } from '@clerk/clerk-expo';
import { useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

import { chipiBaseStyles } from '@/constants/chipi-section-styles';

import { getPinStorage, getWalletStorage, setWalletStorage } from '@/utils/secureStorage';

/**
 * Migrates a PIN-encrypted wallet to passkey credentials.
 * Uses local SecureStore wallet + PIN as input, then persists migrated wallet JSON.
 */
export function MigrateWalletToPasskeySection() {
  const { getToken, userId } = useAuth();
  const { migrateWalletToPasskeyAsync, isLoading, error } = useMigrateWalletToPasskey();
  const [lastCredentialId, setLastCredentialId] = useState<string | null>(null);

  const handleMigrate = async () => {
    try {
      if (!userId) {
        Alert.alert('Error', 'No user id');
        return;
      }
      const raw = await getWalletStorage(userId);
      const pin = await getPinStorage(userId);
      if (!raw || !pin) {
        Alert.alert('Error', 'Need a PIN-encrypted wallet in SecureStore (create with PIN flow first).');
        return;
      }

      const parsed = JSON.parse(raw) as WalletData;
      const token = await getToken();
      if (!token) {
        Alert.alert('Error', 'No bearer token');
        return;
      }

      const result = await migrateWalletToPasskeyAsync({
        wallet: parsed,
        oldEncryptKey: pin,
        externalUserId: userId,
        bearerToken: token,
      });

      await setWalletStorage(userId, JSON.stringify(result.wallet));
      setLastCredentialId(result.credentialId);
      Alert.alert('Success', 'Wallet migrated to native passkey storage.');
    } catch (e) {
      Alert.alert('Migration error', e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <View style={chipiBaseStyles.section}>
      <Text style={chipiBaseStyles.kicker}>Feature: Migrate PIN wallet → passkey</Text>
      <Text style={chipiBaseStyles.hook}>Hook: useMigrateWalletToPasskey (Expo override)</Text>
      <Text style={chipiBaseStyles.note}>
        After success, local SecureStore wallet JSON is replaced with the migrated WalletData shape.
      </Text>

      <TouchableOpacity
        style={[chipiBaseStyles.primaryButton, isLoading && chipiBaseStyles.primaryButtonDisabled]}
        onPress={() => void handleMigrate()}
        disabled={isLoading}
        accessibilityRole="button">
        <Text style={chipiBaseStyles.primaryButtonText}>{isLoading ? 'Migrating…' : 'Migrate to passkey →'}</Text>
      </TouchableOpacity>

      {error ? <Text style={chipiBaseStyles.error}>{error.message}</Text> : null}
      {lastCredentialId ? (
        <Text style={[chipiBaseStyles.mono, { marginTop: 10 }]} numberOfLines={2}>
          credentialId: {lastCredentialId}
        </Text>
      ) : null}
    </View>
  );
}
