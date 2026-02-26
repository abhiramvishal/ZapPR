import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Web-compatible storage wrapper
export const storage = {
  async getItemAsync(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.error("localStorage error:", e);
        return null;
      }
    }
    return await SecureStore.getItemAsync(key);
  },

  async setItemAsync(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.error("localStorage error:", e);
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },

  async deleteItemAsync(key: string): Promise<void> {
    if (Platform.OS === "web") {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error("localStorage error:", e);
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};
