import { ChainToken, useChipiWallet } from '@chipi-stack/chipi-expo';
import { useAuth } from '@clerk/clerk-expo';
import { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { chipiBaseStyles } from '@/constants/chipi-section-styles';
import { MW_COLORS } from '@/constants/morgan-theme';

/**
 * High-level wallet dashboard using `useChipiWallet`.
 * Aggregates wallet fetch, balance fetch, and create-wallet action into one hook.
 */
export function WalletOverviewUseChipiWalletSection() {
  const { userId, getToken } = useAuth();
  const [pin, setPin] = useState('');

  const {
    wallet,
    hasWallet,
    formattedBalance,
    isLoadingWallet,
    walletError,
    createWallet,
    isCreating,
    refetchAll,
  } = useChipiWallet({
    externalUserId: userId ?? null,
    getBearerToken: getToken,
    defaultToken: ChainToken.USDC,
    enabled: Boolean(userId),
  });

  return (
    <View style={chipiBaseStyles.section}>
      <Text style={chipiBaseStyles.kicker}>Feature: Wallet overview</Text>
      <Text style={chipiBaseStyles.hookTight}>Hook: useChipiWallet</Text>

      {isLoadingWallet ? (
        <ActivityIndicator style={chipiBaseStyles.spinner} color={MW_COLORS.foreground} />
      ) : walletError ? (
        <Text style={chipiBaseStyles.error}>{walletError.message}</Text>
      ) : hasWallet && wallet ? (
        <View style={chipiBaseStyles.card}>
          <Text style={chipiBaseStyles.fieldLabel}>Address</Text>
          <Text style={chipiBaseStyles.mono} numberOfLines={2}>
            {wallet.normalizedPublicKey ?? wallet.publicKey}
          </Text>
          <Text style={chipiBaseStyles.short}>{wallet.shortAddress}</Text>
          <View style={chipiBaseStyles.row}>
            <Text style={chipiBaseStyles.rowLabel}>USDC: </Text>
            <Text style={chipiBaseStyles.metricValue}>{formattedBalance}</Text>
          </View>
          <View style={chipiBaseStyles.row}>
            <Text style={chipiBaseStyles.rowLabel}>Session keys: </Text>
            <Text style={chipiBaseStyles.metricValue}>{wallet.supportsSessionKeys ? 'Yes' : 'No'}</Text>
          </View>
          <TouchableOpacity style={chipiBaseStyles.ghostLinkButton} onPress={() => void refetchAll()} accessibilityRole="button">
            <Text style={chipiBaseStyles.ghostLinkText}>Refetch wallet + balance</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={chipiBaseStyles.card}>
          <Text style={chipiBaseStyles.mutedBlock}>No wallet on server for this user yet.</Text>
          <TextInput
            style={chipiBaseStyles.input}
            value={pin}
            onChangeText={setPin}
            placeholder="PIN for createWallet (min 4)"
            placeholderTextColor={MW_COLORS.mutedForeground}
            keyboardType="numeric"
            maxLength={8}
            secureTextEntry
          />
          <TouchableOpacity
            style={[chipiBaseStyles.primaryButton, (pin.length < 4 || isCreating) && chipiBaseStyles.primaryButtonDisabled]}
            disabled={pin.length < 4 || isCreating}
            onPress={() => void createWallet({ encryptKey: pin })}
            accessibilityRole="button">
            <Text style={chipiBaseStyles.primaryButtonText}>{isCreating ? 'Creating…' : 'Create via useChipiWallet →'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={chipiBaseStyles.ghostLinkButton} onPress={() => void refetchAll()} accessibilityRole="button">
            <Text style={chipiBaseStyles.ghostLinkText}>Refetch wallet + balance</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
