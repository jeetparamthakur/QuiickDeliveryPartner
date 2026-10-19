import type { TripStep } from '@/types/partner';

export type TripMapsTarget = 'pickup' | 'drop';

export type TripStepUiConfig = {
  phaseIndex: 0 | 1 | 2;
  primaryAdvanceLabel: string;
  secondaryMapsLabel?: string;
  mapsTarget?: TripMapsTarget;
  confirmBeforeAdvance?: {
    title: string;
    message: string;
    confirmText: string;
  };
};

export const TRIP_STEP_UI: Record<TripStep, TripStepUiConfig> = {
  navigate_pickup: {
    phaseIndex: 0,
    primaryAdvanceLabel: "I've arrived at store",
    secondaryMapsLabel: 'Open maps to pickup',
    mapsTarget: 'pickup',
  },
  confirm_pickup: {
    phaseIndex: 0,
    primaryAdvanceLabel: 'Order picked up',
    confirmBeforeAdvance: {
      title: 'Confirm pickup',
      message: 'Have you collected all items from the store?',
      confirmText: 'Yes, picked up',
    },
  },
  navigate_drop: {
    phaseIndex: 1,
    primaryAdvanceLabel: "I've arrived at customer",
    secondaryMapsLabel: 'Open maps to customer',
    mapsTarget: 'drop',
  },
  confirm_delivery: {
    phaseIndex: 2,
    primaryAdvanceLabel: 'Mark as delivered',
    confirmBeforeAdvance: {
      title: 'Confirm delivery',
      message: 'Handed the order to the customer?',
      confirmText: 'Mark delivered',
    },
  },
  completed: {
    phaseIndex: 2,
    primaryAdvanceLabel: 'Done',
  },
};

export const TRIP_PHASE_LABELS = ['Pickup', 'On the way', 'Deliver'] as const;

export function tripStepPhaseIndex(step: TripStep): number {
  return TRIP_STEP_UI[step].phaseIndex;
}
