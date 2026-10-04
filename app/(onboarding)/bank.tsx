import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { StepProgress } from '@/components/layout/StepProgress';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { deliveryPartnerService } from '@/services/api';
import { usePartnerStore } from '@/stores/partnerStore';
import { colors, spacing, typography } from '@/theme';

export default function BankScreen() {
  const setProfile = usePartnerStore((s) => s.setProfile);
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!accountHolderName || !bankName || accountNumber.length < 8 || ifscCode.length < 4) {
      setError('Please fill valid bank details');
      return;
    }
    setLoading(true);
    const bank = {
      accountHolderName: accountHolderName.trim(),
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim().toUpperCase(),
    };
    try {
      const profile = await deliveryPartnerService.completeOnboarding(bank);
      await setProfile(profile);
      router.replace('/(onboarding)/pending-approval');
    } catch {
      setError('Could not submit bank details');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.content}>
        <StepProgress currentStep={3} totalSteps={4} label="Payout account" />
        <Text style={styles.title}>Bank details</Text>
        <Text style={styles.subtitle}>Weekly settlements are sent to this account</Text>
        <Input label="Account holder name" value={accountHolderName} onChangeText={setAccountHolderName} />
        <Input label="Bank name" value={bankName} onChangeText={setBankName} />
        <Input
          label="Account number"
          value={accountNumber}
          onChangeText={setAccountNumber}
          keyboardType="number-pad"
        />
        <Input label="IFSC code" value={ifscCode} onChangeText={setIfscCode} autoCapitalize="characters" />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Submit for approval" onPress={handleSubmit} loading={loading} fullWidth />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  title: { ...typography.h1 },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  error: { ...typography.caption, color: colors.danger },
});
