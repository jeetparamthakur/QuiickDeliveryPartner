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

export type RunStopKind = 'pickup' | 'drop';
export type RunStopStatus = 'pending' | 'current' | 'done';

export type RunStop = {
  stopId: string;
  assignmentIds: string[];
  orderIds: string[];
  orderNumbers: string[];
  kind: RunStopKind;
  status: RunStopStatus;
  address: string;
  latitude: number;
  longitude: number;
};

export type RunOrderSummary = {
  assignmentId: string;
  orderId: string;
  orderNumber: string;
  deliveryFee: number;
  itemCount: number;
  pickupDone: boolean;
  deliveryDone: boolean;
};

export type ActiveDeliveryRun = {
  runId: string;
  createdAt: string;
  currentStopIndex: number;
  microStep: TripStep;
  stopsRemaining: number;
  totalDeliveryFee: number;
  stops: RunStop[];
  orders: RunOrderSummary[];
  currentStop?: RunStop;
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

export type PartnerOrdersTab = 'active' | 'delivered';

export type PartnerOrder = DeliveryRequest & {
  step?: TripStep;
  completedAt?: string;
};

export function partnerOrderStatusLabel(order: PartnerOrder): string {
  if (order.status === 'delivered') return 'Delivered';
  if (order.step) return TRIP_STEP_LABELS[order.step];
  switch (order.status) {
    case 'picked_up':
      return TRIP_STEP_LABELS.navigate_drop;
    case 'accepted':
      return TRIP_STEP_LABELS.navigate_pickup;
    default:
      return 'In delivery';
  }
}
