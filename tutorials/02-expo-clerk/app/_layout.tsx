import { ClerkProvider } from "@clerk/clerk-expo";
import { ChipiProvider } from "@chipi-stack/chipi-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { Stack } from "expo-router";

const CHIPI_API_PUBLIC_KEY = process.env.EXPO_PUBLIC_CHIPI_API_PUBLIC_KEY;
const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!CHIPI_API_PUBLIC_KEY) {
  throw new Error("EXPO_PUBLIC_CHIPI_API_PUBLIC_KEY is not set");
}

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not set");
}

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
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </ChipiProvider>
    </ClerkProvider>
  );
}