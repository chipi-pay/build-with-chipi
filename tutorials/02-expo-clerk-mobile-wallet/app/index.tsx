import { useAuth } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';

export default function IndexPage() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;
  return <Redirect href={isSignedIn ? '/(home)' : '/(auth)/sign-in'} />;
}
