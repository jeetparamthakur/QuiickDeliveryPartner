import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Button } from '@/components/ui/Button';
import { openSupportEmail, openSupportWhatsApp } from '@/utils/maps';
import { colors, spacing, typography } from '@/theme';

export default function SupportScreen() {
  return (
    <ScreenWrapper>
      <View style={styles.content}>
        <Text style={styles.title}>Partner support</Text>
        <Text style={styles.subtitle}>
          Reach our delivery support team for payout, KYC, or trip issues.
        </Text>
        <Button title="WhatsApp support" onPress={() => openSupportWhatsApp()} fullWidth />
        <Button
          title="Email support"
          variant="secondary"
          onPress={() => openSupportEmail()}
          fullWidth
          style={{ marginTop: spacing.md }}
        />
        <Button
          title="Back"
          variant="ghost"
          onPress={() => router.back()}
          fullWidth
          style={{ marginTop: spacing.lg }}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg },
  title: { ...typography.h1, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl },
});
