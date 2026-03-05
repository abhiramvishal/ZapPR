import * as WebBrowser from "expo-web-browser";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { auth } from "@/lib/api";
import { Colors, Spacing, Typography } from "@/lib/theme";

function parseRedirectUrl(url: string): { code?: string; state?: string } {
  try {
    const parsed = new URL(url);
    return {
      code: parsed.searchParams.get("code") ?? undefined,
      state: parsed.searchParams.get("state") ?? undefined,
    };
  } catch {
    return {};
  }
}

export default function SignIn() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const redirectUri = Linking.createURL("auth/callback");
      const { auth_url, code_verifier, state } = await auth.startOAuth(redirectUri);
      const result = await WebBrowser.openAuthSessionAsync(auth_url, redirectUri);

      if (result.type === "success" && result.url) {
        const { code, state: returnedState } = parseRedirectUrl(result.url);
        if (code) {
          const { access_token } = await auth.callback(code, code_verifier, returnedState ?? state, redirectUri);
          await SecureStore.setItemAsync("jwt", access_token);
          router.replace("/(tabs)/repos");
        } else {
          Alert.alert("Error", "No authorization code received");
        }
      } else if (result.type === "cancel") {
        // User cancelled - no alert needed
      } else {
        Alert.alert("Error", "Sign in failed");
      }
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <Text style={styles.logo}>⚡ ZapPR</Text>
        <Text style={styles.subtitle}>Agentic Git Client</Text>
        <Text style={styles.description}>
          Generate patches, review diffs, and open PRs — all from your phone.
        </Text>
        <TouchableOpacity
          style={styles.githubButton}
          onPress={handleSignIn}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.githubIcon}>●</Text>
              <Text style={styles.githubText}>Sign in with GitHub</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    paddingHorizontal: Spacing.xxl,
  },
  content: {
    alignItems: "center",
  },
  logo: {
    fontSize: Typography.size.xxl,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.size.lg,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
  },
  description: {
    fontSize: Typography.size.md,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xxxxl,
  },
  githubButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    borderRadius: 12,
    width: "100%",
    gap: Spacing.sm,
  },
  githubIcon: {
    color: Colors.text,
    fontSize: 18,
  },
  githubText: {
    color: Colors.text,
    fontSize: Typography.size.md,
    fontWeight: "600",
  },
});
