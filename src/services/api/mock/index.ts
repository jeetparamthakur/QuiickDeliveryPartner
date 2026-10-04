import { isPartnerWithinPickupRadius } from '@/utils/geo';
import type {
  ActiveTrip,
  DeliveryPartnerProfile,
  DeliveryRequest,
  PartnerDeliveryPreferences,
  TripStep,
  VehicleType,
} from '@/types/partner';
import type { BankAccount, EarningsSummary, KycInfo, Payout, ShiftHistoryEntry } from '@/types/common';
import type { NearbyStore } from '@/types/store';
import type { NearbySeller } from '@/types/seller';
import { getDistanceKm } from '@/utils/geo';

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
let mockActiveTrip: ActiveTrip | null = null;

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

function tripFromRequest(request: DeliveryRequest): ActiveTrip {
  return {
    requestId: request.id,
    orderId: request.orderId,
    orderNumber: request.orderNumber,
    status: 'accepted',
    pickupAddress: request.pickupAddress,
    pickupLatitude: request.pickupLatitude,
    pickupLongitude: request.pickupLongitude,
    customerAddress: request.customerAddress,
    customerLatitude: request.customerLatitude,
    customerLongitude: request.customerLongitude,
    deliveryFee: request.deliveryFee,
    itemCount: request.itemCount,
    step: 'navigate_pickup',
  };
}

export const mockApi = {
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
        if (mockActiveTrip) return false;

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
      await delay();
      const idx = mockDeliveryRequests.findIndex((r) => r.id === requestId);
      if (idx === -1) throw new Error('Delivery request not found');
      const request = mockDeliveryRequests[idx];
      if (request.status !== 'requested') throw new Error('Request is no longer available');

      mockDeliveryRequests[idx] = { ...request, status: 'accepted' };
      mockActiveTrip = tripFromRequest(mockDeliveryRequests[idx]);
      mockProfile = { ...mockProfile, id: partnerId, name: partnerName || mockProfile.name };
      return { ...mockActiveTrip };
    },
    rejectRequest: async (requestId: string): Promise<DeliveryRequest> => {
      await delay();
      const idx = mockDeliveryRequests.findIndex((r) => r.id === requestId);
      if (idx === -1) throw new Error('Delivery request not found');
      mockDeliveryRequests[idx] = { ...mockDeliveryRequests[idx], status: 'rejected' };
      return mockDeliveryRequests[idx];
    },
    getActiveTrip: async (): Promise<ActiveTrip | null> => {
      await delay(200);
      return mockActiveTrip ? { ...mockActiveTrip } : null;
    },
    updateTripStep: async (step: TripStep): Promise<ActiveTrip> => {
      await delay();
      if (!mockActiveTrip) throw new Error('No active trip');
      mockActiveTrip = { ...mockActiveTrip, step };
      if (step === 'confirm_pickup') {
        mockActiveTrip.status = 'picked_up';
      }
      if (step === 'completed') {
        mockActiveTrip.status = 'delivered';
        mockEarnings = {
          ...mockEarnings,
          today: mockEarnings.today + mockActiveTrip.deliveryFee,
          week: mockEarnings.week + mockActiveTrip.deliveryFee,
        };
        const reqIdx = mockDeliveryRequests.findIndex((r) => r.id === mockActiveTrip!.requestId);
        if (reqIdx !== -1) {
          mockDeliveryRequests[reqIdx] = {
            ...mockDeliveryRequests[reqIdx],
            status: 'delivered',
          };
        }
        mockActiveTrip = null;
        throw new Error('TRIP_COMPLETED');
      }
      return { ...mockActiveTrip };
    },
    advanceTrip: async (): Promise<ActiveTrip | null> => {
      if (!mockActiveTrip) return null;
      const order: TripStep[] = [
        'navigate_pickup',
        'confirm_pickup',
        'navigate_drop',
        'confirm_delivery',
        'completed',
      ];
      const idx = order.indexOf(mockActiveTrip.step);
      const next = order[idx + 1] ?? 'completed';
      try {
        return await mockApi.delivery.updateTripStep(next);
      } catch (e) {
        if (e instanceof Error && e.message === 'TRIP_COMPLETED') return null;
        throw e;
      }
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
