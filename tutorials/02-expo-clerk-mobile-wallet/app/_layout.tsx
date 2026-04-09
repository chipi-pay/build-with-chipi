import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AppProviders } from '@/app/providers';

export const unstable_settings = {
  anchor: '(home)',
};

export default function RootLayout() {
  return (
    <AppProviders>
      <ThemeProvider value={DarkTheme}>
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(home)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Morgan`s Wallet' }} />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </AppProviders>
  );
}
