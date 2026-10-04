import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { StepProgress } from '@/components/layout/StepProgress';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { kycService } from '@/services/api';
import type { KycInfo, KycStatus } from '@/types';
import { colors, radius, spacing, typography } from '@/theme';

const DOCUMENTS = [
  { type: 'aadhaar', label: 'Aadhaar / ID', required: true },
  { type: 'driving_license', label: 'Driving license', required: true },
  { type: 'selfie', label: 'Selfie verification', required: true },
] as const;

const STATUS_VARIANT: Record<KycStatus, 'warning' | 'info' | 'success' | 'danger'> = {
  pending: 'warning',
  under_review: 'info',
  approved: 'success',
  rejected: 'danger',
};

export default function KycScreen() {
  const [kyc, setKyc] = useState<KycInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    kycService.getStatus().then(setKyc).finally(() => setLoading(false));
  }, []);

  async function pickAndUpload(type: string) {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to upload documents.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploading(type);
    try {
      const updated = await kycService.uploadDocument(type, result.assets[0].uri);
      setKyc(updated);
    } catch {
      Alert.alert('Upload failed', 'Please try again.');
    } finally {
      setUploading(null);
    }
  }

  const uploadedTypes = new Set(kyc?.documents.map((d) => d.type) ?? []);
  const canContinue = DOCUMENTS.filter((d) => d.required).every((d) => uploadedTypes.has(d.type));

  return (
    <ScreenWrapper>
      <View style={styles.content}>
        <StepProgress currentStep={2} totalSteps={4} label="KYC verification" />
        <Text style={styles.title}>Upload documents</Text>
        {kyc ? (
          <StatusBadge label={kyc.status.replace('_', ' ')} variant={STATUS_VARIANT[kyc.status]} />
        ) : null}

        {DOCUMENTS.map((doc) => {
          const done = uploadedTypes.has(doc.type);
          return (
            <TouchableOpacity
              key={doc.type}
              style={styles.docRow}
              onPress={() => pickAndUpload(doc.type)}
              disabled={!!uploading}
            >
              <View style={styles.docIcon}>
                <Ionicons
                  name={done ? 'checkmark-circle' : 'cloud-upload-outline'}
                  size={22}
                  color={done ? colors.success : colors.primary}
                />
              </View>
              <View style={styles.docText}>
                <Text style={styles.docLabel}>{doc.label}</Text>
                <Text style={styles.docHint}>
                  {uploading === doc.type ? 'Uploading…' : done ? 'Uploaded' : 'Tap to upload'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <Button
          title="Continue to bank details"
          onPress={() => router.push('/(onboarding)/bank')}
          disabled={!canContinue || loading}
          fullWidth
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  title: { ...typography.h1 },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  docIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docText: { flex: 1 },
  docLabel: { ...typography.bodyMedium, color: colors.text },
  docHint: { ...typography.caption, color: colors.textSecondary },
});
