Docs pages to follow (in order)
https://docs.chipipay.com/sdk/expo/use-biometrics
- content 

Expo Guides
Use Biometrics as a PIN
Learn how to implement biometric authentication as a PIN alternative in your Expo app

​
Overview
Biometric authentication provides a secure and convenient way for users to authenticate without remembering PINs or passwords. The Chipi SDK supports fingerprint and face recognition on compatible devices.
​
Prerequisites
Expo SDK 55 or later
Chipi SDK installed and configured
Device with biometric capabilities (fingerprint sensor or face recognition)
​
Installation
First, install the required dependencies:
npx expo install expo-local-authentication
​
Basic Implementation
This is the minimal configuration required to enroll in and use biometrics instead of a PIN to sign transactions.
1
Register biometrics along with the PIN

await SecureStore.setItemAsync("wallet_pin", pin, {
 requireAuthentication: true,     
});
2
Read the PIN to trigger the biometric prompt

    import { useTransfer } from "@chipi-stack/chipi-expo";
    import { ChainToken } from "@chipi-stack/chipi-expo";
    
    const storedWallet = await SecureStore.getItemAsync("wallet");
    const pin = await SecureStore.getItemAsync("wallet_pin",{
      requireAuthentication: true,
    });

    const token = await getToken();
    if (!token) {
      setError("No bearer token found");
      return;
    }

    const transferResponse = await transferAsync({
      params: {
        encryptKey: pin,
        wallet: JSON.parse(storedWallet),
        token: ChainToken.USDC,
        recipient: recipientAddress,
        amount: Number(amount),
      },
      bearerToken: token,
    });
​
Example
Here’s a simple example of how to implement a secure transfer flow using biometric authentication:
Create Wallet Component
Send Token with Biometric
To use biometrics for authentication, you first need to create and securely store a wallet with a PIN (which can be protected by biometrics). Here’s an example wallet creation screen using the useCreateWallet hook:
// Create Wallet Screen with biometric authentication

import { useCreateWallet } from '@chipi-stack/chipi-expo';
import { useAuth, useUser } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import { StyleSheet, Text, View, Alert, Linking } from 'react-native';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SimpleInput } from '@/components/ui/SimpleInput';

export const CreateWalletView = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState('');
  const { createWalletAsync, isLoading } = useCreateWallet();
  const [walletData, setWalletData] = useState<any>(null);

  const handleCreateWallet = async () => {
    try {
      setError('');
      const token = await getToken();
      if (!token) {
        setError('No bearer token found');
        return;
      }

      const result = await createWalletAsync({
        params: {
          encryptKey: pin,
          externalUserId: user?.id || '',
        },
        bearerToken: token,
      });

      // Save wallet data to local storage, protected by biometrics
      await SecureStore.setItemAsync('wallet', JSON.stringify(result.wallet));
      await SecureStore.setItemAsync('wallet_pin', pin, {
        requireAuthentication: true,
      });

      setWalletData(result);
      Alert.alert('Success', 'Wallet successfully created!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError('Error creating wallet: ' + errorMessage);
    }
  };

  const openStarkscan = (address: string) => {
    const url = `https://starkscan.co/contract/${address}`;
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create New Wallet</Text>
      <Text style={styles.subtitle}>Set a PIN to secure your wallet</Text>

      <SimpleInput
        placeholder="Enter your PIN (min 4 digits)"
        value={pin}
        onChangeText={setPin}
        keyboardType="numeric"
        maxLength={6}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <PrimaryButton
        title={isLoading ? 'Creating...' : 'Create Wallet'}
        active={pin.length >= 4 && !isLoading}
        onPress={handleCreateWallet}
      />

      {walletData && (
        <View style={styles.walletDetails}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>Wallet Details</Text>
            <Text
              style={styles.viewContract}
              onPress={() => openStarkscan(walletData.publicKey)}>
              View Contract →
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Address:</Text>
            <Text style={styles.detailValue} numberOfLines={2}>
              {walletData.publicKey}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#11181C',
  },
  subtitle: {
    fontSize: 16,
    color: '#687076',
    marginBottom: 24,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginTop: 8,
  },
  walletDetails: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#11181C',
  },
  viewContract: {
    fontSize: 14,
    color: '#0a7ea4',
    fontWeight: '600',
  },
  detailItem: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#687076',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#11181C',
    fontFamily: 'monospace',
  },
});
​
Useful resources
Making an EAS Build in Expo
​
Next Steps
Now that you have biometric authentication working, you can:
Integrate it with other Chipi SDK features
Add biometric authentication to wallet operations
Implement multi-factor authentication combining biometrics and PINs
Add biometric authentication to transaction signing
For more information, check out the Expo Local Authentication documentation.
Was this page helpful?


