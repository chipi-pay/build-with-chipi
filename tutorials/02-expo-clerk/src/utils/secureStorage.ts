import * as SecureStore from "expo-secure-store";

export async function getWalletStorage() {
  const stored = await SecureStore.getItemAsync("wallet");
  if (!stored) return null;
  return JSON.parse(stored);
}

export async function getPinStorage() {
  return await SecureStore.getItemAsync("wallet_pin");
}

export async function saveWalletStorage(wallet: any) {
  await SecureStore.setItemAsync("wallet", JSON.stringify(wallet));
}

export async function savePinStorage(pin: string, requireAuth = false) {
  await SecureStore.setItemAsync("wallet_pin", pin, {
    requireAuthentication: requireAuth,
  });
}

export async function clearWalletStorage() {
  await SecureStore.deleteItemAsync("wallet");
  await SecureStore.deleteItemAsync("wallet_pin");
}