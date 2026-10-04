import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { deviceService } from '@/services/api';
import type { DeliveryRequest } from '@/types';
import { DELIVERY_REQUESTS_QUERY_KEY } from '@/hooks/useDeliveryRequestsQuery';

/** SDK 53+ Expo Go on Android throws when `expo-notifications` is loaded (remote push removed). */
const isExpoGoAndroid = isRunningInExpoGo() && Platform.OS === 'android';

type NotificationsModule = typeof import('expo-notifications');

const ALERT_DEDUPE_MS = 30_000;
const recentAlertKeys = new Map<string, number>();

async function loadNotifications(): Promise<NotificationsModule | null> {
  if (isExpoGoAndroid) return null;
  return import('expo-notifications');
}

let notificationHandlerConfigured = false;

async function ensureNotificationHandler() {
  if (notificationHandlerConfigured || isExpoGoAndroid) return;
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  notificationHandlerConfigured = true;
}

function resolveExpoProjectId(): string | undefined {
  const fromEnv = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  if (fromEnv) return fromEnv;
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  const id = extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!id || id.startsWith('REPLACE_')) return undefined;
  return id;
}

export function shouldSkipDeliveryAlert(dedupeKey: string): boolean {
  const now = Date.now();
  const last = recentAlertKeys.get(dedupeKey);
  if (last != null && now - last < ALERT_DEDUPE_MS) {
    return true;
  }
  recentAlertKeys.set(dedupeKey, now);
  return false;
}

export function markDeliveryAlertShown(dedupeKey: string) {
  recentAlertKeys.set(dedupeKey, Date.now());
}

export async function scheduleLocalDeliveryAlert(
  title: string,
  body: string,
  dedupeKey?: string
) {
  if (dedupeKey && shouldSkipDeliveryAlert(dedupeKey)) return;
  if (dedupeKey) markDeliveryAlertShown(dedupeKey);

  await ensureNotificationHandler();
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      ...(Platform.OS === 'android' ? { channelId: 'deliveries' } : {}),
    },
    trigger: null,
  });
}

export function usePushNotifications(enabled: boolean) {
  const registered = useRef(false);

  useEffect(() => {
    if (!enabled || isExpoGoAndroid) return;

    async function setup() {
      await ensureNotificationHandler();
      const Notifications = await loadNotifications();
      if (!Notifications) return;

      const settings = await Notifications.getPermissionsAsync();
      let status = settings.status;
      if (status !== 'granted') {
        const req = await Notifications.requestPermissionsAsync();
        status = req.status;
      }
      if (status !== 'granted') return;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('deliveries', {
          name: 'Delivery requests',
          importance: Notifications.AndroidImportance.MAX,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
        });
      }

      const projectId = resolveExpoProjectId();
      const token = (
        await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined
        )
      ).data;
      if (!registered.current) {
        await deviceService.registerPushToken(token);
        registered.current = true;
      }
    }

    setup().catch(() => undefined);
  }, [enabled]);
}

export function useDeliveryRequestNotifications(
  requests: DeliveryRequest[],
  enabled: boolean
) {
  const seenIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  useEffect(() => {
    if (!enabled || isExpoGoAndroid) {
      seenIds.current = new Set();
      initialized.current = false;
      return;
    }

    const currentIds = new Set(requests.map((r) => r.id));
    if (!initialized.current) {
      seenIds.current = currentIds;
      initialized.current = true;
      return;
    }

    for (const request of requests) {
      if (!seenIds.current.has(request.id)) {
        const dedupeKey = `order:${request.orderId}`;
        void scheduleLocalDeliveryAlert(
          'Naya pickup request',
          `Order ${request.orderNumber} · ${request.pickupAddress}`,
          dedupeKey
        );
      }
    }
    seenIds.current = currentIds;
  }, [requests, enabled]);
}

function extractDeliveryData(
  data: Record<string, unknown> | undefined
): { type?: string; subOrderId?: string } {
  if (!data) return {};
  return {
    type: typeof data.type === 'string' ? data.type : undefined,
    subOrderId: typeof data.subOrderId === 'string' ? data.subOrderId : undefined,
  };
}

export function useDeliveryNotificationListeners(enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || isExpoGoAndroid) return;

    let receivedSub: { remove: () => void } | undefined;
    let responseSub: { remove: () => void } | undefined;

    async function attach() {
      await ensureNotificationHandler();
      const Notifications = await loadNotifications();
      if (!Notifications) return;

      receivedSub = Notifications.addNotificationReceivedListener((notification) => {
        const content = notification.request.content;
        const { type, subOrderId } = extractDeliveryData(
          content.data as Record<string, unknown> | undefined
        );
        if (type === 'delivery_request' && subOrderId) {
          markDeliveryAlertShown(`order:${subOrderId}`);
        }
        void queryClient.invalidateQueries({ queryKey: [DELIVERY_REQUESTS_QUERY_KEY] });
      });

      responseSub = Notifications.addNotificationResponseReceivedListener(() => {
        void queryClient.invalidateQueries({ queryKey: [DELIVERY_REQUESTS_QUERY_KEY] });
        router.push('/(app)/(tabs)/requests');
      });
    }

    attach().catch(() => undefined);

    return () => {
      receivedSub?.remove();
      responseSub?.remove();
    };
  }, [enabled, queryClient]);
}
