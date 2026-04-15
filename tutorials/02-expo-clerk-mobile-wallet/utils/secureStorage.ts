import * as SecureStore from 'expo-secure-store';

function walletKey(userId: string) {
  return `chipi_wallet_${userId}`;
}

function pinKey(userId: string) {
  return `chipi_wallet_pin_${userId}`;
}

export async function setWalletStorage(userId: string, walletJson: string) {
  await SecureStore.setItemAsync(walletKey(userId), walletJson);
}

export async function getWalletStorage(userId: string | null | undefined) {
  if (!userId) return null;
  return SecureStore.getItemAsync(walletKey(userId));
}

export async function setPinStorage(userId: string, pin: string) {
  await SecureStore.setItemAsync(pinKey(userId), pin, {
    requireAuthentication: true,
  });
}

export async function getPinStorage(userId: string | null | undefined) {
  if (!userId) return null;
  return SecureStore.getItemAsync(pinKey(userId), {
    requireAuthentication: true,
  });
}
