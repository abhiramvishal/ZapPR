import { useRouter } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Octicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useRepo } from "@/context/RepoContext";
import { apiFetch } from "@/constants/api";
import { colors, spacing } from "@/constants/theme";
import { Button } from "@/components/Button";
import { BranchBadge } from "@/components/BranchBadge";

export default function CommitScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { selectedRepo, selectedBranch, patches } = useRepo();
  const [commitMessage, setCommitMessage] = useState("");
  const [openPR, setOpenPR] = useState(true);
  const [prTitle, setPrTitle] = useState("");
  const [prBody, setPrBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleCommit = async () => {
    if (!selectedRepo || !selectedBranch || !token || !commitMessage.trim()) return;
    setLoading(true);
    setSuccess(false);
    try {
      const [owner, repo] = selectedRepo.full_name.split("/");
      await apiFetch(`/repos/${owner}/${repo}/commit`, token, {
        method: "POST",
        body: {
          branch: selectedBranch.name,
          message: commitMessage.trim(),
          patches,
        },
      });
      if (openPR) {
        const title = prTitle.trim() || commitMessage.trim();
        const result = await apiFetch<{ pr_url: string; pr_number: number }>(
          `/repos/${owner}/${repo}/pr`,
          token,
          {
            method: "POST",
            body: {
              head: selectedBranch.name,
              base: selectedRepo.default_branch,
              title,
              body: prBody.trim() || undefined,
            },
          }
        );
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSuccess(true);
        Alert.alert("Success", `PR #${result.pr_number} created`, [
          { text: "Done", onPress: () => router.replace("/(app)/repos") },
        ]);
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSuccess(true);
        Alert.alert("Success", "Changes committed and pushed", [
          { text: "Done", onPress: () => router.replace("/(app)/repos") },
        ]);
      }
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedRepo || !selectedBranch) {
    router.back();
    return null;
  }

  return (
    <ScrollView
      style={[styles.container, { paddingBottom: insets.bottom + spacing.xl }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <BranchBadge name={selectedBranch.name} />
          <Text style={styles.summaryStat}>
            {patches.length} file(s) changed
          </Text>
        </View>
      </View>

      <Text style={styles.label}>Commit message</Text>
      <TextInput
        style={styles.input}
        placeholder="feat: add new feature"
        placeholderTextColor={colors.muted}
        value={commitMessage}
        onChangeText={(t) => {
          setCommitMessage(t);
          if (!prTitle) setPrTitle(t);
        }}
        multiline
        maxLength={500}
        autoCorrect={false}
      />
      <Text style={styles.charCount}>{commitMessage.length}/500</Text>

      <TouchableOpacity style={styles.toggleRow} onPress={() => setOpenPR(!openPR)}>
        <Octicons name={openPR ? "check" : "circle"} size={20} color={openPR ? colors.success : colors.muted} />
        <Text style={styles.toggleLabel}>Open Pull Request</Text>
      </TouchableOpacity>

      {openPR && (
        <>
          <Text style={styles.label}>PR title</Text>
          <TextInput
            style={styles.input}
            placeholder="Defaults to commit message"
            placeholderTextColor={colors.muted}
            value={prTitle}
            onChangeText={setPrTitle}
            maxLength={200}
          />
          <Text style={styles.label}>PR description (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Detailed breakdown..."
            placeholderTextColor={colors.muted}
            value={prBody}
            onChangeText={setPrBody}
            multiline
            maxLength={5000}
          />
        </>
      )}

      <Button
        title={loading ? "" : "Commit & Push"}
        onPress={handleCommit}
        loading={loading}
        disabled={loading || !commitMessage.trim()}
        style={styles.submitBtn}
      />
      {success && (
        <View style={styles.successRow}>
          <Octicons name="check-circle-fill" size={24} color={colors.success} />
          <Text style={styles.successText}>Done!</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md },
  summaryCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  summaryStat: { color: colors.muted, fontSize: 14 },
  label: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "500",
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    color: colors.text,
    padding: spacing.md,
    fontSize: 16,
  },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  charCount: { color: colors.muted, fontSize: 11, marginTop: spacing.xs },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  toggleLabel: { color: colors.text, fontSize: 16 },
  submitBtn: { marginTop: spacing.xl, height: 52 },
  successRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  successText: { color: colors.success, fontSize: 18, fontWeight: "600" },
});
