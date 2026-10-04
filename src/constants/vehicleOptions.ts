import type { SelectOption } from '@/components/ui/OptionSelectGrid';
import { VEHICLE_LABELS, type VehicleType } from '@/types/partner';

export const VEHICLE_OPTIONS: SelectOption<VehicleType>[] = [
  { value: 'bike', label: VEHICLE_LABELS.bike, icon: { set: 'material', name: 'motorbike' } },
  { value: 'scooter', label: VEHICLE_LABELS.scooter, icon: { set: 'material', name: 'scooter' } },
  {
    value: 'bicycle',
    label: VEHICLE_LABELS.bicycle,
    icon: { set: 'ionicons', name: 'bicycle-outline' },
  },
  {
    value: 'ev_bike',
    label: VEHICLE_LABELS.ev_bike,
    icon: { set: 'material', name: 'motorbike-electric' },
  },
];
