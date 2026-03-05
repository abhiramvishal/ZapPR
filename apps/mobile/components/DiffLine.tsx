import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, font } from "@/constants/theme";

interface DiffLineProps {
  line: string;
  lineNumber?: number;
}

export const DiffLine = ({ line, lineNumber }: DiffLineProps) => {
  const isAdd = line.startsWith("+") && !line.startsWith("+++");
  const isDel = line.startsWith("-") && !line.startsWith("---");
  const isHeader = line.startsWith("@@") || line.startsWith("---") || line.startsWith("+++");

  const lineStyle = isAdd ? styles.addLine : isDel ? styles.delLine : isHeader ? styles.headerLine : styles.contextLine;
  const textColor = isAdd ? colors.success : isDel ? colors.danger : isHeader ? colors.primary : colors.muted;

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
    paddingHorizontal: spacing.md,
  },
  lineNum: {
    width: 40,
    textAlign: "right",
    marginRight: spacing.md,
    fontSize: 11,
    color: colors.muted,
    fontFamily: font.mono,
  },
  content: {
    flex: 1,
    fontSize: 13,
    fontFamily: font.mono,
  },
  addLine: {
    backgroundColor: "#1A3A2A",
  },
  delLine: {
    backgroundColor: "#3A1A1A",
  },
  headerLine: {
    backgroundColor: `${colors.primary}15`,
  },
  contextLine: {
    backgroundColor: "transparent",
  },
});
