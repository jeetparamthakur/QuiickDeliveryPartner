import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { StepProgress } from '@/components/layout/StepProgress';
import { Button } from '@/components/ui/Button';
import { deliveryPartnerService } from '@/services/api';
import { usePartnerStore } from '@/stores/partnerStore';
import { getPostAuthRoute } from '@/services/api/mappers/partnerProfile';
import { colors, radius, spacing, typography } from '@/theme';

export default function PendingApprovalScreen() {
  const profile = usePartnerStore((s) => s.profile);
  const setProfile = usePartnerStore((s) => s.setProfile);
  const [loading, setLoading] = useState(false);

  async function refreshStatus() {
    setLoading(true);
    try {
      const updated = await deliveryPartnerService.getProfile();
      await setProfile(updated);
      if (updated.approvalStatus === 'approved') {
        router.replace(getPostAuthRoute(updated) as '/');
      }
    } finally {
      setLoading(false);
    }
  }

  async function demoApprove() {
    setLoading(true);
    try {
      const updated = await deliveryPartnerService.approveForDemo();
      await setProfile(updated);
      router.replace('/(app)/(tabs)/home');
    } finally {
      setLoading(false);
    }
  }

  const rejected = profile?.approvalStatus === 'rejected';

  return (
    <ScreenWrapper scroll={false}>
      <View style={styles.content}>
        <StepProgress currentStep={4} totalSteps={4} label="Review" />
        <View style={styles.iconWrap}>
          <Ionicons
            name={rejected ? 'close-circle-outline' : 'time-outline'}
            size={48}
            color={rejected ? colors.danger : colors.warning}
          />
        </View>
        <Text style={styles.title}>
          {rejected ? 'Application not approved' : 'Verification in progress'}
        </Text>
        <Text style={styles.subtitle}>
          {rejected
            ? 'Please contact support to resubmit your documents.'
            : 'Our team is reviewing your KYC and bank details. You can go online once approved.'}
        </Text>
        <Button title="Refresh status" onPress={refreshStatus} loading={loading} fullWidth />
        {!rejected ? (
          <Button
            title="Dev: Approve partner"
            variant="secondary"
            onPress={demoApprove}
            loading={loading}
            fullWidth
            style={{ marginTop: spacing.md }}
          />
        ) : null}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  iconWrap: {
    alignSelf: 'center',
    width: 88,
    height: 88,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { ...typography.h1, textAlign: 'center', marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
});
