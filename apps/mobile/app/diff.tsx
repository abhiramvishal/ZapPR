import { useRouter } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useRepoStore } from "@/lib/store";
import { patchApi } from "@/lib/api";

function DiffView({ patch }: { patch: string }) {
  const lines = patch.split("\n");
  return (
    <ScrollView style={styles.diffScroll} horizontal>
      <ScrollView nestedScrollEnabled>
        {lines.map((line, i) => {
          const isAdd = line.startsWith("+") && !line.startsWith("+++");
          const isDel = line.startsWith("-") && !line.startsWith("---");
          return (
            <Text
              key={i}
              style={[
                styles.diffLine,
                isAdd && styles.addLine,
                isDel && styles.delLine,
              ]}
            >
              {line}
            </Text>
          );
        })}
      </ScrollView>
    </ScrollView>
  );
}

export default function DiffScreen() {
  const router = useRouter();
  const { repo, branch, patch } = useRepoStore();
  const [valid, setValid] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validate = async () => {
    if (!repo || !branch || !patch) return;
    try {
      const [owner, repoName] = repo.full_name.split("/");
      const result = await patchApi.validate(owner, repoName, branch.name, patch);
      setValid(result.valid);
      setError(result.message || null);
    } catch (e) {
      setValid(false);
      setError((e as Error).message);
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
    <View style={styles.container}>
      <TouchableOpacity style={styles.validateBtn} onPress={validate}>
        <Text style={styles.validateBtnText}>Validate Patch</Text>
      </TouchableOpacity>
      {valid !== null && (
        <View style={styles.status}>
          <Text style={valid ? styles.validText : styles.invalidText}>
            {valid ? "✓ Valid" : `✗ ${error || "Invalid"}`}
          </Text>
        </View>
      )}
      <DiffView patch={patch} />
      {valid && (
        <TouchableOpacity style={styles.acceptBtn} onPress={acceptAndContinue}>
          <Text style={styles.acceptBtnText}>Accept & Continue to Commit</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a", padding: 16 },
  validateBtn: {
    backgroundColor: "#3b82f6",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  validateBtnText: { color: "#fff", fontWeight: "600" },
  status: { marginBottom: 12 },
  validText: { color: "#22c55e", fontWeight: "600" },
  invalidText: { color: "#ef4444" },
  diffScroll: {
    flex: 1,
    backgroundColor: "#18181b",
    borderRadius: 8,
    padding: 12,
  },
  diffLine: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "#a1a1aa",
  },
  addLine: { color: "#22c55e", backgroundColor: "#22c55e15" },
  delLine: { color: "#ef4444", backgroundColor: "#ef444415" },
  acceptBtn: {
    backgroundColor: "#22c55e",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  acceptBtnText: { color: "#fff", fontWeight: "600" },
});
