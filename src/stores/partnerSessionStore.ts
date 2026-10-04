import { create } from 'zustand';
import type { PartnerDeliveryPreferences } from '@/types/partner';

type PartnerSessionState = {
  isOnline: boolean;
  latitude: number | null;
  longitude: number | null;
  preferences: PartnerDeliveryPreferences;
  setOnline: (online: boolean) => void;
  setLocation: (latitude: number, longitude: number) => void;
  setPreferences: (preferences: PartnerDeliveryPreferences) => void;
};

export const usePartnerSessionStore = create<PartnerSessionState>((set) => ({
  isOnline: false,
  latitude: 28.6139,
  longitude: 77.209,
  preferences: { scope: 'all_sellers' },
  setOnline: (isOnline) => set({ isOnline }),
  setLocation: (latitude, longitude) => set({ latitude, longitude }),
  setPreferences: (preferences) => set({ preferences }),
}));
