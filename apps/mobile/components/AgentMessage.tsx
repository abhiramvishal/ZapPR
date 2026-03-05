import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Spacing, Typography } from "@/lib/theme";

interface AgentMessageProps {
  content: string;
  isUser?: boolean;
  streaming?: boolean;
}

function parseContent(content: string): (string | { type: "code"; text: string })[] {
  const parts: (string | { type: "code"; text: string })[] = [];
  let remaining = content;

  while (remaining.length > 0) {
    const match = remaining.match(/```[\s\S]*?```/);
    if (match) {
      const before = remaining.slice(0, match.index);
      if (before) parts.push(before);
      parts.push({ type: "code", text: match[0].replace(/```/g, "").trim() });
      remaining = remaining.slice((match.index ?? 0) + match[0].length);
    } else {
      parts.push(remaining);
      break;
    }
  }

  return parts;
}

export const AgentMessage = ({ content, isUser, streaming }: AgentMessageProps) => {
  const parts = parseContent(content);

  const showCursor = streaming && content.length === 0;

  return (
    <View style={[styles.bubble, isUser ? styles.userBubble : styles.agentBubble]}>
      {parts.length > 0 ? (
        parts.map((p, i) =>
          typeof p === "string" ? (
            <Text key={i} style={[styles.text, isUser && styles.userText]}>
              {p}
              {streaming && i === parts.length - 1 && <Text style={styles.cursor}>▋</Text>}
            </Text>
          ) : (
            <View key={i} style={styles.codeBlock}>
              <Text style={styles.codeText}>{p.text}</Text>
            </View>
          )
        )
      ) : (
        showCursor && <Text style={styles.cursor}>▋</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    maxWidth: "85%",
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.sm,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: Colors.primary,
  },
  agentBubble: {
    alignSelf: "flex-start",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  text: {
    fontSize: Typography.size.md,
    color: Colors.text,
    lineHeight: 22,
  },
  userText: {
    color: "#FFFFFF",
  },
  codeBlock: {
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: 8,
    marginTop: Spacing.sm,
  },
  codeText: {
    fontSize: Typography.size.sm,
    color: Colors.text,
    ...Typography.mono,
  },
  cursor: {
    color: Colors.primary,
  },
});
