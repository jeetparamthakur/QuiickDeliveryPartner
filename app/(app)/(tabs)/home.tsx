import { useCallback } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { EarningsCard } from '@/components/cards/EarningsCard';
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
import { formatCurrency, getGreeting } from '@/utils/format';
import { colors, radius, spacing, typography, shadows } from '@/theme';

export default function HomeScreen() {
  const profile = usePartnerStore((s) => s.profile);
  const isOnline = usePartnerSessionStore((s) => s.isOnline);
  const setOnline = usePartnerSessionStore((s) => s.setOnline);
  const latitude = usePartnerSessionStore((s) => s.latitude);
  const longitude = usePartnerSessionStore((s) => s.longitude);
  const canGoOnline = profile?.canGoOnline ?? false;

  usePartnerLocationTracking(isOnline);

  useFocusEffect(
    useCallback(() => {
      deliveryPartnerService
        .getSession()
        .then((session) => {
          setOnline(session.isOnline);
        })
        .catch(() => undefined);
    }, [setOnline])
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

  useFocusEffect(
    useCallback(() => {
      activeTripQuery.refetch();
      earningsQuery.refetch();
    }, [])
  );

  async function toggleOnline(value: boolean) {
    if (value && !canGoOnline) {
      Alert.alert('Not approved yet', 'Complete onboarding and wait for approval to go online.');
      return;
    }
    try {
      await partnerSessionService.setOnline(value);
      setOnline(value);
      if (value && latitude != null && longitude != null) {
        await partnerSessionService.updateLocation(latitude, longitude);
      }
    } catch {
      Alert.alert('Could not update status', 'Check your connection and try again.');
    }
  }

  const trip = activeTripQuery.data;

  return (
    <ScreenWrapper>
      <View style={styles.content}>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <Text style={styles.name}>{profile?.name || 'Partner'}</Text>

        <View style={styles.onlineCard}>
          <View>
            <Text style={styles.onlineTitle}>{isOnline ? 'You are online' : 'You are offline'}</Text>
            <Text style={styles.onlineHint}>
              {isOnline ? 'Receiving nearby delivery requests' : 'Go online to receive requests'}
            </Text>
          </View>
          <Switch
            value={isOnline}
            onValueChange={toggleOnline}
            trackColor={{ true: colors.primaryLight, false: colors.border }}
            thumbColor={isOnline ? colors.primary : colors.surface}
          />
        </View>

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
          <TouchableOpacity
            style={styles.tripCard}
            onPress={() => router.push(`/(app)/trip/${trip.orderId}`)}
          >
            <View style={styles.tripHeader}>
              <Text style={styles.tripTitle}>Active trip · {trip.orderNumber}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            </View>
            <Text style={styles.tripStep}>{TRIP_STEP_LABELS[trip.step]}</Text>
            <Text style={styles.tripFee}>{formatCurrency(trip.deliveryFee)} delivery fee</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyTrip}>
            <Ionicons name="bicycle-outline" size={28} color={colors.textMuted} />
            <Text style={styles.emptyText}>No active trip</Text>
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  greeting: { ...typography.body, color: colors.textSecondary },
  name: { ...typography.h1, marginTop: -spacing.sm },
  earningsRow: { flexDirection: 'row' },
  onlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  onlineTitle: { ...typography.h3 },
  onlineHint: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  tripCard: {
    backgroundColor: colors.primaryLight,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tripTitle: { ...typography.h3, color: colors.primaryDark },
  tripStep: { ...typography.body, textTransform: 'capitalize', marginTop: spacing.sm },
  tripFee: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  emptyTrip: {
    alignItems: 'center',
    padding: spacing.xxxl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  emptyText: { ...typography.body, color: colors.textMuted },
});
