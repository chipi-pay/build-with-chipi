import { useSignUp } from '@clerk/clerk-expo';
import { type Href, Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { MW_COLORS, MW_FONTS, MW_TYPE } from '@/constants/morgan-theme';

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
        <ActivityIndicator size="large" color={MW_COLORS.foreground} />
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
            placeholderTextColor={MW_COLORS.mutedForeground}
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
    letterSpacing: 1,
    fontFamily: MW_FONTS.mono,
    fontSize: MW_TYPE.label,
    textTransform: 'uppercase',
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
