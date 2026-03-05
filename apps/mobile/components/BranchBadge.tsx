import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Spacing, Typography } from "@/lib/theme";

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
    backgroundColor: `${Colors.primary}20`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
    maxWidth: 120,
  },
  text: {
    color: Colors.primary,
    fontSize: Typography.size.xs,
    ...Typography.mono,
  },
});
