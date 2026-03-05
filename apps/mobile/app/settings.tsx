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
import { useAuth } from "@/context/AuthContext";
import { useRepo } from "@/context/RepoContext";
import { colors, spacing } from "@/constants/theme";
import { Button } from "@/components/Button";

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { claudeApiKey, saveClaudeKey, setClaudeApiKey } = useRepo();
  const [claudeKey, setClaudeKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setClaudeKey(claudeApiKey || "");
  }, [claudeApiKey]);

  const save = async () => {
    if (claudeKey.trim()) {
      await saveClaudeKey(claudeKey.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      await setClaudeApiKey(null);
      Alert.alert("Success", "API key removed.");
    }
  };

  const signOut = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.section}>
        <Text style={styles.label}>Claude API Key</Text>
        <Text style={styles.hint}>Stored locally only.</Text>
        <TextInput
          style={styles.input}
          placeholder="sk-ant-..."
          placeholderTextColor={colors.muted}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.md,
  },
  section: { marginBottom: spacing.md },
  label: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  hint: {
    color: colors.muted,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    color: colors.text,
    padding: spacing.md,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  saveBtn: { height: 48 },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  signOutBtn: { height: 48 },
});
