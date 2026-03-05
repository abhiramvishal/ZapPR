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
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { Octicons } from "@expo/vector-icons";
import { repos as reposApi, agent as agentApi, TreeEntry } from "../lib/api";
import { useRepoStore } from "../lib/store";
import { Colors, Spacing, Typography } from "../lib/theme";
import { TerminalText } from "../components/TerminalText";
import { Button } from "../components/Button";

export default function WorkspaceScreen() {
  const router = useRouter();
  const repo = useRepoStore((s: any) => s.repo);
  const branch = useRepoStore((s: any) => s.branch);
  const [tree, setTree] = useState<TreeEntry[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
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

  const generatePatch = async () => {
    if (!repo || !branch || !goal.trim()) return;
    const claudeKey = await SecureStore.getItemAsync("claude_key");
    if (!claudeKey) {
      Alert.alert(
        "Missing API Key",
        "Please add your Claude API key in Settings."
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
      useRepoStore.getState().setPatch(patchResult.patch);
      useRepoStore.getState().setFilesChanged(patchResult.files_changed);
      router.push("/diff");
    }
  };

  if (!repo || !branch) return null;

  const blobs = tree.filter((e) => e.type === "blob");

  return (
    <View style={styles.container}>
      {/* File Tree Section */}
      <View style={styles.treeSection}>
        <View style={styles.sectionHeader}>
          <Octicons name="file-directory" size={14} color={Colors.textMuted} />
          <Text style={styles.sectionTitle}>EXPLORER</Text>
        </View>
        <ScrollView style={styles.treeScroll}>
          {blobs.slice(0, 100).map((e) => {
            const isSelected = selectedFiles.has(e.path);
            const isChanged = patchResult?.files_changed.includes(e.path);

            return (
              <TouchableOpacity
                key={e.path}
                style={[
                  styles.treeItem,
                  isSelected && styles.treeItemSelected,
                ]}
                onPress={() => toggleFile(e.path)}
              >
                <View style={styles.treeItemContent}>
                  <Octicons
                    name={isSelected ? "check-circle-fill" : "file"}
                    size={12}
                    color={isSelected ? Colors.success : Colors.textMuted}
                    style={styles.fileIcon}
                  />
                  <Text
                    style={[
                      styles.treeText,
                      isSelected && styles.textActive,
                      isChanged && styles.textModified
                    ]}
                    numberOfLines={1}
                  >
                    {e.path.split("/").pop()}
                  </Text>
                </View>
                {isChanged && <Text style={styles.statusBadge}>M</Text>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Chat/Terminal Section */}
      <View style={styles.mainSection}>
        <View style={styles.chatHeader}>
          <TerminalText style={styles.chatTitle}>
            {`ssh agent@zappr:${repo.name}`}
          </TerminalText>
        </View>

        <ScrollView style={styles.chatScroll} contentContainerStyle={styles.chatContent}>
          <View style={styles.messageBox}>
            <TerminalText style={styles.prompt}>$ zappr init</TerminalText>
            <TerminalText style={styles.botMessage}>
              {"Welcome to ZapPR. I'm your AI agent. Select files from the explorer for context, then tell me what to change."}
            </TerminalText>
          </View>

          {loading && (
            <View style={styles.messageBox}>
              <TerminalText style={styles.prompt}>$ zappr patch --generate</TerminalText>
              <TerminalText style={styles.botMessage} streaming>
                {"Analyzing codebase and generating patch..."}
              </TerminalText>
            </View>
          )}

          {patchResult && (
            <View style={styles.messageBox}>
              <TerminalText style={styles.prompt}>$ zappr patch --summary</TerminalText>
              <View style={styles.planBox}>
                {patchResult.plan.map((p, i) => (
                  <TerminalText key={i} style={styles.planItem}>
                    {`[${i + 1}] ${p}`}
                  </TerminalText>
                ))}
              </View>
              <TerminalText style={styles.botMessage}>
                {patchResult.summary}
              </TerminalText>
              <Button
                title="Review Diff"
                onPress={goToDiff}
                variant="outline"
                style={styles.reviewBtn}
              />
            </View>
          )}
        </ScrollView>

        <View style={styles.inputSection}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputPrompt}>{">"}</Text>
            <TextInput
              style={styles.goalInput}
              placeholder="What's the goal?"
              placeholderTextColor={Colors.textMuted}
              value={goal}
              onChangeText={setGoal}
              multiline
              autoCorrect={false}
            />
          </View>
          <Button
            title="Execute"
            onPress={generatePatch}
            loading={loading}
            disabled={!goal.trim() || loading}
            style={styles.executeBtn}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: Colors.background,
  },
  treeSection: {
    width: 120,
    backgroundColor: Colors.background,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  sectionTitle: {
    color: Colors.textMuted,
    fontSize: Typography.size.xs,
    fontWeight: "700",
    marginLeft: Spacing.xs,
    letterSpacing: 1,
  },
  treeScroll: { flex: 1 },
  treeItem: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  treeItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  treeItemSelected: {
    backgroundColor: Colors.surface,
  },
  fileIcon: {
    marginRight: 6,
  },
  treeText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: "SpaceMono",
    flex: 1,
  },
  textActive: {
    color: Colors.text,
  },
  textModified: {
    color: Colors.warning,
  },
  statusBadge: {
    fontSize: 9,
    fontFamily: "SpaceMono",
    color: Colors.warning,
    marginLeft: 4,
  },
  mainSection: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  chatHeader: {
    padding: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chatTitle: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
  },
  chatScroll: { flex: 1 },
  chatContent: {
    padding: Spacing.md,
  },
  messageBox: {
    marginBottom: Spacing.xl,
  },
  prompt: {
    fontSize: Typography.size.sm,
    color: Colors.success,
    marginBottom: 4,
  },
  botMessage: {
    fontSize: Typography.size.sm,
    color: Colors.text,
    lineHeight: 20,
  },
  planBox: {
    paddingLeft: Spacing.md,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
  planItem: {
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  reviewBtn: {
    marginTop: Spacing.md,
    height: 40,
  },
  inputSection: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  inputPrompt: {
    fontFamily: "SpaceMono",
    color: Colors.success,
    fontSize: Typography.size.md,
    marginTop: 10,
    marginRight: 8,
  },
  goalInput: {
    flex: 1,
    color: Colors.text,
    fontSize: Typography.size.md,
    fontFamily: "SpaceMono",
    minHeight: 40,
    paddingTop: 10,
  },
  executeBtn: {
    height: 48,
  },
});
