import React, { useEffect, useState } from "react";
import { Text, TextStyle, StyleSheet } from "react-native";
import { Colors, Typography } from "../lib/theme";

interface TerminalTextProps {
    children: string;
    streaming?: boolean;
    style?: TextStyle;
}

export const TerminalText = ({ children, streaming, style }: TerminalTextProps) => {
    const [showCursor, setShowCursor] = useState(true);

    useEffect(() => {
        if (streaming) {
            const interval = setInterval(() => {
                setShowCursor((v) => !v);
            }, 500);
            return () => clearInterval(interval);
        }
    }, [streaming]);

    return (
        <Text style={[styles.text, style]}>
            {children}
            {streaming && showCursor && <Text style={styles.cursor}>▋</Text>}
        </Text>
    );
};

const styles = StyleSheet.create({
    text: {
        fontFamily: "SpaceMono", // Default Expo monospace
        fontSize: Typography.size.md,
        color: Colors.text,
        lineHeight: 20,
    },
    cursor: {
        color: Colors.primary,
        fontSize: Typography.size.md,
    },
});
