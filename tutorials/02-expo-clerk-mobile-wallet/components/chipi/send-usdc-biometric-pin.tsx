import { ChainToken, useTransfer } from '@chipi-stack/chipi-expo';
import { useAuth } from '@clerk/clerk-expo';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { getPinStorage, getWalletStorage } from '@/utils/secureStorage';

/**
 * Sends USDC using a PIN-backed wallet.
 * Reads wallet JSON + PIN from SecureStore and signs through `useTransfer`.
 */
export function SendUsdcBiometricPinSection() {
  const { getToken, userId } = useAuth();
  const { transferAsync, isLoading, error } = useTransfer();
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');

  const handleTransfer = async () => {
    try {
      const trimmed = recipientAddress.trim();
      if (!trimmed || !amount.trim()) {
        Alert.alert('Error', 'Please enter recipient address and amount');
        return;
      }
      const num = Number(amount);
      if (!Number.isFinite(num) || num <= 0) {
        Alert.alert('Error', 'Amount must be a number greater than 0');
        return;
      }

      const storedWallet = await getWalletStorage(userId);
      const pin = await getPinStorage(userId);

      if (!storedWallet || !pin) {
        Alert.alert('Error', 'Wallet or PIN not found. Create a PIN-encrypted wallet first.');
        return;
      }

      const token = await getToken();
      if (!token) {
        Alert.alert('Error', 'No bearer token found');
        return;
      }

      const wallet = JSON.parse(storedWallet) as {
        publicKey: string;
        encryptedPrivateKey: string;
        walletType?: string;
      };

      const txHash = await transferAsync({
        params: {
          encryptKey: pin,
          wallet,
          token: ChainToken.USDC,
          recipient: trimmed,
          amount: num,
        },
        bearerToken: token,
      });

      Alert.alert('Success', `Transfer submitted. TX: ${txHash || 'pending'}`);
      setRecipientAddress('');
      setAmount('');
    } catch (err) {
      Alert.alert('Transfer Error', err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.kicker}>Feature: Send USDC (PIN + biometric)</Text>
      <Text style={styles.hook}>Hook: useTransfer · encryptKey from SecureStore</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Recipient</Text>
        <TextInput
          style={styles.input}
          value={recipientAddress}
          onChangeText={setRecipientAddress}
          placeholder="0x..."
          autoCapitalize="none"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Amount (USDC)</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />
      </View>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={() => void handleTransfer()}
        disabled={isLoading || !recipientAddress.trim() || !amount.trim()}>
        <Text style={styles.buttonText}>{isLoading ? 'Sending...' : 'Send USDC'}</Text>
      </TouchableOpacity>

      {error ? <Text style={styles.error}>Error: {error.message}</Text> : null}
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
  field: { marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6, color: '#94A3B8' },
  input: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#090B10',
    color: '#FFFFFF',
  },
  button: {
    backgroundColor: '#EA580C',
    borderRadius: 999,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#F7931A99',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  error: { color: '#F87171', fontSize: 14, marginTop: 8 },
});
