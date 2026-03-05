/**
 * Storage abstraction: SecureStore when available (standalone/dev build),
 * AsyncStorage when running in Expo Go (SecureStore not supported).
 */
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const isExpoGo = Constants.appOwnership === "expo";

export const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (isExpoGo) {
        return await AsyncStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (isExpoGo) {
        await AsyncStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch {
      // Fallback: no-op (e.g. simulator without SecureStore)
    }
  },

  async deleteItem(key: string): Promise<void> {
    try {
      if (isExpoGo) {
        await AsyncStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch {
      // Fallback: no-op
    }
  },
};