Yes

No
Expo with Custom Auth
Use Passkeys (Biometrics) as a PIN



 ----------------------------------------------------------


https://docs.chipipay.com/sdk/expo/use-passkeys

Expo Guides
Use Passkeys (Biometrics) as a PIN
Secure wallet authentication with Face ID / Touch ID on iOS and fingerprint on Android — no PIN required.

​
Overview
On mobile, passkeys work differently from browsers. Instead of WebAuthn, the Chipi Expo SDK uses:
expo-local-authentication — Face ID, Touch ID, and fingerprint gate
expo-secure-store — iOS Keychain / Android Keystore for protected key storage
When you set usePasskey: true, the SDK automatically generates a random encryption key, stores it in the device’s secure enclave, and gates it behind biometric authentication. The user just taps “Create Wallet” and scans their face or fingerprint — no PIN to remember.
This is a native mobile implementation. For browser (Next.js / React), see Use Passkeys (React) which uses WebAuthn instead.
​
Prerequisites
Expo SDK 55 or later
A physical iOS or Android device with biometrics enrolled (Face ID, Touch ID, or fingerprint)
A development build — biometrics are not supported in Expo Go
The iOS Simulator does not support biometric authentication. You must test on a real device or configure the simulator to use device passcode fallback.
​
Installation
npx expo install expo-local-authentication expo-secure-store
​
Configuration
Add the expo-local-authentication plugin to your app.json to request Face ID permission on iOS:
{
  "expo": {
    "plugins": [
      [
        "expo-local-authentication",
        {
          "faceIDPermission": "Allow $(PRODUCT_NAME) to use Face ID to secure your wallet."
        }
      ]
    ]
  }
}
If you skip faceIDPermission, Apple will reject your app during review and Face ID will fall back to device passcode on iOS without an explanation to the user.
After updating app.json, rebuild your development client:
npx expo run:ios
# or
npx expo run:android
​
Usage
​
Create a wallet with biometric passkey
Pass usePasskey: true and an externalUserId — the SDK handles everything else:
import { useCreateWallet } from '@chipi-stack/chipi-expo';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '@clerk/clerk-expo';

export function CreateWalletScreen() {
  const { getToken, userId } = useAuth();
  const { createWalletAsync, isLoading, error } = useCreateWallet();

  const handleCreateWallet = async () => {
    const token = await getToken();
    if (!token || !userId) return;

    // Face ID / Touch ID prompt is shown automatically
    const result = await createWalletAsync({
      params: {
        usePasskey: true,
        externalUserId: userId,
      },
      bearerToken: token,
    });

    // Persist the wallet (no PIN to store — biometrics handle auth)
    await SecureStore.setItemAsync('wallet', JSON.stringify(result.wallet));
  };

  return (/* your UI */);
}
​
Sign a transaction (retrieve the key with biometrics)
When you need the encryption key later (e.g. to sign a transfer), retrieve it from secure storage — this automatically triggers the Face ID / Touch ID prompt:
import { useTransfer, getNativeWalletEncryptKey, ChainToken } from '@chipi-stack/chipi-expo';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '@clerk/clerk-expo';

export function TransferScreen() {
  const { getToken, userId } = useAuth();
  const { transferAsync, isLoading } = useTransfer();

  const handleTransfer = async () => {
    const token = await getToken();
    if (!token || !userId) return;

    // Triggers Face ID / Touch ID automatically
    const encryptKey = await getNativeWalletEncryptKey(userId);
    if (!encryptKey) throw new Error('No wallet key found. Please re-create your wallet.');

    const storedWallet = await SecureStore.getItemAsync('wallet');
    if (!storedWallet) throw new Error('No wallet found.');

    await transferAsync({
      params: {
        encryptKey,
        wallet: JSON.parse(storedWallet),
        token: ChainToken.USDC,
        recipient: '0x...',
        amount: 1.0,
      },
      bearerToken: token,
    });
  };

  return (/* your UI */);
}
​
Use usePasskey: true directly in transaction hooks
useTransfer, useApprove, and useCallAnyContract now use the Expo native passkey adapter automatically when wrapped with @chipi-stack/chipi-expo’s ChipiProvider.
When you pass usePasskey: true to those hooks, also pass externalUserId (usually your auth provider user id), so the SDK can fetch the correct key from secure storage:
await transferAsync({
  params: {
    wallet,
    token: ChainToken.USDC,
    recipient: "0x...",
    amount: 1,
    usePasskey: true,
    externalUserId: userId,
  },
  bearerToken: token,
});
​
Migrate an existing PIN wallet to biometrics
If your users already have a PIN-based wallet, migrate them with one call:
import { useMigrateWalletToPasskey } from '@chipi-stack/chipi-expo';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '@clerk/clerk-expo';

