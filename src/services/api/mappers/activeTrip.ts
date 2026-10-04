import type { ActiveTrip, DeliveryRequestStatus, TripStep } from '@/types/partner';

const TRIP_STEPS: TripStep[] = [
  'navigate_pickup',
  'confirm_pickup',
  'navigate_drop',
  'confirm_delivery',
  'completed',
];

function isTripStep(value: unknown): value is TripStep {
  return typeof value === 'string' && TRIP_STEPS.includes(value as TripStep);
}

function stepFromStatus(status: DeliveryRequestStatus | undefined): TripStep {
  switch (status) {
    case 'picked_up':
      return 'navigate_drop';
    case 'delivered':
      return 'completed';
    case 'accepted':
    default:
      return 'navigate_pickup';
  }
}

/** Backend may return `null` as an empty body; apiClient coerces that to `{}`. */
export function mapActiveTrip(raw: unknown): ActiveTrip | null {
  if (raw == null || typeof raw !== 'object') return null;

  const record = raw as Record<string, unknown>;
  const requestId = record.requestId;
  const orderId = record.orderId;
  if (!requestId || !orderId) return null;

  const status = (record.status as DeliveryRequestStatus) ?? 'accepted';
  const step = isTripStep(record.step) ? record.step : stepFromStatus(status);

  return {
    requestId: String(requestId),
    orderId: String(orderId),
    orderNumber: String(record.orderNumber ?? orderId),
    status,
    pickupAddress: String(record.pickupAddress ?? ''),
    pickupLatitude: Number(record.pickupLatitude ?? 0),
    pickupLongitude: Number(record.pickupLongitude ?? 0),
    customerAddress: String(record.customerAddress ?? ''),
    customerLatitude: Number(record.customerLatitude ?? 0),
    customerLongitude: Number(record.customerLongitude ?? 0),
    deliveryFee: Number(record.deliveryFee ?? 0),
    itemCount: Number(record.itemCount ?? 0),
    step,
  };
}
