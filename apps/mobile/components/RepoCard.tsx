import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, spacing } from "@/constants/theme";

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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  name: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "600",
    flex: 1,
  },
  badge: {
    backgroundColor: `${colors.primary}20`,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  badgePrivate: {
    backgroundColor: `${colors.warning}20`,
  },
  badgeText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "500",
  },
  fullName: {
    color: colors.muted,
    fontSize: 14,
  },
});
