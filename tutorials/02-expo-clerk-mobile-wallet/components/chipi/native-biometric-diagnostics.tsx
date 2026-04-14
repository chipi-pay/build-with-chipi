import { createNativeWalletPasskey, isNativeBiometricSupported } from '@chipi-stack/chipi-expo';
import { useAuth } from '@clerk/clerk-expo';
import { useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

import { chipiBaseStyles } from '@/constants/chipi-section-styles';

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
    <View style={chipiBaseStyles.section}>
      <Text style={chipiBaseStyles.kicker}>Feature: Native biometric diagnostics</Text>
      <Text style={chipiBaseStyles.hook}>API: isNativeBiometricSupported · createNativeWalletPasskey (advanced)</Text>
      <Text style={chipiBaseStyles.body}>
        `createNativeWalletPasskey` is public in chipi-expo for encryption-key provisioning. Normal app flows should
        use `useCreateWallet` with `usePasskey: true` so wallet creation stays aligned with the SDK.
      </Text>

      <Text style={chipiBaseStyles.hook}>
        Biometrics ready: {supported === null ? 'checking…' : supported ? 'yes' : 'no'}
      </Text>

      <TouchableOpacity
        style={chipiBaseStyles.secondaryButton}
        onPress={() => void runLowLevelPasskeyDemo()}
        accessibilityRole="button">
        <Text style={chipiBaseStyles.secondaryButtonText}>Run createNativeWalletPasskey (demo)</Text>
      </TouchableOpacity>
    </View>
  );
}
