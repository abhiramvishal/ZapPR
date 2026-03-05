import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useRepo } from "@/context/RepoContext";
import { apiFetch } from "@/constants/api";
import { colors, spacing } from "@/constants/theme";
import { RepoCard } from "@/components/RepoCard";

interface Repo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
  owner: { login: string; avatar_url?: string };
}

export default function ReposScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { setSelectedRepo } = useRepo();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const load = async () => {
    if (!token) return;
    try {
      const data = await apiFetch<Repo[]>("/repos", token);
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
  }, [token]);

  const filtered = repos.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const selectRepo = (repo: Repo) => {
    setSelectedRepo(repo);
    router.push("/(app)/branches");
  };

  if (loading) {
    return (
      <View style={[styles.centered, { paddingBottom: insets.bottom }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search repos..."
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(r) => String(r.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No repos found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <RepoCard
            name={item.name}
            fullName={item.full_name}
            isPrivate={item.private}
            onPress={() => selectRepo(item)}
          />
        )}
      />
      <TouchableOpacity
        style={[styles.settingsBtn, { bottom: insets.bottom + 16 }]}
        onPress={() => router.push("/settings")}
      >
        <Text style={styles.settingsText}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg },
  searchBar: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  searchInput: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 16,
  },
  listContent: { padding: spacing.md, paddingBottom: 80 },
  empty: { padding: spacing.xl * 2, alignItems: "center" },
  emptyText: { color: colors.muted, fontSize: 16 },
  settingsBtn: { position: "absolute", right: spacing.md },
  settingsText: { color: colors.primary, fontSize: 16 },
});
