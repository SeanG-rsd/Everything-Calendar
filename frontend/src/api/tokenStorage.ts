import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'ec_token';

// expo-secure-store has no native backing on web (Keychain/Keystore don't exist
// there), so fall back to localStorage when running via `expo start --web`.
const webStorage = {
  async get(): Promise<string | null> {
    return localStorage.getItem(TOKEN_KEY);
  },
  async set(token: string): Promise<void> {
    localStorage.setItem(TOKEN_KEY, token);
  },
  async clear(): Promise<void> {
    localStorage.removeItem(TOKEN_KEY);
  },
};

const nativeStorage = {
  get(): Promise<string | null> {
    return SecureStore.getItemAsync(TOKEN_KEY);
  },
  set(token: string): Promise<void> {
    return SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  clear(): Promise<void> {
    return SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};

export const tokenStorage = Platform.OS === 'web' ? webStorage : nativeStorage;
