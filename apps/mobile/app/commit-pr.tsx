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
import { Octicons } from "@expo/vector-icons";
import { git } from "@/lib/api";
import { useRepoStore } from "@/lib/store";
import { Colors, Spacing, Typography } from "@/lib/theme";
import { Button } from "@/components/Button";
import { BranchBadge } from "@/components/BranchBadge";

export default function CommitPRScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { repo, branch, patch, filesChanged } = useRepoStore((s) => s);
  const [commitMessage, setCommitMessage] = useState("");
  const [prTitle, setPrTitle] = useState("");
  const [prBody, setPrBody] = useState("");
  const [openPR, setOpenPR] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleCommitAndPR = async () => {
    if (!repo || !branch || !patch || !commitMessage.trim()) return;
    setLoading(true);
    setSuccess(false);
    try {
      const [owner, repoName] = repo.full_name.split("/");
      await git.applyAndCommit({
        owner,
        repo: repoName,
        branch: branch.name,
        patch,
        commit_message: commitMessage.trim(),
      });
      if (openPR) {
        const title = prTitle.trim() || commitMessage.trim();
        const result = await git.createPR({
          owner,
          repo: repoName,
          head: branch.name,
          base: repo.default_branch,
          title,
          body: prBody.trim() || undefined,
        });
        setSuccess(true);
        Alert.alert("Success", `PR #${result.pr_number} created`, [
          { text: "Done", onPress: () => router.replace("/(tabs)/repos") },
        ]);
      } else {
        setSuccess(true);
        Alert.alert("Success", "Changes committed and pushed", [
          { text: "Done", onPress: () => router.replace("/(tabs)/repos") },
        ]);
      }
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const addCount = patch?.split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++")).length ?? 0;
  const delCount = patch?.split("\n").filter((l) => l.startsWith("-") && !l.startsWith("---")).length ?? 0;

  if (!repo || !branch || !patch) {
    router.back();
    return null;
  }

  return (
    <ScrollView
      style={[styles.container, { paddingBottom: insets.bottom + Spacing.xxl }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <BranchBadge name={branch.name} />
          <Text style={styles.summaryStat}>
            {filesChanged.length} file{filesChanged.length !== 1 ? "s" : ""} changed
          </Text>
        </View>
        <View style={styles.statsRow}>
          <Text style={[styles.stat, styles.statAdd]}>+{addCount}</Text>
          <Text style={[styles.stat, styles.statDel]}>-{delCount}</Text>
        </View>
      </View>

      <Text style={styles.label}>Commit message</Text>
      <TextInput
        style={styles.input}
        placeholder="feat: add new feature"
        placeholderTextColor={Colors.textMuted}
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
        <Octicons name={openPR ? "check" : "circle"} size={20} color={openPR ? Colors.success : Colors.textMuted} />
        <Text style={styles.toggleLabel}>Open Pull Request</Text>
      </TouchableOpacity>

      {openPR && (
        <>
          <Text style={styles.label}>PR title</Text>
          <TextInput
            style={styles.input}
            placeholder="Defaults to commit message"
            placeholderTextColor={Colors.textMuted}
            value={prTitle}
            onChangeText={setPrTitle}
            maxLength={200}
          />
          <Text style={styles.label}>PR description (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Detailed breakdown of changes..."
            placeholderTextColor={Colors.textMuted}
            value={prBody}
            onChangeText={setPrBody}
            multiline
            maxLength={5000}
          />
        </>
      )}

      <Button
        title={loading ? "" : "Commit & Push"}
        onPress={handleCommitAndPR}
        loading={loading}
        disabled={loading || !commitMessage.trim()}
        style={styles.submitBtn}
      />
      {success && (
        <View style={styles.successRow}>
          <Octicons name="check-circle-fill" size={24} color={Colors.success} />
          <Text style={styles.successText}>Done!</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  summaryStat: {
    color: Colors.textMuted,
    fontSize: Typography.size.sm,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  stat: {
    fontSize: Typography.size.md,
    fontWeight: "600",
  },
  statAdd: { color: Colors.success },
  statDel: { color: Colors.danger },
  label: {
    color: Colors.textMuted,
    fontSize: Typography.size.sm,
    fontWeight: "500",
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    color: Colors.text,
    padding: Spacing.lg,
    fontSize: Typography.size.md,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  charCount: {
    color: Colors.textMuted,
    fontSize: Typography.size.xs,
    marginTop: Spacing.xs,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.sm,
  },
  toggleLabel: {
    color: Colors.text,
    fontSize: Typography.size.md,
  },
  submitBtn: {
    marginTop: Spacing.xxl,
    height: 52,
  },
  successRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  successText: {
    color: Colors.success,
    fontSize: Typography.size.lg,
    fontWeight: "600",
  },
});
