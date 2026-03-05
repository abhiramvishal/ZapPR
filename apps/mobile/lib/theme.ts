import { StyleSheet } from "react-native";

export const Colors = {
  background: "#0D0D0D", // Near black
  surface: "#1A1A1A",    // Dark grey for cards/sections
  border: "#27272A",     // 1px border color
  text: "#FFFFFF",       // Primary text
  textMuted: "#71717A",  // Secondary/muted text
  primary: "#FFFFFF",    // High contrast white for primary actions
  success: "#22C55E",    // Green for accept/A
  danger: "#EF4444",     // Red for reject/D
  warning: "#F59E0B",    // Amber for M
  accent: "#3B82F6",     // Blue for review/commit
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const Typography = {
  mono: {
    fontFamily: "SpaceMono", // Default Expo monospace, or "JetBrains Mono" if loaded
  },
  sans: {
    fontWeight: "400" as const,
  },
  bold: {
    fontWeight: "700" as const,
  },
  size: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 24,
  },
};

export const GlobalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  monoText: {
    fontFamily: "SpaceMono", // Ensure this matches available fonts
    color: Colors.text,
  },
  borderSide: {
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
});
