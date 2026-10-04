import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { partnerSessionService } from '@/services/api';
import { usePartnerSessionStore } from '@/stores/partnerSessionStore';

export const PARTNER_LOCATION_TASK = 'QUIICK_PARTNER_LOCATION_TASK';

TaskManager.defineTask(PARTNER_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.warn('[location-task]', error.message);
    return;
  }
  const locations = (data as { locations?: Location.LocationObject[] })?.locations;
  const latest = locations?.[0];
  if (!latest) return;
  usePartnerSessionStore.getState().setLocation(latest.coords.latitude, latest.coords.longitude);
});

export function usePartnerLocationTracking(enabled: boolean) {
  const setLocation = usePartnerSessionStore((s) => s.setLocation);
  const watcher = useRef<Location.LocationSubscription | null>(null);
  const lastSyncRef = useRef(0);

  function syncLocation(latitude: number, longitude: number) {
    if (!enabled) return;
    const now = Date.now();
    if (now - lastSyncRef.current < 15000) return;
    lastSyncRef.current = now;
    void partnerSessionService.updateLocation(latitude, longitude).catch(() => undefined);
  }

  useEffect(() => {
    let cancelled = false;

    async function start() {
      const fg = await Location.requestForegroundPermissionsAsync();
      if (fg.status !== 'granted' || cancelled) return;

      if (enabled) {
        await Location.requestBackgroundPermissionsAsync().catch(() => undefined);
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (!cancelled) {
        setLocation(current.coords.latitude, current.coords.longitude);
        syncLocation(current.coords.latitude, current.coords.longitude);
      }

      watcher.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 15000,
          distanceInterval: 50,
        },
        (loc) => {
          setLocation(loc.coords.latitude, loc.coords.longitude);
          syncLocation(loc.coords.latitude, loc.coords.longitude);
        }
      );

      if (enabled) {
        const started = await Location.hasStartedLocationUpdatesAsync(PARTNER_LOCATION_TASK);
        if (!started) {
          await Location.startLocationUpdatesAsync(PARTNER_LOCATION_TASK, {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 30000,
            distanceInterval: 75,
            showsBackgroundLocationIndicator: true,
            foregroundService: {
              notificationTitle: 'Quiick Delivery Partner',
              notificationBody: 'You are online and receiving delivery requests.',
            },
          }).catch(() => undefined);
        }
      } else {
        const started = await Location.hasStartedLocationUpdatesAsync(PARTNER_LOCATION_TASK);
        if (started) {
          await Location.stopLocationUpdatesAsync(PARTNER_LOCATION_TASK).catch(() => undefined);
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      watcher.current?.remove();
      watcher.current = null;
    };
  }, [enabled, setLocation]);
}
