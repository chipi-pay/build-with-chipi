import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useMigrateWalletToPasskey } from "@chipi-stack/chipi-expo";
import { useAuth } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";

export default function MigratePasskeyScreen() {
  const { getToken, userId } = useAuth();
  const router = useRouter();
  const [currentPin, setCurrentPin] = useState("");
  const [error, setError] = useState("");
  const { migrateWalletToPasskeyAsync, isLoading } = useMigrateWalletToPasskey();

  const handleMigrate = async () => {
    try {
      setError("");

      if (!currentPin) {
        setError("Please enter your current PIN");
        return;
      }

      const token = await getToken();
      const storedWallet = await SecureStore.getItemAsync("wallet");

      if (!token || !userId || !storedWallet) {
        setError("No bearer token, user ID, or wallet found");
        return;
      }

      // Trigger migration (Face ID / Touch ID prompt shown automatically)
      const result = await migrateWalletToPasskeyAsync({
        wallet: JSON.parse(storedWallet),
        oldEncryptKey: currentPin,
        externalUserId: userId,
        bearerToken: token,
      });

      // Replace the stored wallet with the re-encrypted version
      await SecureStore.setItemAsync("wallet", JSON.stringify(result.wallet));
      
      // Remove the old PIN since it no longer works
      await SecureStore.deleteItemAsync("wallet_pin");

      Alert.alert(
        "Success",
        "Your wallet has been migrated to passkey authentication! The old PIN no longer works.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError("Error migrating wallet: " + errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Migrate to Passkey</Text>
      <Text style={styles.subtitle}>
        Upgrade your wallet security with Face ID or Touch ID. After migration, your PIN will no longer work.
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Current PIN</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your current PIN"
          value={currentPin}
          onChangeText={setCurrentPin}
          secureTextEntry
          keyboardType="numeric"
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleMigrate}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Migrate to Passkey</Text>
        )}
      </TouchableOpacity>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>⚠️ Important</Text>
        <Text style={styles.infoText}>
          • This migration is irreversible{"\n"}
          • Your old PIN will stop working{"\n"}
          • You'll use biometrics for all future transactions{"\n"}
          • Make sure biometrics are enrolled on your device
        </Text>
      </View>
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
    lineHeight: 22,
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
    marginBottom: 24,
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
  infoCard: {
    backgroundColor: "#fff3cd",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffc107",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#856404",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#856404",
    lineHeight: 20,
  },
});