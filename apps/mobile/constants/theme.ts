export const colors = {
  bg: "#0D0F12",
  surface: "#161B22",
  border: "#30363D",
  primary: "#58A6FF",
  success: "#3FB950",
  danger: "#F85149",
  warning: "#D29922",
  muted: "#8B949E",
  text: "#E6EDF3",
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

import { Platform } from "react-native";

export const font = {
  ui: undefined as string | undefined,
  mono: Platform.OS === "ios" ? "Menlo" : "monospace",
};
