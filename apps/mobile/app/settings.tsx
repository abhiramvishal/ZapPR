import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { Colors, Spacing, Typography } from "../lib/theme";
import { TerminalText } from "../components/TerminalText";
import { Button } from "../components/Button";

export default function SettingsScreen() {
  const router = useRouter();
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TerminalText style={styles.headerTitle}>
          {"> config --edit --global"}
        </TerminalText>
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>CLAUDE_API_KEY</Text>
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
          title={saved ? "SAVED" : "UPDATE KEY"}
          onPress={save}
          variant={saved ? "primary" : "outline"}
          style={styles.saveBtn}
        />

        <View style={styles.divider} />

        <Text style={styles.label}>USER_SESSION</Text>
        <Button
          title="Sign out / De-auth"
          onPress={signOut}
          variant="danger"
          style={styles.signOutBtn}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>ZapPR v0.1.0-alpha</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
  content: {
    padding: Spacing.xl,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textMuted,
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
    fontSize: Typography.size.sm,
    marginBottom: Spacing.md,
  },
  saveBtn: {
    height: 48,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xxl,
  },
  signOutBtn: {
    height: 48,
  },
  footer: {
    position: "absolute",
    bottom: Spacing.xl,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  footerText: {
    fontFamily: "SpaceMono",
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
  },
});
