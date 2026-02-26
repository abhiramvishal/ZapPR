import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { storage } from "@/lib/storage";

export default function SettingsScreen() {
  const router = useRouter();
  const [claudeKey, setClaudeKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    storage.getItemAsync("claude_key").then((k) => setClaudeKey(k || ""));
  }, []);

  const save = async () => {
    if (claudeKey.trim()) {
      await storage.setItemAsync("claude_key", claudeKey.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      await storage.deleteItemAsync("claude_key");
    }
  };

  const signOut = async () => {
    await storage.deleteItemAsync("jwt");
    router.replace("/(auth)/sign-in");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Claude API Key (stored locally only)</Text>
      <TextInput
        style={styles.input}
        placeholder="sk-ant-..."
        placeholderTextColor="#71717a"
        value={claudeKey}
        onChangeText={setClaudeKey}
        secureTextEntry
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.saveBtn} onPress={save}>
        <Text style={styles.saveBtnText}>{saved ? "Saved" : "Save"}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
        <Text style={styles.signOutBtnText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#0a0a0a" },
  label: { color: "#a1a1aa", fontSize: 14, marginBottom: 8 },
  input: {
    backgroundColor: "#27272a",
    color: "#fff",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: "#22c55e",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  saveBtnText: { color: "#fff", fontWeight: "600" },
  signOutBtn: {
    padding: 14,
    alignItems: "center",
    marginTop: 24,
  },
  signOutBtnText: { color: "#ef4444", fontWeight: "600" },
});
