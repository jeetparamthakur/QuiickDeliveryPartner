import { isPartnerWithinPickupRadius } from '@/utils/geo';
import type {
  ActiveTrip,
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
import { getDistanceKm } from '@/utils/geo';
import {
  advanceRunMicroStep,
  buildActiveRun,
  enrichActiveRun,
  MAX_RUN_ORDERS,
  type ActiveRunState,
} from '@/utils/deliveryRun';
import type { ActiveDeliveryRun } from '@/types/partner';

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

let mockProfile: DeliveryPartnerProfile = {
  id: 'dp-1',
  name: '',
  phone: '',
  city: '',
  vehicleType: 'bike',
  onboardingStep: 'profile',
  approvalStatus: 'pending',
  canGoOnline: false,
};

let mockKyc: KycInfo = { status: 'pending', documents: [] };
let mockBank: BankAccount | null = null;
let mockActiveRun: ActiveRunState | null = null;

const mockDeliveredOrders: PartnerOrder[] = [
  {
    id: 'dr-del-1',
    orderId: 'ord-88',
    orderNumber: 'QM-088',
    storeId: 'store-1',
    sellerId: 'seller-1',
    sellerType: 'STORE',
    pickupAddress: 'Quickmart Hub, Connaught Place, New Delhi',
    pickupLatitude: 28.6315,
    pickupLongitude: 77.2167,
    customerAddress: 'India Gate, New Delhi',
    customerLatitude: 28.6129,
    customerLongitude: 77.2295,
    partnerPickupRadiusKm: 8,
    status: 'delivered',
    orderTotal: 720,
    deliveryFee: 42,
    itemCount: 5,
    createdAt: '2026-10-15T10:30:00.000Z',
    completedAt: '2026-10-15T11:05:00.000Z',
  },
  {
    id: 'dr-del-2',
    orderId: 'ord-77',
    orderNumber: 'QM-077',
    sellerId: 'seller-ind-1',
    sellerType: 'INDEPENDENT_SELLER',
    pickupAddress: 'Karol Bagh Market, New Delhi',
    pickupLatitude: 28.6512,
    pickupLongitude: 77.191,
    customerAddress: 'Paharganj, New Delhi',
    customerLatitude: 28.6425,
    customerLongitude: 77.214,
    partnerPickupRadiusKm: 6,
    status: 'delivered',
    orderTotal: 480,
    deliveryFee: 35,
    itemCount: 2,
    createdAt: '2026-10-14T16:00:00.000Z',
    completedAt: '2026-10-14T16:40:00.000Z',
  },
];

const mockDeliveryRequests: DeliveryRequest[] = [
  {
    id: 'dr-1',
    orderId: 'ord-101',
    orderNumber: 'QM-101',
    storeId: 'store-1',
    sellerId: 'seller-1',
    sellerType: 'STORE',
    pickupAddress: 'Quickmart Hub, Connaught Place, New Delhi',
    pickupLatitude: 28.6315,
    pickupLongitude: 77.2167,
    customerAddress: '12 Janpath, New Delhi',
    customerLatitude: 28.6129,
    customerLongitude: 77.2295,
    partnerPickupRadiusKm: 8,
    status: 'requested',
    orderTotal: 840,
    deliveryFee: 45,
    itemCount: 6,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'dr-2',
    orderId: 'ord-102',
    orderNumber: 'QM-102',
    sellerId: 'seller-ind-1',
    sellerType: 'INDEPENDENT_SELLER',
    pickupAddress: 'Karol Bagh Market, New Delhi',
    pickupLatitude: 28.6512,
    pickupLongitude: 77.191,
    customerAddress: 'Rajendra Place, New Delhi',
    customerLatitude: 28.6425,
    customerLongitude: 77.1862,
    partnerPickupRadiusKm: 6,
    status: 'requested',
    orderTotal: 520,
    deliveryFee: 35,
    itemCount: 3,
    createdAt: new Date().toISOString(),
  },
];

let mockEarnings: EarningsSummary = {
  today: 420,
  week: 3180,
  month: 14200,
  total: 86500,
  pendingSettlement: 1200,
  availableBalance: 5600,
  nextSettlement: 1200,
  nextSettlementDate: '2026-10-05',
};

const mockPayouts: Payout[] = [
  { id: 'p1', amount: 4200, status: 'completed', date: '2026-09-28', reference: 'UTR123' },
  { id: 'p2', amount: 3800, status: 'processing', date: '2026-10-01' },
];

const mockShifts: ShiftHistoryEntry[] = [
  {
    id: 's1',
    startedAt: '2026-10-01T09:00:00.000Z',
    endedAt: '2026-10-01T14:30:00.000Z',
    durationMinutes: 330,
    deliveriesCompleted: 8,
    earnings: 640,
  },
];

let mockIsOnline = false;
let mockOpenShiftStartedAt: string | null = null;

function istDayStart(date: Date): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const y = parts.find((p) => p.type === 'year')!.value;
  const m = parts.find((p) => p.type === 'month')!.value;
  const d = parts.find((p) => p.type === 'day')!.value;
  return new Date(`${y}-${m}-${d}T00:00:00+05:30`);
}

