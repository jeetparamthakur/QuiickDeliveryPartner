import { useCallback } from 'react';
import { View, Text, StyleSheet, Switch, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { EarningsCard } from '@/components/cards/EarningsCard';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/context/ThemeContext';
import { usePartnerStore } from '@/stores/partnerStore';
import { usePartnerSessionStore } from '@/stores/partnerSessionStore';
import {
  deliveryPartnerService,
  deliveryService,
  earningsService,
  partnerSessionService,
} from '@/services/api';
import { usePartnerLocationTracking } from '@/hooks/usePartnerLocation';
import { TRIP_STEP_LABELS } from '@/types';
import { formatCurrency, formatDuration, formatShiftTime, getGreeting } from '@/utils/format';
import { useShiftClock } from '@/hooks/useShiftClock';
import { spacing } from '@/theme';
import { PressableScale } from '@/components/ui/PressableScale';

export default function HomeScreen() {
  const { colors, typography, radius, shadows, fontFamily } = useTheme();
  const profile = usePartnerStore((s) => s.profile);
  const queryClient = useQueryClient();
  const isOnline = usePartnerSessionStore((s) => s.isOnline);
  const currentShiftStartedAt = usePartnerSessionStore((s) => s.currentShiftStartedAt);
  const todayOnlineMinutes = usePartnerSessionStore((s) => s.todayOnlineMinutes);
  const onlineMetricsSyncedAt = usePartnerSessionStore((s) => s.onlineMetricsSyncedAt);
  const applyOnlineStatus = usePartnerSessionStore((s) => s.applyOnlineStatus);
  const { elapsedMinutes, todayTotalMinutes } = useShiftClock(
    isOnline,
    currentShiftStartedAt,
    todayOnlineMinutes,
    onlineMetricsSyncedAt,
  );
  const latitude = usePartnerSessionStore((s) => s.latitude);
  const longitude = usePartnerSessionStore((s) => s.longitude);
  const canGoOnline = profile?.canGoOnline ?? false;

  usePartnerLocationTracking(isOnline);

  useFocusEffect(
    useCallback(() => {
      deliveryPartnerService
        .getSession()
        .then((session) => {
          applyOnlineStatus({
            isOnline: session.isOnline,
            currentShiftStartedAt: session.currentShiftStartedAt ?? null,
            todayOnlineMinutes: session.todayOnlineMinutes ?? 0,
          });
        })
        .catch(() => undefined);
    }, [applyOnlineStatus]),
  );

  const earningsQuery = useQuery({
    queryKey: ['earnings-summary'],
    queryFn: () => earningsService.getSummary(),
  });

  const activeTripQuery = useQuery({
    queryKey: ['active-trip'],
    queryFn: () => deliveryService.getActiveTrip(),
    refetchInterval: isOnline ? 8000 : false,
  });

  const activeRunQuery = useQuery({
    queryKey: ['active-run'],
    queryFn: () => deliveryService.getActiveRun(),
    refetchInterval: isOnline ? 8000 : false,
  });

  useFocusEffect(
    useCallback(() => {
      activeTripQuery.refetch();
      activeRunQuery.refetch();
      earningsQuery.refetch();
    }, []),
  );

  async function toggleOnline(value: boolean) {
    if (value && !canGoOnline) {
      Alert.alert('Not approved yet', 'Complete onboarding and wait for approval to go online.');
      return;
    }
    try {
      const status = await partnerSessionService.setOnline(value);
      applyOnlineStatus(status);
      if (!value) {
        queryClient.invalidateQueries({ queryKey: ['shifts'] });
      }
      if (value && latitude != null && longitude != null) {
        await partnerSessionService.updateLocation(latitude, longitude);
      }
    } catch {
      Alert.alert('Could not update status', 'Check your connection and try again.');
    }
  }

  const trip = activeTripQuery.data;
  const run = activeRunQuery.data;
  const isMultiRun = (run?.orders.length ?? 0) > 1;

  return (
    <ScreenWrapper>
      <View style={[styles.content, { gap: spacing.lg }]}>
        <View>
          <Text style={[typography.body, { color: colors.textSecondary }]}>{getGreeting()}</Text>
          <Text style={[typography.h1, { color: colors.text, marginTop: -spacing.sm, fontFamily: fontFamily.bold }]}>
            {profile?.name || 'Partner'}
          </Text>
        </View>

        <Card
          variant="elevated"
          style={{
            ...shadows.md,
            ...(isOnline
              ? {
                  borderColor: colors.primary,
                  borderWidth: 1,
                  backgroundColor: colors.primaryLight,
                }
              : {}),
          }}
        >
          <View style={styles.onlineRow}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.h3, { color: colors.text }]}>{isOnline ? 'You are online' : 'You are offline'}</Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>
                {isOnline ? 'Receiving nearby delivery requests' : 'Go online to receive requests'}
              </Text>
              {isOnline && currentShiftStartedAt ? (
                <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}>
                  Shift started {formatShiftTime(currentShiftStartedAt)} · {formatDuration(elapsedMinutes)} elapsed
                </Text>
              ) : null}
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}>
                Today online: {formatDuration(todayTotalMinutes)}
              </Text>
            </View>
            <Switch
              value={isOnline}
              onValueChange={toggleOnline}
              trackColor={{ true: colors.primaryLight, false: colors.border }}
              thumbColor={isOnline ? colors.primary : colors.surface}
            />
          </View>
        </Card>

        <View style={styles.earningsRow}>
          <EarningsCard
            label="Today's earnings"
            value={earningsQuery.data?.today ?? 0}
            isCurrency
            variant="featured"
            metricKey="earnings"
          />
        </View>

        {trip ? (
          <PressableScale onPress={() => router.push(`/(app)/trip/${trip.orderId}`)} haptic="selection">
            <Card variant="outline" style={{ backgroundColor: colors.primaryLight, borderColor: colors.borderSubtle }}>
              <View style={styles.tripHeader}>
                <Text style={[typography.h3, { color: colors.primaryDark }]}>
                  {isMultiRun
                    ? `Active run · ${run?.orders.length} orders`
                    : `Active trip · ${trip.orderNumber}`}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.primary} />
              </View>
              <Text style={[typography.body, { textTransform: 'capitalize', marginTop: spacing.sm, color: colors.text }]}>
                {TRIP_STEP_LABELS[run?.microStep ?? trip.step]}
              </Text>
              <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.xs }]}>
                {isMultiRun
                  ? `${run?.stopsRemaining ?? 0} stops left · Total earn ${formatCurrency(run?.totalDeliveryFee ?? trip.deliveryFee)}`
                  : `You earn ${formatCurrency(trip.deliveryFee)}`}
              </Text>
            </Card>
          </PressableScale>
        ) : (
          <Card variant="outline">
            <View style={{ alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm }}>
              <Ionicons name="bicycle-outline" size={28} color={colors.textMuted} />
              <Text style={[typography.body, { color: colors.textMuted }]}>No active trip</Text>
            </View>
          </Card>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg },
  onlineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  earningsRow: { flexDirection: 'row' },
  tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
