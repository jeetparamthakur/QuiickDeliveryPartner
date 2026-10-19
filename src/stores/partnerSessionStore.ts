import { create } from 'zustand';
import type { PartnerOnlineStatus } from '@/types/common';
import type { PartnerDeliveryPreferences } from '@/types/partner';

type PartnerSessionState = PartnerOnlineStatus & {
  onlineMetricsSyncedAt: number;
  latitude: number | null;
  longitude: number | null;
  preferences: PartnerDeliveryPreferences;
  applyOnlineStatus: (status: PartnerOnlineStatus) => void;
  setLocation: (latitude: number, longitude: number) => void;
  setPreferences: (preferences: PartnerDeliveryPreferences) => void;
};

export const usePartnerSessionStore = create<PartnerSessionState>((set) => ({
  isOnline: false,
  currentShiftStartedAt: null,
  todayOnlineMinutes: 0,
  onlineMetricsSyncedAt: Date.now(),
  latitude: 28.6139,
  longitude: 77.209,
  preferences: { scope: 'all_sellers' },
  applyOnlineStatus: (status) =>
    set({
      isOnline: status.isOnline,
      currentShiftStartedAt: status.currentShiftStartedAt,
      todayOnlineMinutes: status.todayOnlineMinutes,
      onlineMetricsSyncedAt: Date.now(),
    }),
  setLocation: (latitude, longitude) => set({ latitude, longitude }),
  setPreferences: (preferences) => set({ preferences }),
}));
