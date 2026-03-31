import { useCreateWallet } from "@chipi-stack/chipi-expo";
import { useAuth } from "@clerk/clerk-expo";
import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Linking, ActivityIndicator } from "react-native";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import { isNativeBiometricSupported } from "@chipi-stack/chipi-passkey";
import * as LocalAuthentication from "expo-local-authentication";

export default function CreateWalletScreen() {
  const { getToken, userId } = useAuth();
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [usePasskey, setUsePasskey] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const { createWalletAsync, isLoading, data } = useCreateWallet();

  // Check biometric availability on mount
  useState(() => {
    (async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const nativeSupported = await isNativeBiometricSupported();
      setBiometricAvailable(hasHardware && isEnrolled && nativeSupported);
    })();
  });

  const handleCreateWallet = async () => {
    try {
      setError("");

      if (!usePasskey && pin.length < 4) {
        setError("PIN must be at least 4 digits");
        return;
      }

      const token = await getToken();
      if (!token || !userId) {
        setError("No bearer token or user ID found");
        return;
      }

      const result = await createWalletAsync({
        params: {
          encryptKey: usePasskey ? undefined : pin,
          externalUserId: userId,
          usePasskey: usePasskey,
        },
        bearerToken: token,
      });

      // Save wallet data to secure storage
      await SecureStore.setItemAsync("wallet", JSON.stringify(result.wallet));

      if (!usePasskey) {
        // Save PIN with biometric protection if available
        await SecureStore.setItemAsync("wallet_pin", pin, {
          requireAuthentication: biometricAvailable,
        });
      }

      Alert.alert("Success", "Wallet successfully created!", [
        {
          text: "OK",
          onPress: () => router.replace("/wallet"),
        },
      ]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError("Error creating wallet: " + errorMessage);
    }
  };

  const openStarkscan = (address: string) => {
    const url = `https://starkscan.co/contract/${address}`;
    Linking.openURL(url);
  };

  if (data) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Wallet Created!</Text>
        <View style={styles.walletDetails}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>Wallet Details</Text>
            <TouchableOpacity onPress={() => openStarkscan(data.publicKey)}>
              <Text style={styles.viewContract}>View Contract →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Address:</Text>
            <Text style={styles.detailValue} numberOfLines={2}>
              {data.publicKey}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/wallet")}
        >
          <Text style={styles.buttonText}>Go to Wallet</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create New Wallet</Text>
      <Text style={styles.subtitle}>
        {usePasskey ? "Use biometric authentication" : "Set a PIN to secure your wallet"}
      </Text>

      {biometricAvailable && (
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={styles.toggle}
            onPress={() => setUsePasskey(!usePasskey)}
          >
            <View style={[styles.checkbox, usePasskey && styles.checkboxActive]}>
              {usePasskey && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.toggleText}>Use Face ID / Touch ID</Text>
          </TouchableOpacity>
        </View>
      )}

      {!usePasskey && (
        <TextInput
          style={styles.input}
          placeholder="Enter your PIN (min 4 digits)"
          value={pin}
          onChangeText={setPin}
          keyboardType="numeric"
          maxLength={6}
          secureTextEntry
        />
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, (!usePasskey && pin.length < 4) || isLoading ? styles.buttonDisabled : null]}
        onPress={handleCreateWallet}
        disabled={(!usePasskey && pin.length < 4) || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Create Wallet</Text>
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
    marginBottom: 8,
    color: "#11181C",
  },
  subtitle: {
    fontSize: 16,
    color: "#687076",
    marginBottom: 24,
  },
  toggleContainer: {
    marginBottom: 16,
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
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#0a7ea4",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
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
  walletDetails: {
    marginTop: 32,
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginBottom: 24,
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#11181C",
  },
  viewContract: {
    fontSize: 14,
    color: "#0a7ea4",
    fontWeight: "600",
  },
  detailItem: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#687076",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: "#11181C",
    fontFamily: "monospace",
  },
});