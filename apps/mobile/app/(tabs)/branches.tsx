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
import { Octicons } from "@expo/vector-icons";
import { repos as reposApi, Branch } from "../../lib/api";
import { useRepoStore } from "../../lib/store";
import { Colors, Spacing, Typography } from "../../lib/theme";
import { TerminalText } from "../../components/TerminalText";
import { Button } from "../../components/Button";

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
          {`> git branch --list (${repo.name})`}
        </TerminalText>
      </View>

      <View style={styles.createBox}>
        <TextInput
          style={styles.input}
          placeholder="New branch name..."
          placeholderTextColor={Colors.textMuted}
          value={newBranchName}
          onChangeText={setNewBranchName}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Button
          title="Create"
          onPress={createBranch}
          loading={creating}
          disabled={!newBranchName.trim()}
          variant="primary"
          style={styles.createBtn}
        />
      </View>

      <FlatList
        data={branches}
        keyExtractor={(b) => b.name}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => selectBranch(item)}
            activeOpacity={0.7}
          >
            <Octicons name="git-branch" size={14} color={Colors.textMuted} style={styles.icon} />
            <Text style={styles.name}>{item.name}</Text>
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
  createBox: {
    flexDirection: "row",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    paddingHorizontal: Spacing.md,
    height: 48,
    fontFamily: "SpaceMono",
    fontSize: Typography.size.md,
  },
  createBtn: {
    height: 48,
    paddingHorizontal: Spacing.lg,
  },
  listContent: {
    padding: Spacing.md,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xs,
  },
  icon: {
    marginRight: Spacing.md,
  },
  name: {
    color: Colors.text,
    fontSize: Typography.size.sm,
    fontFamily: "SpaceMono",
  },
});
