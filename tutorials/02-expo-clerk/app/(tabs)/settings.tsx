import { useAuth, useUser } from "@clerk/clerk-expo";
import { useMigrateWalletToPasskey } from "@chipi-stack/chipi-expo";
import { isNativeBiometricSupported } from "@chipi-stack/chipi-passkey";
import * as SecureStore from "expo-secure-store";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { SimpleInput } from "@/components/ui/SimpleInput";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

export default function SettingsScreen() {
  const { getToken, userId, signOut } = useAuth();
  const { user } = useUser();
  const [currentPin, setCurrentPin] = useState("");
  const [error, setError] = useState("");
  const [hasWallet, setHasWallet] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);

  const { migrateWalletToPasskeyAsync, isLoading } = useMigrateWalletToPasskey();

  useEffect(() => {
    checkWallet();
    checkBiometric();
  }, []);

  const checkWallet = async () => {
    const stored = await SecureStore.getItemAsync("wallet");
    setHasWallet(Boolean(stored));
  };

  const checkBiometric = async () => {
    const supported = await isNativeBiometricSupported();
    setBiometricSupported(supported);
  };

  const handleMigrate = async () => {
    try {
      setError("");

      if (!currentPin || currentPin.length < 4) {
        setError("Please enter your current PIN");
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

      const wallet = JSON.parse(storedWallet);

      const result = await migrateWalletToPasskeyAsync({
        wallet,
        oldEncryptKey: currentPin,
        externalUserId: userId,
        bearerToken: token,
      });

      // Save updated wallet
      await SecureStore.setItemAsync("wallet", JSON.stringify(result.wallet));

      Alert.alert(
        "Success",
        "Your wallet has been migrated to biometric authentication!"
      );
      setCurrentPin("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError("Migration failed: " + errorMessage);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => signOut(),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.infoBox}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>
              {user?.primaryEmailAddress?.emailAddress || "Not set"}
            </Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.label}>User ID</Text>
            <Text style={styles.value} numberOfLines={1}>
              {userId}
            </Text>
          </View>
        </View>

        {hasWallet && biometricSupported && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security</Text>
            <Text style={styles.subtitle}>
              Migrate your wallet to biometric authentication for easier access
            </Text>

            <SimpleInput
              placeholder="Enter your current PIN"
              value={currentPin}
              onChangeText={setCurrentPin}
              keyboardType="numeric"
              maxLength={6}
              secureTextEntry
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <PrimaryButton
              title={isLoading ? "Migrating..." : "Migrate to Biometrics"}
              active={currentPin.length >= 4 && !isLoading}
              onPress={handleMigrate}
            />

            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ After migration, you'll use Face ID / Touch ID to authenticate
                transactions. Your PIN will remain as a backup.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <PrimaryButton
            title="Sign Out"
            onPress={handleSignOut}
            variant="danger"
          />
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
    marginBottom: 24,
    color: "#11181C",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#11181C",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: "#687076",
    marginBottom: 16,
  },
  infoBox: {
    padding: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: "#687076",
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  value: {
    fontSize: 16,
    color: "#11181C",
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 14,
    marginTop: 8,
    marginBottom: 8,
  },
  warningBox: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#fff7ed",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  warningText: {
    fontSize: 14,
    color: "#11181C",
    lineHeight: 20,
  },
});