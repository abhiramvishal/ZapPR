import { Platform, StyleSheet } from "react-native";

export const Colors = {
  background: "#0D0F12",
  surface: "#161B22",
  border: "#30363D",
  primary: "#58A6FF",
  success: "#3FB950",
  danger: "#F85149",
  warning: "#D29922",
  textMuted: "#8B949E",
  text: "#E6EDF3",
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 48,
};

export const Typography = {
  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 28,
  },
  mono: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
};

export const GlobalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
