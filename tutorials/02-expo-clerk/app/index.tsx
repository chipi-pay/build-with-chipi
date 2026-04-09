import { useAuth, useUser } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { SignInButton } from "@/components/ui/SignInButton";

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  if (isSignedIn) {
    return <Redirect href="/(tabs)/wallet" />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Chipi Wallet</Text>
        <Text style={styles.subtitle}>
          Secure mobile wallet with biometric authentication
        </Text>
        <SignInButton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    alignItems: "center",
    maxWidth: 400,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#11181C",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#687076",
    textAlign: "center",
    marginBottom: 32,
  },
});