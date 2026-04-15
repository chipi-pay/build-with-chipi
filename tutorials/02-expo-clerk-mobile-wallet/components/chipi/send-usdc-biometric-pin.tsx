import { ChainToken, useTransfer } from '@chipi-stack/chipi-expo';
import { useAuth } from '@clerk/clerk-expo';
import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { chipiBaseStyles } from '@/constants/chipi-section-styles';
import { MW_COLORS } from '@/constants/morgan-theme';

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
    <View style={chipiBaseStyles.section}>
      <Text style={chipiBaseStyles.kicker}>Feature: Send USDC (PIN + biometric)</Text>
      <Text style={chipiBaseStyles.hookTight}>Hook: useTransfer · encryptKey from SecureStore</Text>

      <View style={chipiBaseStyles.field}>
        <Text style={chipiBaseStyles.label}>Recipient</Text>
        <TextInput
          style={chipiBaseStyles.input}
          value={recipientAddress}
          onChangeText={setRecipientAddress}
          placeholder="0x..."
          placeholderTextColor={MW_COLORS.mutedForeground}
          autoCapitalize="none"
        />
      </View>

      <View style={chipiBaseStyles.field}>
        <Text style={chipiBaseStyles.label}>Amount (USDC)</Text>
        <TextInput
          style={chipiBaseStyles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor={MW_COLORS.mutedForeground}
          keyboardType="decimal-pad"
        />
      </View>

      <TouchableOpacity
        style={[chipiBaseStyles.primaryButton, { marginTop: 4 }, isLoading && chipiBaseStyles.primaryButtonDisabled]}
        onPress={() => void handleTransfer()}
        disabled={isLoading || !recipientAddress.trim() || !amount.trim()}
        accessibilityRole="button">
        <Text style={chipiBaseStyles.primaryButtonText}>{isLoading ? 'Sending...' : 'Send USDC →'}</Text>
      </TouchableOpacity>

      {error ? <Text style={chipiBaseStyles.error}>Error: {error.message}</Text> : null}
    </View>
  );
}
