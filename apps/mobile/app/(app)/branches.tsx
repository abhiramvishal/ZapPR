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
import { useAuth } from "@/context/AuthContext";
import { useRepo } from "@/context/RepoContext";
import { apiFetch } from "@/constants/api";
import { colors, spacing, font } from "@/constants/theme";
import { Button } from "@/components/Button";

interface Branch {
  name: string;
  sha: string;
}

export default function BranchesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { selectedRepo, selectedBranch, setSelectedBranch } = useRepo();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBranchName, setNewBranchName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!selectedRepo || !token) {
      if (!selectedRepo) router.back();
      return;
    }
    const [owner, repo] = selectedRepo.full_name.split("/");
    apiFetch<Branch[]>(`/repos/${owner}/${repo}/branches`, token)
      .then(setBranches)
      .finally(() => setLoading(false));
  }, [selectedRepo, token]);

  const selectBranch = (b: Branch) => {
    setSelectedBranch(b);
    router.push("/(app)/workspace");
  };

  const createBranch = async () => {
    if (!newBranchName.trim() || !selectedRepo || !token) return;
    setCreating(true);
    try {
      const [owner, repo] = selectedRepo.full_name.split("/");
      await apiFetch(`/repos/${owner}/${repo}/branches`, token, {
        method: "POST",
        body: { name: newBranchName.trim(), from_ref: "HEAD" },
      });
      const updated = await apiFetch<Branch[]>(`/repos/${owner}/${repo}/branches`, token);
      setBranches(updated);
      setNewBranchName("");
      setShowCreateModal(false);
      const nb = updated.find((b) => b.name === newBranchName.trim());
      if (nb) selectBranch(nb);
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  if (!selectedRepo) return null;

  const filtered = branches.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return (
      <View style={[styles.centered, { paddingBottom: insets.bottom }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <TouchableOpacity style={styles.createButton} onPress={() => setShowCreateModal(true)}>
        <Octicons name="plus" size={18} color={colors.primary} />
        <Text style={styles.createButtonText}>＋ New branch</Text>
      </TouchableOpacity>

      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search branches..."
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(b) => b.name}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isCurrent = selectedBranch?.name === item.name;
          return (
            <TouchableOpacity
              style={[styles.item, isCurrent && styles.itemCurrent]}
              onPress={() => selectBranch(item)}
              activeOpacity={0.7}
            >
              <Octicons
                name={isCurrent ? "check" : "git-branch"}
                size={16}
                color={isCurrent ? colors.success : colors.muted}
                style={styles.icon}
              />
              <Text style={[styles.name, isCurrent && styles.nameCurrent]}>{item.name}</Text>
            </TouchableOpacity>
          );
        }}
      />

      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + spacing.lg }]}>
            <Text style={styles.modalTitle}>Create new branch</Text>
            <TextInput
              style={styles.input}
              placeholder="branch-name"
              placeholderTextColor={colors.muted}
              value={newBranchName}
              onChangeText={setNewBranchName}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalButtons}>
              <Button title="Cancel" variant="secondary" onPress={() => setShowCreateModal(false)} style={styles.modalBtn} />
              <Button title="Create" onPress={createBranch} loading={creating} disabled={!newBranchName.trim()} style={styles.modalBtn} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  createButtonText: { color: colors.primary, fontSize: 16, fontWeight: "600" },
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
  listContent: { padding: spacing.md, paddingBottom: spacing.xl },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  itemCurrent: { borderColor: colors.success, backgroundColor: `${colors.success}20` },
  icon: { marginRight: spacing.md },
  name: { color: colors.text, fontSize: 16, fontFamily: font.mono },
  nameCurrent: { color: colors.success, fontWeight: "600" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.xl,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: "600", marginBottom: spacing.md },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    color: colors.text,
    padding: spacing.md,
    fontSize: 16,
    fontFamily: font.mono,
    marginBottom: spacing.md,
  },
  modalButtons: { flexDirection: "row", gap: spacing.md },
  modalBtn: { flex: 1 },
});
