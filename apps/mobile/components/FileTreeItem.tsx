import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, spacing, font } from "@/constants/theme";

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
  M: colors.warning,
  A: colors.success,
  D: colors.danger,
  "?": colors.muted,
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
      style={[styles.item, { paddingLeft: spacing.md + indent * spacing.lg }, isSelected && styles.selected]}
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
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
  },
  selected: {
    backgroundColor: colors.surface,
  },
  icon: {
    fontSize: 14,
    marginRight: spacing.sm,
  },
  name: {
    flex: 1,
    color: colors.muted,
    fontSize: 14,
    fontFamily: font.mono,
  },
  nameSelected: {
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: font.mono,
  },
});
