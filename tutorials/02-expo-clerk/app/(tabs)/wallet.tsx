import { useAuth, useUser } from "@clerk/clerk-expo";
import { useCreateWallet, useGetWallet, useGetTokenBalance, Chain, ChainToken } from "@chipi-stack/chipi-expo";
import { createNativeWalletPasskey, isNativeBiometricSupported } from "@chipi-stack/chipi-passkey";
import * as SecureStore from "expo-secure-store";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  Linking,
  RefreshControl,
} from "react-native";
import { SimpleInput } from "@/components/ui/SimpleInput";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { USDC_CONTRACT } from "@/constants/tokens";

export default function WalletScreen() {
  const { getToken, userId } = useAuth();
  const { user } = useUser();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [hasWallet, setHasWallet] = useState(false);
  const [walletData, setWalletData] = useState<any>(null);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { createWalletAsync, isLoading: isCreating } = useCreateWallet();

  // Check for existing wallet on mount
  useEffect(() => {
    checkExistingWallet();
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    const supported = await isNativeBiometricSupported();
    setBiometricSupported(supported);
  };

  const checkExistingWallet = async () => {
    try {
      const stored = await SecureStore.getItemAsync("wallet");
      if (stored) {
        const wallet = JSON.parse(stored);
        setWalletData(wallet);
        setHasWallet(true);
      }
    } catch (err) {
      console.error("Error checking wallet:", err);
    }
  };

  const { data: balance, isLoading: isLoadingBalance, refetch: refetchBalance } = useGetTokenBalance({
    params: {
      chainToken: ChainToken.USDC,
      chain: Chain.STARKNET,
      walletPublicKey: walletData?.publicKey || "",
    },
    getBearerToken: async () => {
      const token = await getToken();
      if (!token) throw new Error("No token");
      return token;
    },
    queryOptions: {
      enabled: Boolean(walletData?.publicKey),
    },
  });

  const handleCreateWallet = async () => {
    try {
      setError("");
      
      if (pin.length < 4) {
        setError("PIN must be at least 4 digits");
        return;
      }

      const token = await getToken();
      if (!token || !userId) {
        setError("No bearer token found");
        return;
      }

      const result = await createWalletAsync({
        params: {
          encryptKey: pin,
          externalUserId: userId,
          chain: Chain.STARKNET,
          walletType: "CHIPI",
        },
        bearerToken: token,
      });

      await SecureStore.setItemAsync("wallet", JSON.stringify(result));
      await SecureStore.setItemAsync("wallet_pin", pin, {
        requireAuthentication: false,
      });

      setWalletData(result);
      setHasWallet(true);
      setPin("");
      Alert.alert("Success", "Wallet successfully created!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError("Error creating wallet: " + errorMessage);
    }
  };

  const handleCreateWalletWithPasskey = async () => {
    try {
      setError("");

      if (pin.length < 4) {
        setError("PIN must be at least 4 digits (required as backup)");
        return;
      }

      const token = await getToken();
      if (!token || !userId) {
        setError("No bearer token found");
        return;
      }

      // Use createNativeWalletPasskey utility
      const result = await createNativeWalletPasskey({
        externalUserId: userId,
        pinBackup: pin,
        chain: Chain.STARKNET,
        walletType: "CHIPI",
        bearerToken: token,
      });

      await SecureStore.setItemAsync("wallet", JSON.stringify(result.wallet));
      await SecureStore.setItemAsync("wallet_pin", pin, {
        requireAuthentication: false,
      });

      setWalletData(result.wallet);
      setHasWallet(true);
      setPin("");
      Alert.alert("Success", "Wallet created with biometric authentication!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError("Error creating wallet: " + errorMessage);
    }
  };

  const openStarkscan = (address: string) => {
    const url = `https://starkscan.co/contract/${address}`;
    Linking.openURL(url);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchBalance();
    setRefreshing(false);
  };

  if (hasWallet && walletData) {
    const formattedBalance = balance?.balance
      ? (parseFloat(balance.balance) / Math.pow(10, 6)).toFixed(2)
      : "0.00";

    return (
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.greeting}>Hello, {user?.firstName || "User"}!</Text>
            <Text style={styles.balanceLabel}>Your Balance</Text>
            <Text style={styles.balance}>
              {isLoadingBalance ? "..." : `$${formattedBalance}`} USDC
            </Text>
          </View>

          <View style={styles.walletDetails}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>Wallet Address</Text>
              <Text
                style={styles.viewContract}
                onPress={() => openStarkscan(walletData.publicKey)}
              >
                View on Starkscan →
              </Text>
            </View>
            <Text style={styles.address} numberOfLines={2}>
              {walletData.publicKey}
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              ℹ️ Your wallet is secured with {biometricSupported ? "biometric authentication" : "PIN encryption"}
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create Your Wallet</Text>
        <Text style={styles.subtitle}>
          Set a PIN to secure your wallet
          {biometricSupported && " or use biometric authentication"}
        </Text>

        <SimpleInput
          placeholder="Enter your PIN (min 4 digits)"
          value={pin}
          onChangeText={setPin}
          keyboardType="numeric"
          maxLength={6}
          secureTextEntry
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <PrimaryButton
          title={isCreating ? "Creating..." : "Create Wallet with PIN"}
          active={pin.length >= 4 && !isCreating}
          onPress={handleCreateWallet}
        />

        {biometricSupported && (
          <>
            <Text style={styles.orText}>— OR —</Text>
            <PrimaryButton
              title={isCreating ? "Creating..." : "Create with Biometrics"}
              active={pin.length >= 4 && !isCreating}
              onPress={handleCreateWalletWithPasskey}
              variant="secondary"
            />
            <Text style={styles.helperText}>
              PIN is required as a backup recovery method
            </Text>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 32,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "600",
    color: "#11181C",
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#687076",
    marginBottom: 4,
  },
  balance: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#0a7ea4",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#11181C",
  },
  subtitle: {
    fontSize: 16,
    color: "#687076",
    marginBottom: 24,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 14,
    marginTop: 8,
    marginBottom: 8,
  },
  walletDetails: {
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    marginBottom: 16,
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#687076",
  },
  viewContract: {
    fontSize: 12,
    color: "#0a7ea4",
    fontWeight: "600",
  },
  address: {
    fontSize: 12,
    color: "#11181C",
    fontFamily: "monospace",
  },
  infoBox: {
    padding: 16,
    backgroundColor: "#e6f7ff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#91d5ff",
  },
  infoText: {
    fontSize: 14,
    color: "#11181C",
    lineHeight: 20,
  },
  orText: {
    textAlign: "center",
    color: "#687076",
    marginVertical: 16,
    fontSize: 14,
  },
  helperText: {
    fontSize: 12,
    color: "#687076",
    textAlign: "center",
    marginTop: 8,
  },
});