function minutesInWindow(start: Date, end: Date, windowStart: Date, windowEnd: Date): number {
  const from = Math.max(start.getTime(), windowStart.getTime());
  const to = Math.min(end.getTime(), windowEnd.getTime());
  if (to <= from) return 0;
  return Math.floor((to - from) / 60000);
}

function mockTodayOnlineMinutes(): number {
  const now = new Date();
  const dayStart = istDayStart(now);
  const tomorrowStart = istDayStart(new Date(now.getTime() + 86400000));
  let total = 0;
  for (const shift of mockShifts) {
    total += minutesInWindow(
      new Date(shift.startedAt),
      new Date(shift.endedAt),
      dayStart,
      tomorrowStart,
    );
  }
  if (mockIsOnline && mockOpenShiftStartedAt) {
    total += minutesInWindow(new Date(mockOpenShiftStartedAt), now, dayStart, tomorrowStart);
  }
  return total;
}

function mockOnlineStatus(isOnline: boolean): PartnerOnlineStatus {
  return {
    isOnline,
    currentShiftStartedAt: isOnline ? mockOpenShiftStartedAt : null,
    todayOnlineMinutes: mockTodayOnlineMinutes(),
  };
}

function syncProfileStep() {
  if (mockProfile.approvalStatus === 'approved') {
    mockProfile = {
      ...mockProfile,
      onboardingStep: 'active',
      canGoOnline: true,
    };
    return;
  }
  if (mockBank && mockKyc.status !== 'pending') {
    mockProfile = {
      ...mockProfile,
      onboardingStep: 'pending_approval',
      canGoOnline: false,
    };
    return;
  }
  if (mockKyc.documents.length >= 2) {
    mockProfile = { ...mockProfile, onboardingStep: 'bank', canGoOnline: false };
    return;
  }
  if (mockProfile.name && mockProfile.city) {
    mockProfile = { ...mockProfile, onboardingStep: 'kyc', canGoOnline: false };
  }
}

function tripFromRun(run: ActiveRunState): ActiveTrip | null {
  const stop = run.stops[run.currentStopIndex];
  if (!stop) return null;
  const request = mockDeliveryRequests.find((r) => r.id === stop.assignmentIds[0]);
  if (!request) return null;
  const status =
    run.microStep === 'navigate_drop' || run.microStep === 'confirm_delivery'
      ? 'picked_up'
      : 'accepted';
  return {
    requestId: request.id,
    orderId: request.orderId,
    orderNumber: stop.orderNumbers.length > 1
      ? stop.orderNumbers.join(', ')
      : request.orderNumber,
    status,
    pickupAddress: request.pickupAddress,
    pickupLatitude: request.pickupLatitude,
    pickupLongitude: request.pickupLongitude,
    customerAddress: request.customerAddress,
    customerLatitude: request.customerLatitude,
    customerLongitude: request.customerLongitude,
    deliveryFee: stop.assignmentIds.reduce((sum, id) => {
      const row = mockDeliveryRequests.find((r) => r.id === id);
      return sum + (row?.deliveryFee ?? 0);
    }, 0),
    itemCount: stop.assignmentIds.reduce((sum, id) => {
      const row = mockDeliveryRequests.find((r) => r.id === id);
      return sum + (row?.itemCount ?? 0);
    }, 0),
    step: run.microStep,
  };
}

