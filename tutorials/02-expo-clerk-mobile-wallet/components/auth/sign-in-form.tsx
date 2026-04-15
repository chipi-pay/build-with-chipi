import { useSignIn, useSSO } from '@clerk/clerk-expo';
import * as Linking from 'expo-linking';
import { type Href, Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { MW_COLORS, MW_FONTS, MW_TYPE } from '@/constants/morgan-theme';

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
        <ActivityIndicator size="large" color={MW_COLORS.foreground} />
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
        placeholderTextColor={MW_COLORS.mutedForeground}
        onChangeText={setEmailAddress}
        keyboardType="email-address"
      />
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        placeholder="Enter password"
        placeholderTextColor={MW_COLORS.mutedForeground}
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
    fontSize: MW_TYPE.pageTitle,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: MW_FONTS.display,
    letterSpacing: -0.5,
  },
  body: { color: MW_COLORS.mutedForeground, fontFamily: MW_FONTS.body },
  label: {
    fontWeight: '600',
    fontSize: MW_TYPE.label,
    color: MW_COLORS.mutedForeground,
    fontFamily: MW_FONTS.bodySemi,
  },
  input: {
    borderWidth: 0,
    borderBottomWidth: 2,
    borderBottomColor: MW_COLORS.border,
    borderRadius: 0,
    paddingVertical: 12,
    paddingHorizontal: 0,
    fontSize: MW_TYPE.body,
    color: MW_COLORS.foreground,
    backgroundColor: MW_COLORS.background,
    fontFamily: MW_FONTS.body,
  },
  button: {
    backgroundColor: MW_COLORS.foreground,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 0,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 2,
    borderColor: MW_COLORS.foreground,
    minHeight: 48,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: MW_COLORS.accentForeground,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontFamily: MW_FONTS.mono,
    fontSize: MW_TYPE.label,
  },
  googleButton: {
    backgroundColor: MW_COLORS.background,
    borderWidth: 2,
    borderColor: MW_COLORS.foreground,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 0,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 48,
    justifyContent: 'center',
  },
  googleButtonText: {
    color: MW_COLORS.foreground,
    fontWeight: '700',
    fontFamily: MW_FONTS.bodySemi,
  },
  linkContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
    alignItems: 'center',
  },
  link: {
    color: MW_COLORS.foreground,
    fontWeight: '700',
    fontFamily: MW_FONTS.bodySemi,
    textDecorationLine: 'underline',
  },
  error: {
    color: MW_COLORS.foreground,
    fontSize: MW_TYPE.bodySm,
    marginTop: 4,
    fontStyle: 'italic',
    fontFamily: MW_FONTS.body,
    borderLeftWidth: 4,
    borderLeftColor: MW_COLORS.foreground,
    paddingLeft: 10,
  },
});
