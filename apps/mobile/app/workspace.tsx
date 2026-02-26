import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { storage } from "@/lib/storage";
import { repos as reposApi, agent as agentApi, TreeEntry } from "@/lib/api";
import { useRepoStore } from "@/lib/store";

export default function WorkspaceScreen() {
  const router = useRouter();
  const repo = useRepoStore((s) => s.repo);
  const branch = useRepoStore((s) => s.branch);
  const [tree, setTree] = useState<TreeEntry[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [fileContent, setFileContent] = useState("");
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [patchResult, setPatchResult] = useState<{
    plan: string[];
    patch: string;
    summary: string;
    files_changed: string[];
  } | null>(null);

  useEffect(() => {
    if (!repo || !branch) {
      router.back();
      return;
    }
    const [owner, repoName] = repo.full_name.split("/");
    reposApi.tree(owner, repoName, branch.name).then((t) => setTree(t.tree));
  }, [repo, branch]);

  const toggleFile = (path: string) => {
    if (path.endsWith("/") || !path) return;
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const loadFile = async (path: string) => {
    if (!repo || !branch) return;
    const [owner, repoName] = repo.full_name.split("/");
    try {
      const fc = await reposApi.file(owner, repoName, path, branch.name);
      setFileContent(fc.content);
      setCurrentPath(path);
    } catch {
      setFileContent("");
      setCurrentPath(path);
    }
  };

  const generatePatch = async () => {
    if (!repo || !branch || !goal.trim()) return;
    const claudeKey = await storage.getItemAsync("claude_key");
    if (!claudeKey) {
      Alert.alert(
        "Claude API Key",
        "Add your Claude API key in Settings to generate patches."
      );
      return;
    }
    setLoading(true);
    setPatchResult(null);
    try {
      const [owner, repoName] = repo.full_name.split("/");
      const result = await agentApi.patch({
        owner,
        repo: repoName,
        branch: branch.name,
        user_goal: goal,
        selected_files: Array.from(selectedFiles),
        claude_api_key: claudeKey,
      });
      setPatchResult(result);
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const goToDiff = () => {
    if (patchResult) {
      useRepoStore.setState({ patch: patchResult.patch });
      router.push("/diff");
    }
  };

  if (!repo || !branch) return null;

  const blobs = tree.filter((e) => e.type === "blob");

  return (
    <View style={styles.container}>
      <View style={styles.treeSection}>
        <Text style={styles.sectionTitle}>Files (select for context)</Text>
        <ScrollView style={styles.treeScroll}>
          {blobs.slice(0, 100).map((e) => (
            <TouchableOpacity
              key={e.path}
              style={[styles.treeItem, selectedFiles.has(e.path) && styles.treeItemSelected]}
              onPress={() => toggleFile(e.path)}
              onLongPress={() => loadFile(e.path)}
            >
              <Text style={styles.treeText} numberOfLines={1}>
                {e.path}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <View style={styles.mainSection}>
        <TextInput
          style={styles.goalInput}
          placeholder="What should the agent do? (e.g. Add error handling to main.py)"
          placeholderTextColor="#71717a"
          value={goal}
          onChangeText={setGoal}
          multiline
        />
        <TouchableOpacity
          style={[styles.generateBtn, loading && styles.disabled]}
          onPress={generatePatch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.generateBtnText}>Generate Patch</Text>
          )}
        </TouchableOpacity>
        {patchResult && (
          <View style={styles.result}>
            <Text style={styles.resultTitle}>Plan:</Text>
            {patchResult.plan.map((p, i) => (
              <Text key={i} style={styles.planItem}>• {p}</Text>
            ))}
            <Text style={styles.resultTitle}>Summary:</Text>
            <Text style={styles.summary}>{patchResult.summary}</Text>
            <TouchableOpacity style={styles.reviewBtn} onPress={goToDiff}>
              <Text style={styles.reviewBtnText}>Review Diff</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: "row", backgroundColor: "#0a0a0a" },
  treeSection: { width: 140, borderRightWidth: 1, borderRightColor: "#27272a" },
  sectionTitle: { color: "#71717a", fontSize: 12, padding: 8 },
  treeScroll: { flex: 1 },
  treeItem: { padding: 8, paddingLeft: 12 },
  treeItemSelected: { backgroundColor: "#22c55e20" },
  treeText: { color: "#a1a1aa", fontSize: 12 },
  mainSection: { flex: 1, padding: 16 },
  goalInput: {
    backgroundColor: "#27272a",
    color: "#fff",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: "top",
  },
  generateBtn: {
    backgroundColor: "#22c55e",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  generateBtnText: { color: "#fff", fontWeight: "600" },
  disabled: { opacity: 0.6 },
  result: { marginTop: 20 },
  resultTitle: { color: "#fff", fontWeight: "600", marginTop: 12 },
  planItem: { color: "#a1a1aa", marginTop: 4, marginLeft: 8 },
  summary: { color: "#a1a1aa", marginTop: 8 },
  reviewBtn: {
    backgroundColor: "#3b82f6",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  reviewBtnText: { color: "#fff", fontWeight: "600" },
});
