import { USE_MOCK_API, apiClient, normalizePhone, uploadMultipart } from './client';
import { mockApi } from './mock';
import { mapActiveTrip } from './mappers/activeTrip';
import { mapActiveRun } from './mappers/activeRun';
import { mapBackendProfile } from './mappers/partnerProfile';
import type {
  ActiveTrip,
  ActiveDeliveryRun,
  DeliveryPartnerProfile,
  DeliveryRequest,
  PartnerDeliveryPreferences,
  PartnerOrder,
  PartnerOrdersTab,
  TripStep,
  VehicleType,
} from '@/types/partner';
import type {
  BankAccount,
  EarningsSummary,
  KycInfo,
  PartnerOnlineStatus,
  Payout,
  ShiftHistoryEntry,
} from '@/types/common';
import type { NearbyStore } from '@/types/store';
import type { NearbySeller } from '@/types/seller';

export const authService = {
  sendOtp: (phone: string) =>
    USE_MOCK_API
      ? mockApi.auth.sendOtp(phone)
      : apiClient('/auth/otp/send', {
          method: 'POST',
          body: { phone: normalizePhone(phone), userType: 'DELIVERY_PARTNER' },
        }),
  verifyOtp: (phone: string, otp: string) =>
    USE_MOCK_API
      ? mockApi.auth.verifyOtp(phone, otp)
      : apiClient<{ token: string; refreshToken: string }>('/auth/otp/verify', {
          method: 'POST',
          body: { phone: normalizePhone(phone), otp, userType: 'DELIVERY_PARTNER' },
        }),
  logout: () =>
    USE_MOCK_API ? mockApi.auth.logout() : apiClient('/auth/logout', { method: 'POST' }),
};

export const storesService = {
  getNearby: (latitude: number, longitude: number, radiusKm = 15): Promise<NearbyStore[]> =>
    USE_MOCK_API
      ? mockApi.stores.getNearby(latitude, longitude, radiusKm)
      : apiClient<NearbyStore[]>(
          `/delivery-partner/stores/nearby?lat=${latitude}&lng=${longitude}&radiusKm=${radiusKm}`,
        ),
};

export const sellersService = {
  getNearby: (latitude: number, longitude: number, radiusKm = 15): Promise<NearbySeller[]> =>
    USE_MOCK_API
      ? mockApi.sellers.getNearby(latitude, longitude, radiusKm)
      : apiClient<NearbySeller[]>(
          `/delivery-partner/sellers/nearby?lat=${latitude}&lng=${longitude}&radiusKm=${radiusKm}`,
        ),
};

export const deliveryPartnerService = {
  getProfile: async (): Promise<DeliveryPartnerProfile> => {
    if (USE_MOCK_API) return mockApi.partner.getProfile();
    const raw = await apiClient<Record<string, unknown>>('/delivery-partner/profile');
    return mapBackendProfile(raw);
  },
  updateProfile: async (data: {
    name?: string;
    city?: string;
    vehicleType?: VehicleType;
  }): Promise<DeliveryPartnerProfile> => {
    if (USE_MOCK_API) return mockApi.partner.updateProfile(data);
    const raw = await apiClient<Record<string, unknown>>('/delivery-partner/profile', {
      method: 'PATCH',
      body: data,
    });
    return mapBackendProfile(raw);
  },
  completeOnboarding: async (
    bank: Pick<BankAccount, 'accountHolderName' | 'bankName' | 'accountNumber' | 'ifscCode'>,
  ): Promise<DeliveryPartnerProfile> => {
    if (USE_MOCK_API) return mockApi.partner.completeOnboarding(bank);
    const raw = await apiClient<Record<string, unknown>>('/delivery-partner/onboarding/complete', {
      method: 'POST',
      body: {
        bankDetails: {
          accountHolderName: bank.accountHolderName,
          bankName: bank.bankName,
          accountNumber: bank.accountNumber,
          ifscCode: bank.ifscCode,
        },
      },
    });
    return mapBackendProfile(raw);
  },
  approveForDemo: async (): Promise<DeliveryPartnerProfile> => {
    if (USE_MOCK_API) return mockApi.partner.approveForDemo();
    const raw = await apiClient<Record<string, unknown>>(
      '/delivery-partner/onboarding/dev-approve',
      { method: 'POST' },
    );
    return mapBackendProfile(raw);
  },
  getSession: (): Promise<
    PartnerOnlineStatus & {
      deliveryScope?: PartnerDeliveryPreferences['scope'];
      storeId?: string | null;
      sellerId?: string | null;
    }
  > =>
    USE_MOCK_API
      ? mockApi.session.getSession()
      : apiClient('/delivery-partner/session'),
  updatePreferences: (
    preferences: PartnerDeliveryPreferences,
  ): Promise<{
    isOnline: boolean;
    deliveryScope?: PartnerDeliveryPreferences['scope'];
    storeId?: string | null;
    sellerId?: string | null;
  }> =>
    USE_MOCK_API
      ? Promise.resolve({
          isOnline: false,
          deliveryScope: preferences.scope,
          storeId: preferences.storeId ?? null,
          sellerId: preferences.sellerId ?? null,
        })
      : apiClient('/delivery-partner/preferences', {
          method: 'PATCH',
          body: preferences,
        }),
};

export const kycService = {
  getStatus: (): Promise<KycInfo> =>
    USE_MOCK_API
      ? mockApi.kyc.getStatus()
      : apiClient<KycInfo>('/delivery-partner/kyc/status'),
  uploadDocument: (type: string, uri: string) =>
    USE_MOCK_API
      ? mockApi.kyc.uploadDocument(type, uri)
      : uploadMultipart<KycInfo>('/delivery-partner/kyc/upload', type, uri),
};

