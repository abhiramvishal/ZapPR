import * as AuthSession from "expo-auth-session";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { auth } from "../../lib/api";
import { Colors, Spacing, Typography } from "../../lib/theme";
import { Button } from "../../components/Button";
import { TerminalText } from "../../components/TerminalText";

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
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>ZapPR</Text>
          <View style={styles.cursor} />
        </View>
        <TerminalText style={styles.subtitle}>
          {"> Initializing Agentic Git Client..."}
        </TerminalText>
        <TerminalText style={styles.description} streaming>
          {"Ready to generate patches, review diffs, and open PRs from your pocket."}
        </TerminalText>

        <View style={styles.footer}>
          <Button
            title="Authenticate with GitHub"
            onPress={handleSignIn}
            loading={loading}
            style={styles.button}
          />
          <Text style={styles.version}>v0.1.0-alpha</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.xl,
    justifyContent: "center",
  },
  content: {
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.size.xxl,
    fontWeight: "700",
    color: Colors.text,
    letterSpacing: -1,
  },
  cursor: {
    width: 12,
    height: 24,
    backgroundColor: Colors.primary,
    marginLeft: 4,
  },
  subtitle: {
    color: Colors.success,
    fontSize: Typography.size.sm,
    marginBottom: Spacing.lg,
  },
  description: {
    fontSize: Typography.size.md,
    color: Colors.textMuted,
    lineHeight: 24,
    marginBottom: Spacing.xxl,
  },
  footer: {
    marginTop: Spacing.xl,
  },
  button: {
    marginBottom: Spacing.md,
  },
  version: {
    fontFamily: "SpaceMono",
    fontSize: Typography.size.xs,
    color: Colors.textMuted,
    textAlign: "center",
  },
});
