import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors, Spacing, Typography } from "@/lib/theme";

interface RepoCardProps {
  name: string;
  fullName: string;
  isPrivate: boolean;
  onPress: () => void;
}

export const RepoCard = ({ name, fullName, isPrivate, onPress }: RepoCardProps) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.header}>
      <Text style={styles.name}>{name}</Text>
      <View style={[styles.badge, isPrivate && styles.badgePrivate]}>
        <Text style={styles.badgeText}>{isPrivate ? "Private" : "Public"}</Text>
      </View>
    </View>
    <Text style={styles.fullName}>{fullName}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  name: {
    color: Colors.text,
    fontSize: Typography.size.lg,
    fontWeight: "600",
    flex: 1,
  },
  badge: {
    backgroundColor: `${Colors.primary}20`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
  },
  badgePrivate: {
    backgroundColor: `${Colors.warning}20`,
  },
  badgeText: {
    color: Colors.textMuted,
    fontSize: Typography.size.xs,
    fontWeight: "500",
  },
  fullName: {
    color: Colors.textMuted,
    fontSize: Typography.size.sm,
  },
});
