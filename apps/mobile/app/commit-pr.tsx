import { useRouter } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { git } from "@/lib/api";
import { useRepoStore } from "@/lib/store";

export default function CommitPRScreen() {
  const router = useRouter();
  const { repo, branch, patch } = useRepoStore();
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
      Alert.alert("Success", `PR created: ${result.pr_url}`, [
        { text: "OK", onPress: () => router.replace("/(tabs)/repos") },
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
    <View style={styles.container}>
      <Text style={styles.label}>Commit message</Text>
      <TextInput
        style={styles.input}
        placeholder="feat: add new feature"
        placeholderTextColor="#71717a"
        value={commitMessage}
        onChangeText={(t) => {
          setCommitMessage(t);
          if (!prTitle) setPrTitle(t);
        }}
      />
      <Text style={styles.label}>PR title (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Defaults to commit message"
        placeholderTextColor="#71717a"
        value={prTitle}
        onChangeText={setPrTitle}
      />
      <Text style={styles.label}>PR description (optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Additional PR description"
        placeholderTextColor="#71717a"
        value={prBody}
        onChangeText={setPrBody}
        multiline
      />
      <TouchableOpacity
        style={[styles.submitBtn, loading && styles.disabled]}
        onPress={handleCommitAndPR}
        disabled={loading || !commitMessage.trim()}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>Commit, Push & Create PR</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#0a0a0a" },
  label: { color: "#a1a1aa", fontSize: 14, marginTop: 16, marginBottom: 8 },
  input: {
    backgroundColor: "#27272a",
    color: "#fff",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  submitBtn: {
    backgroundColor: "#22c55e",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
  },
  submitBtnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  disabled: { opacity: 0.6 },
});
