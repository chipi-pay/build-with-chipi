import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useTransfer, ChainToken } from "@chipi-stack/chipi-expo";
import { useAuth } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import { createNativeWalletPasskey, getNativeWalletEncryptKey } from "@chipi-stack/chipi-passkey";
import { useRouter } from "expo-router";

// Mainnet USDC contract address
const USDC_CONTRACT = "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8";

export default function TransferScreen() {
  const { getToken, userId } = useAuth();
  const router = useRouter();
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [usePasskey, setUsePasskey] = useState(false);
  const { transferAsync, isLoading } = useTransfer();

  const handleTransfer = async () => {
    try {
      setError("");

      if (!recipientAddress || !amount) {
        setError("Please fill all fields");
        return;
      }

      if (!usePasskey && !pin) {
        setError("Please enter your PIN");
        return;
      }

      const token = await getToken();
      const storedWallet = await SecureStore.getItemAsync("wallet");

      if (!token || !userId || !storedWallet) {
        setError("No bearer token, user ID, or wallet found");
        return;
      }

      let encryptKey: string;

      if (usePasskey) {
        // Retrieve passkey-encrypted key (triggers biometric prompt)
        const passkeyKey = await getNativeWalletEncryptKey(userId);
        if (!passkeyKey) {
          // DOCS-ISSUE: createNativeWalletPasskey is used to create a new passkey, not retrieve
          // We should only use getNativeWalletEncryptKey here
          throw new Error("No wallet key found. Please re-create your wallet or migrate to passkey.");
        }
        encryptKey = passkeyKey;
      } else {
        // Use PIN from secure storage with biometric authentication
        const storedPin = await SecureStore.getItemAsync("wallet_pin", {
          requireAuthentication: true,
        });
        encryptKey = storedPin || pin;
      }

      const transferResponse = await transferAsync({
        params: {
          encryptKey,
          wallet: JSON.parse(storedWallet),
          token: ChainToken.USDC,
          recipient: recipientAddress,
          amount: Number(amount),
        },
        bearerToken: token,
      });

      Alert.alert("Success", `Transfer completed!\nTx: ${transferResponse}`, [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError("Error transferring: " + errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transfer USDC</Text>

      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={styles.toggle}
          onPress={() => setUsePasskey(!usePasskey)}
        >
          <View style={[styles.checkbox, usePasskey && styles.checkboxActive]}>
            {usePasskey && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.toggleText}>Use biometric authentication</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Recipient Address</Text>
        <TextInput
          style={styles.input}
          placeholder="0x..."
          value={recipientAddress}
          onChangeText={setRecipientAddress}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Amount (USDC)</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />
      </View>

      {!usePasskey && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>PIN</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your PIN"
            value={pin}
            onChangeText={setPin}
            secureTextEntry
            keyboardType="numeric"
          />
        </View>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleTransfer}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    color: "#11181C",
  },
  toggleContainer: {
    marginBottom: 24,
  },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#687076",
    borderRadius: 4,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxActive: {
    backgroundColor: "#0a7ea4",
    borderColor: "#0a7ea4",
  },
  checkmark: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  toggleText: {
    fontSize: 16,
    color: "#11181C",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#687076",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#0a7ea4",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 14,
    marginBottom: 16,
  },
});