import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { DeliveryPartnerProfile } from '@/types/partner';
import { getOnboardingRoute } from '@/services/api/mappers/partnerProfile';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const PHONE_KEY = 'auth_phone';
const PROFILE_KEY = 'partner_profile';

type AuthState = {
  token: string | null;
  refreshToken: string | null;
  phone: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setTokens: (token: string, refreshToken: string) => Promise<void>;
  setPhone: (phone: string) => Promise<void>;
  loadSession: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  refreshToken: null,
  phone: null,
  isLoading: true,
  isAuthenticated: false,

  setTokens: async (token, refreshToken) => {
    set({ token, refreshToken, isAuthenticated: true });
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  },

  setPhone: async (phone) => {
    await SecureStore.setItemAsync(PHONE_KEY, phone);
    set({ phone });
  },

  loadSession: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      const phone = await SecureStore.getItemAsync(PHONE_KEY);
      set({
        token,
        refreshToken,
        phone,
        isAuthenticated: !!token,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(PHONE_KEY);
    await SecureStore.deleteItemAsync(PROFILE_KEY);
    set({ token: null, refreshToken: null, phone: null, isAuthenticated: false });
  },
}));

type PartnerState = {
  profile: DeliveryPartnerProfile | null;
  setProfile: (profile: DeliveryPartnerProfile) => Promise<void>;
  loadCachedProfile: () => Promise<void>;
  clearProfile: () => Promise<void>;
};

export const usePartnerStore = create<PartnerState>((set) => ({
  profile: null,

  setProfile: async (profile) => {
    await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(profile));
    set({ profile });
  },

  loadCachedProfile: async () => {
    const raw = await SecureStore.getItemAsync(PROFILE_KEY);
    if (!raw) return;
    try {
      set({ profile: JSON.parse(raw) as DeliveryPartnerProfile });
    } catch {
      // ignore corrupt cache
    }
  },

  clearProfile: async () => {
    await SecureStore.deleteItemAsync(PROFILE_KEY);
    set({ profile: null });
  },
}));

export { getOnboardingRoute };
