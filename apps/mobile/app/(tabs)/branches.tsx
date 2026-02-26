import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { repos as reposApi, Branch } from "@/lib/api";
import { useRepoStore } from "@/lib/store";

export default function BranchesScreen() {
  const router = useRouter();
  const repo = useRepoStore((s) => s.repo);
  const setBranch = useRepoStore((s) => s.setBranch);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBranchName, setNewBranchName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!repo) {
      router.back();
      return;
    }
    const [owner, repoName] = repo.full_name.split("/");
    reposApi.branches(owner, repoName).then(setBranches).finally(() => setLoading(false));
  }, [repo]);

  const selectBranch = (branch: Branch) => {
    setBranch(branch);
    router.push("/workspace");
  };

  const createBranch = async () => {
    if (!newBranchName.trim() || !repo) return;
    setCreating(true);
    try {
      const [owner, repoName] = repo.full_name.split("/");
      await reposApi.createBranch(owner, repoName, newBranchName.trim());
      const updated = await reposApi.branches(owner, repoName);
      setBranches(updated);
      setNewBranchName("");
      const newBranch = updated.find((b) => b.name === newBranchName.trim());
      if (newBranch) selectBranch(newBranch);
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  if (!repo) return null;

  const [owner, repoName] = repo.full_name.split("/");

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.createRow}>
        <TextInput
          style={styles.input}
          placeholder="New branch name"
          placeholderTextColor="#71717a"
          value={newBranchName}
          onChangeText={setNewBranchName}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[styles.createBtn, creating && styles.disabled]}
          onPress={createBranch}
          disabled={creating || !newBranchName.trim()}
        >
          <Text style={styles.createBtnText}>Create</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={branches}
        keyExtractor={(b) => b.name}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => selectBranch(item)}>
            <Text style={styles.name}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0a0a0a" },
  createRow: { flexDirection: "row", padding: 16, gap: 8 },
  input: {
    flex: 1,
    backgroundColor: "#27272a",
    color: "#fff",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  createBtn: {
    backgroundColor: "#22c55e",
    paddingHorizontal: 20,
    justifyContent: "center",
    borderRadius: 8,
  },
  createBtnText: { color: "#fff", fontWeight: "600" },
  disabled: { opacity: 0.6 },
  item: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#27272a" },
  name: { color: "#fff", fontSize: 16 },
});
