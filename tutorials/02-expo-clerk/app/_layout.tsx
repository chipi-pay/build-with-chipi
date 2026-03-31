import { ChipiProvider } from "@chipi-stack/chipi-expo";
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { Stack } from "expo-router";

const CHIPI_API_PUBLIC_KEY = process.env.EXPO_PUBLIC_CHIPI_API_PUBLIC_KEY;
const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!CHIPI_API_PUBLIC_KEY) throw new Error("EXPO_PUBLIC_CHIPI_API_PUBLIC_KEY is not set");
if (!CLERK_PUBLISHABLE_KEY) throw new Error("EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not set");

export default function RootLayout() {
  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      <ChipiProvider
        config={{
          apiPublicKey: CHIPI_API_PUBLIC_KEY,
        }}
      >
        <Stack>
          <Stack.Screen name="index" options={{ title: "Home" }} />
          <Stack.Screen name="create-wallet" options={{ title: "Create Wallet" }} />
          <Stack.Screen name="wallet" options={{ title: "My Wallet" }} />
          <Stack.Screen name="transfer" options={{ title: "Transfer" }} />
          <Stack.Screen name="transactions" options={{ title: "Transactions" }} />
          <Stack.Screen name="migrate-passkey" options={{ title: "Migrate to Passkey" }} />
        </Stack>
      </ChipiProvider>
    </ClerkProvider>
  );
}