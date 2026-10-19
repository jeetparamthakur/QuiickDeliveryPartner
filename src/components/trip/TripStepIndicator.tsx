import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { TRIP_PHASE_LABELS, tripStepPhaseIndex } from '@/constants/tripSteps';
import type { TripStep } from '@/types/partner';
import { TRIP_STEP_LABELS } from '@/types/partner';

type Props = {
  step: TripStep;
};

export function TripStepIndicator({ step }: Props) {
  const { colors, typography, spacing, radius } = useTheme();
  const activePhase = tripStepPhaseIndex(step);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {TRIP_PHASE_LABELS.map((label, index) => {
          const done = index < activePhase;
          const active = index === activePhase;
          const isLast = index === TRIP_PHASE_LABELS.length - 1;

          return (
            <View key={label} style={styles.phase}>
              <View style={styles.phaseTop}>
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: done || active ? colors.primary : colors.border,
                      borderRadius: radius.full,
                    },
                  ]}
                >
                  {done ? (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  ) : (
                    <Text
                      style={[
                        typography.caption,
                        {
                          color: active ? '#fff' : colors.textMuted,
                          fontWeight: '600',
                        },
                      ]}
                    >
                      {index + 1}
                    </Text>
                  )}
                </View>
                {!isLast ? (
                  <View
                    style={[
                      styles.line,
                      { backgroundColor: done ? colors.primary : colors.border },
                    ]}
                  />
                ) : null}
              </View>
              <Text
                style={[
                  typography.caption,
                  {
                    color: active ? colors.text : colors.textMuted,
                    marginTop: spacing.xs,
                    fontWeight: active ? '600' : '400',
                  },
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
        {TRIP_STEP_LABELS[step]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  phase: { flex: 1, alignItems: 'center' },
  phaseTop: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center' },
  dot: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: { flex: 1, height: 2, marginHorizontal: 4, maxWidth: 48 },
});
