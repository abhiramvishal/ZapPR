import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, font } from "@/constants/theme";

interface BranchBadgeProps {
  name: string;
}

export const BranchBadge = ({ name }: BranchBadgeProps) => (
  <View style={styles.badge}>
    <Text style={styles.text} numberOfLines={1}>
      {name}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    backgroundColor: `${colors.primary}20`,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    maxWidth: 120,
  },
  text: {
    color: colors.primary,
    fontSize: 11,
    fontFamily: font.mono,
  },
});
