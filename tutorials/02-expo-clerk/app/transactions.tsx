import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import { useGetTransactionList } from "@chipi-stack/chipi-expo";
import { useAuth } from "@clerk/clerk-expo";
import { useState } from "react";
import * as SecureStore from "expo-secure-store";
import { useEffect } from "react";

export default function TransactionsScreen() {
  const { getToken } = useAuth();
  const [page, setPage] = useState(1);
  const [walletAddress, setWalletAddress] = useState<string>("");

  useEffect(() => {
    (async () => {
      const storedWallet = await SecureStore.getItemAsync("wallet");
      if (storedWallet) {
        const wallet = JSON.parse(storedWallet);
        setWalletAddress(wallet.publicKey);
      }
    })();
  }, []);

  const { data, isLoading, error } = useGetTransactionList({
    query: {
      page,
      limit: 10,
      walletAddress,
    },
    getBearerToken: async () => {
      const token = await getToken();
      if (!token) throw new Error("No token found");
      return token;
    },
    queryOptions: {
      enabled: Boolean(walletAddress),
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transaction History</Text>

      {!data || data.data.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No transactions yet</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={data.data}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.transactionCard}>
                <View style={styles.transactionHeader}>
                  <Text style={styles.transactionStatus}>{item.status}</Text>
                  <Text style={styles.transactionDate}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.transactionHash} numberOfLines={1}>
                  {item.transactionHash}
                </Text>
              </View>
            )}
            style={styles.list}
          />

          <View style={styles.pagination}>
            <TouchableOpacity
              style={[styles.paginationButton, page === 1 && styles.buttonDisabled]}
              onPress={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <Text style={styles.paginationButtonText}>Previous</Text>
            </TouchableOpacity>
            <Text style={styles.pageNumber}>Page {page}</Text>
            <TouchableOpacity
              style={styles.paginationButton}
              onPress={() => setPage((p) => p + 1)}
            >
              <Text style={styles.paginationButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
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
  list: {
    flex: 1,
  },
  transactionCard: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  transactionStatus: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0a7ea4",
  },
  transactionDate: {
    fontSize: 14,
    color: "#687076",
  },
  transactionHash: {
    fontSize: 12,
    fontFamily: "monospace",
    color: "#11181C",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  paginationButton: {
    backgroundColor: "#0a7ea4",
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  paginationButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  pageNumber: {
    fontSize: 16,
    color: "#11181C",
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
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#687076",
  },
});