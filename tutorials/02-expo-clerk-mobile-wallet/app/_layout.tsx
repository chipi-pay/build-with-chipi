import { DefaultTheme, ThemeProvider, type Theme } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { SourceSerif4_400Regular, SourceSerif4_600SemiBold } from '@expo-google-fonts/source-serif-4';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AppProviders } from '@/app/providers';
import { MW_COLORS } from '@/constants/morgan-theme';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(home)',
};

const navigationMonoLight: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: MW_COLORS.foreground,
    background: MW_COLORS.background,
    card: MW_COLORS.card,
    text: MW_COLORS.foreground,
    border: MW_COLORS.border,
    notification: MW_COLORS.foreground,
  },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_700Bold,
    SourceSerif4_400Regular,
    SourceSerif4_600SemiBold,
    JetBrainsMono_400Regular,
  });

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AppProviders>
      <ThemeProvider value={navigationMonoLight}>
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(home)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Morgan`s Wallet' }} />
        </Stack>
        <StatusBar style="dark" />
      </ThemeProvider>
    </AppProviders>
  );
}
