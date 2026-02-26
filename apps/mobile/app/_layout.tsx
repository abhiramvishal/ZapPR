import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { storage } from "@/lib/storage";

export default function RootLayout() {
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    storage.getItemAsync("jwt").then((t) => setHasToken(!!t));
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0a0a0a" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "600" },
          contentStyle: { backgroundColor: "#0a0a0a" },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/sign-in" options={{ title: "Sign in" }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="workspace" options={{ title: "Workspace" }} />
        <Stack.Screen name="diff" options={{ title: "Review Diff" }} />
        <Stack.Screen name="commit-pr" options={{ title: "Commit & PR" }} />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
      </Stack>
    </>
  );
}
