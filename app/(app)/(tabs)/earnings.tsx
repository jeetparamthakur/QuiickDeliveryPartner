import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { EarningsCard } from '@/components/cards/EarningsCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { earningsService } from '@/services/api';
import { formatCurrency, formatDuration } from '@/utils/format';
import { colors, radius, spacing, typography } from '@/theme';

export default function EarningsScreen() {
  const summaryQuery = useQuery({
    queryKey: ['earnings-summary'],
    queryFn: () => earningsService.getSummary(),
  });
  const payoutsQuery = useQuery({
    queryKey: ['payouts'],
    queryFn: () => earningsService.getPayouts(),
  });
  const shiftsQuery = useQuery({
    queryKey: ['shifts'],
    queryFn: () => earningsService.getShiftHistory(),
  });

  const summary = summaryQuery.data;

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Earnings</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.metricsScroll}>
          <EarningsCard label="Today" value={summary?.today ?? 0} isCurrency metricKey="earnings" />
          <EarningsCard label="This week" value={summary?.week ?? 0} isCurrency metricKey="sales" />
          <EarningsCard label="This month" value={summary?.month ?? 0} isCurrency metricKey="orders" />
        </ScrollView>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Settlement</Text>
          <Text style={styles.panelRow}>
            Available balance · {formatCurrency(summary?.availableBalance ?? 0)}
          </Text>
          <Text style={styles.panelRow}>
            Pending · {formatCurrency(summary?.pendingSettlement ?? 0)}
          </Text>
          <Text style={styles.panelHint}>
            Next payout {formatCurrency(summary?.nextSettlement ?? 0)} on{' '}
            {summary?.nextSettlementDate ?? '—'}
          </Text>
        </View>

        <Text style={styles.section}>Recent payouts</Text>
        {payoutsQuery.data?.map((payout) => (
          <View key={payout.id} style={styles.payoutRow}>
            <View>
              <Text style={styles.payoutAmount}>{formatCurrency(payout.amount)}</Text>
              <Text style={styles.payoutDate}>{payout.date}</Text>
            </View>
            <StatusBadge label={payout.status} variant={payout.status === 'completed' ? 'success' : 'info'} />
          </View>
        ))}

        <Text style={styles.section}>Shift history</Text>
        {shiftsQuery.data?.map((shift) => (
          <View key={shift.id} style={styles.shiftRow}>
            <Text style={styles.shiftTitle}>{formatDuration(shift.durationMinutes)} online</Text>
            <Text style={styles.shiftMeta}>
              {shift.deliveriesCompleted} deliveries · {formatCurrency(shift.earnings)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.huge },
  title: { ...typography.h1, marginBottom: spacing.lg },
  metricsScroll: { marginBottom: spacing.lg },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  panelTitle: { ...typography.h3, marginBottom: spacing.sm },
  panelRow: { ...typography.body, color: colors.text, marginBottom: spacing.xs },
  panelHint: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm },
  section: { ...typography.h3, marginBottom: spacing.md, marginTop: spacing.md },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  payoutAmount: { ...typography.bodyMedium },
  payoutDate: { ...typography.caption, color: colors.textSecondary },
  shiftRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  shiftTitle: { ...typography.bodyMedium },
  shiftMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});
