import { useMigrateWalletToPasskey, type WalletData } from '@chipi-stack/chipi-expo';
import { useAuth } from '@clerk/clerk-expo';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
    <View style={styles.section}>
      <Text style={styles.kicker}>Feature: Migrate PIN wallet → passkey</Text>
      <Text style={styles.hook}>Hook: useMigrateWalletToPasskey (Expo override)</Text>
      <Text style={styles.note}>
        After success, local SecureStore wallet JSON is replaced with the migrated WalletData shape.
      </Text>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={() => void handleMigrate()}
        disabled={isLoading}>
        <Text style={styles.buttonText}>{isLoading ? 'Migrating…' : 'Migrate to passkey'}</Text>
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error.message}</Text> : null}
      {lastCredentialId ? (
        <Text style={styles.mono} numberOfLines={2}>
          credentialId: {lastCredentialId}
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
  note: { fontSize: 13, color: '#94A3B8', marginBottom: 12 },
  button: { backgroundColor: '#EA580C', borderRadius: 999, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#F7931A99' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  error: { color: '#F87171', marginTop: 10 },
  mono: { marginTop: 10, fontFamily: 'monospace', fontSize: 11, color: '#E2E8F0' },
});
