import type { DeliveryPartnerProfile } from '@/types/partner';

const ROUTES: Record<DeliveryPartnerProfile['onboardingStep'], string> = {
  profile: '/(onboarding)/profile',
  kyc: '/(onboarding)/kyc',
  bank: '/(onboarding)/bank',
  pending_approval: '/(onboarding)/pending-approval',
  active: '/(app)/(tabs)/home',
};

export function getPostAuthRoute(profile: DeliveryPartnerProfile): string {
  if (profile.approvalStatus === 'rejected') {
    return '/(onboarding)/pending-approval';
  }
  return ROUTES[profile.onboardingStep] ?? '/(onboarding)/profile';
}

export function getOnboardingRoute(step: DeliveryPartnerProfile['onboardingStep']): string {
  return ROUTES[step] ?? '/(onboarding)/profile';
}

export function mapBackendProfile(raw: Record<string, unknown>): DeliveryPartnerProfile {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    phone: String(raw.phone ?? ''),
    city: String(raw.city ?? ''),
    vehicleType: (raw.vehicleType as DeliveryPartnerProfile['vehicleType']) ?? 'bike',
    onboardingStep:
      (raw.onboardingStep as DeliveryPartnerProfile['onboardingStep']) ?? 'profile',
    approvalStatus:
      (raw.approvalStatus as DeliveryPartnerProfile['approvalStatus']) ?? 'pending',
    canGoOnline: Boolean(raw.canGoOnline),
  };
}
