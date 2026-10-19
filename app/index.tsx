import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { usePartnerStore, getOnboardingRoute } from '@/stores/partnerStore';
import { deliveryPartnerService, partnerSessionService } from '@/services/api';
import { usePartnerSessionStore } from '@/stores/partnerSessionStore';
import { getPostAuthRoute } from '@/services/api/mappers/partnerProfile';
import { markWorkplaceSelectionDone } from '@/stores/workplaceSelectionStore';
import { colors } from '@/theme';

async function applySessionFromServer() {
  const session = await deliveryPartnerService.getSession().catch(() => null);
  if (!session) return;

  const store = usePartnerSessionStore.getState();
  store.applyOnlineStatus({
    isOnline: session.isOnline,
    currentShiftStartedAt: session.currentShiftStartedAt ?? null,
    todayOnlineMinutes: session.todayOnlineMinutes ?? 0,
  });
  if (session.deliveryScope) {
    store.setPreferences({
      scope: session.deliveryScope,
      storeId: session.storeId ?? undefined,
      sellerId: session.sellerId ?? undefined,
    });
  }
  if (session.storeId || session.sellerId) {
    await markWorkplaceSelectionDone();
  }
  if (session.isOnline && store.latitude != null && store.longitude != null) {
    await partnerSessionService
      .updateLocation(store.latitude, store.longitude)
      .catch(() => undefined);
  }
}

export default function Index() {
  const { isLoading, isAuthenticated } = useAuthStore();
  const setProfile = usePartnerStore((s) => s.setProfile);
  const loadCachedProfile = usePartnerStore((s) => s.loadCachedProfile);
  const [checking, setChecking] = useState(true);
  const [route, setRoute] = useState<string | null>(null);

  useEffect(() => {
    async function refreshProfileFromNetwork(fallbackRoute: string) {
      try {
        const profile = await deliveryPartnerService.getProfile();
        await setProfile(profile);
        setRoute(getPostAuthRoute(profile));
        await applySessionFromServer();
      } catch {
        setRoute((current) => current ?? fallbackRoute);
      }
    }

    async function check() {
      if (!isAuthenticated) {
        setChecking(false);
        return;
      }

      await loadCachedProfile();
      const cached = usePartnerStore.getState().profile;

      if (cached) {
        const cachedRoute = getPostAuthRoute(cached);
        setRoute(cachedRoute);
        setChecking(false);
        void refreshProfileFromNetwork(cachedRoute);
        return;
      }

      try {
        const profile = await deliveryPartnerService.getProfile();
        await setProfile(profile);
        await applySessionFromServer();
        setRoute(getPostAuthRoute(profile));
      } catch {
        setRoute(getOnboardingRoute('profile'));
      } finally {
        setChecking(false);
      }
    }

    if (!isLoading) check();
  }, [isLoading, isAuthenticated, setProfile, loadCachedProfile]);

  if (isLoading || checking) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (route) {
    return <Redirect href={route as '/'} />;
  }

  return <Redirect href="/(onboarding)/profile" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
