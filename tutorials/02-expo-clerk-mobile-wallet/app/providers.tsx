import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { ChipiProvider } from '@chipi-stack/chipi-expo';
import * as WebBrowser from 'expo-web-browser';
import { type ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

WebBrowser.maybeCompleteAuthSession();

const chipiPublicKey = process.env.EXPO_PUBLIC_CHIPI_API_PUBLIC_KEY;
const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!chipiPublicKey) {
  throw new Error('EXPO_PUBLIC_CHIPI_API_PUBLIC_KEY is not set');
}
if (!clerkPublishableKey) {
  throw new Error('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not set');
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider>
      <ClerkProvider publishableKey={clerkPublishableKey!} tokenCache={tokenCache}>
        <ChipiProvider config={{ apiPublicKey: chipiPublicKey! }}>{children}</ChipiProvider>
      </ClerkProvider>
    </SafeAreaProvider>
  );
}
