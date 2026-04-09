import { useSignUp } from '@clerk/clerk-expo';
import { type Href, Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { MW_COLORS, MW_RADIUS, MW_SHADOWS } from '@/constants/morgan-theme';

/**
 * Standalone sign-up form page component (email/password + email code verification).
 */
export function SignUpForm() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [awaitingEmailCode, setAwaitingEmailCode] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const finalizeIfComplete = async () => {
    if (!signUp || !setActive) return false;
    if (signUp.status !== 'complete' || !signUp.createdSessionId) return false;
    await setActive({ session: signUp.createdSessionId });
    router.push('/(home)' as Href);
    return true;
  };

  const handleStart = async () => {
    if (!signUp) return;
    setMessage(null);
    setFetching(true);
    try {
      await signUp.create({
        emailAddress: emailAddress.trim(),
        password,
      });
      if (await finalizeIfComplete()) return;
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setAwaitingEmailCode(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setFetching(false);
    }
  };

  const handleVerify = async () => {
    if (!signUp) return;
    setMessage(null);
    setFetching(true);
    try {
      await signUp.attemptEmailAddressVerification({ code: code.trim() });
      if (!(await finalizeIfComplete())) {
        setMessage(`Sign-up attempt not complete (status: ${String(signUp.status)})`);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setFetching(false);
    }
  };

  if (!isLoaded || !signUp) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={MW_COLORS.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{awaitingEmailCode ? 'Verify your email' : 'Sign up'}</Text>
      {awaitingEmailCode ? (
        <>
          <Text style={styles.body}>Enter the code sent to {emailAddress.trim()}.</Text>
          <TextInput
            style={styles.input}
            value={code}
            placeholder="123456"
            placeholderTextColor="#666666"
            onChangeText={setCode}
            keyboardType="number-pad"
          />
          <Pressable style={[styles.button, (!code || fetching) && styles.buttonDisabled]} onPress={handleVerify} disabled={!code || fetching}>
            <Text style={styles.buttonText}>{fetching ? 'Verifying…' : 'Verify and continue'}</Text>
          </Pressable>
        </>
      ) : (
        <>
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
            onPress={handleStart}
            disabled={!emailAddress || !password || fetching}>
            <Text style={styles.buttonText}>{fetching ? 'Loading…' : 'Continue'}</Text>
          </Pressable>
        </>
      )}
      {message ? <Text style={styles.error}>{message}</Text> : null}
      <View style={styles.linkContainer}>
        <Text style={styles.body}>Already have an account?</Text>
        <Link href="/(auth)/sign-in">
          <Text style={styles.link}>Sign in</Text>
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
