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
  Modal,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Octicons } from "@expo/vector-icons";
import { repos as reposApi, Branch } from "@/lib/api";
import { useRepoStore } from "@/lib/store";
import { Colors, Spacing, Typography } from "@/lib/theme";
import { Button } from "@/components/Button";
import { BranchBadge } from "@/components/BranchBadge";

export default function BranchesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const repo = useRepoStore((s) => s.repo);
  const branch = useRepoStore((s) => s.branch);
  const setBranch = useRepoStore((s) => s.setBranch);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBranchName, setNewBranchName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!repo) {
      router.back();
      return;
    }
    const [owner, repoName] = repo.full_name.split("/");
    reposApi.branches(owner, repoName).then(setBranches).finally(() => setLoading(false));
  }, [repo]);

  const selectBranch = (b: Branch) => {
    setBranch(b);
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
      setShowCreateModal(false);
      const newBranch = updated.find((b) => b.name === newBranchName.trim());
      if (newBranch) selectBranch(newBranch);
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  if (!repo) return null;

  const filtered = branches.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return (
      <View style={[styles.centered, { paddingBottom: insets.bottom }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <TouchableOpacity style={styles.createButton} onPress={() => setShowCreateModal(true)}>
        <Octicons name="plus" size={18} color={Colors.primary} />
        <Text style={styles.createButtonText}>Create new branch</Text>
      </TouchableOpacity>

      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search branches..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(b) => b.name}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isCurrent = branch?.name === item.name;
          return (
            <TouchableOpacity
              style={[styles.item, isCurrent && styles.itemCurrent]}
              onPress={() => selectBranch(item)}
              activeOpacity={0.7}
            >
              <Octicons
                name={isCurrent ? "check" : "git-branch"}
                size={16}
                color={isCurrent ? Colors.success : Colors.textMuted}
                style={styles.icon}
              />
              <Text style={[styles.name, isCurrent && styles.nameCurrent]}>{item.name}</Text>
            </TouchableOpacity>
          );
        }}
      />

      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <Text style={styles.modalTitle}>Create new branch</Text>
            <TextInput
              style={styles.input}
              placeholder="branch-name"
              placeholderTextColor={Colors.textMuted}
              value={newBranchName}
              onChangeText={setNewBranchName}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setShowCreateModal(false)}
                style={styles.modalBtn}
              />
              <Button
                title="Create"
                onPress={createBranch}
                loading={creating}
                disabled={!newBranchName.trim()}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: Spacing.sm,
  },
  createButtonText: {
    color: Colors.primary,
    fontSize: Typography.size.md,
    fontWeight: "600",
  },
  searchBar: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  searchInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    color: Colors.text,
    fontSize: Typography.size.md,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  itemCurrent: {
    borderColor: Colors.success,
    backgroundColor: `${Colors.success}10`,
  },
  icon: {
    marginRight: Spacing.md,
  },
  name: {
    color: Colors.text,
    fontSize: Typography.size.md,
    ...Typography.mono,
  },
  nameCurrent: {
    color: Colors.success,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: Spacing.xxl,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  modalTitle: {
    color: Colors.text,
    fontSize: Typography.size.xl,
    fontWeight: "600",
    marginBottom: Spacing.lg,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    color: Colors.text,
    padding: Spacing.lg,
    fontSize: Typography.size.md,
    ...Typography.mono,
    marginBottom: Spacing.lg,
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  modalBtn: {
    flex: 1,
  },
});
