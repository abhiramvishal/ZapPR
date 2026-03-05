import React from "react";
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from "react-native";
import { Colors, Spacing, Typography } from "../lib/theme";

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: "primary" | "secondary" | "danger" | "outline";
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Button = ({
    title,
    onPress,
    variant = "primary",
    loading,
    disabled,
    style,
    textStyle,
}: ButtonProps) => {
    const getBackgroundColor = () => {
        if (disabled) return "#27272A";
        switch (variant) {
            case "primary":
                return Colors.primary;
            case "secondary":
                return Colors.surface;
            case "danger":
                return Colors.danger;
            case "outline":
                return "transparent";
            default:
                return Colors.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return Colors.textMuted;
        switch (variant) {
            case "primary":
                return "#000000"; // High contrast black on white
            case "outline":
                return Colors.primary;
            default:
                return Colors.text;
        }
    };

    const borderStyle = variant === "outline" ? { borderWidth: 1, borderColor: Colors.border } : {};

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            style={[
                styles.button,
                { backgroundColor: getBackgroundColor() },
                borderStyle,
                style,
                disabled && styles.disabled,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} size="small" />
            ) : (
                <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
                    {title.toUpperCase()}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 48,
    },
    text: {
        fontSize: Typography.size.sm,
        fontWeight: "700",
        letterSpacing: 1,
    },
    disabled: {
        opacity: 0.5,
    },
});
