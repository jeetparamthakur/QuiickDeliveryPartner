import { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import type { DeliveryRequest } from '@/types/partner';
import { useDeliveryRequestsQuery } from '@/hooks/useDeliveryRequestsQuery';
import { usePartnerSessionStore } from '@/stores/partnerSessionStore';
import { getDistanceKm } from '@/utils/geo';
import { formatCurrency } from '@/utils/format';
import { acceptDeliveryRequest, rejectDeliveryRequest } from '@/utils/deliveryRequestActions';
import { notificationAsync, NotificationFeedbackType } from '@/utils/haptics';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';
import { radius, spacing } from '@/theme';

type Props = {
  enabled: boolean;
};

export function DeliveryRequestAlertModal({ enabled }: Props) {
  const { colors, typography, fontFamily } = useTheme();
  const isOnline = usePartnerSessionStore((s) => s.isOnline);
  const latitude = usePartnerSessionStore((s) => s.latitude) ?? 28.6139;
  const longitude = usePartnerSessionStore((s) => s.longitude) ?? 77.209;
  const requestsQuery = useDeliveryRequestsQuery();
  const queryClient = useQueryClient();

  const seenIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [alertRequest, setAlertRequest] = useState<DeliveryRequest | null>(null);
  const [loading, setLoading] = useState(false);

  const active = enabled && isOnline;

  useEffect(() => {
    const requests = requestsQuery.data ?? [];
    if (!active || !requests.length) {
      if (!active) {
        seenIds.current = new Set();
        initialized.current = false;
        setAlertRequest(null);
      }
      return;
    }

    const currentIds = new Set(requests.map((r) => r.id));
    if (!initialized.current) {
      seenIds.current = currentIds;
      initialized.current = true;
      return;
    }

    const newest = requests.find((r) => !seenIds.current.has(r.id));
    if (newest) {
      seenIds.current = currentIds;
      setAlertRequest(newest);
      void notificationAsync(NotificationFeedbackType.Warning);
    } else {
      seenIds.current = currentIds;
    }
  }, [requestsQuery.data, active]);

  useEffect(() => {
    if (!alertRequest) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [alertRequest, pulseAnim]);

  async function handleAccept() {
    if (!alertRequest) return;
    setLoading(true);
    try {
      await acceptDeliveryRequest(alertRequest.id, queryClient);
      setAlertRequest(null);
    } catch {
      // user can retry from Requests
    } finally {
      setLoading(false);
    }
  }

  async function handleDecline() {
    if (!alertRequest) return;
    setLoading(true);
    try {
      await rejectDeliveryRequest(alertRequest.id, queryClient);
      setAlertRequest(null);
      await requestsQuery.refetch();
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  const distanceKm =
    alertRequest != null
      ? getDistanceKm(
          latitude,
          longitude,
          alertRequest.pickupLatitude,
          alertRequest.pickupLongitude
        )
      : null;

  return (
    <Modal visible={alertRequest != null} transparent animationType="fade">
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <Animated.View
          style={[
            styles.alert,
            {
              backgroundColor: colors.surface,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Ionicons name="notifications" size={40} color={colors.primary} />
          <Text
            style={[
              typography.h2,
              { color: colors.text, fontFamily: fontFamily.bold, marginTop: spacing.md },
            ]}
          >
            Naya pickup request
          </Text>
          {alertRequest ? (
            <>
              <Text
                style={[
                  typography.h3,
                  { color: colors.primary, fontFamily: fontFamily.bold, marginTop: spacing.sm },
                ]}
              >
                {alertRequest.orderNumber}
              </Text>
              <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>
                You earn {formatCurrency(alertRequest.deliveryFee)}
                {distanceKm != null ? ` · ${distanceKm.toFixed(1)} km to pickup` : ''}
              </Text>
              <Text
                style={[typography.bodySmall, { color: colors.text, marginTop: spacing.md, textAlign: 'center' }]}
                numberOfLines={3}
              >
                {alertRequest.pickupAddress}
              </Text>
            </>
          ) : null}
          <View style={styles.actions}>
            <Button
              title="Decline"
              variant="ghost"
              onPress={handleDecline}
              disabled={loading}
              style={styles.actionBtn}
            />
            <Button
              title={loading ? 'Accepting…' : 'Accept'}
              onPress={handleAccept}
              disabled={loading}
              loading={loading}
              style={styles.actionBtn}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  alert: {
    borderRadius: radius.xl,
    padding: spacing.xxxl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
    width: '100%',
  },
  actionBtn: { flex: 1 },
});
