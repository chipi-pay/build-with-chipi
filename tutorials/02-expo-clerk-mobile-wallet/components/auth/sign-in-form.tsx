import { useSignIn, useSSO } from '@clerk/clerk-expo';
import * as Linking from 'expo-linking';
import { type Href, Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { MW_COLORS, MW_RADIUS, MW_SHADOWS } from '@/constants/morgan-theme';

/**
 * Standalone sign-in form page component (email/password + optional email code + Google OAuth).
 */
export function SignInForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { startSSOFlow } = useSSO(); // Google OAuth
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [fetching, setFetching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const finalizeIfComplete = async () => {
    if (!signIn || !setActive) return false;
    if (signIn.status !== 'complete' || !signIn.createdSessionId) return false;
    await setActive({ session: signIn.createdSessionId });
    router.push('/(home)' as Href);
    return true;
  };

  const handleSubmit = async () => {
    if (!signIn) return;
    setMessage(null);
    setFetching(true);
    try {
      await signIn.create({
        strategy: 'password',
        identifier: emailAddress.trim(),
        password,
      });

      if (await finalizeIfComplete()) return;

      setMessage(
        signIn.status === 'needs_second_factor'
          ? 'This account needs an extra sign-in step (MFA).'
          : `Sign-in attempt not complete (status: ${String(signIn.status)})`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setFetching(false);
    }
  };

  const handleGoogle = async () => {
    setMessage(null);
    setFetching(true);
    try {
      const { createdSessionId, setActive: ssoSetActive } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl: Linking.createURL('/'),
      });
      if (createdSessionId && ssoSetActive) {
        await ssoSetActive({ session: createdSessionId });
        router.push('/(home)' as Href);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setFetching(false);
    }
  };

  if (!isLoaded || !signIn) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={MW_COLORS.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in</Text>
      <Text style={styles.label}>Email address</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        value={emailAddress}
        placeholder="Enter email"
        placeholderTextColor="#666666"
        onChangeText={setEmailAddress}
        keyboardType="email-address"
      />
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        placeholder="Enter password"
        placeholderTextColor="#666666"
        secureTextEntry
        onChangeText={setPassword}
      />
      <Pressable
        style={[styles.button, (!emailAddress || !password || fetching) && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={!emailAddress || !password || fetching}>
        <Text style={styles.buttonText}>{fetching ? 'Loading…' : 'Continue'}</Text>
      </Pressable>
      <Pressable style={[styles.googleButton, fetching && styles.buttonDisabled]} onPress={handleGoogle} disabled={fetching}>
        <Text style={styles.googleButtonText}>Continue with Google</Text>
      </Pressable>
      {message ? <Text style={styles.error}>{message}</Text> : null}
      <View style={styles.linkContainer}>
        <Text style={styles.body}>Don&apos;t have an account?</Text>
        <Link href="/(auth)/sign-up">
          <Text style={styles.link}>Sign up</Text>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 12,
    backgroundColor: MW_COLORS.background,
  },
  title: {
    color: MW_COLORS.foreground,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  body: { color: MW_COLORS.muted },
  label: {
    fontWeight: '600',
    fontSize: 14,
    color: MW_COLORS.muted,
  },
  input: {
    borderWidth: 1,
    borderColor: MW_COLORS.border,
    borderRadius: MW_RADIUS.sm,
    padding: 12,
    fontSize: 16,
    color: MW_COLORS.foreground,
    backgroundColor: MW_COLORS.surface,
  },
  button: {
    backgroundColor: MW_COLORS.accentDeep,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: MW_RADIUS.pill,
    alignItems: 'center',
    marginTop: 8,
    ...MW_SHADOWS.orangeGlow,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: MW_COLORS.foreground,
    fontWeight: '700',
  },
  googleButton: {
    backgroundColor: MW_COLORS.surface,
    borderWidth: 1,
    borderColor: '#F7931A66',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: MW_RADIUS.pill,
    alignItems: 'center',
    marginTop: 8,
  },
  googleButtonText: { color: MW_COLORS.foreground, fontWeight: '700' },
  linkContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
    alignItems: 'center',
  },
  link: {
    color: MW_COLORS.accent,
    fontWeight: '700',
  },
  error: {
    color: MW_COLORS.danger,
    fontSize: 12,
    marginTop: 4,
  },
});
