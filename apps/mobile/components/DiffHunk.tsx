import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Spacing, Typography } from "@/lib/theme";

interface DiffHunkProps {
  line: string;
  lineNumber?: number;
  onAccept?: () => void;
  onReject?: () => void;
}

export const DiffHunk = ({ line, lineNumber }: DiffHunkProps) => {
  const isAdd = line.startsWith("+") && !line.startsWith("+++");
  const isDel = line.startsWith("-") && !line.startsWith("---");
  const isHeader = line.startsWith("@@") || line.startsWith("---") || line.startsWith("+++");

  const lineStyle = isAdd ? styles.addLine : isDel ? styles.delLine : isHeader ? styles.headerLine : styles.contextLine;
  const textColor = isAdd ? Colors.success : isDel ? Colors.danger : isHeader ? Colors.primary : Colors.textMuted;

  return (
    <View style={[styles.row, lineStyle]}>
      <Text style={styles.lineNum}>{lineNumber ?? ""}</Text>
      <Text style={[styles.content, { color: textColor }]}>{line}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
    paddingHorizontal: Spacing.md,
  },
  lineNum: {
    width: 40,
    textAlign: "right",
    marginRight: Spacing.md,
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    ...Typography.mono,
  },
  content: {
    flex: 1,
    fontSize: Typography.size.sm,
    ...Typography.mono,
  },
  addLine: {
    backgroundColor: "#1A3A2A",
  },
  delLine: {
    backgroundColor: "#3A1A1A",
  },
  headerLine: {
    backgroundColor: `${Colors.primary}15`,
  },
  contextLine: {
    backgroundColor: "transparent",
  },
});
