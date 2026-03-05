import { Tabs } from "expo-router";
import { useRouter } from "expo-router";
import { TouchableOpacity, Text, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Spacing, Typography } from "@/lib/theme";

export default function TabsLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          paddingBottom: insets.bottom > 0 ? insets.bottom - 8 : 8,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontSize: Typography.size.lg, fontWeight: "600" },
        headerRight: () => (
          <TouchableOpacity onPress={() => router.push("/settings")} style={{ marginRight: Spacing.lg }}>
            <Text style={{ color: Colors.primary, fontSize: Typography.size.md }}>Settings</Text>
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen name="repos" options={{ title: "ZapPR" }} />
      <Tabs.Screen name="branches" options={{ title: "Branches" }} />
    </Tabs>
  );
}
