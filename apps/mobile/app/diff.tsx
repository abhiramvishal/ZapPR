import { useRouter } from "expo-router";
import { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  PanResponder,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRepoStore } from "@/lib/store";
import { patchApi } from "@/lib/api";
import { Colors, Spacing, Typography } from "@/lib/theme";
import { DiffHunk } from "@/components/DiffHunk";
import { Button } from "@/components/Button";

function parsePatchToFiles(patch: string): { path: string; lines: string[] }[] {
  const files: { path: string; lines: string[] }[] = [];
  const lines = patch.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("--- ")) {
      const oldPath = line.slice(4).split("\t")[0].trim().replace(/^a\//, "");
      i++;
      if (i < lines.length && lines[i].startsWith("+++ ")) {
        const newPath = lines[i].slice(4).split("\t")[0].trim().replace(/^b\//, "");
        const path = newPath || oldPath;
        const fileLines: string[] = [lines[i - 1], lines[i]];
        i++;
        while (i < lines.length && !lines[i].startsWith("--- ")) {
          fileLines.push(lines[i]);
          i++;
        }
        files.push({ path, lines: fileLines });
      } else {
        i++;
      }
    } else {
      i++;
    }
  }
  return files;
}

export default function DiffScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { repo, branch, patch } = useRepoStore((s) => s);
  const [valid, setValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileIndex, setFileIndex] = useState(0);
  const [acceptedHunks, setAcceptedHunks] = useState<Set<number>>(new Set());

  const files = useMemo(() => (patch ? parsePatchToFiles(patch) : []), [patch]);
  const currentFile = files[fileIndex];
  const allLines = currentFile?.lines ?? [];

  const validate = async () => {
    if (!repo || !branch || !patch) return;
    setLoading(true);
    setError(null);
    try {
      const [owner, repoName] = repo.full_name.split("/");
      const result = await patchApi.validate(owner, repoName, branch.name, patch);
      setValid(result.valid);
      setError(result.message ?? null);
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

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.fileName} numberOfLines={1}>
          {currentFile?.path ?? "diff"}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.acceptAllBtn} onPress={() => setAcceptedHunks(new Set(allLines.map((_, i) => i)))}>
            <Text style={styles.headerBtnText}>Accept all</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectAllBtn} onPress={() => setAcceptedHunks(new Set())}>
            <Text style={styles.headerBtnText}>Reject all</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.validateBadge, valid === true && styles.validBadge, valid === false && styles.invalidBadge]}
        onPress={validate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.badgeText}>{valid === null ? "Validate" : valid ? "Valid" : "Invalid"}</Text>
        )}
      </TouchableOpacity>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={allLines}
        keyExtractor={(_, i) => String(i)}
        style={styles.diffList}
        contentContainerStyle={styles.diffContent}
        renderItem={({ item, index }) => (
          <DiffHunk line={item} lineNumber={index + 1} />
        )}
      />

      <View style={styles.footer}>
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.navBtn, fileIndex === 0 && styles.navBtnDisabled]}
            onPress={() => setFileIndex((i) => Math.max(0, i - 1))}
            disabled={fileIndex === 0}
          >
            <Text style={styles.navBtnText}>← Prev file</Text>
          </TouchableOpacity>
          <Text style={styles.navLabel}>
            {fileIndex + 1} / {files.length}
          </Text>
          <TouchableOpacity
            style={[styles.navBtn, fileIndex >= files.length - 1 && styles.navBtnDisabled]}
            onPress={() => setFileIndex((i) => Math.min(files.length - 1, i + 1))}
            disabled={fileIndex >= files.length - 1}
          >
            <Text style={styles.navBtnText}>Next file →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.actionRow}>
          <Button title="Reject" variant="secondary" onPress={() => router.back()} style={styles.footerBtn} />
          <Button
            title="Accept & Continue"
            onPress={acceptAndContinue}
            disabled={valid === false}
            style={styles.footerBtn}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  fileName: {
    flex: 1,
    color: Colors.text,
    fontSize: Typography.size.md,
    ...Typography.mono,
  },
  headerActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  acceptAllBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  rejectAllBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  headerBtnText: {
    color: Colors.primary,
    fontSize: Typography.size.sm,
    fontWeight: "500",
  },
  validateBadge: {
    alignSelf: "flex-start",
    margin: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  validBadge: { backgroundColor: Colors.success },
  invalidBadge: { backgroundColor: Colors.danger },
  badgeText: {
    color: "#fff",
    fontSize: Typography.size.sm,
    fontWeight: "600",
  },
  errorBox: {
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
    backgroundColor: `${Colors.danger}20`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  errorText: {
    color: Colors.danger,
    fontSize: Typography.size.sm,
  },
  diffList: { flex: 1 },
  diffContent: { paddingVertical: Spacing.sm },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  navBtn: {
    padding: Spacing.sm,
  },
  navBtnDisabled: {
    opacity: 0.5,
  },
  navBtnText: {
    color: Colors.primary,
    fontSize: Typography.size.sm,
  },
  navLabel: {
    color: Colors.textMuted,
    fontSize: Typography.size.sm,
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  footerBtn: {
    flex: 1,
  },
});
