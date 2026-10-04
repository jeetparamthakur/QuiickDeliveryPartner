export type DeliveryRequestStatus =
  | 'none'
  | 'requested'
  | 'accepted'
  | 'rejected'
  | 'picked_up'
  | 'delivered';

export type DeliveryRequest = {
  id: string;
  orderId: string;
  orderNumber: string;
  storeId?: string;
  sellerId: string;
  sellerType: 'STORE' | 'INDEPENDENT_SELLER';
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  customerAddress: string;
  customerLatitude: number;
  customerLongitude: number;
  partnerPickupRadiusKm: number | null;
  status: DeliveryRequestStatus;
  orderTotal: number;
  deliveryFee: number;
  itemCount: number;
  createdAt: string;
};

export type PartnerDeliveryScope = 'store' | 'seller' | 'all_sellers';

export type PartnerDeliveryPreferences = {
  scope: PartnerDeliveryScope;
  storeId?: string;
  sellerId?: string;
};

export type VehicleType = 'bike' | 'scooter' | 'bicycle' | 'ev_bike';

export type DeliveryPartnerOnboardingStep =
  | 'profile'
  | 'kyc'
  | 'bank'
  | 'pending_approval'
  | 'active';

export type PartnerApprovalStatus = 'pending' | 'approved' | 'rejected';

export type TripStep =
  | 'navigate_pickup'
  | 'confirm_pickup'
  | 'navigate_drop'
  | 'confirm_delivery'
  | 'completed';

export type ActiveTrip = {
  requestId: string;
  orderId: string;
  orderNumber: string;
  status: DeliveryRequestStatus;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  customerAddress: string;
  customerLatitude: number;
  customerLongitude: number;
  deliveryFee: number;
  itemCount: number;
  step: TripStep;
};

export type DeliveryPartnerProfile = {
  id: string;
  name: string;
  phone: string;
  city: string;
  vehicleType: VehicleType;
  onboardingStep: DeliveryPartnerOnboardingStep;
  approvalStatus: PartnerApprovalStatus;
  canGoOnline: boolean;
};

export const VEHICLE_LABELS: Record<VehicleType, string> = {
  bike: 'Bike',
  scooter: 'Scooter',
  bicycle: 'Bicycle',
  ev_bike: 'EV Bike',
};

export const TRIP_STEP_LABELS: Record<TripStep, string> = {
  navigate_pickup: 'Go to pickup',
  confirm_pickup: 'Confirm pickup',
  navigate_drop: 'Go to customer',
  confirm_delivery: 'Confirm delivery',
  completed: 'Completed',
};