export function MigrateScreen({ currentPin }: { currentPin: string }) {
  const { getToken, userId } = useAuth();
  const { migrateWalletToPasskeyAsync, isLoading, error } = useMigrateWalletToPasskey();

  const handleMigrate = async () => {
    const token = await getToken();
    const storedWallet = await SecureStore.getItemAsync('wallet');
    if (!token || !userId || !storedWallet) return;

    // Face ID / Touch ID prompt is shown during migration
    const result = await migrateWalletToPasskeyAsync({
      wallet: JSON.parse(storedWallet),
      oldEncryptKey: currentPin,
      externalUserId: userId,
      bearerToken: token,
    });

    // Replace the stored wallet with the re-encrypted version
    await SecureStore.setItemAsync('wallet', JSON.stringify(result.wallet));
    // currentPin no longer works — biometrics are now required
  };

  return (/* your UI */);
}
After migration, the old PIN (oldEncryptKey) will no longer decrypt the wallet. Store the updated wallet object returned by migrateWalletToPasskeyAsync immediately.
​
Full Example
Create Wallet
Transfer with Biometrics
import { useCreateWallet } from '@chipi-stack/chipi-expo';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '@clerk/clerk-expo';
import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';

export function CreateWalletWithPasskey() {
  const { getToken, userId } = useAuth();
  const { createWalletAsync, isLoading, error } = useCreateWallet();
  const [wallet, setWallet] = useState(null);

  const handleCreate = async () => {
    try {
      const token = await getToken();
      if (!token || !userId) {
        Alert.alert('Error', 'No auth token or user ID found.');
        return;
      }

      // Face ID / Touch ID prompt shown automatically
      const result = await createWalletAsync({
        params: {
          usePasskey: true,
          externalUserId: userId,
        },
        bearerToken: token,
      });

      await SecureStore.setItemAsync('wallet', JSON.stringify(result.wallet));
      setWallet(result.wallet);
      Alert.alert('Success', 'Wallet created and secured with biometrics!');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Wallet</Text>
      <Text style={styles.subtitle}>Secured with Face ID / Touch ID — no PIN needed</Text>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleCreate}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Creating...' : 'Create Wallet with Biometrics'}
        </Text>
      </TouchableOpacity>

      {error && <Text style={styles.error}>{error.message}</Text>}
      {wallet && (
        <Text style={styles.address} numberOfLines={2}>
          {wallet.accountAddress}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: '#687076', marginBottom: 24 },
  button: { backgroundColor: '#007AFF', borderRadius: 8, padding: 16, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  error: { color: '#ff3b30', marginTop: 12 },
  address: { fontFamily: 'monospace', fontSize: 12, marginTop: 16, color: '#333' },
});
​
How it Works
Step	What happens
Wallet creation	SDK generates a random 32-byte key, prompts Face ID / Touch ID, stores key in iOS Keychain / Android Keystore with biometric protection
Wallet use	getNativeWalletEncryptKey(userId) retrieves the key — this automatically triggers the biometric prompt
Migration	Old PIN decrypts the private key, new biometric key re-encrypts it
​
Security Notes
The encryption key is stored in the device’s secure enclave (iOS Keychain / Android Keystore)
requireAuthentication: true means the key cannot be read without biometric approval
The key never leaves the device
If the user uninstalls the app or re-installs it, the key is lost — ensure your users understand wallet recovery options
​
Utilities Reference
Export	Description
isNativeBiometricSupported()	Check if the device has enrolled biometrics
createNativeWalletPasskey(userId, userName)	Manually create a passkey (called by useCreateWallet internally)
getNativeWalletEncryptKey(userId)	Retrieve the stored key (triggers biometric prompt)
hasNativeWalletPasskey()	Check if a passkey was already created on this device
removeNativeWalletPasskey(userId)	Delete the stored key (destructive — use with caution)
getNativeWalletCredential()	Get credential metadata (credentialId, userId, createdAt)
​
Related
Use Biometrics as a PIN — Manual approach storing your own PIN with biometric protection
useCreateWallet
useMigrateWalletToPasskey
Was this page helpful?


Yes

No
Use Biometrics as a PIN
useChipiWallet





 ----------------------------------------------------------



https://docs.chipipay.com/sdk/expo/hooks/use-create-wallet


useCreateWallet
Creates a new Argent-compatible wallet on StarkNet. This hook deploys the wallet contract behind the scenes and uses Avnus gasless to sponsor gas fees, resulting in a frictionless onboarding experience.

​
Usage
const { createWalletAsync, data, isLoading, error } = useCreateWallet();
​
Parameters
The mutation accepts an object with:
params (CreateWalletParams):
encryptKey (string): PIN or passkey-derived key used to encrypt the private key
externalUserId (string): Your application’s unique identifier for the user
chain (Chain): The blockchain network. Use Chain.STARKNET
walletType ("CHIPI" | "READY", optional): "CHIPI" supports session keys; "READY" is Argent X compatible. Defaults to "CHIPI"
usePasskey (boolean, optional): Set true when encryptKey was derived from a passkey (via @chipi-stack/chipi-passkey)
bearerToken (string): Bearer token for authentication
​
Return Value
Returns an object containing:
createWallet: Function to trigger wallet creation (fire-and-forget)
createWalletAsync: Promise-based function that resolves with the wallet data
data: The created wallet (CreateWalletResponse) — flat object with publicKey, encryptedPrivateKey, walletType, chain, etc.
isLoading: Boolean indicating if the operation is in progress
isError: Boolean indicating if an error occurred
error: Error instance when isError is true, otherwise null
isSuccess: Boolean indicating if wallet creation succeeded
reset: Function to reset the mutation state
​
Example Implementation
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useCreateWallet, Chain } from "@chipi-stack/nextjs";

export function CreateWallet() {
  const { userId, getToken } = useAuth();
  const {
    createWalletAsync,
    data,
    isLoading,
    error
  } = useCreateWallet();

  const [pin, setPin] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const bearerToken = await getToken();
    if (!bearerToken || !userId) {
      console.error('No bearer token or user ID available');
      return;
    }
    try {
      const wallet = await createWalletAsync({
        params: {
          encryptKey: pin,
          externalUserId: userId,
          chain: Chain.STARKNET,
          walletType: "CHIPI", // supports session keys
        },
        bearerToken,
      });
      alert('Wallet created successfully!');
    } catch (err) {
      console.error('Wallet creation failed:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Create New Wallet</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Set PIN Code
          </label>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            required
            minLength={4}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
        >
          {isLoading ? 'Creating...' : 'Create Wallet'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
          Error: {error.message}
        </div>
      )}

      {data && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Wallet Details</h3>
            <a
              href={`https://starkscan.co/contract/${data.publicKey}`}
              target="_blank"
              rel="noopener"
              className="text-green-600 hover:text-green-800 text-sm flex items-center gap-1"
            >
              View Contract
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Address:</span>
              <span className="ml-2 font-mono break-all">
                {data.publicKey}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
​
Security Considerations
PINs should always be collected client-side
Never log or store raw PIN values
Use secure encryption before any transmission
Store encrypted private key securely
Associate with user session (not persistent storage)
​
Error Handling
Catch and handle RPC connection errors
Monitor gasless API limits
Implement retry logic for failed deployments
Wallet creation is free! Gas fees are covered by our gasless integration.
Was this page helpful?


Yes

No
useChipiSession
useGetWallet


 ----------------------------------------------------------

https://docs.chipipay.com/sdk/expo/hooks/use-get-wallet


SDK Hooks
useGetWallet
Get an authenticated user Wallet

​
Usage
const { fetchWallet, data, isLoading, error } = useGetWallet();
​
Parameters
params (GetWalletParams):
externalUserId (string): User ID from your auth provider
getBearerToken (() => Promise<string>): Function returning the auth token
queryOptions (UseQueryOptions, optional): React Query options (e.g. enabled)
​
Return Value
Returns an object containing:
fetchWallet: Function to manually fetch wallet data with custom params
data: The wallet object (publicKey, encryptedPrivateKey, walletType, etc.)
isLoading: Boolean indicating if the operation is in progress
isError: Boolean indicating if an error occurred
isSuccess: Boolean indicating if the query succeeded
error: Any error that occurred during the process
refetch: Function to re-run the query
​
Example Implementation
import { useGetWallet } from "@chipi-stack/chipi-react";
import { useAuth } from "@clerk/nextjs";

export function WalletPage(){
  const { userId, getToken } = useAuth();

  const { data: wallet, isLoading, error, fetchWallet } = useGetWallet({
    params: {
      externalUserId: userId || "",
    },
    getBearerToken: async () => {
      const token = await getToken();
      if (!token) throw new Error("No token found");
      return token;
    },
    queryOptions: {
      enabled: Boolean(userId),
    },
  });

  // Or use fetchWallet manually:
  const loadWallet = async () => {
    if (!userId) return;
    try {
      const token = await getToken();
      if (!token) throw new Error("No token found");

      const wallet = await fetchWallet({
        params: {
          externalUserId: userId,
        },
        getBearerToken: async () => token,
      });

      console.log("Wallet loaded:", wallet);
    } catch (error) {
      console.error("Error loading wallet:", error);
    }
  };

  return (
    <div>
      {isLoading && <p>Loading wallet...</p>}
      {error && <p>Error: {error.message}</p>}
      {wallet && (
        <div>
          <p>Public Key: {wallet.publicKey}</p>
          <p>Normalized Public Key: {wallet.normalizedPublicKey}</p>
        </div>
      )}
    </div>
  );
}
Chipi never stores your decrypted sensitive data. All private keys and authentication tokens remain secure and are never accessible to Chipi servers.
Was this page helpful?


Yes

No
useCreateWallet
useApprove



 ----------------------------------------------------------


https://docs.chipipay.com/sdk/expo/hooks/use-get-token-balance



 ----------------------------------------------------------
https://docs.chipipay.com/sdk/expo/hooks/use-chipi-wallet

useChipiWallet
All-in-one hook for wallet management - combines wallet fetching, creation, and balance checking into a single unified API.

​
Overview
useChipiWallet is a convenience hook that simplifies wallet management by combining multiple operations into one:
Wallet fetching (replaces useGetWallet)
Wallet creation (replaces useCreateWallet)
Balance checking (replaces useGetTokenBalance)
Use this hook when you want a streamlined API. Use the individual hooks (useGetWallet, useCreateWallet, useGetTokenBalance) when you need more granular control.
​
Quick Start
import { useChipiWallet } from "@chipi-stack/chipi-expo";

function WalletComponent() {
  const { userId, getToken } = useYourAuthProvider(); // Clerk, Firebase, etc.
  
  const {
    wallet,
    hasWallet,
    balance,
    formattedBalance,
    createWallet,
    isCreating,
    isLoadingWallet,
  } = useChipiWallet({
    externalUserId: userId,
    getBearerToken: getToken,
  });

  if (isLoadingWallet) return <Text>Loading...</Text>;

  if (!hasWallet) {
    return (
      <Button 
        title={isCreating ? "Creating..." : "Create Wallet"}
        onPress={() => createWallet({ encryptKey: "1234" })}
        disabled={isCreating}
      />
    );
  }

  return (
    <View>
      <Text>Address: {wallet?.shortAddress}</Text>
      <Text>Balance: ${formattedBalance} USDC</Text>
    </View>
  );
}
​
Configuration Options
interface UseChipiWalletConfig {
  // Required
  externalUserId: string | null | undefined;
  getBearerToken: () => Promise<string | null | undefined>;
  
  // Optional
  defaultToken?: ChainToken;  // Default: "USDC"
  enabled?: boolean;          // Default: true
}
Option	Type	Default	Description
externalUserId	string | null	Required	User ID from your auth provider
getBearerToken	() => Promise<string>	Required	Function to get the auth token
defaultToken	ChainToken	"USDC"	Token to fetch balance for
enabled	boolean	true	Whether to fetch wallet on mount
​
Return Values
​
Wallet Data
Property	Type	Description
wallet	ChipiWalletData | null | undefined	Wallet data with computed properties
hasWallet	boolean	Whether the user has a wallet
isLoadingWallet	boolean	Wallet fetch loading state
walletError	Error | null	Any error from fetching
​
Balance Data
Property	Type	Description
balance	GetTokenBalanceResponse | undefined	Raw balance data
formattedBalance	string	Formatted balance (e.g., “1,234.56”)
isLoadingBalance	boolean	Balance fetch loading state
​
Create Wallet
Property	Type	Description
createWallet	(params) => Promise<CreateWalletResponse>	Create a new wallet
isCreating	boolean	Creation loading state
createdWallet	CreateWalletResponse | undefined	Last created wallet data
​
Actions
Method	Description
refetchWallet()	Refetch wallet data
refetchBalance()	Refetch balance data
refetchAll()	Refetch both wallet and balance
​
Computed Wallet Properties
The wallet object includes these computed properties:
interface ChipiWalletData extends GetWalletResponse {
  supportsSessionKeys: boolean;  // true for CHIPI wallets
  shortAddress: string;          // Truncated address for display
}
​
Example with Clerk Authentication
import { useState } from "react";
import { useAuth } from "@clerk/clerk-expo";
import { useChipiWallet } from "@chipi-stack/chipi-expo";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";

export function WalletDashboard() {
  const { userId, getToken } = useAuth();
  const [pin, setPin] = useState("");
  
  const {
    wallet,
    hasWallet,
    formattedBalance,
    createWallet,
    isCreating,
    isLoadingWallet,
    refetchAll,
  } = useChipiWallet({
    externalUserId: userId,
    getBearerToken: getToken,
  });

  const handleCreateWallet = async () => {
    if (!pin || pin.length < 4) {
      Alert.alert("Error", "Please enter a 4-digit PIN");
      return;
    }
    
    try {
      const result = await createWallet({
        encryptKey: pin,
        walletType: "CHIPI",
      });
      Alert.alert("Success", `Wallet created! Address: ${result.publicKey}`);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to create wallet");
    }
  };

  if (isLoadingWallet) {
    return <ActivityIndicator size="large" />;
  }

  if (!hasWallet) {
    return (
      <View style={{ padding: 20, gap: 16 }}>
        <TextInput
          secureTextEntry
          placeholder="Enter 4-digit PIN"
          value={pin}
          onChangeText={setPin}
          maxLength={4}
          keyboardType="numeric"
          style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
        />
        <TouchableOpacity 
          onPress={handleCreateWallet}
          disabled={isCreating}
          style={{ backgroundColor: '#007AFF', padding: 16, borderRadius: 8 }}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>
            {isCreating ? "Creating..." : "Create Wallet"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ padding: 20, gap: 16 }}>
      <Text>Address: {wallet?.shortAddress}</Text>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
        ${formattedBalance} USDC
      </Text>
      <Text>Sessions: {wallet?.supportsSessionKeys ? "✓ Supported" : "✗ Not Supported"}</Text>
      <TouchableOpacity onPress={() => refetchAll()}>
        <Text>Refresh</Text>
      </TouchableOpacity>
    </View>
  );
}
​
Wallet Types
Type	Session Keys	Description
CHIPI	✅ Yes	OpenZeppelin account with SNIP-9 session key support
READY	❌ No	Argent X compatible wallet
// Create a CHIPI wallet (supports session keys)
await createWallet({
  encryptKey: pin,
  walletType: "CHIPI"
});

// Create a READY wallet (no session keys)
await createWallet({
  encryptKey: pin,
  walletType: "READY"
});
​
Migration from Individual Hooks
​
Before
const { data: wallet, isLoading } = useGetWallet({
  params: { externalUserId: userId },
  getBearerToken: getToken,
  enabled: !!userId,
});

const { createWalletAsync } = useCreateWallet();

const { data: balance } = useGetTokenBalance({
  params: { walletPublicKey: wallet?.publicKey, ... },
  getBearerToken: getToken,
  enabled: !!wallet?.publicKey,
});
​
After
const {
  wallet,
  hasWallet,
  balance,
  formattedBalance,
  createWallet,
  isLoadingWallet,
} = useChipiWallet({
  externalUserId: userId,
  getBearerToken: getToken,
});
useChipiWallet automatically handles the dependency chain - it only fetches balance after the wallet is loaded.
Was this page helpful?


Yes

No
Use Passkeys (Biometrics) as a PIN
useChipiSession

 ----------------------------------------------------------


https://docs.chipipay.com/sdk/expo/hooks/use-transfer


SDK Hooks
useTransfer
Transfers tokens from the user wallet to another address. Uses Avnus gasless to cover gas fees.

​
Usage
const {
  transfer,
  transferAsync,
  data,
  isLoading,
  isError,
  error,
  isSuccess,
  reset,
} = useTransfer();
​
Parameters
transfer / transferAsync both accept an object with:
params (TransferHookInput):
encryptKey (string): PIN used to decrypt the private key.
wallet (WalletData): Object with publicKey and encryptedPrivateKey.
token (ChainToken): Token identifier (e.g. ChainToken.USDC).
usePasskey (boolean, optional): When true, the hook authenticates with passkey internally (requires externalUserId). Do not use with external setupPasskey/authenticate calls.
otherToken (optional): Custom token configuration with:
contractAddress (string): ERC-20 token contract address.
decimals (number): Token decimals.
recipient (string): Destination wallet address.
amount (number): Transfer amount (will be converted to a string internally).
bearerToken (string): Bearer token for authentication (e.g. from your auth provider).
​
Return Value
Returns an object containing:
transfer: Function to trigger the transfer (fire-and-forget style).
transferAsync: Promise-based function that resolves with the transaction hash.
data: Transaction hash of the transfer (string | undefined).
isLoading: Boolean indicating if the operation is in progress.
isError: Boolean indicating if an error occurred.
error: Error instance when isError is true, otherwise null.
isSuccess: Boolean indicating if the transfer completed successfully.
reset: Function to reset the mutation state.
​
Example Implementation
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useTransfer, ChainToken } from "@chipi-stack/chipi-react";

export function TransferForm() {
  const { getToken } = useAuth();
  const { transferAsync, data, isLoading, isError, error } = useTransfer();
  const [form, setForm] = useState({
    pin: '',
    recipient: '',
    amount: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const bearerToken = await getToken();

    if (!bearerToken) {
      console.error('No bearer token available');
      return;
    }

    try {
      await transferAsync({
        params: {
          amount: Number(form.amount),
          encryptKey: form.pin,
          wallet: {
            publicKey: "0x123...yourPublicKeyHere",
            encryptedPrivateKey: "encrypted:key:data"
          },
          token: ChainToken.USDC,
          recipient: form.recipient
        },
        bearerToken,
      });
    } catch (err) {
      console.error('Transfer failed:', err);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Transfer Tokens</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Security PIN</label>
          <input
            type="password"
            value={form.pin}
            onChange={(e) => setForm({...form, pin: e.target.value})}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Recipient Address</label>
          <input
            type="text"
            value={form.recipient}
            onChange={(e) => setForm({...form, recipient: e.target.value})}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Amount</label>
          <input
            type="number"
            step="0.000001"
            value={form.amount}
            onChange={(e) => setForm({...form, amount: e.target.value})}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
        >
          {isLoading ? 'Processing...' : 'Transfer'}
        </button>
      </form>

      {data && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm font-mono break-all">
            TX Hash: {data}
          </p>
        </div>
      )}

      {isError && error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
          Error: {error.message}
        </div>
      )}
    </div>
  );
}
​
Security Considerations
Always verify recipient addresses
Use encrypted private keys
Implement proper PIN validation
Monitor transaction status
​
Error Handling
Handle insufficient token balance
Validate wallet addresses
Monitor gas fees
Implement retry logic for failed transactions
Always verify recipient addresses. Transfers on StarkNet are irreversible.
​
Related Hooks
useApprove - Required before transferring new token types
useCallAnyContract - For custom contract interactions
Was this page helpful?


Yes

No
useApprove
useCallAnyContract



 ----------------------------------------------------------


https://docs.chipipay.com/sdk/expo/hooks  use-get-transaction-list


SDK Hooks
useGetTransactionList
Fetches a paginated list of transactions with optional date and address filters.

​
Usage
const {
  data,
  isLoading,
  isError,
  isSuccess,
  error,
  refetch,
  fetchTransactionList,
} = useGetTransactionList({
  query: {
    page: 1,
    limit: 10,
    walletAddress: "0x...",
  },
  getBearerToken: getToken,
});
​
Input Parameters
Parameter	Type	Required	Description
query.page	number	No	Page number (default: 1)
query.limit	number	No	Results per page (default: 10)
query.walletAddress	string	No	Filter by wallet address
query.calledFunction	string	No	Filter by contract function name
query.day	number	No	Filter by day (1–31)
query.month	number	No	Filter by month (1–12)
query.year	number	No	Filter by year
getBearerToken	() => Promise<string>	Yes	Function returning the auth token
queryOptions	UseQueryOptions	No	React Query options (e.g. staleTime, enabled)
​
Return Value
Property	Type	Description
data	PaginatedResponse<Transaction> | undefined	Paginated transaction results
isLoading	boolean	True while fetching
isError	boolean	True if an error occurred
isSuccess	boolean	True if the query succeeded
error	Error | null	Error when isError is true
refetch	() => void	Re-run the query
fetchTransactionList	(input) => Promise<PaginatedResponse<Transaction>>	Imperatively fetch with custom params
​
Example Implementation
import { useGetTransactionList } from "@chipi-stack/chipi-react";
import { useAuth } from "@clerk/nextjs";
import { useState } from "react";

export function TransactionList({ walletAddress }: { walletAddress: string }) {
  const { getToken } = useAuth();
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useGetTransactionList({
    query: {
      page,
      limit: 10,
      walletAddress,
    },
    getBearerToken: getToken,
  });

  if (isLoading) return <p>Loading transactions...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <ul>
        {data?.data.map((tx) => (
          <li key={tx.id}>
            {tx.transactionHash} — {tx.status}
          </li>
        ))}
      </ul>
      <div>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
          Previous
        </button>
        <span>Page {page}</span>
        <button onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  );
}
Was this page helpful?


Yes

No
useGetTokenBalance
useGetTransaction
x
github
linkedin
Powered by



----------------------------------------------------------



https://docs.chipipay.com/sdk/expo/hooks/use-migrate-wallet-to-passkey


SDK Hooks
useMigrateWalletToPasskey
Migrates an existing PIN-encrypted wallet to passkey (biometric) authentication.

​
Usage
const {
  migrateWalletToPasskey,
  migrateWalletToPasskeyAsync,
  data,
  isLoading,
  isError,
  isSuccess,
  error,
  reset,
} = useMigrateWalletToPasskey();
​
Parameters
The mutation accepts an object with:
Parameter	Type	Required	Description
wallet	WalletData	Yes	The current wallet object (publicKey + encryptedPrivateKey)
oldEncryptKey	string	Yes	The user’s current PIN used to decrypt the wallet
externalUserId	string	Yes	Your app’s user ID — used as the passkey username
bearerToken	string	Yes	Auth token from your provider
​
Return Value
Property	Type	Description
migrateWalletToPasskey	(input) => void	Fire-and-forget migration
migrateWalletToPasskeyAsync	(input) => Promise<MigrateWalletToPasskeyResult>	Promise-based migration
data	MigrateWalletToPasskeyResult | undefined	Migration result
isLoading	boolean	True while migrating
isError	boolean	True if migration failed
isSuccess	boolean	True if migration succeeded
error	Error | null	Error details
reset	() => void	Reset mutation state
​
MigrateWalletToPasskeyResult
Property	Type	Description
success	boolean	Whether migration succeeded
wallet	WalletData	Updated wallet with new passkey-encrypted private key
credentialId	string	The passkey credential ID (store this for future auth)
​
How It Works
A new passkey is created in the browser/device (triggers biometric prompt)
The wallet’s private key is decrypted using oldEncryptKey (the PIN)
The private key is re-encrypted using the passkey-derived key
The updated wallet is returned — persist the new wallet object and credentialId
After migration, the old PIN (oldEncryptKey) will no longer work. Store the updated wallet object and credentialId securely.
​
Example Implementation
import { useMigrateWalletToPasskey } from "@chipi-stack/chipi-react";
import { useAuth } from "@clerk/nextjs";
import { useState } from "react";

export function MigrateToPasskey({ currentWallet, userId }: {
  currentWallet: WalletData;
  userId: string;
}) {
  const { getToken } = useAuth();
  const [currentPin, setCurrentPin] = useState("");
  const { migrateWalletToPasskeyAsync, isLoading, error } = useMigrateWalletToPasskey();

  const handleMigrate = async () => {
    const bearerToken = await getToken();
    if (!bearerToken) return;

    try {
      const result = await migrateWalletToPasskeyAsync({
        wallet: currentWallet,
        oldEncryptKey: currentPin,
        externalUserId: userId,
        bearerToken,
      });

      // Persist the updated wallet and credentialId
      localStorage.setItem("wallet", JSON.stringify(result.wallet));
      localStorage.setItem("passkeyCredentialId", result.credentialId);

      alert("Successfully migrated to passkey!");
    } catch (err) {
      console.error("Migration failed:", err);
    }
  };

  return (
    <div>
      <input
        type="password"
        placeholder="Current PIN"
        value={currentPin}
        onChange={(e) => setCurrentPin(e.target.value)}
      />
      <button onClick={handleMigrate} disabled={isLoading}>
        {isLoading ? "Migrating..." : "Migrate to Passkey"}
      </button>
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
​
Related
Use Passkeys Guide — Full passkey setup walkthrough
useCreateWallet — Create a wallet with passkey from the start (set usePasskey: true)
Was this page helpful?


Yes

No
useGetTransactionStatus
useUpdateWalletEncryption



----------------------------------------------------------