export const bankService = {
  get: (): Promise<BankAccount | null> =>
    USE_MOCK_API ? mockApi.bank.get() : apiClient<BankAccount>('/delivery-partner/bank'),
};

export const deliveryService = {
  getAvailableRequests: (
    latitude: number,
    longitude: number,
    preferences: PartnerDeliveryPreferences
  ): Promise<DeliveryRequest[]> =>
    USE_MOCK_API
      ? mockApi.delivery.getAvailableRequests(latitude, longitude, preferences)
      : apiClient<DeliveryRequest[]>(
          `/delivery-partner/requests?lat=${latitude}&lng=${longitude}&scope=${preferences.scope}${
            preferences.storeId ? `&storeId=${preferences.storeId}` : ''
          }${preferences.sellerId ? `&sellerId=${preferences.sellerId}` : ''}`
        ),
  acceptRequest: async (requestId: string, partnerId: string, partnerName: string) => {
    if (USE_MOCK_API) {
      return mockApi.delivery.acceptRequest(requestId, partnerId, partnerName);
    }
    const raw = await apiClient<unknown>(`/delivery-partner/requests/${requestId}/accept`, {
      method: 'POST',
      body: { partnerId, partnerName },
    });
    const trip = mapActiveTrip(raw);
    if (!trip) throw new Error('Invalid active trip response');
    return trip;
  },
  acceptRequestBatch: async (
    assignmentIds: string[],
    partnerId: string,
    partnerName: string,
    partnerLat: number,
    partnerLng: number,
  ): Promise<ActiveDeliveryRun> => {
    if (USE_MOCK_API) {
      return mockApi.delivery.acceptRequestBatch(
        assignmentIds,
        partnerId,
        partnerName,
        partnerLat,
        partnerLng,
      );
    }
    const raw = await apiClient<unknown>('/delivery-partner/requests/accept-batch', {
      method: 'POST',
      body: { assignmentIds },
    });
    const run = mapActiveRun(raw);
    if (!run) throw new Error('Invalid active run response');
    return run;
  },
  rejectRequest: (requestId: string) =>
    USE_MOCK_API
      ? mockApi.delivery.rejectRequest(requestId)
      : apiClient<DeliveryRequest>(`/delivery-partner/requests/${requestId}/reject`, {
          method: 'POST',
        }),
  listMyOrders: (tab: PartnerOrdersTab): Promise<PartnerOrder[]> =>
    USE_MOCK_API
      ? mockApi.delivery.listMyOrders(tab)
      : apiClient<PartnerOrder[]>(`/delivery-partner/orders?tab=${tab}`),
  getActiveRun: async (): Promise<ActiveDeliveryRun | null> => {
    if (USE_MOCK_API) return mockApi.delivery.getActiveRun();
    const raw = await apiClient<unknown>('/delivery-partner/runs/active');
    return mapActiveRun(raw);
  },
  getActiveTrip: async (): Promise<ActiveTrip | null> => {
    if (USE_MOCK_API) return mockApi.delivery.getActiveTrip();
    const raw = await apiClient<unknown>('/delivery-partner/trips/active');
    return mapActiveTrip(raw);
  },
  advanceActiveRun: async (): Promise<ActiveDeliveryRun | null> => {
    if (USE_MOCK_API) return mockApi.delivery.advanceActiveRun();
    const raw = await apiClient<unknown>('/delivery-partner/runs/active/advance', { method: 'POST' });
    return mapActiveRun(raw);
  },
  advanceTrip: async (): Promise<ActiveTrip | null> => {
    if (USE_MOCK_API) return mockApi.delivery.advanceTrip();
    const raw = await apiClient<unknown>('/delivery-partner/trips/active/advance', { method: 'POST' });
    return mapActiveTrip(raw);
  },
  updateTripStatus: async (status: TripStep | 'picked_up' | 'delivered') => {
    if (USE_MOCK_API) return mockApi.delivery.updateTripStep(status as TripStep);
    const raw = await apiClient<unknown>('/delivery-partner/trips/active/status', {
      method: 'PATCH',
      body: { status },
    });
    const trip = mapActiveTrip(raw);
    if (!trip) throw new Error('Invalid active trip response');
    return trip;
  },
};

export const earningsService = {
  getSummary: (): Promise<EarningsSummary> =>
    USE_MOCK_API ? mockApi.earnings.getSummary() : apiClient('/delivery-partner/earnings'),
  getPayouts: (): Promise<Payout[]> =>
    USE_MOCK_API ? mockApi.earnings.getPayouts() : apiClient('/delivery-partner/payouts'),
  getShiftHistory: (): Promise<ShiftHistoryEntry[]> =>
    USE_MOCK_API
      ? mockApi.earnings.getShiftHistory()
      : apiClient('/delivery-partner/shifts'),
};

export const deviceService = {
  registerPushToken: (token: string) =>
    USE_MOCK_API
      ? mockApi.devices.registerPushToken(token)
      : apiClient('/delivery-partner/devices', { method: 'POST', body: { pushToken: token } }),
};

export const partnerSessionService = {
  setOnline: (isOnline: boolean): Promise<PartnerOnlineStatus> =>
    USE_MOCK_API
      ? mockApi.session.setOnline(isOnline)
      : apiClient<PartnerOnlineStatus>('/delivery-partner/online-status', {
          method: 'PATCH',
          body: { isOnline },
        }),
  updateLocation: (latitude: number, longitude: number) =>
    USE_MOCK_API
      ? Promise.resolve({ success: true })
      : apiClient('/delivery-partner/location', {
          method: 'PATCH',
          body: { lat: String(latitude), lng: String(longitude) },
        }),
};
