import { createNativeWalletPasskey, isNativeBiometricSupported } from '@chipi-stack/chipi-expo';
import { useAuth } from '@clerk/clerk-expo';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/**
 * Surfaces low-level native helpers. Prefer `useCreateWallet({ usePasskey: true })` for real wallets.
 */
export function NativeBiometricDiagnosticsSection() {
  const { userId } = useAuth();
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    void isNativeBiometricSupported().then(setSupported);
  }, []);

  const runLowLevelPasskeyDemo = async () => {
    try {
      if (!userId) {
        Alert.alert('Error', 'Sign in first');
        return;
      }
      const result = await createNativeWalletPasskey(userId, 'validation');
      Alert.alert('Native passkey demo', `Got encrypt key length: ${result.encryptKey.length}`);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.kicker}>Feature: Native biometric diagnostics</Text>
      <Text style={styles.hook}>API: isNativeBiometricSupported · createNativeWalletPasskey (advanced)</Text>
      <Text style={styles.body}>
        `createNativeWalletPasskey` is public in chipi-expo for encryption-key provisioning. Normal app flows
        should use `useCreateWallet` with `usePasskey: true` so wallet creation stays aligned with the SDK.
      </Text>

      <Text style={styles.result}>
        Biometrics ready: {supported === null ? 'checking…' : supported ? 'yes' : 'no'}
      </Text>

      <TouchableOpacity style={styles.button} onPress={() => void runLowLevelPasskeyDemo()}>
        <Text style={styles.buttonText}>Run createNativeWalletPasskey (demo)</Text>
      </TouchableOpacity>
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
  body: { fontSize: 13, color: '#94A3B8', marginBottom: 12, lineHeight: 18 },
  result: { fontSize: 14, fontWeight: '700', marginBottom: 12, color: '#FFFFFF' },
  button: {
    backgroundColor: '#141922',
    borderRadius: 999,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F7931A80',
  },
  buttonText: { color: '#fff', fontWeight: '700' },
});
