import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { Colors, Spacing, Typography } from "@/lib/theme";
import { Button } from "@/components/Button";

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [claudeKey, setClaudeKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync("claude_key").then((k) => setClaudeKey(k || ""));
  }, []);

  const save = async () => {
    if (claudeKey.trim()) {
      await SecureStore.setItemAsync("claude_key", claudeKey.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      await SecureStore.deleteItemAsync("claude_key");
      Alert.alert("Success", "API key removed.");
    }
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync("jwt");
    router.replace("/(auth)/sign-in");
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.section}>
        <Text style={styles.label}>Claude API Key</Text>
        <Text style={styles.hint}>Stored locally only. Never sent to our servers.</Text>
        <TextInput
          style={styles.input}
          placeholder="sk-ant-..."
          placeholderTextColor={Colors.textMuted}
          value={claudeKey}
          onChangeText={setClaudeKey}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Button
          title={saved ? "Saved" : "Save"}
          onPress={save}
          variant={saved ? "primary" : "secondary"}
          style={styles.saveBtn}
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.label}>Account</Text>
        <Button title="Sign out" variant="danger" onPress={signOut} style={styles.signOutBtn} />
      </View>

      <Text style={styles.footer}>ZapPR v0.1.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  label: {
    color: Colors.text,
    fontSize: Typography.size.lg,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  hint: {
    color: Colors.textMuted,
    fontSize: Typography.size.sm,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    color: Colors.text,
    padding: Spacing.lg,
    fontSize: Typography.size.md,
    marginBottom: Spacing.md,
  },
  saveBtn: {
    height: 48,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.lg,
  },
  signOutBtn: {
    height: 48,
  },
  footer: {
    position: "absolute",
    bottom: Spacing.xxl,
    left: 0,
    right: 0,
    color: Colors.textMuted,
    fontSize: Typography.size.sm,
    textAlign: "center",
  },
});
