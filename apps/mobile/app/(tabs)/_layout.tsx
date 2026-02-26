import { Tabs } from "expo-router";
import { useRouter } from "expo-router";
import { TouchableOpacity, Text } from "react-native";

export default function TabsLayout() {
  const router = useRouter();
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: "#18181b" },
        tabBarActiveTintColor: "#22c55e",
        tabBarInactiveTintColor: "#71717a",
        headerRight: () => (
          <TouchableOpacity onPress={() => router.push("/settings")} style={{ marginRight: 16 }}>
            <Text style={{ color: "#22c55e" }}>Settings</Text>
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen name="repos" options={{ title: "Repos" }} />
      <Tabs.Screen name="branches" options={{ title: "Branches" }} />
    </Tabs>
  );
}