function markRequestsPickedUp(assignmentIds: string[]) {
  for (const id of assignmentIds) {
    const idx = mockDeliveryRequests.findIndex((r) => r.id === id);
    if (idx !== -1) {
      mockDeliveryRequests[idx] = { ...mockDeliveryRequests[idx], status: 'picked_up' };
    }
  }
}

function markRequestsDelivered(assignmentIds: string[]) {
  for (const id of assignmentIds) {
    const idx = mockDeliveryRequests.findIndex((r) => r.id === id);
    if (idx === -1) continue;
    const deliveredRequest = {
      ...mockDeliveryRequests[idx],
      status: 'delivered' as const,
    };
    mockDeliveryRequests[idx] = deliveredRequest;
    mockDeliveredOrders.unshift({
      ...deliveredRequest,
      completedAt: new Date().toISOString(),
      step: 'completed',
    });
  }
}

function partnerOrderStepForRun(run: ActiveRunState, assignmentId: string): TripStep | undefined {
  const order = run.orders.find((o) => o.assignmentId === assignmentId);
  if (!order) return undefined;
  if (order.deliveryDone) return 'completed';
  if (order.pickupDone) return 'navigate_drop';
  const current = run.stops[run.currentStopIndex];
  if (current?.assignmentIds.includes(assignmentId) && current.status === 'current') {
    return run.microStep;
  }
  return 'navigate_pickup';
}

