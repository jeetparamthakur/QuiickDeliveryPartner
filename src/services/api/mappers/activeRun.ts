import type { ActiveDeliveryRun, TripStep } from '@/types/partner';

const MICRO_STEPS: TripStep[] = [
  'navigate_pickup',
  'confirm_pickup',
  'navigate_drop',
  'confirm_delivery',
];

function isMicroStep(value: unknown): value is TripStep {
  return typeof value === 'string' && MICRO_STEPS.includes(value as TripStep);
}

export function mapActiveRun(raw: unknown): ActiveDeliveryRun | null {
  if (raw == null || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  if (!record.runId || !Array.isArray(record.stops) || !Array.isArray(record.orders)) {
    return null;
  }

  const microStep = isMicroStep(record.microStep)
    ? record.microStep
    : 'navigate_pickup';

  return {
    runId: String(record.runId),
    createdAt: String(record.createdAt ?? new Date().toISOString()),
    currentStopIndex: Number(record.currentStopIndex ?? 0),
    microStep,
    stopsRemaining: Number(record.stopsRemaining ?? 0),
    totalDeliveryFee: Number(record.totalDeliveryFee ?? 0),
    stops: record.stops as ActiveDeliveryRun['stops'],
    orders: record.orders as ActiveDeliveryRun['orders'],
    currentStop: record.currentStop as ActiveDeliveryRun['currentStop'],
  };
}
