import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

type BrowserStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

function getBrowserStorage(): BrowserStorage | null {
  if (Platform.OS !== "web") {
    return null;
  }

  return (
    (globalThis as typeof globalThis & { localStorage?: BrowserStorage })
      .localStorage ?? null
  );
}

export const secureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const browserStorage = getBrowserStorage();

    if (browserStorage) {
      return browserStorage.getItem(key);
    }

    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    const browserStorage = getBrowserStorage();

    if (browserStorage) {
      browserStorage.setItem(key, value);
      return;
    }

    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    const browserStorage = getBrowserStorage();

    if (browserStorage) {
      browserStorage.removeItem(key);
      return;
    }

    await SecureStore.deleteItemAsync(key);
  }
};
