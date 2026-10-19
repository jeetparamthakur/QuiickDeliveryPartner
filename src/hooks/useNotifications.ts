import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { deviceService } from '@/services/api';
import type { DeliveryRequest } from '@/types';
import { DELIVERY_REQUESTS_QUERY_KEY } from '@/hooks/useDeliveryRequestsQuery';
import {
  acceptDeliveryRequest,
  rejectDeliveryRequest,
  resolveAssignmentId,
} from '@/utils/deliveryRequestActions';

/** SDK 53+ Expo Go on Android throws when `expo-notifications` is loaded (remote push removed). */
const isExpoGoAndroid = isRunningInExpoGo() && Platform.OS === 'android';

type NotificationsModule = typeof import('expo-notifications');

export const DELIVERY_REQUEST_CATEGORY = 'delivery_request';
export const ACCEPT_DELIVERY_ACTION = 'accept_delivery';
export const DECLINE_DELIVERY_ACTION = 'decline_delivery';

const ALERT_DEDUPE_MS = 30_000;
const recentAlertKeys = new Map<string, number>();

export type DeliveryAlertData = {
  assignmentId?: string;
  subOrderId: string;
  orderNumber?: string;
};

async function loadNotifications(): Promise<NotificationsModule | null> {
  if (isExpoGoAndroid) return null;
  return import('expo-notifications');
}

let notificationHandlerConfigured = false;
let notificationCategoryConfigured = false;

async function ensureNotificationCategory(Notifications: NotificationsModule) {
  if (notificationCategoryConfigured) return;
  await Notifications.setNotificationCategoryAsync(DELIVERY_REQUEST_CATEGORY, [
    {
      identifier: ACCEPT_DELIVERY_ACTION,
      buttonTitle: 'Accept',
      options: { opensAppToForeground: true },
    },
    {
      identifier: DECLINE_DELIVERY_ACTION,
      buttonTitle: 'Decline',
      options: { opensAppToForeground: true, isDestructive: true },
    },
  ]);
  notificationCategoryConfigured = true;
}

async function ensureNotificationHandler() {
  if (notificationHandlerConfigured || isExpoGoAndroid) return;
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  await ensureNotificationCategory(Notifications);
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
  dedupeKey?: string,
  alertData?: DeliveryAlertData
) {
  if (dedupeKey && shouldSkipDeliveryAlert(dedupeKey)) return;
  if (dedupeKey) markDeliveryAlertShown(dedupeKey);

  await ensureNotificationHandler();
  const Notifications = await loadNotifications();
  if (!Notifications) return;

  const data: Record<string, string> = {
    type: 'delivery_request',
    subOrderId: alertData?.subOrderId ?? '',
  };
  if (alertData?.assignmentId) data.assignmentId = alertData.assignmentId;
  if (alertData?.orderNumber) data.orderNumber = alertData.orderNumber;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      categoryIdentifier: DELIVERY_REQUEST_CATEGORY,
      data,
      ...(Platform.OS === 'android' ? { channelId: 'deliveries' } : {}),
    },
    trigger: null,
  });
}

function extractDeliveryData(data: Record<string, unknown> | undefined): {
  type?: string;
  subOrderId?: string;
  assignmentId?: string;
  orderNumber?: string;
} {
  if (!data) return {};
  return {
    type: typeof data.type === 'string' ? data.type : undefined,
    subOrderId: typeof data.subOrderId === 'string' ? data.subOrderId : undefined,
    assignmentId: typeof data.assignmentId === 'string' ? data.assignmentId : undefined,
    orderNumber: typeof data.orderNumber === 'string' ? data.orderNumber : undefined,
  };
}

type NotificationResponse = {
  actionIdentifier: string;
  notification: {
    request: {
      content: {
        data?: Record<string, unknown>;
      };
    };
  };
};

export async function resolveAndHandleDeliveryAction(
  response: NotificationResponse,
  queryClient: QueryClient
): Promise<void> {
  const Notifications = await loadNotifications();
  const defaultAction =
    Notifications?.DEFAULT_ACTION_IDENTIFIER ?? 'expo.modules.notifications.actions.DEFAULT';

  const content = response.notification.request.content;
  const { type, subOrderId, assignmentId } = extractDeliveryData(content.data);
  if (type !== 'delivery_request') return;

  const actionId = response.actionIdentifier;

  await queryClient.invalidateQueries({ queryKey: [DELIVERY_REQUESTS_QUERY_KEY] });

  if (actionId === defaultAction) {
    router.push('/(app)/(tabs)/requests');
    return;
  }

  if (actionId !== ACCEPT_DELIVERY_ACTION && actionId !== DECLINE_DELIVERY_ACTION) {
    router.push('/(app)/(tabs)/requests');
    return;
  }

  const resolvedId = await resolveAssignmentId(assignmentId, subOrderId);
  if (!resolvedId) {
    router.push('/(app)/(tabs)/requests');
    return;
  }

  try {
    if (actionId === ACCEPT_DELIVERY_ACTION) {
      await acceptDeliveryRequest(resolvedId, queryClient);
    } else {
      await rejectDeliveryRequest(resolvedId, queryClient);
    }
  } catch {
    router.push('/(app)/(tabs)/requests');
  }
}

/** Handle notification tap/action after cold start (app was killed). */
export async function processLastNotificationResponse(queryClient: QueryClient): Promise<void> {
  if (isExpoGoAndroid) return;
  await ensureNotificationHandler();
  const Notifications = await loadNotifications();
  if (!Notifications) return;

  const response = await Notifications.getLastNotificationResponseAsync();
  if (!response) return;

  const { type } = extractDeliveryData(
    response.notification.request.content.data as Record<string, unknown> | undefined
  );
  if (type !== 'delivery_request') return;

  await resolveAndHandleDeliveryAction(response, queryClient);
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
        await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)
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
          dedupeKey,
          {
            assignmentId: request.id,
            subOrderId: request.orderId,
            orderNumber: request.orderNumber,
          }
        );
      }
    }
    seenIds.current = currentIds;
  }, [requests, enabled]);
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

      responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
        void resolveAndHandleDeliveryAction(response, queryClient);
      });
    }

    attach().catch(() => undefined);

    return () => {
      receivedSub?.remove();
      responseSub?.remove();
    };
  }, [enabled, queryClient]);
}
