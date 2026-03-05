import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/context/AuthContext";
import { RepoProvider } from "@/context/RepoContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <RepoProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
          <Stack.Screen
            name="settings"
            options={{
              headerShown: true,
              title: "Settings",
              headerStyle: { backgroundColor: "#0D0F12" },
              headerTintColor: "#E6EDF3",
            }}
          />
        </Stack>
      </RepoProvider>
    </AuthProvider>
  );
}
