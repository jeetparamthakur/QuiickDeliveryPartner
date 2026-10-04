export type StorePartnerType = 'FOOD_STORE' | 'STORE' | 'INDEPENDENT_SELLER';

export type NearbyStore = {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number;
  partnerType: StorePartnerType | string;
  ownerLabel?: string;
};
