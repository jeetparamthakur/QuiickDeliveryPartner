import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/theme';

type Props = {
  currentStep: number;
  totalSteps: number;
  label?: string;
};

export function StepProgress({ currentStep, totalSteps, label }: Props) {
  const progress = (currentStep / totalSteps) * 100;
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepText}>
          {label ?? `Step ${currentStep} of ${totalSteps}`}
        </Text>
        <Text style={styles.percent}>{Math.round(progress)}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  stepText: { ...typography.bodySmall, color: colors.textSecondary },
  percent: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  track: { height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
});
