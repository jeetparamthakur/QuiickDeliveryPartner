import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AuthProgress } from '@/components/layout/AuthProgress';
import { OTPInput } from '@/components/ui/OTPInput';
import { Button } from '@/components/ui/Button';
import { authService, deliveryPartnerService } from '@/services/api';
import { getPostAuthRoute } from '@/services/api/mappers/partnerProfile';
import { useAuthStore } from '@/stores/authStore';
import { usePartnerStore } from '@/stores/partnerStore';
import { colors, spacing, typography } from '@/theme';

export default function OTPScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const setTokens = useAuthStore((s) => s.setTokens);
  const setProfile = usePartnerStore((s) => s.setProfile);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  async function handleVerify() {
    if (otp.length !== 6) {
      setError('Please enter 6-digit OTP');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { token, refreshToken } = await authService.verifyOtp(phone ?? '', otp);
      await setTokens(token, refreshToken);
      const profile = await deliveryPartnerService.getProfile();
      await setProfile(profile);
      router.replace(getPostAuthRoute(profile) as '/');
    } catch {
      setError('Invalid OTP. Use 000000 in local dev or the code from the backend logs.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenWrapper scroll={false}>
      <View style={styles.container}>
        <AuthProgress currentStep={2} />
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
          <Text style={styles.backText}>Edit mobile number</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          Code sent to <Text style={styles.phone}>{phone}</Text>
        </Text>
        <OTPInput value={otp} onChange={setOtp} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Verify & Continue" onPress={handleVerify} loading={loading} fullWidth />
        <Text style={styles.resend} onPress={() => resendTimer === 0 && setResendTimer(30)}>
          {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
        </Text>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.lg },
  backText: { ...typography.bodySmall, color: colors.textSecondary },
  title: { ...typography.h1, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl },
  phone: { fontWeight: '600', color: colors.text },
  error: { ...typography.caption, color: colors.danger, textAlign: 'center', marginVertical: spacing.sm },
  resend: { ...typography.bodySmall, color: colors.primary, textAlign: 'center', marginTop: spacing.xl },
});
