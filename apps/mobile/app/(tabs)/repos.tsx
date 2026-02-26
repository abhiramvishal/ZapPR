import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { repos as reposApi, Repo } from "@/lib/api";
import { useRepoStore } from "@/lib/store";

export default function ReposScreen() {
  const router = useRouter();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const setRepo = useRepoStore((s) => s.setRepo);

  const load = async () => {
    try {
      const data = await reposApi.list();
      setRepos(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const selectRepo = (repo: Repo) => {
    setRepo(repo);
    router.push("/(tabs)/branches");
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={repos}
        keyExtractor={(r) => String(r.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => selectRepo(item)}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.fullName}>{item.full_name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0a0a0a" },
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#27272a",
  },
  name: { color: "#fff", fontSize: 16, fontWeight: "600" },
  fullName: { color: "#71717a", fontSize: 14, marginTop: 4 },
});
