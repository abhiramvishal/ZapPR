import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
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
import { useAuth } from "@/context/AuthContext";
import { API_BASE, apiFetch } from "@/constants/api";
import { colors, spacing } from "@/constants/theme";

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

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      // Expo Go: returns exp://IP:8081/--/auth/callback
      // Standalone/dev build: returns zappr://auth/callback
      const redirectUri = makeRedirectUri({ scheme: "zappr", path: "auth/callback" });
      const data = await apiFetch<{ auth_url: string; code_verifier: string; state: string }>(
        `/auth/github/start?redirect_uri=${encodeURIComponent(redirectUri)}`
      );

      WebBrowser.maybeCompleteAuthSession();
      const result = await WebBrowser.openAuthSessionAsync(data.auth_url, redirectUri);

      if (result.type === "success" && result.url) {
        const { code } = parseRedirectUrl(result.url);
        if (code) {
          const cb = await apiFetch<{ user: { id: number; login: string; avatar_url?: string }; access_token: string }>(
            `/auth/github/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(data.state)}&code_verifier=${encodeURIComponent(data.code_verifier)}&redirect_uri=${encodeURIComponent(redirectUri)}`
          );
          await login(cb.access_token, {
            id: cb.user.id,
            login: cb.user.login,
            avatar_url: cb.user.avatar_url,
          });
          router.replace("/(app)/repos");
        } else {
          Alert.alert("Error", "No authorization code received");
        }
      }
    } catch (e) {
      const msg = (e as Error).message;
      const hint = msg === "Network request failed"
        ? `Cannot reach API at ${API_BASE}. On a physical device, use your computer's LAN IP (e.g. http://192.168.1.x:8000) in .env.local, not localhost.`
        : msg;
      Alert.alert("Error", hint);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <Text style={styles.logo}>⚡ ZapPR</Text>
        <Text style={styles.subtitle}>Agentic Git Client</Text>
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
        <Text style={styles.hint}>
          API: {API_BASE}{'\n'}
          GitHub OAuth: exp://YOUR_IP:8081/--/auth/callback
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  content: { alignItems: "center" },
  logo: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 17,
    color: colors.muted,
    marginBottom: spacing.xl,
  },
  githubButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    width: "100%",
    gap: spacing.sm,
  },
  githubIcon: { color: colors.text, fontSize: 18 },
  githubText: { color: colors.text, fontSize: 16, fontWeight: "600" },
  hint: {
    marginTop: spacing.xl,
    fontSize: 11,
    color: colors.muted,
    textAlign: "center",
  },
});
