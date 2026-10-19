import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { authService, bankService, kycService, partnerSessionService } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { usePartnerStore } from '@/stores/partnerStore';
import { usePartnerSessionStore } from '@/stores/partnerSessionStore';
import { useWorkplaceUiStore } from '@/stores/workplaceUiStore';
import { VEHICLE_LABELS } from '@/types';
import { formatPhone, getInitials, maskAccountNumber } from '@/utils/format';
import { colors, radius, spacing, typography, shadows } from '@/theme';

export default function ProfileTabScreen() {
  const profile = usePartnerStore((s) => s.profile);
  const logoutAuth = useAuthStore((s) => s.logout);
  const clearProfile = usePartnerStore((s) => s.clearProfile);
  const applyOnlineStatus = usePartnerSessionStore((s) => s.applyOnlineStatus);
  const preferences = usePartnerSessionStore((s) => s.preferences);
  const requestWorkplaceOpen = useWorkplaceUiStore((s) => s.requestOpen);

  const kycQuery = useQuery({ queryKey: ['kyc'], queryFn: () => kycService.getStatus() });
  const bankQuery = useQuery({ queryKey: ['bank'], queryFn: () => bankService.get() });

  async function handleLogout() {
    const status = await partnerSessionService.setOnline(false).catch(() => null);
    if (status) applyOnlineStatus(status);
    else applyOnlineStatus({ isOnline: false, currentShiftStartedAt: null, todayOnlineMinutes: 0 });
    await authService.logout().catch(() => undefined);
    await clearProfile();
    await logoutAuth();
    router.replace('/(auth)/login');
  }

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(profile?.name ?? 'Partner')}</Text>
          </View>
          <View style={styles.heroText}>
            <Text style={styles.name}>{profile?.name ?? 'Partner'}</Text>
            <Text style={styles.subtitle}>{profile?.city ?? 'Delivery partner'}</Text>
            {profile?.phone ? <Text style={styles.phone}>{formatPhone(profile.phone)}</Text> : null}
          </View>
          <StatusBadge
            label={profile?.approvalStatus ?? 'pending'}
            variant={profile?.approvalStatus === 'approved' ? 'success' : 'warning'}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>
          <Row label="Vehicle" value={VEHICLE_LABELS[profile?.vehicleType ?? 'bike']} />
          <Row label="KYC" value={kycQuery.data?.status ?? 'pending'} />
          <Row
            label="Bank"
            value={
              bankQuery.data
                ? `${bankQuery.data.bankName} ${maskAccountNumber(bankQuery.data.accountNumber)}`
                : 'Not added'
            }
          />
        </View>

        <TouchableOpacity style={styles.menuItem} onPress={requestWorkplaceOpen}>
          <Ionicons name="business-outline" size={22} color={colors.primary} />
          <View style={styles.menuTextBlock}>
            <Text style={styles.menuLabel}>Workplace</Text>
            <Text style={styles.menuHint}>
              {preferences.scope === 'store' && preferences.storeId
                ? 'Delivering for one store'
                : preferences.scope === 'seller' && preferences.sellerId
                  ? 'Delivering for one seller'
                  : 'All sellers in your area'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(app)/support')}>
          <Ionicons name="help-circle-outline" size={22} color={colors.primary} />
          <Text style={styles.menuLabel}>Help & support</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <Button title="Log out" variant="secondary" onPress={handleLogout} fullWidth />
      </ScrollView>
    </ScreenWrapper>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.huge },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.h3, color: colors.primaryDark },
  heroText: { flex: 1 },
  name: { ...typography.h3 },
  subtitle: { ...typography.caption, color: colors.textSecondary },
  phone: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { ...typography.h3, marginBottom: spacing.md },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  rowLabel: { ...typography.bodySmall, color: colors.textSecondary },
  rowValue: { ...typography.bodySmall, color: colors.text, textTransform: 'capitalize' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuTextBlock: { flex: 1 },
  menuLabel: { ...typography.bodyMedium },
  menuHint: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
});
