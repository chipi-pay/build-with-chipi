import { ChainToken, useGetWallet, useTransfer } from '@chipi-stack/chipi-expo';
import { useAuth } from '@clerk/clerk-expo';
import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { chipiBaseStyles } from '@/constants/chipi-section-styles';
import { MW_COLORS } from '@/constants/morgan-theme';

import { getWalletStorage } from '@/utils/secureStorage';

/**
 * Sends USDC with passkey params (`usePasskey: true` + `externalUserId`).
 * Demonstrates the passkey-specific transfer shape required by the Expo SDK.
 */
export function SendUsdcPasskeyParamsSection() {
  const { getToken, userId } = useAuth();
  const { transferAsync, isLoading, error } = useTransfer();
  useGetWallet();
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
      if (!userId) {
        Alert.alert('Error', 'No user id');
        return;
      }

      const storedWallet = await getWalletStorage(userId);
      if (!storedWallet) {
        Alert.alert('Error', 'No local wallet JSON. Create a passkey wallet first.');
        return;
      }

      const token = await getToken();
      if (!token) {
        Alert.alert('Error', 'No bearer token found');
        return;
      }

      const wallet = JSON.parse(storedWallet) as {
        publicKey: string;
        walletType?: string;
        encryptedPrivateKey: string;
      };

      const txHash = await transferAsync({
        params: {
          usePasskey: true,
          externalUserId: userId,
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
      <Text style={chipiBaseStyles.kicker}>Feature: Send USDC (passkey path)</Text>
      <Text style={chipiBaseStyles.hook}>Hook: useTransfer · usePasskey: true · externalUserId</Text>
      <Text style={chipiBaseStyles.note}>
        Requires a wallet created with usePasskey so the native encrypt key exists for this Clerk user.
      </Text>

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
        <Text style={chipiBaseStyles.primaryButtonText}>{isLoading ? 'Sending...' : 'Send with passkey →'}</Text>
      </TouchableOpacity>

      {error ? <Text style={chipiBaseStyles.error}>Error: {error.message}</Text> : null}
    </View>
  );
}
