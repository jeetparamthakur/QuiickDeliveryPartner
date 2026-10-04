import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/theme';

const STEPS = ['Login', 'Verify', 'Choose Type'];

type Props = {
  currentStep: 1 | 2 | 3;
  variant?: 'default' | 'light';
};

export function AuthProgress({ currentStep, variant = 'default' }: Props) {
  const isLight = variant === 'light';

  return (
    <View style={styles.container}>
      <Text style={[styles.stepLabel, isLight && styles.stepLabelLight]}>
        Step {currentStep} of 3 · {STEPS[currentStep - 1]}
      </Text>
      <View style={styles.barRow}>
        {STEPS.map((_, index) => {
          const stepNum = index + 1;
          const isActive = stepNum <= currentStep;
          const isCurrent = stepNum === currentStep;
          return (
            <View
              key={stepNum}
              style={[
                styles.segment,
                isLight && styles.segmentLight,
                isActive && (isLight ? styles.segmentActiveLight : styles.segmentActive),
                isCurrent && styles.segmentCurrent,
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  stepLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  stepLabelLight: {
    color: 'rgba(255,255,255,0.75)',
  },
  barRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  segmentLight: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
  segmentActiveLight: {
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  segmentCurrent: {
    height: 5,
  },
});
