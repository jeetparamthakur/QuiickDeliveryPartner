import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { StepProgress } from '@/components/layout/StepProgress';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { OptionSelectGrid } from '@/components/ui/OptionSelectGrid';
import { deliveryPartnerService } from '@/services/api';
import { usePartnerStore } from '@/stores/partnerStore';
import { VEHICLE_OPTIONS } from '@/constants/vehicleOptions';
import type { VehicleType } from '@/types';
import { colors, spacing, typography } from '@/theme';

export default function ProfileOnboardingScreen() {
  const profile = usePartnerStore((s) => s.profile);
  const setProfile = usePartnerStore((s) => s.setProfile);
  const [name, setName] = useState(profile?.name ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [vehicleType, setVehicleType] = useState<VehicleType>(profile?.vehicleType ?? 'bike');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleContinue() {
    if (!name.trim() || !city.trim()) {
      setError('Name and city are required');
      return;
    }
    setLoading(true);
    try {
      const updated = await deliveryPartnerService.updateProfile({
        name: name.trim(),
        city: city.trim(),
        vehicleType,
      });
      await setProfile(updated);
      router.replace('/(onboarding)/kyc');
    } catch {
      setError('Could not save profile');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.content}>
        <StepProgress currentStep={1} totalSteps={4} label="Partner profile" />
        <Text style={styles.title}>Tell us about you</Text>
        <Text style={styles.subtitle}>We use this to match you with nearby deliveries</Text>
        <Input label="Full name" value={name} onChangeText={setName} placeholder="Your name" />
        <Input label="City" value={city} onChangeText={setCity} placeholder="e.g. New Delhi" />
        <Text style={styles.label}>Vehicle type</Text>
        <OptionSelectGrid
          options={VEHICLE_OPTIONS}
          value={vehicleType}
          onChange={setVehicleType}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Continue" onPress={handleContinue} loading={loading} fullWidth />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  title: { ...typography.h1 },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  label: { ...typography.label, marginTop: spacing.sm },
  error: { ...typography.caption, color: colors.danger },
});
