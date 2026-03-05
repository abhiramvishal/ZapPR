import { useRouter } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { Octicons } from "@expo/vector-icons";
import { git } from "../lib/api";
import { useRepoStore } from "../lib/store";
import { Colors, Spacing, Typography } from "../lib/theme";
import { TerminalText } from "../components/TerminalText";
import { Button } from "../components/Button";

export default function CommitPRScreen() {
  const router = useRouter();
  const { repo, branch, patch, filesChanged } = useRepoStore((s: any) => s);
  const [commitMessage, setCommitMessage] = useState("");
  const [prTitle, setPrTitle] = useState("");
  const [prBody, setPrBody] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCommitAndPR = async () => {
    if (!repo || !branch || !patch || !commitMessage.trim()) return;
    setLoading(true);
    try {
      const [owner, repoName] = repo.full_name.split("/");
      await git.applyAndCommit({
        owner,
        repo: repoName,
        branch: branch.name,
        patch,
        commit_message: commitMessage.trim(),
      });
      const title = prTitle.trim() || commitMessage.trim();
      const result = await git.createPR({
        owner,
        repo: repoName,
        head: branch.name,
        base: repo.default_branch,
        title,
        body: prBody.trim() || undefined,
      });
      Alert.alert("SHIP IT!", `PR successfully created: #${result.pr_number}`, [
        { text: "DONE", onPress: () => router.replace("/(tabs)/repos") },
      ]);
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!repo || !branch || !patch) {
    router.back();
    return null;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TerminalText style={styles.headerTitle}>
          {`> git commit -m "${commitMessage || "..."}"`}
        </TerminalText>
      </View>

      <View style={styles.summaryBox}>
        <View style={styles.summaryHeader}>
          <Octicons name="file-diff" size={14} color={Colors.textMuted} />
          <Text style={styles.summaryTitle}>STAGED CHANGES</Text>
        </View>
        {filesChanged.map((f: string, i: number) => (
          <View key={i} style={styles.fileRow}>
            <Text style={styles.fileStatus}>M</Text>
            <Text style={styles.fileName}>{f}</Text>
          </View>
        ))}
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>COMMIT MESSAGE</Text>
        <TextInput
          style={styles.input}
          placeholder="feat: awesome new feature"
          placeholderTextColor={Colors.textMuted}
          value={commitMessage}
          onChangeText={(t) => {
            setCommitMessage(t);
            if (!prTitle) setPrTitle(t);
          }}
          autoCorrect={false}
        />

        <Text style={styles.label}>PR TITLE (OPTIONAL)</Text>
        <TextInput
          style={styles.input}
          placeholder="Defaults to commit message"
          placeholderTextColor={Colors.textMuted}
          value={prTitle}
          onChangeText={setPrTitle}
          autoCorrect={false}
        />

        <Text style={styles.label}>PR DESCRIPTION (OPTIONAL)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Detailed breakdown of changes..."
          placeholderTextColor={Colors.textMuted}
          value={prBody}
          onChangeText={setPrBody}
          multiline
          autoCorrect={false}
        />
      </View>

      <Button
        title="Ship It"
        onPress={handleCommitAndPR}
        loading={loading}
        disabled={loading || !commitMessage.trim()}
        style={styles.shipBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Spacing.xxl },
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
  summaryBox: {
    margin: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
    opacity: 0.6,
  },
  summaryTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.text,
    marginLeft: 6,
    letterSpacing: 1,
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  fileStatus: {
    fontFamily: "SpaceMono",
    fontSize: 10,
    color: Colors.warning,
    width: 20,
  },
  fileName: {
    fontFamily: "SpaceMono",
    fontSize: 11,
    color: Colors.textMuted,
  },
  form: {
    paddingHorizontal: Spacing.md,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textMuted,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.text,
    padding: Spacing.md,
    fontFamily: "SpaceMono",
    fontSize: Typography.size.md,
  },
  textArea: {
    minHeight: 100,
  },
  shipBtn: {
    margin: Spacing.md,
    marginTop: Spacing.xl,
    backgroundColor: Colors.accent,
  },
});
