import { useAuth } from "@clerk/clerk-expo";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking } from "react-native";
import { useGetWallet, useGetTokenBalance, ChainToken, Chain } from "@chipi-stack/chipi-expo";
import { useRouter } from "expo-router";

export default function WalletScreen() {
  const { getToken, userId } = useAuth();
  const router = useRouter();

  const { data: wallet, isLoading: walletLoading } = useGetWallet({
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

  const { data: balance, isLoading: balanceLoading } = useGetTokenBalance({
    params: {
      chainToken: ChainToken.USDC,
      chain: Chain.STARKNET,
      walletPublicKey: wallet?.publicKey || "",
    },
    getBearerToken: async () => {
      const token = await getToken();
      if (!token) throw new Error("No token found");
      return token;
    },
    queryOptions: {
      enabled: Boolean(wallet?.publicKey),
    },
  });

  const openStarkscan = (address: string) => {
    const url = `https://starkscan.co/contract/${address}`;
    Linking.openURL(url);
  };

  if (walletLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text style={styles.loadingText}>Loading wallet...</Text>
      </View>
    );
  }

  if (!wallet) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No wallet found</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/create-wallet")}
        >
          <Text style={styles.buttonText}>Create Wallet</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Wallet</Text>

      <View style={styles.card}>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>USDC Balance</Text>
          {balanceLoading ? (
            <ActivityIndicator color="#0a7ea4" />
          ) : (
            <Text style={styles.balanceValue}>
              ${balance?.balance || "0.00"}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.detailHeader}>
          <Text style={styles.detailTitle}>Wallet Details</Text>
          <TouchableOpacity onPress={() => openStarkscan(wallet.publicKey)}>
            <Text style={styles.viewContract}>View on Starkscan →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Address:</Text>
          <Text style={styles.detailValue} numberOfLines={2}>
            {wallet.publicKey}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Type:</Text>
          <Text style={styles.detailValue}>{wallet.walletType}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/transfer")}
        >
          <Text style={styles.buttonText}>Send USDC</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/transactions")}
        >
          <Text style={styles.buttonText}>View Transactions</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    color: "#11181C",
  },
  card: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  balanceContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#687076",
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#11181C",
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#11181C",
  },
  viewContract: {
    fontSize: 14,
    color: "#0a7ea4",
    fontWeight: "600",
  },
  detailItem: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#687076",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: "#11181C",
    fontFamily: "monospace",
  },
  actions: {
    gap: 12,
    marginTop: 24,
  },
  button: {
    backgroundColor: "#0a7ea4",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#687076",
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#ff6b6b",
    textAlign: "center",
    marginBottom: 24,
  },
});