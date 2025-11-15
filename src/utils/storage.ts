import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  ACCESS_TOKEN: '@reddit_client:access_token',
  REFRESH_TOKEN: '@reddit_client:refresh_token',
  TOKEN_EXPIRY: '@reddit_client:token_expiry',
  USER_DATA: '@reddit_client:user_data',
  SUBSCRIBED_SUBREDDITS: '@reddit_client:subscribed_subreddits',
};

export const storage = {
  async getAccessToken(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  async setAccessToken(token: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  async setRefreshToken(token: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  },

  async getTokenExpiry(): Promise<number | null> {
    const expiry = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
    return expiry ? parseInt(expiry, 10) : null;
  },

  async setTokenExpiry(expiry: number): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiry.toString());
  },

  async clearAuth(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.TOKEN_EXPIRY,
      STORAGE_KEYS.USER_DATA,
    ]);
  },

  async getUserData(): Promise<any | null> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  },

  async setUserData(data: any): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data));
  },

  async getSubscribedSubreddits(): Promise<string[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIBED_SUBREDDITS);
    return data ? JSON.parse(data) : [];
  },

  async setSubscribedSubreddits(subreddits: string[]): Promise<void> {
    await AsyncStorage.setItem(
      STORAGE_KEYS.SUBSCRIBED_SUBREDDITS,
      JSON.stringify(subreddits),
    );
  },
};

