import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Modal, Text, TextInput, TouchableOpacity, View, StyleSheet } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useRepo } from "@/context/RepoContext";
import { colors, spacing } from "@/constants/theme";

export default function AppLayout() {
  const router = useRouter();
  const { token } = useAuth();
  const { claudeApiKey, saveClaudeKey } = useRepo();
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState("");

  useEffect(() => {
    if (!token) {
      router.replace("/(auth)/login");
    }
  }, [token]);

  useEffect(() => {
    if (token && !claudeApiKey) {
      setShowKeyModal(true);
    }
  }, [token, claudeApiKey]);

  const handleSaveKey = async () => {
    if (keyInput.trim()) {
      await saveClaudeKey(keyInput.trim());
      setKeyInput("");
      setShowKeyModal(false);
    }
  };

  const handleSkip = () => {
    setShowKeyModal(false);
  };

  if (!token) return null;

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontSize: 17, fontWeight: "600" },
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push("/settings")} style={{ marginRight: 16 }}>
              <Text style={{ color: colors.text, fontSize: 16 }}>Settings</Text>
            </TouchableOpacity>
          ),
        }}
      >
        <Stack.Screen name="repos" options={{ title: "Repos" }} />
        <Stack.Screen name="branches" options={{ title: "Branches" }} />
        <Stack.Screen name="workspace" options={{ title: "Workspace" }} />
        <Stack.Screen name="diff" options={{ title: "Review Diff" }} />
        <Stack.Screen name="commit" options={{ title: "Commit & PR" }} />
      </Stack>

      <Modal visible={showKeyModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Claude API Key</Text>
            <Text style={styles.modalHint}>Stored locally only. Required for agent chat.</Text>
            <TextInput
              style={styles.input}
              placeholder="sk-ant-..."
              placeholderTextColor={colors.muted}
              value={keyInput}
              onChangeText={setKeyInput}
              secureTextEntry
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, !keyInput.trim() && styles.saveBtnDisabled]}
                onPress={handleSaveKey}
                disabled={!keyInput.trim()}
              >
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  modalHint: {
    color: colors.muted,
    fontSize: 14,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    color: colors.text,
    padding: spacing.md,
    fontSize: 16,
    marginBottom: spacing.lg,
  },
  modalButtons: { flexDirection: "row", gap: spacing.md },
  skipBtn: { flex: 1, padding: spacing.md, alignItems: "center" },
  skipText: { color: colors.muted },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveText: { color: "#fff", fontWeight: "600" },
});
