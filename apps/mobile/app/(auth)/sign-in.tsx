import * as AuthSession from "expo-auth-session";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { auth } from "@/lib/api";

export default function SignIn() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const redirectUri = Linking.createURL("auth/callback");
      const { auth_url, code_verifier, state } = await auth.startOAuth(redirectUri);
      const result = await AuthSession.startAsync({
        authUrl: auth_url,
        returnUrl: redirectUri,
      });

      if (result.type === "success" && result.params?.code) {
        const { access_token } = await auth.callback(
          result.params.code,
          code_verifier,
          result.params.state || state,
          redirectUri
        );
        await SecureStore.setItemAsync("jwt", access_token);
        router.replace("/(tabs)/repos");
      } else if (result.type === "error") {
        Alert.alert("Error", result.error?.message || "Sign in failed");
      }
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ZapPR</Text>
      <Text style={styles.subtitle}>
        Agentic Git Client — generate patches, review diffs, open PRs
      </Text>
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign in with GitHub</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#0a0a0a",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#71717a",
    textAlign: "center",
    marginBottom: 48,
  },
  button: {
    backgroundColor: "#22c55e",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 200,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
