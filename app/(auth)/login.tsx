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
import { spacing, typography, radius, shadows, colors as themeColors } from '@/theme';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';

const CARD_OVERLAP = 28;

const FEATURES = [
  { icon: 'bicycle-outline' as const, label: 'Flexible shifts' },
  { icon: 'navigate-outline' as const, label: 'Live trips' },
  { icon: 'wallet-outline' as const, label: 'Weekly payouts' },
];

export default function LoginScreen() {
  const { colors } = useTheme();
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
    } catch (err) {
      console.error('[Login] sendOtp failed:', err);
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[colors.primaryLight, colors.background]}
          locations={[0, 1]}
          style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}
          pointerEvents="none"
        >
          <View style={[styles.heroOrb1, { backgroundColor: colors.accentLight }]} pointerEvents="none" />
          <View style={[styles.heroOrb2, { backgroundColor: colors.primaryLight }]} pointerEvents="none" />

          <View style={styles.heroContent} pointerEvents="none">
            <AuthProgress currentStep={1} variant="light" />

            <View style={styles.logoWrap}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>Q</Text>
              </View>
              <View style={styles.logoBadge}>
                <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
              </View>
            </View>

            <Text style={[styles.heroTitle, { color: colors.text }]}>Quickmart Delivery</Text>
            <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
              Deliver orders and earn on your schedule from one place
            </Text>

            <View style={styles.featureRow}>
              {FEATURES.map((feature) => (
                <View
                  key={feature.label}
                  style={[
                    styles.featurePill,
                    { backgroundColor: colors.card, borderColor: colors.borderSubtle },
                  ]}
                >
                  <Ionicons name={feature.icon} size={14} color={colors.primary} />
                  <Text style={[styles.featureText, { color: colors.textSecondary }]}>{feature.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </LinearGradient>

        <View
          style={[
            styles.card,
            {
              marginTop: -CARD_OVERLAP,
              backgroundColor: colors.card,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.text }]}>Get started</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Enter your mobile number to receive a one-time password
          </Text>

          <Text style={[styles.label, { color: colors.text }]}>Mobile Number</Text>
          <PhoneNumberInput
            value={phone}
            onChangeText={(t) => {
              setPhone(t);
              if (error) setError('');
            }}
            error={!!error}
          />

          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
            </View>
          ) : (
            <Text style={[styles.hint, { color: colors.textMuted }]}>We'll send a 6-digit verification code via SMS</Text>
          )}

          <Pressable
            style={styles.terms}
            onPress={() => {
              setAccepted((prev) => !prev);
              if (error) setError('');
            }}
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: colors.border,
                  backgroundColor: accepted ? colors.primary : colors.surface,
                },
                accepted && { borderColor: colors.primary },
              ]}
            >
              {accepted && <Ionicons name="checkmark" size={14} color={colors.white} />}
            </View>
            <Text style={[styles.termsText, { color: colors.textSecondary }]}>
              I agree to the <Text style={[styles.link, { color: colors.primary }]}>Terms & Conditions</Text> and{' '}
              <Text style={[styles.link, { color: colors.primary }]}>Privacy Policy</Text>
            </Text>
          </Pressable>

          <Button
            title={loading ? 'Sending OTP...' : 'Continue'}
            onPress={handleContinue}
            loading={loading}
            disabled={!isValid}
            fullWidth
            leftIcon="arrow-forward"
          />

          {!isValid && !error && (
            <Text style={[styles.ctaHint, { color: colors.textMuted }]}>
              {phone.length < 10 ? 'Enter your 10-digit mobile number' : 'Accept terms to continue'}
            </Text>
          )}

          <View style={styles.secureRow}>
            <Ionicons name="lock-closed-outline" size={14} color={colors.textMuted} />
            <Text style={[styles.secureText, { color: colors.textMuted }]}>Your number is encrypted and never shared</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingBottom: CARD_OVERLAP + spacing.xxxl,
    overflow: 'hidden',
    borderBottomLeftRadius: radius.xl + 8,
    borderBottomRightRadius: radius.xl + 8,
  },
  heroOrb1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -60,
    right: -40,
    opacity: 0.7,
  },
  heroOrb2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    bottom: 20,
    left: -30,
    opacity: 0.6,
  },
  heroContent: { zIndex: 1 },
  logoWrap: { alignSelf: 'flex-start', marginBottom: spacing.lg, marginTop: spacing.md },
  logo: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: themeColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  logoText: { fontSize: 28, fontWeight: '800', color: themeColors.primary },
  logoBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: themeColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    maxWidth: '90%',
  },
  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '500',
  },
  card: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.xl,
    padding: spacing.xl,
    zIndex: 10,
    ...shadows.lg,
    borderWidth: 1,
    ...(Platform.OS === 'web' ? { position: 'relative' as const } : {}),
  },
  cardTitle: { ...typography.h2, marginBottom: spacing.xs },
  cardSubtitle: { ...typography.bodySmall, marginBottom: spacing.xl, lineHeight: 20 },
  label: { ...typography.label, marginBottom: spacing.sm },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  error: { ...typography.caption, flex: 1 },
  hint: { ...typography.caption, marginBottom: spacing.lg },
  terms: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.xl,
    paddingVertical: spacing.xs,
    cursor: Platform.OS === 'web' ? 'pointer' : undefined,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {},
  termsText: { ...typography.bodySmall, flex: 1, lineHeight: 20 },
  link: { fontWeight: '600' },
  ctaWrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.md,
    cursor: Platform.OS === 'web' ? 'pointer' : undefined,
  },
  ctaInactive: { opacity: 0.85 },
  ctaPressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  ctaDisabled: { opacity: 0.7 },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  ctaHint: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  secureText: { ...typography.caption },
});