export const mockApi = {
  session: {
    getSession: async () => {
      await delay(150);
      return {
        ...mockOnlineStatus(mockIsOnline),
        deliveryScope: 'all_sellers' as const,
        storeId: null,
        sellerId: null,
      };
    },
    setOnline: async (isOnline: boolean): Promise<PartnerOnlineStatus> => {
      await delay(200);
      if (isOnline && !mockIsOnline) {
        mockOpenShiftStartedAt = new Date().toISOString();
      }
      if (!isOnline && mockIsOnline && mockOpenShiftStartedAt) {
        const endedAt = new Date().toISOString();
        const startedAt = mockOpenShiftStartedAt;
        const durationMinutes = Math.max(
          0,
          Math.floor((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000),
        );
        mockShifts.unshift({
          id: `s-${Date.now()}`,
          startedAt,
          endedAt,
          durationMinutes,
          deliveriesCompleted: 0,
          earnings: 0,
        });
        mockOpenShiftStartedAt = null;
      }
      mockIsOnline = isOnline;
      return mockOnlineStatus(mockIsOnline);
    },
  },

  auth: {
    sendOtp: async (_phone: string) => {
      await delay();
      return { success: true };
    },
    verifyOtp: async (phone: string, otp: string) => {
      await delay();
      if (otp !== '123456' && otp !== '000000') {
        throw new Error('Invalid OTP');
      }
      mockProfile = { ...mockProfile, phone };
      return {
        token: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };
    },
    logout: async () => {
      await delay(200);
    },
  },

  partner: {
    getProfile: async (): Promise<DeliveryPartnerProfile> => {
      await delay();
      syncProfileStep();
      return { ...mockProfile };
    },
    updateProfile: async (data: {
      name?: string;
      city?: string;
      vehicleType?: VehicleType;
    }): Promise<DeliveryPartnerProfile> => {
      await delay();
      mockProfile = { ...mockProfile, ...data };
      syncProfileStep();
      return { ...mockProfile };
    },
    completeOnboarding: async (
      bank: Pick<BankAccount, 'accountHolderName' | 'bankName' | 'accountNumber' | 'ifscCode'>,
    ): Promise<DeliveryPartnerProfile> => {
      await delay();
      mockBank = { ...bank, verificationStatus: 'pending' };
      mockKyc = { ...mockKyc, status: 'under_review' };
      mockProfile = {
        ...mockProfile,
        onboardingStep: 'pending_approval',
        approvalStatus: 'pending',
        canGoOnline: false,
      };
      return { ...mockProfile };
    },
    approveForDemo: async (): Promise<DeliveryPartnerProfile> => {
      await delay();
      mockProfile = {
        ...mockProfile,
        approvalStatus: 'approved',
        onboardingStep: 'active',
        canGoOnline: true,
      };
      mockKyc = { ...mockKyc, status: 'approved' };
      return { ...mockProfile };
    },
  },

  kyc: {
    getStatus: async (): Promise<KycInfo> => {
      await delay();
      return { ...mockKyc, documents: [...mockKyc.documents] };
    },
    uploadDocument: async (type: string, uri: string): Promise<KycInfo> => {
      await delay();
      mockKyc = {
        ...mockKyc,
        status: 'under_review',
        documents: [
          ...mockKyc.documents.filter((d) => d.type !== type),
          {
            id: `${type}-${Date.now()}`,
            type: type as KycInfo['documents'][0]['type'],
            uri,
            uploadedAt: new Date().toISOString(),
          },
        ],
      };
      syncProfileStep();
      return mockKyc;
    },
  },

  bank: {
    get: async (): Promise<BankAccount | null> => {
      await delay();
      return mockBank ? { ...mockBank } : null;
    },
  },

  delivery: {
    getAvailableRequests: async (
      latitude: number,
      longitude: number,
      preferences: PartnerDeliveryPreferences
    ): Promise<DeliveryRequest[]> => {
      await delay(300);
      return mockDeliveryRequests.filter((request) => {
        if (request.status !== 'requested') return false;
        if (mockActiveRun) return false;

        if (preferences.scope === 'store') {
          if (request.sellerType !== 'STORE') return false;
          if (preferences.storeId && request.storeId !== preferences.storeId) return false;
        }
        if (preferences.scope === 'seller') {
          if (request.sellerType !== 'INDEPENDENT_SELLER') return false;
          if (preferences.sellerId && request.sellerId !== preferences.sellerId) return false;
        }

        if (
          request.partnerPickupRadiusKm == null ||
          !request.pickupLatitude ||
          !request.pickupLongitude
        ) {
          return false;
        }
        return isPartnerWithinPickupRadius(
          latitude,
          longitude,
          request.pickupLatitude,
          request.pickupLongitude,
          request.partnerPickupRadiusKm
        );
      });
    },
    acceptRequest: async (
      requestId: string,
      partnerId: string,
      partnerName: string
    ): Promise<ActiveTrip> => {
      await mockApi.delivery.acceptRequestBatch(
        [requestId],
        partnerId,
        partnerName,
        28.6139,
        77.209,
      );
      const trip = tripFromRun(mockActiveRun!);
      if (!trip) throw new Error('Could not start trip');
      return trip;
    },
    acceptRequestBatch: async (
      assignmentIds: string[],
      partnerId: string,
      partnerName: string,
      partnerLat: number,
      partnerLng: number,
    ): Promise<ActiveDeliveryRun> => {
      await delay();
      if (mockActiveRun) throw new Error('Finish your current run first');
      if (!assignmentIds.length) throw new Error('Select at least one request');
      if (assignmentIds.length > MAX_RUN_ORDERS) {
        throw new Error(`You can accept at most ${MAX_RUN_ORDERS} orders`);
      }

      const unique = [...new Set(assignmentIds)];
      const inputs = unique.map((id) => {
        const request = mockDeliveryRequests.find((r) => r.id === id);
        if (!request || request.status !== 'requested') {
          throw new Error('One or more requests are unavailable');
        }
        return {
          assignmentId: request.id,
          orderId: request.orderId,
          orderNumber: request.orderNumber,
          pickupLat: request.pickupLatitude,
          pickupLng: request.pickupLongitude,
          pickupAddress: request.pickupAddress,
          customerLat: request.customerLatitude,
          customerLng: request.customerLongitude,
          customerAddress: request.customerAddress,
          deliveryFee: request.deliveryFee,
          itemCount: request.itemCount,
        };
      });

      for (const id of unique) {
        const idx = mockDeliveryRequests.findIndex((r) => r.id === id);
        mockDeliveryRequests[idx] = { ...mockDeliveryRequests[idx], status: 'accepted' };
      }

      mockActiveRun = buildActiveRun(inputs, partnerLat, partnerLng);
      mockProfile = { ...mockProfile, id: partnerId, name: partnerName || mockProfile.name };
      return enrichActiveRun(mockActiveRun);
    },
    rejectRequest: async (requestId: string): Promise<DeliveryRequest> => {
      await delay();
      const idx = mockDeliveryRequests.findIndex((r) => r.id === requestId);
      if (idx === -1) throw new Error('Delivery request not found');
      mockDeliveryRequests[idx] = { ...mockDeliveryRequests[idx], status: 'rejected' };
      return mockDeliveryRequests[idx];
    },
    listMyOrders: async (tab: PartnerOrdersTab): Promise<PartnerOrder[]> => {
      await delay(300);
      if (tab === 'delivered') {
        return mockDeliveredOrders.map((o) => ({ ...o }));
      }
      if (!mockActiveRun) return [];
      const rows: PartnerOrder[] = [];
      for (const order of mockActiveRun.orders) {
        const request = mockDeliveryRequests.find((r) => r.id === order.assignmentId);
        if (!request) continue;
        rows.push({
          ...request,
          status: order.deliveryDone ? 'delivered' : order.pickupDone ? 'picked_up' : request.status,
          step: partnerOrderStepForRun(mockActiveRun!, order.assignmentId),
        });
      }
      return rows;
    },
    getActiveRun: async (): Promise<ActiveDeliveryRun | null> => {
      await delay(200);
      return mockActiveRun ? enrichActiveRun(mockActiveRun) : null;
    },
    getActiveTrip: async (): Promise<ActiveTrip | null> => {
      await delay(200);
      if (!mockActiveRun) return null;
      const trip = tripFromRun(mockActiveRun);
      return trip ? { ...trip } : null;
    },
    advanceActiveRun: async (): Promise<ActiveDeliveryRun | null> => {
      await delay();
      if (!mockActiveRun) return null;
      const stop = mockActiveRun.stops[mockActiveRun.currentStopIndex];
      if (!stop) {
        mockActiveRun = null;
        return null;
      }

      if (mockActiveRun.microStep === 'navigate_pickup') {
        mockActiveRun = { ...mockActiveRun, microStep: 'confirm_pickup' };
        return enrichActiveRun(mockActiveRun);
      }
      if (mockActiveRun.microStep === 'navigate_drop') {
        mockActiveRun = { ...mockActiveRun, microStep: 'confirm_delivery' };
        return enrichActiveRun(mockActiveRun);
      }
      if (mockActiveRun.microStep === 'confirm_pickup') {
        markRequestsPickedUp(stop.assignmentIds);
      }
      if (mockActiveRun.microStep === 'confirm_delivery') {
        markRequestsDelivered(stop.assignmentIds);
        const fee = stop.assignmentIds.reduce((sum, id) => {
          const row = mockDeliveryRequests.find((r) => r.id === id);
          return sum + (row?.deliveryFee ?? 0);
        }, 0);
        mockEarnings = {
          ...mockEarnings,
          today: mockEarnings.today + fee,
          week: mockEarnings.week + fee,
        };
      }

      const advanced = advanceRunMicroStep(mockActiveRun);
      if (advanced.completed) {
        mockActiveRun = null;
        return null;
      }
      mockActiveRun = advanced.run;
      return enrichActiveRun(mockActiveRun);
    },
    updateTripStep: async (step: TripStep): Promise<ActiveTrip> => {
      await delay();
      if (!mockActiveRun) throw new Error('No active trip');
      mockActiveRun = { ...mockActiveRun, microStep: step as ActiveRunState['microStep'] };
      const trip = tripFromRun(mockActiveRun);
      if (!trip) throw new Error('No active trip');
      return trip;
    },
    advanceTrip: async (): Promise<ActiveTrip | null> => {
      const run = await mockApi.delivery.advanceActiveRun();
      if (!run) return null;
      const trip = tripFromRun(mockActiveRun!);
      return trip ? { ...trip } : null;
    },
    seedRequest: async () => {
      const id = `dr-${Date.now()}`;
      mockDeliveryRequests.unshift({
        id,
        orderId: `ord-${id}`,
        orderNumber: `QM-${Math.floor(Math.random() * 900 + 100)}`,
        storeId: 'store-1',
        sellerId: 'seller-1',
        sellerType: 'STORE',
        pickupAddress: 'Quickmart Hub, Connaught Place, New Delhi',
        pickupLatitude: 28.6315,
        pickupLongitude: 77.2167,
        customerAddress: 'Sansad Marg, New Delhi',
        customerLatitude: 28.617,
        customerLongitude: 77.208,
        partnerPickupRadiusKm: 10,
        status: 'requested',
        orderTotal: 650,
        deliveryFee: 40,
        itemCount: 4,
        createdAt: new Date().toISOString(),
      });
    },
  },

  earnings: {
    getSummary: async (): Promise<EarningsSummary> => {
      await delay();
      return { ...mockEarnings };
    },
    getPayouts: async (): Promise<Payout[]> => {
      await delay();
      return [...mockPayouts];
    },
    getShiftHistory: async (): Promise<ShiftHistoryEntry[]> => {
      await delay();
      return [...mockShifts];
    },
  },

  devices: {
    registerPushToken: async (_token: string) => {
      await delay(200);
      return { success: true };
    },
  },

  sellers: {
    getNearby: async (lat: number, lng: number, radiusKm = 15): Promise<NearbySeller[]> => {
      await delay();
      const candidates: Omit<NearbySeller, 'distanceKm'>[] = [
        {
          id: 'seller-ind-1',
          businessName: 'Priya Home Kitchen',
          latitude: 28.6425,
          longitude: 77.1862,
        },
        {
          id: 'seller-ind-2',
          businessName: 'Rajesh Fresh Produce',
          latitude: 28.6201,
          longitude: 77.2155,
        },
      ];
      return candidates
        .map((seller) => ({
          ...seller,
          distanceKm:
            Math.round(getDistanceKm(lat, lng, seller.latitude, seller.longitude) * 100) / 100,
        }))
        .filter((s) => s.distanceKm <= radiusKm)
        .sort((a, b) => a.distanceKm - b.distanceKm);
    },
  },

  stores: {
    getNearby: async (lat: number, lng: number, radiusKm = 15): Promise<NearbyStore[]> => {
      await delay();
      const candidates: Omit<NearbyStore, 'distanceKm'>[] = [
        {
          id: 'store-1',
          name: 'Quickmart Hub CP',
          address: 'Connaught Place, New Delhi',
          latitude: 28.6315,
          longitude: 77.2167,
          partnerType: 'STORE',
          ownerLabel: 'Quickmart Retail',
        },
        {
          id: 'store-food-1',
          name: 'Spice Route Kitchen',
          address: 'Janpath, New Delhi',
          latitude: 28.6129,
          longitude: 77.2295,
          partnerType: 'FOOD_STORE',
          ownerLabel: 'Spice Route',
        },
        {
          id: 'store-2',
          name: 'Neighborhood Mart',
          address: 'Karol Bagh, New Delhi',
          latitude: 28.6512,
          longitude: 77.191,
          partnerType: 'STORE',
        },
      ];
      return candidates
        .map((store) => ({
          ...store,
          distanceKm: Math.round(getDistanceKm(lat, lng, store.latitude, store.longitude) * 100) / 100,
        }))
        .filter((s) => s.distanceKm <= radiusKm)
        .sort((a, b) => a.distanceKm - b.distanceKm);
    },
  },
};

export type MockApi = typeof mockApi;
