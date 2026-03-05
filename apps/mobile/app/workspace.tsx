import { useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { Octicons } from "@expo/vector-icons";
import { repos as reposApi, agent as agentApi, TreeEntry } from "@/lib/api";
import { useRepoStore } from "@/lib/store";
import { Colors, Spacing, Typography } from "@/lib/theme";
import { FileTreeItem } from "@/components/FileTreeItem";
import { AgentMessage } from "@/components/AgentMessage";
import { Button } from "@/components/Button";

type Message = { role: "user" | "agent"; content: string; streaming?: boolean };

export default function WorkspaceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const repo = useRepoStore((s) => s.repo);
  const branch = useRepoStore((s) => s.branch);
  const [tree, setTree] = useState<TreeEntry[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"files" | "agent">("agent");
  const [goal, setGoal] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "agent",
      content:
        "Select files from the Files tab for context, then tell me what changes you'd like. I'll generate a unified diff patch.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [patchResult, setPatchResult] = useState<{
    plan: string[];
    patch: string;
    summary: string;
    files_changed: string[];
  } | null>(null);
  const [fileModalPath, setFileModalPath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [streamingCursor, setStreamingCursor] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!repo || !branch) {
      router.back();
      return;
    }
    const [owner, repoName] = repo.full_name.split("/");
    reposApi.tree(owner, repoName, branch.name).then((t) => setTree(t.tree));
  }, [repo, branch]);

  useEffect(() => {
    if (loading) {
      const id = setInterval(() => setStreamingCursor((v) => !v), 500);
      return () => clearInterval(id);
    }
  }, [loading]);

  const toggleFile = (path: string) => {
    if (!path) return;
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const openFile = async (path: string) => {
    if (!repo || !branch) return;
    const [owner, repoName] = repo.full_name.split("/");
    try {
      const fc = await reposApi.file(owner, repoName, path, branch.name);
      setFileContent(fc.content);
      setFileModalPath(path);
    } catch {
      setFileContent("");
      setFileModalPath(path);
    }
  };

  const generatePatch = async () => {
    if (!repo || !branch || !goal.trim()) return;
    const claudeKey = await SecureStore.getItemAsync("claude_key");
    if (!claudeKey) {
      Alert.alert("Claude API Key", "Add your Claude API key in Settings to generate patches.");
      return;
    }
    setLoading(true);
    setPatchResult(null);
    setMessages((m) => [...m, { role: "user", content: goal }, { role: "agent", content: "", streaming: true }]);

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
      const agentContent = [
        ...result.plan.map((p) => `• ${p}`),
        "",
        result.summary,
        "",
        "**Files changed:** " + result.files_changed.join(", "),
      ].join("\n");
      setMessages((m) =>
        m.map((msg) => (msg.streaming ? { ...msg, content: agentContent, streaming: false as const } : msg))
      );
    } catch (e) {
      setMessages((m) =>
        m.map((msg) =>
          msg.streaming ? { ...msg, content: `Error: ${(e as Error).message}`, streaming: false as const } : msg
        )
      );
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
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Tab bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "files" && styles.tabActive]}
          onPress={() => setActiveTab("files")}
        >
          <Octicons name="file-directory" size={18} color={activeTab === "files" ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.tabText, activeTab === "files" && styles.tabTextActive]}>Files</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "agent" && styles.tabActive]}
          onPress={() => setActiveTab("agent")}
        >
          <Octicons name="comment-discussion" size={18} color={activeTab === "agent" ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.tabText, activeTab === "agent" && styles.tabTextActive]}>Agent</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "files" && (
        <View style={styles.filesPanel}>
          <ScrollView style={styles.treeScroll}>
            {blobs.slice(0, 150).map((e) => {
              const isSelected = selectedFiles.has(e.path);
              const isChanged = patchResult?.files_changed.includes(e.path);
              return (
                <FileTreeItem
                  key={e.path}
                  path={e.path}
                  status={isChanged ? "M" : undefined}
                  isSelected={isSelected}
                  onPress={() => openFile(e.path)}
                  onLongPress={() => toggleFile(e.path)}
                />
              );
            })}
          </ScrollView>
          <TouchableOpacity style={styles.fileHint} onPress={() => {}}>
            <Text style={styles.fileHintText}>Tap a file to view contents</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === "agent" && (
        <KeyboardAvoidingView
          style={styles.agentPanel}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={100}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(_, i) => String(i)}
            inverted
            contentContainerStyle={styles.chatContent}
            renderItem={({ item }) => (
              <AgentMessage
                content={item.content}
                isUser={item.role === "user"}
                streaming={item.streaming}
              />
            )}
          />
          {loading && (
            <View style={styles.streamingIndicator}>
              <Text style={styles.streamingText}>
                Generating patch...{streamingCursor ? "▋" : " "}
              </Text>
            </View>
          )}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="What should I change?"
              placeholderTextColor={Colors.textMuted}
              value={goal}
              onChangeText={setGoal}
              multiline
              maxLength={2000}
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!goal.trim() || loading) && styles.sendBtnDisabled]}
              onPress={generatePatch}
              disabled={!goal.trim() || loading}
            >
              <Octicons name="paper-airplane" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          {patchResult && (
            <View style={styles.reviewBar}>
              <Button title="Review Diff" onPress={goToDiff} style={styles.reviewBtn} />
            </View>
          )}
        </KeyboardAvoidingView>
      )}

      <Modal visible={!!fileModalPath} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {fileModalPath}
              </Text>
              <TouchableOpacity onPress={() => setFileModalPath(null)}>
                <Text style={styles.modalClose}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalCode}>{fileContent}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: Typography.size.md,
    fontWeight: "500",
  },
  tabTextActive: {
    color: Colors.primary,
  },
  filesPanel: { flex: 1 },
  treeScroll: { flex: 1, padding: Spacing.md },
  fileHint: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  fileHintText: {
    color: Colors.textMuted,
    fontSize: Typography.size.sm,
    textAlign: "center",
  },
  agentPanel: { flex: 1 },
  chatContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  streamingIndicator: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  streamingText: {
    color: Colors.textMuted,
    fontSize: Typography.size.sm,
    ...Typography.mono,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    color: Colors.text,
    fontSize: Typography.size.md,
    maxHeight: 120,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  reviewBar: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  reviewBtn: {
    height: 48,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    color: Colors.text,
    fontSize: Typography.size.md,
    ...Typography.mono,
    flex: 1,
  },
  modalClose: {
    color: Colors.primary,
    fontSize: Typography.size.md,
    fontWeight: "600",
  },
  modalScroll: {
    padding: Spacing.lg,
    maxHeight: 400,
  },
  modalCode: {
    color: Colors.text,
    fontSize: Typography.size.sm,
    ...Typography.mono,
  },
});
