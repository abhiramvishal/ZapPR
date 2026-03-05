import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Colors, Spacing, Typography } from "@/lib/theme";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button = ({
  title,
  onPress,
  variant = "primary",
  loading,
  disabled,
  style,
  textStyle,
}: ButtonProps) => {
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";
  const isSecondary = variant === "secondary";

  const backgroundColor = disabled
    ? Colors.border
    : isPrimary
      ? Colors.primary
      : isDanger
        ? Colors.danger
        : "transparent";

  const textColor = disabled ? Colors.textMuted : isSecondary ? Colors.text : "#FFFFFF";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        { backgroundColor },
        isSecondary && styles.secondaryBorder,
        style,
        disabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text style={[styles.text, { color: textColor }, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    borderRadius: 8,
  },
  secondaryBorder: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  text: {
    fontSize: Typography.size.md,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.7,
  },
});
