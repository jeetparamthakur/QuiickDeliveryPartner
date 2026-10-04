import { useCallback, useEffect, useState, type ReactNode } from 'react';
import * as Location from 'expo-location';
import { WorkplaceSelectionSheet } from './WorkplaceSelectionSheet';
import { usePartnerStore } from '@/stores/partnerStore';
import { usePartnerSessionStore } from '@/stores/partnerSessionStore';
import { loadWorkplaceSelectionDone, markWorkplaceSelectionDone } from '@/stores/workplaceSelectionStore';
import { deliveryPartnerService } from '@/services/api';

type Props = {
  children: ReactNode;
  /** When set, opens the sheet (e.g. from Profile). */
  manualOpenSignal?: number;
  onManualClose?: () => void;
};

export function WorkplaceSelectionGate({ children, manualOpenSignal = 0, onManualClose }: Props) {
  const profile = usePartnerStore((s) => s.profile);
  const preferences = usePartnerSessionStore((s) => s.preferences);
  const sessionLat = usePartnerSessionStore((s) => s.latitude);
  const sessionLng = usePartnerSessionStore((s) => s.longitude);
  const setLocation = usePartnerSessionStore((s) => s.setLocation);
  const setPreferences = usePartnerSessionStore((s) => s.setPreferences);

  const [gateChecked, setGateChecked] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [dismissible, setDismissible] = useState(false);
  const [coords, setCoords] = useState({ lat: sessionLat ?? 28.6139, lng: sessionLng ?? 77.209 });

  const isActivePartner =
    profile?.onboardingStep === 'active' && profile?.approvalStatus === 'approved';

  const evaluateGate = useCallback(async () => {
    if (!isActivePartner) {
      setShowSheet(false);
      setGateChecked(true);
      return;
    }
    const done = await loadWorkplaceSelectionDone();
    const hasWorkplace =
      Boolean(preferences.storeId) || Boolean(preferences.sellerId);
    if (done || hasWorkplace) {
      setShowSheet(false);
    } else {
      setDismissible(false);
      setShowSheet(true);
    }
    setGateChecked(true);
  }, [isActivePartner, preferences.storeId, preferences.sellerId]);

  useEffect(() => {
    evaluateGate();
  }, [evaluateGate]);

  useEffect(() => {
    if (!isActivePartner) return;
    deliveryPartnerService
      .getSession()
      .then(async (session) => {
        if (session.deliveryScope) {
          setPreferences({
            scope: session.deliveryScope,
            storeId: session.storeId ?? undefined,
            sellerId: session.sellerId ?? undefined,
          });
        }
        if (session.storeId || session.sellerId) {
          await markWorkplaceSelectionDone();
        }
      })
      .catch(() => undefined);
  }, [isActivePartner, setPreferences]);

  useEffect(() => {
    if (!manualOpenSignal) return;
    setDismissible(true);
    setShowSheet(true);
  }, [manualOpenSignal]);

  useEffect(() => {
    if (!showSheet) return;
    let cancelled = false;

    async function resolveLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled) {
            setCoords({
              lat: sessionLat ?? 28.6139,
              lng: sessionLng ?? 77.209,
            });
          }
          return;
        }
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        setLocation(latitude, longitude);
      } catch {
        if (!cancelled) {
          setCoords({
            lat: sessionLat ?? 28.6139,
            lng: sessionLng ?? 77.209,
          });
        }
      }
    }

    resolveLocation();
    return () => {
      cancelled = true;
    };
  }, [showSheet, sessionLat, sessionLng, setLocation]);

  function handleClose() {
    setShowSheet(false);
    onManualClose?.();
  }

  function handleComplete() {
    setShowSheet(false);
    onManualClose?.();
  }

  return (
    <>
      {children}
      {gateChecked && isActivePartner ? (
        <WorkplaceSelectionSheet
          visible={showSheet}
          latitude={coords.lat}
          longitude={coords.lng}
          dismissible={dismissible}
          initialScope={preferences.scope}
          initialStoreId={preferences.storeId}
          initialSellerId={preferences.sellerId}
          onClose={handleClose}
          onComplete={handleComplete}
        />
      ) : null}
    </>
  );
}
