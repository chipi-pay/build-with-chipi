import { useAuth } from "@clerk/clerk-expo";
import { useTransfer, ChainToken } from "@chipi-stack/chipi-expo";
import { getNativeWalletEncryptKey } from "@chipi-stack/chipi-passkey";
import * as SecureStore from "expo-secure-store";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
} from "react-native";
import { SimpleInput } from "@/components/ui/SimpleInput";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

export default function TransferScreen() {
  const { getToken, userId } = useAuth();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [hasWallet, setHasWallet] = useState(false);
  const [useBiometric, setUseBiometric] = useState(false);

  const { transferAsync, data: txHash, isLoading, reset } = useTransfer();

  useEffect(() => {
    checkWallet();
  }, []);

  const checkWallet = async () => {
    const stored = await SecureStore.getItemAsync("wallet");
    setHasWallet(Boolean(stored));
  };

  const handleTransfer = async () => {
    try {
      setError("");
      reset();

      if (!recipient || !amount) {
        setError("Please fill in all fields");
        return;
      }

      if (!recipient.startsWith("0x")) {
        setError("Recipient address must start with 0x");
        return;
      }

      const token = await getToken();
      if (!token || !userId) {
        setError("No authentication token");
        return;
      }

      const storedWallet = await SecureStore.getItemAsync("wallet");
      if (!storedWallet) {
        setError("No wallet found");
        return;
      }

      let encryptKey: string;

      if (useBiometric) {
        // Try to get biometric key
        const biometricKey = await getNativeWalletEncryptKey(userId);
        if (!biometricKey) {
          setError("Biometric key not found. Please use PIN.");
          return;
        }
        encryptKey = biometricKey;
      } else {
        if (!pin || pin.length < 4) {
          setError("Please enter your PIN");
          return;
        }
        encryptKey = pin;
      }

      const wallet = JSON.parse(storedWallet);

      const result = await transferAsync({
        params: {
          encryptKey,
          wallet,
          token: ChainToken.USDC,
          recipient,
          amount: Number(amount),
        },
        bearerToken: token,
      });

      Alert.alert("Success", "Transfer submitted successfully!");
      setRecipient("");
      setAmount("");
      setPin("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError("Transfer failed: " + errorMessage);
    }
  };

  const openTxExplorer = (hash: string) => {
    const url = `https://starkscan.co/tx/${hash}`;
    Linking.openURL(url);
  };

  if (!hasWallet) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.emptyText}>
            Please create a wallet first
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Send USDC</Text>
        <Text style={styles.subtitle}>
          Transfer tokens to another Starknet address
        </Text>

        <SimpleInput
          placeholder="Recipient address (0x...)"
          value={recipient}
          onChangeText={setRecipient}
          autoCapitalize="none"
        />

        <SimpleInput
          placeholder="Amount in USDC"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />

        {!useBiometric && (
          <SimpleInput
            placeholder="Enter your PIN"
            value={pin}
            onChangeText={setPin}
            keyboardType="numeric"
            maxLength={6}
            secureTextEntry
          />
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <PrimaryButton
          title={isLoading ? "Sending..." : useBiometric ? "Send with Biometrics" : "Send"}
          active={
            !isLoading &&
            Boolean(recipient) &&
            Boolean(amount) &&
            (useBiometric || pin.length >= 4)
          }
          onPress={handleTransfer}
        />

        {txHash && (
          <View style={styles.successBox}>
            <Text style={styles.successTitle}>Transaction Sent!</Text>
            <Text style={styles.txHash} numberOfLines={2}>
              {txHash}
            </Text>
            <Text
              style={styles.viewTx}
              onPress={() => openTxExplorer(txHash)}
            >
              View on Starkscan →
            </Text>
          </View>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ⚡ Gas fees are covered by Chipi's gasless integration
          </Text>
        </View>
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
  emptyText: {
    fontSize: 16,
    color: "#687076",
    textAlign: "center",
  },
  successBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#86efac",
  },
  successTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#16a34a",
    marginBottom: 8,
  },
  txHash: {
    fontSize: 12,
    fontFamily: "monospace",
    color: "#11181C",
    marginBottom: 8,
  },
  viewTx: {
    fontSize: 14,
    color: "#0a7ea4",
    fontWeight: "600",
  },
  infoBox: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#e6f7ff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#91d5ff",
  },
  infoText: {
    fontSize: 14,
    color: "#11181C",
  },
});