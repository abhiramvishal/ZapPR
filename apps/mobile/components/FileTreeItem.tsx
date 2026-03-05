import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors, Spacing, Typography } from "@/lib/theme";

type GitStatus = "M" | "A" | "D" | "?";

interface FileTreeItemProps {
  path: string;
  isFolder?: boolean;
  status?: GitStatus;
  isSelected?: boolean;
  indent?: number;
  onPress: () => void;
  onLongPress?: () => void;
}

const statusColors: Record<GitStatus, string> = {
  M: Colors.warning,
  A: Colors.success,
  D: Colors.danger,
  "?": Colors.textMuted,
};

export const FileTreeItem = ({
  path,
  isFolder = false,
  status,
  isSelected,
  indent = 0,
  onPress,
  onLongPress,
}: FileTreeItemProps) => {
  const displayName = path.split("/").pop() || path;
  return (
    <TouchableOpacity
      style={[styles.item, { paddingLeft: Spacing.md + indent * Spacing.lg }, isSelected && styles.selected]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <Text style={styles.icon}>{isFolder ? "🗂" : "📄"}</Text>
      <Text style={[styles.name, isSelected && styles.nameSelected]} numberOfLines={1}>
        {displayName}
      </Text>
      {status && (
        <View style={[styles.statusBadge, { backgroundColor: `${statusColors[status]}30` }]}>
          <Text style={[styles.statusText, { color: statusColors[status] }]}>{status}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingRight: Spacing.md,
  },
  selected: {
    backgroundColor: Colors.surface,
  },
  icon: {
    fontSize: 14,
    marginRight: Spacing.sm,
  },
  name: {
    flex: 1,
    color: Colors.textMuted,
    fontSize: Typography.size.sm,
    ...Typography.mono,
  },
  nameSelected: {
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    ...Typography.mono,
  },
});
