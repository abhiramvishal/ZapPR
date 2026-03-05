import { useRouter } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Octicons } from "@expo/vector-icons";
import { useRepoStore } from "../lib/store";
import { patchApi } from "../lib/api";
import { Colors, Spacing, Typography } from "../lib/theme";
import { TerminalText } from "../components/TerminalText";
import { Button } from "../components/Button";

function DiffLine({ line, index }: { line: string; index: number }) {
  const isAdd = line.startsWith("+") && !line.startsWith("+++");
  const isDel = line.startsWith("-") && !line.startsWith("---");
  const isHeader = line.startsWith("@@") || line.startsWith("index") || line.startsWith("---") || line.startsWith("+++");

  const getLineStyle = () => {
    if (isAdd) return styles.addLine;
    if (isDel) return styles.delLine;
    if (isHeader) return styles.headerLine;
    return {};
  };

  const getTextColor = () => {
    if (isAdd) return Colors.success;
    if (isDel) return Colors.danger;
    if (isHeader) return Colors.accent;
    return Colors.textMuted;
  };

  return (
    <View style={[styles.lineWrapper, getLineStyle()]}>
      <Text style={styles.lineNumber}>{index + 1}</Text>
      <Text style={[styles.codeText, { color: getTextColor() }]}>
        {line}
      </Text>
    </View>
  );
}

export default function DiffScreen() {
  const router = useRouter();
  const { repo, branch, patch } = useRepoStore((s: any) => s);
  const [valid, setValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = async () => {
    if (!repo || !branch || !patch) return;
    setLoading(true);
    try {
      const [owner, repoName] = repo.full_name.split("/");
      const result = await patchApi.validate(owner, repoName, branch.name, patch);
      setValid(result.valid);
      setError(result.message || null);
    } catch (e) {
      setValid(false);
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const acceptAndContinue = () => {
    router.push("/commit-pr");
  };

  if (!repo || !branch || !patch) {
    router.back();
    return null;
  }

  const lines = patch.split("\n");

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TerminalText style={styles.headerTitle}>
          {`> git diff --staged`}
        </TerminalText>
        <TouchableOpacity
          style={[styles.validateBadge, valid === true && styles.validBadge, valid === false && styles.invalidBadge]}
          onPress={validate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.text} />
          ) : (
            <Text style={styles.badgeText}>
              {valid === null ? "VALIDATE" : valid ? "VALID" : "INVALID"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Octicons name="alert" size={12} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ScrollView style={styles.diffContainer} contentContainerStyle={styles.diffContent}>
        {lines.map((line: string, i: number) => (
          <DiffLine key={i} line={line} index={i} />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Reject Patch"
          onPress={() => router.back()}
          variant="secondary"
          style={styles.footerBtn}
        />
        <Button
          title="Accept & Commit"
          onPress={acceptAndContinue}
          variant="primary"
          disabled={valid === false}
          style={styles.footerBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  headerTitle: {
    fontSize: Typography.size.sm,
    color: Colors.success,
  },
  validateBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  validBadge: { backgroundColor: Colors.success },
  invalidBadge: { backgroundColor: Colors.danger },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  errorBox: {
    flexDirection: "row",
    backgroundColor: `${Colors.danger}15`,
    padding: Spacing.md,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.danger,
  },
  errorText: {
    color: Colors.danger,
    fontSize: Typography.size.xs,
    marginLeft: Spacing.sm,
    fontFamily: "monospace",
  },
  diffContainer: {
    flex: 1,
  },
  diffContent: {
    paddingVertical: Spacing.sm,
  },
  lineWrapper: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    paddingVertical: 1,
  },
  lineNumber: {
    width: 30,
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: "monospace",
    textAlign: "right",
    marginRight: Spacing.md,
  },
  codeText: {
    fontSize: 11,
    fontFamily: "monospace",
    flex: 1,
  },
  addLine: {
    backgroundColor: `${Colors.success}10`,
  },
  delLine: {
    backgroundColor: `${Colors.danger}10`,
  },
  headerLine: {
    backgroundColor: `${Colors.accent}10`,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: `${Colors.accent}20`,
    marginVertical: 4,
  },
  footer: {
    padding: Spacing.md,
    flexDirection: "row",
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  footerBtn: {
    flex: 1,
  },
});
