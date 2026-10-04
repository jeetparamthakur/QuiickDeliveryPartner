import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthProgress } from '@/components/layout/AuthProgress';
import { PhoneNumberInput } from '@/components/ui/PhoneNumberInput';
import { authService } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing, typography, radius, shadows, gradients } from '@/theme';

const FEATURES = [
  { icon: 'bicycle-outline' as const, label: 'Flexible shifts' },
  { icon: 'navigate-outline' as const, label: 'Live trips' },
  { icon: 'wallet-outline' as const, label: 'Weekly payouts' },
];

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setPhoneStore = useAuthStore((s) => s.setPhone);

  const isValid = phone.length === 10 && accepted;

  async function handleContinue() {
    if (phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!accepted) {
      setError('Please accept Terms & Privacy Policy');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const fullPhone = `+91${phone}`;
      await authService.sendOtp(fullPhone);
      await setPhoneStore(fullPhone);
      router.push({ pathname: '/(auth)/otp', params: { phone: fullPhone } });
    } catch {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={[...gradients.primary]}
          style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}
        >
          <AuthProgress currentStep={1} variant="light" />
          <Text style={styles.heroTitle}>Quiick Delivery Partner</Text>
          <Text style={styles.heroSubtitle}>Deliver locally and earn on your schedule</Text>
          <View style={styles.featureRow}>
            {FEATURES.map((f) => (
              <View key={f.label} style={styles.featurePill}>
                <Ionicons name={f.icon} size={14} color="#fff" />
                <Text style={styles.featureText}>{f.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Partner login</Text>
          <Text style={styles.label}>Mobile number</Text>
          <PhoneNumberInput
            value={phone}
            onChangeText={(t) => {
              setPhone(t);
              if (error) setError('');
            }}
            error={!!error}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable style={styles.terms} onPress={() => setAccepted((v) => !v)}>
            <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
              {accepted ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
            </View>
            <Text style={styles.termsText}>I agree to the Terms & Privacy Policy</Text>
          </Pressable>
          <Pressable onPress={handleContinue} disabled={loading || !isValid} style={styles.cta}>
            <LinearGradient
              colors={isValid ? [...gradients.primary] : ['#94A3B8', '#CBD5E1']}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>{loading ? 'Sending OTP…' : 'Continue'}</Text>
            </LinearGradient>
          </Pressable>
          <Text style={styles.mockHint}>Mock OTP: 123456</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1 },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroTitle: { fontSize: 30, fontWeight: '800', color: '#fff', marginTop: spacing.lg },
  heroSubtitle: { color: 'rgba(255,255,255,0.9)', marginTop: spacing.sm, lineHeight: 22 },
  featureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xl },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  featureText: { color: '#fff', fontSize: 12 },
  card: {
    marginHorizontal: spacing.lg,
    marginTop: -24,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { ...typography.h2, marginBottom: spacing.lg },
  label: { ...typography.label, marginBottom: spacing.sm },
  error: { ...typography.caption, color: colors.danger, marginBottom: spacing.sm },
  terms: { flexDirection: 'row', gap: spacing.md, marginVertical: spacing.lg },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  termsText: { ...typography.bodySmall, color: colors.textSecondary, flex: 1 },
  cta: { borderRadius: radius.lg, overflow: 'hidden' },
  ctaGradient: { paddingVertical: spacing.lg, alignItems: 'center' },
  ctaText: { ...typography.button, color: '#fff' },
  mockHint: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md },
});
