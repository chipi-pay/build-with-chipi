import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useGetWallet } from "@chipi-stack/chipi-expo";
import { useEffect } from "react";

export default function HomeScreen() {
  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { getToken, userId } = useAuth();

  const { data: wallet, isLoading } = useGetWallet({
    params: {
      externalUserId: userId || "",
    },
    getBearerToken: async () => {
      const token = await getToken();
      if (!token) throw new Error("No token found");
      return token;
    },
    queryOptions: {
      enabled: Boolean(userId && isSignedIn),
    },
  });

  useEffect(() => {
    if (!isSignedIn) {
      // Sign in automatically for demo purposes
      // In production, implement proper sign-in UI
    }
  }, [isSignedIn]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chipi Expo Wallet</Text>
      <Text style={styles.subtitle}>with Clerk Auth & Passkeys</Text>

      {isSignedIn && user && (
        <View style={styles.userInfo}>
          <Text style={styles.userText}>
            {user.emailAddresses[0]?.emailAddress || user.id}
          </Text>
        </View>
      )}

      {!wallet ? (
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/create-wallet")}
        >
          <Text style={styles.buttonText}>Create Wallet</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.walletActions}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/wallet")}
          >
            <Text style={styles.buttonText}>View Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/transfer")}
          >
            <Text style={styles.buttonText}>Transfer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/transactions")}
          >
            <Text style={styles.buttonText}>Transactions</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/migrate-passkey")}
          >
            <Text style={styles.buttonText}>Migrate to Passkey</Text>
          </TouchableOpacity>
        </View>
      )}

      {isSignedIn && (
        <TouchableOpacity
          style={[styles.button, styles.signOutButton]}
          onPress={() => signOut()}
        >
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#11181C",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#687076",
    marginBottom: 32,
    textAlign: "center",
  },
  userInfo: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  userText: {
    fontSize: 14,
    color: "#11181C",
    textAlign: "center",
  },
  walletActions: {
    gap: 12,
  },
  button: {
    backgroundColor: "#0a7ea4",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  signOutButton: {
    backgroundColor: "#ff6b6b",
    marginTop: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#687076",
    textAlign: "center",
  },
});