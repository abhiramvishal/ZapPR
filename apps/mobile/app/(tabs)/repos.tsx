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
import { Octicons } from "@expo/vector-icons";
import { repos as reposApi, Repo } from "../../lib/api";
import { useRepoStore } from "../../lib/store";
import { Colors, Spacing, Typography } from "../../lib/theme";
import { TerminalText } from "../../components/TerminalText";

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
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TerminalText style={styles.headerTitle}>
          {"> list-repos --all"}
        </TerminalText>
      </View>
      <FlatList
        data={repos}
        keyExtractor={(r) => String(r.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => selectRepo(item)}
            activeOpacity={0.7}
          >
            <View style={styles.itemHeader}>
              <Octicons name="repo" size={14} color={Colors.textMuted} style={styles.icon} />
              <Text style={styles.name}>{item.name}</Text>
            </View>
            <Text style={styles.fullName}>{item.full_name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
  header: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  headerTitle: {
    fontSize: Typography.size.sm,
    color: Colors.success,
  },
  listContent: {
    padding: Spacing.md,
  },
  item: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  name: {
    color: Colors.text,
    fontSize: Typography.size.md,
    fontWeight: "600",
    fontFamily: "SpaceMono",
  },
  fullName: {
    color: Colors.textMuted,
    fontSize: Typography.size.xs,
    fontFamily: "SpaceMono",
  },
  description: {
    color: Colors.textMuted,
    fontSize: Typography.size.xs,
    marginTop: Spacing.sm,
  },
});
