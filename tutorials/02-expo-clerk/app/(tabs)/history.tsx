import { useAuth } from "@clerk/clerk-expo";
import { useGetTransactionList, useSyncOnChainTransfers } from "@chipi-stack/chipi-expo";
import * as SecureStore from "expo-secure-store";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

export default function HistoryScreen() {
  const { getToken } = useAuth();
  const [walletAddress, setWalletAddress] = useState("");
  const [page, setPage] = useState(1);
  const [syncing, setSyncing] = useState(false);

  const { syncOnChainTransfersAsync } = useSyncOnChainTransfers();

  const {
    data: transactions,
    isLoading,
    error,
    refetch,
  } = useGetTransactionList({
    query: {
      page,
      limit: 10,
      walletAddress,
    },
    getBearerToken: async () => {
      const token = await getToken();
      if (!token) throw new Error("No token");
      return token;
    },
    queryOptions: {
      enabled: Boolean(walletAddress),
    },
  });

  useEffect(() => {
    loadWalletAddress();
  }, []);

  const loadWalletAddress = async () => {
    const stored = await SecureStore.getItemAsync("wallet");
    if (stored) {
      const wallet = JSON.parse(stored);
      setWalletAddress(wallet.publicKey);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const token = await getToken();
      if (!token) throw new Error("No token");

      const stored = await SecureStore.getItemAsync("wallet");
      if (!stored) throw new Error("No wallet");

      const wallet = JSON.parse(stored);

      await syncOnChainTransfersAsync({
        params: {
          walletPublicKey: wallet.publicKey,
        },
        bearerToken: token,
      });

      await refetch();
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const formatAmount = (amount: string) => {
    try {
      const num = parseFloat(amount);
      return (num / Math.pow(10, 6)).toFixed(2);
    } catch {
      return amount;
    }
  };

  if (!walletAddress) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.emptyText}>
            Please create a wallet first
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
      }
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Transaction History</Text>
          <PrimaryButton
            title={syncing ? "Syncing..." : "Sync On-Chain"}
            onPress={handleSync}
            active={!syncing}
            variant="secondary"
          />
        </View>

        {isLoading && !transactions && (
          <ActivityIndicator size="large" color="#0a7ea4" />
        )}

        {error && (
          <Text style={styles.errorText}>
            Error: {error instanceof Error ? error.message : String(error)}
          </Text>
        )}

        {transactions?.data && transactions.data.length === 0 && (
          <Text style={styles.emptyText}>No transactions yet</Text>
        )}

        {transactions?.data?.map((tx: any) => (
          <View key={tx.id} style={styles.txCard}>
            <View style={styles.txHeader}>
              <Text style={styles.txFunction}>
                {tx.calledFunction || "Transfer"}
              </Text>
              <Text
                style={[
                  styles.txStatus,
                  tx.status === "ACCEPTED_ON_L2" && styles.txStatusSuccess,
                  tx.status === "PENDING" && styles.txStatusPending,
                ]}
              >
                {tx.status}
              </Text>
            </View>
            {tx.amount && (
              <Text style={styles.txAmount}>
                ${formatAmount(tx.amount)} USDC
              </Text>
            )}
            <Text style={styles.txHash} numberOfLines={1}>
              {tx.transactionHash}
            </Text>
            <Text style={styles.txDate}>
              {tx.createdAt ? formatDate(tx.createdAt) : "Unknown date"}
            </Text>
          </View>
        ))}

        {transactions && transactions.data && transactions.data.length > 0 && (
          <View style={styles.pagination}>
            <PrimaryButton
              title="Previous"
              onPress={() => setPage((p) => Math.max(1, p - 1))}
              active={page > 1}
              variant="secondary"
            />
            <Text style={styles.pageText}>Page {page}</Text>
            <PrimaryButton
              title="Next"
              onPress={() => setPage((p) => p + 1)}
              active={transactions.data.length === 10}
              variant="secondary"
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#11181C",
  },
  emptyText: {
    fontSize: 16,
    color: "#687076",
    textAlign: "center",
    marginTop: 40,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 14,
    marginBottom: 16,
  },
  txCard: {
    padding: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  txHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  txFunction: {
    fontSize: 16,
    fontWeight: "600",
    color: "#11181C",
  },
  txStatus: {
    fontSize: 12,
    fontWeight: "600",
    color: "#687076",
    textTransform: "uppercase",
  },
  txStatusSuccess: {
    color: "#16a34a",
  },
  txStatusPending: {
    color: "#f59e0b",
  },
  txAmount: {
    fontSize: 14,
    color: "#0a7ea4",
    fontWeight: "600",
    marginBottom: 4,
  },
  txHash: {
    fontSize: 12,
    fontFamily: "monospace",
    color: "#687076",
    marginBottom: 4,
  },
  txDate: {
    fontSize: 12,
    color: "#9ca3af",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
  },
  pageText: {
    fontSize: 16,
    color: "#11181C",
    fontWeight: "600",
  },
});