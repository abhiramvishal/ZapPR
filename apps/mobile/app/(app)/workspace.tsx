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
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Octicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useRepo } from "@/context/RepoContext";
import { apiFetch } from "@/constants/api";
import { colors, spacing, font } from "@/constants/theme";
import { FileTreeItem } from "@/components/FileTreeItem";
import { AgentMessage } from "@/components/AgentMessage";
import { Button } from "@/components/Button";

interface TreeEntry {
  path: string;
  type: "blob" | "tree";
  sha?: string;
}

type Message = { role: "user" | "assistant"; content: string };

export default function WorkspaceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { selectedRepo, selectedBranch, claudeApiKey, setPatches } = useRepo();
  const [tree, setTree] = useState<TreeEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"files" | "agent">("agent");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Select files for context, then tell me what to change. I'll generate a patch." },
  ]);
  const [loading, setLoading] = useState(false);
  const [streamingCursor, setStreamingCursor] = useState(false);
  const [fileModalPath, setFileModalPath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [agentPatch, setAgentPatch] = useState<string | null>(null);

  useEffect(() => {
    if (loading) {
      const id = setInterval(() => setStreamingCursor((v) => !v), 500);
      return () => clearInterval(id);
    }
  }, [loading]);

  useEffect(() => {
    if (!selectedRepo || !selectedBranch || !token) {
      if (!selectedRepo || !selectedBranch) router.back();
      return;
    }
    const [owner, repo] = selectedRepo.full_name.split("/");
    apiFetch<{ tree: TreeEntry[] }>(
      `/repos/${owner}/${repo}/tree?branch=${selectedBranch.name}`,
      token
    ).then((d) => setTree(d.tree));
  }, [selectedRepo, selectedBranch, token]);

  const blobs = tree.filter((e) => e.type === "blob");

  const openFile = async (path: string) => {
    if (!selectedRepo || !selectedBranch || !token) return;
    const [owner, repo] = selectedRepo.full_name.split("/");
    try {
      const fc = await apiFetch<{ content: string }>(
        `/repos/${owner}/${repo}/file?path=${encodeURIComponent(path)}&branch=${selectedBranch.name}`,
        token
      );
      setFileContent(fc.content);
      setFileModalPath(path);
    } catch {
      setFileContent("");
      setFileModalPath(path);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !selectedRepo || !selectedBranch || !token || !claudeApiKey) return;
    setLoading(true);
    setAgentPatch(null);
    setMessages((m) => [...m, { role: "user", content: message }]);

    try {
      const history = messages.map((h) => ({ role: h.role, content: h.content }));
      const res = await apiFetch<{ content: string; patch?: string; files_changed?: string[] }>(
        "/agent/chat",
        token,
        {
          method: "POST",
          body: {
            repo: selectedRepo.full_name,
            branch: selectedBranch.name,
            message: message.trim(),
            history,
            claude_api_key: claudeApiKey,
          },
        }
      );
      setMessages((m) => [...m, { role: "assistant", content: res.content }]);
      if (res.patch) setAgentPatch(res.patch);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: `Error: ${(e as Error).message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const goToDiff = () => {
    if (agentPatch) {
      setPatches([agentPatch]);
      router.push("/(app)/diff");
    }
  };

  if (!selectedRepo || !selectedBranch) return null;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "files" && styles.tabActive]}
          onPress={() => setActiveTab("files")}
        >
          <Octicons name="file-directory" size={18} color={activeTab === "files" ? colors.primary : colors.muted} />
          <Text style={[styles.tabText, activeTab === "files" && styles.tabTextActive]}>Files</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "agent" && styles.tabActive]}
          onPress={() => setActiveTab("agent")}
        >
          <Octicons name="comment-discussion" size={18} color={activeTab === "agent" ? colors.primary : colors.muted} />
          <Text style={[styles.tabText, activeTab === "agent" && styles.tabTextActive]}>Agent</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "files" && (
        <ScrollView style={styles.treeScroll}>
          {blobs.slice(0, 100).map((e) => (
            <FileTreeItem key={e.path} path={e.path} onPress={() => openFile(e.path)} />
          ))}
        </ScrollView>
      )}

      {activeTab === "agent" && (
        <KeyboardAvoidingView style={styles.agentPanel} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={100}>
          <FlatList
            data={[...messages].reverse()}
            keyExtractor={(_, i) => String(i)}
            inverted
            contentContainerStyle={styles.chatContent}
            renderItem={({ item }) => (
              <AgentMessage content={item.content} isUser={item.role === "user"} streaming={loading && item === messages[messages.length - 1]} />
            )}
          />
          {loading && (
            <View style={styles.streamingIndicator}>
              <Text style={styles.streamingText}>Generating...{streamingCursor ? "▋" : " "}</Text>
            </View>
          )}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="What should I change?"
              placeholderTextColor={colors.muted}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={2000}
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!message.trim() || loading) && styles.sendBtnDisabled]}
              onPress={sendMessage}
              disabled={!message.trim() || loading}
            >
              <Octicons name="paper-airplane" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          {agentPatch && (
            <View style={styles.reviewBar}>
              <Button title="Review Changes" onPress={goToDiff} style={styles.reviewBtn} />
            </View>
          )}
        </KeyboardAvoidingView>
      )}

      <Modal visible={!!fileModalPath} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>{fileModalPath}</Text>
              <TouchableOpacity onPress={() => setFileModalPath(null)}>
                <Text style={styles.modalClose}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <Text style={[styles.modalCode, { fontFamily: font.mono }]}>{fileContent}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { color: colors.muted, fontSize: 16, fontWeight: "500" },
  tabTextActive: { color: colors.primary },
  treeScroll: { flex: 1, padding: spacing.md },
  agentPanel: { flex: 1 },
  chatContent: { padding: spacing.md, paddingBottom: spacing.sm },
  streamingIndicator: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.surface },
  streamingText: { color: colors.muted, fontSize: 14, fontFamily: "Menlo" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 16,
    maxHeight: 120,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.5 },
  reviewBar: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  reviewBtn: { height: 48 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: "80%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { color: colors.text, fontSize: 16, flex: 1 },
  modalClose: { color: colors.primary, fontSize: 16, fontWeight: "600" },
  modalScroll: { padding: spacing.md, maxHeight: 400 },
  modalCode: { color: colors.text, fontSize: 13 },
});
