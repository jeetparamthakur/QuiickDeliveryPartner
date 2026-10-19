import { View, StyleSheet } from 'react-native';
import { Button } from '@/components/ui/Button';
import { TRIP_STEP_UI } from '@/constants/tripSteps';
import { useTheme } from '@/context/ThemeContext';
import type { TripStep } from '@/types/partner';

type Props = {
  step: TripStep;
  loading?: boolean;
  primaryAdvanceLabel?: string;
  onAdvance: () => void;
  onOpenMaps?: () => void;
  onViewFullRoute?: () => void;
  onDismiss?: () => void;
};

export function TripActionFooter({
  step,
  loading,
  primaryAdvanceLabel,
  onAdvance,
  onOpenMaps,
  onViewFullRoute,
  onDismiss,
}: Props) {
  const { spacing } = useTheme();
  const config = TRIP_STEP_UI[step];

  if (step === 'completed') {
    return null;
  }

  return (
    <View style={[styles.footer, { gap: spacing.sm }]}>
      <Button
        title={primaryAdvanceLabel ?? config.primaryAdvanceLabel}
        onPress={onAdvance}
        loading={loading}
        fullWidth
        leftIcon={step === 'confirm_pickup' ? 'bag-check-outline' : step === 'confirm_delivery' ? 'checkmark-circle-outline' : undefined}
      />
      {config.secondaryMapsLabel && onOpenMaps ? (
        <Button
          title={config.secondaryMapsLabel}
          variant="secondary"
          onPress={onOpenMaps}
          disabled={loading}
          fullWidth
          leftIcon="navigate-outline"
        />
      ) : null}
      {onViewFullRoute ? (
        <Button
          title="View full route"
          variant="ghost"
          onPress={onViewFullRoute}
          disabled={loading}
          fullWidth
          leftIcon="map-outline"
        />
      ) : null}
      {onDismiss ? (
        <Button title="Close" variant="ghost" onPress={onDismiss} disabled={loading} fullWidth />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { width: '100%' },
});
