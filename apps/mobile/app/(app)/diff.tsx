import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRepo } from "@/context/RepoContext";
import { colors, spacing } from "@/constants/theme";
import { DiffLine } from "@/components/DiffLine";
import { Button } from "@/components/Button";

export default function DiffScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { patches, setPatches } = useRepo();

  const allLines = useMemo(() => {
    const full = patches.join("\n");
    return full.split("\n");
  }, [patches]);

  const acceptAll = () => {
    router.push("/(app)/commit");
  };

  const rejectAll = () => {
    setPatches([]);
    router.back();
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <FlatList
        data={allLines}
        keyExtractor={(_, i) => String(i)}
        style={styles.diffList}
        contentContainerStyle={styles.diffContent}
        renderItem={({ item, index }) => <DiffLine line={item} lineNumber={index + 1} />}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.rejectBtn} onPress={rejectAll}>
          <Text style={styles.rejectText}>Reject All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.acceptBtn} onPress={acceptAll}>
          <Text style={styles.acceptText}>Accept All</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.proceedRow}>
        <Button title="Proceed to Commit →" onPress={acceptAll} style={styles.proceedBtn} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  diffList: { flex: 1 },
  diffContent: { paddingVertical: spacing.sm },
  footer: {
    flexDirection: "row",
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: colors.danger,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: "center",
  },
  rejectText: { color: "#fff", fontWeight: "600" },
  acceptBtn: {
    flex: 1,
    backgroundColor: colors.success,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: "center",
  },
  acceptText: { color: "#fff", fontWeight: "600" },
  proceedRow: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  proceedBtn: { height: 48 },
});
