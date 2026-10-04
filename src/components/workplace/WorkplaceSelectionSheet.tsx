import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { deliveryPartnerService, sellersService, storesService } from '@/services/api';
import { markWorkplaceSelectionDone } from '@/stores/workplaceSelectionStore';
import { usePartnerSessionStore } from '@/stores/partnerSessionStore';
import type { NearbySeller } from '@/types/seller';
import type { NearbyStore } from '@/types/store';
import { formatDistance } from '@/utils/geo';
import { colors, radius, shadows, spacing, typography } from '@/theme';

export const ALL_SELLERS_OPTION_ID = '__all_sellers__';
const storeKey = (id: string) => `store:${id}`;
const sellerKey = (id: string) => `seller:${id}`;

type Props = {
  visible: boolean;
  latitude: number;
  longitude: number;
  dismissible?: boolean;
  initialStoreId?: string;
  initialSellerId?: string;
  initialScope?: 'store' | 'seller' | 'all_sellers';
  onClose?: () => void;
  onComplete?: () => void;
};

type SectionRow =
  | { kind: 'all_sellers' }
  | { kind: 'store'; store: NearbyStore }
  | { kind: 'seller'; seller: NearbySeller };

type Section = {
  title: string;
  data: SectionRow[];
};

function iconForStore(partnerType: string): keyof typeof Ionicons.glyphMap {
  if (partnerType === 'FOOD_STORE') return 'restaurant-outline';
  return 'storefront-outline';
}

function initialSelectionKey(
  scope: Props['initialScope'],
  storeId?: string,
  sellerId?: string,
): string {
  if (scope === 'store' && storeId) return storeKey(storeId);
  if (scope === 'seller' && sellerId) return sellerKey(sellerId);
  return ALL_SELLERS_OPTION_ID;
}

export function WorkplaceSelectionSheet({
  visible,
  latitude,
  longitude,
  dismissible = false,
  initialStoreId,
  initialSellerId,
  initialScope = 'all_sellers',
  onClose,
  onComplete,
}: Props) {
  const setPreferences = usePartnerSessionStore((s) => s.setPreferences);
  const [stores, setStores] = useState<NearbyStore[]>([]);
  const [sellers, setSellers] = useState<NearbySeller[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setSelectedKey(initialSelectionKey(initialScope, initialStoreId, initialSellerId));
    setSaveError('');
  }, [visible, initialScope, initialStoreId, initialSellerId]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError('');
      try {
        const [storesResult, sellersResult] = await Promise.allSettled([
          storesService.getNearby(latitude, longitude),
          sellersService.getNearby(latitude, longitude),
        ]);
        if (cancelled) return;

        const storeList = storesResult.status === 'fulfilled' ? storesResult.value : [];
        const sellerList = sellersResult.status === 'fulfilled' ? sellersResult.value : [];
        setStores(storeList);
        setSellers(sellerList);

        if (storesResult.status === 'rejected' && sellersResult.status === 'rejected') {
          setLoadError('Could not reach the server. Check Wi‑Fi and that the backend is running.');
        } else if (storesResult.status === 'rejected' || sellersResult.status === 'rejected') {
          setLoadError('Some lists could not load. You can still continue with what is shown.');
        }
      } catch {
        if (!cancelled) {
          setLoadError('Could not load nearby options. Try again in a moment.');
          setStores([]);
          setSellers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [visible, latitude, longitude]);

  const hasNearbyWorkplaces = stores.length > 0 || sellers.length > 0;
  const canDismissWithoutSelection = dismissible || (!loading && !hasNearbyWorkplaces);

  async function handleDismiss() {
    if (!loading && !hasNearbyWorkplaces) {
      await markWorkplaceSelectionDone();
    }
    onClose?.();
  }

  useEffect(() => {
    if (!visible || loading) return;

    if (!hasNearbyWorkplaces) {
      setSelectedKey(null);
      return;
    }

    if (selectedKey === ALL_SELLERS_OPTION_ID) return;

    if (selectedKey?.startsWith('store:')) {
      const id = selectedKey.replace('store:', '');
      if (!stores.some((s) => s.id === id)) setSelectedKey(ALL_SELLERS_OPTION_ID);
      return;
    }

    if (selectedKey?.startsWith('seller:')) {
      const id = selectedKey.replace('seller:', '');
      if (!sellers.some((s) => s.id === id)) setSelectedKey(ALL_SELLERS_OPTION_ID);
    }
  }, [visible, loading, hasNearbyWorkplaces, stores, sellers, selectedKey]);

  const sections = useMemo((): Section[] => {
    const result: Section[] = [];

    result.push({
      title: 'Stores',
      data: stores.map((store) => ({ kind: 'store', store })),
    });

    const sellerRows: SectionRow[] = hasNearbyWorkplaces ? [{ kind: 'all_sellers' }] : [];
    sellerRows.push(
      ...sellers.map((seller) => ({ kind: 'seller' as const, seller })),
    );

    result.push({
      title: 'Sellers',
      data: sellerRows,
    });

    return result;
  }, [stores, sellers, hasNearbyWorkplaces]);

  async function handleConfirm() {
    if (!selectedKey) return;
    setSaving(true);
    setSaveError('');
    try {
      let preferences;
      if (selectedKey === ALL_SELLERS_OPTION_ID) {
        preferences = { scope: 'all_sellers' as const };
      } else if (selectedKey.startsWith('store:')) {
        preferences = { scope: 'store' as const, storeId: selectedKey.replace('store:', '') };
      } else if (selectedKey.startsWith('seller:')) {
        preferences = { scope: 'seller' as const, sellerId: selectedKey.replace('seller:', '') };
      } else {
        return;
      }

      const session = await deliveryPartnerService.updatePreferences(preferences);
      setPreferences({
        scope: session.deliveryScope ?? preferences.scope,
        storeId: session.storeId ?? preferences.storeId,
        sellerId: session.sellerId ?? preferences.sellerId,
      });
      await markWorkplaceSelectionDone();
      onComplete?.();
      onClose?.();
    } catch {
      setSaveError('Could not save your choice. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function renderRow({ item }: { item: SectionRow }) {
    if (item.kind === 'all_sellers') {
      const selected = selectedKey === ALL_SELLERS_OPTION_ID;
      return (
        <TouchableOpacity
          style={[styles.option, selected && styles.optionSelected]}
          onPress={() => setSelectedKey(ALL_SELLERS_OPTION_ID)}
          activeOpacity={0.85}
        >
          <View style={styles.optionIcon}>
            <Ionicons name="globe-outline" size={18} color={colors.primary} />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionLabel}>All sellers</Text>
            <Text style={styles.optionSubtitle}>Work for every nearby seller</Text>
          </View>
          {selected ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}
        </TouchableOpacity>
      );
    }

    if (item.kind === 'store') {
      const { store } = item;
      const key = storeKey(store.id);
      const selected = selectedKey === key;
      const subtitle = [store.ownerLabel, formatDistance(store.distanceKm)]
        .filter(Boolean)
        .join(' · ');
      return (
        <TouchableOpacity
          style={[styles.option, selected && styles.optionSelected]}
          onPress={() => setSelectedKey(key)}
          activeOpacity={0.85}
        >
          <View style={styles.optionIcon}>
            <Ionicons name={iconForStore(store.partnerType)} size={18} color={colors.primary} />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionLabel}>{store.name}</Text>
            <Text style={styles.optionSubtitle}>{subtitle}</Text>
            {store.address ? <Text style={styles.optionAddress}>{store.address}</Text> : null}
          </View>
          {selected ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}
        </TouchableOpacity>
      );
    }

    const { seller } = item;
    const key = sellerKey(seller.id);
    const selected = selectedKey === key;
    return (
      <TouchableOpacity
        style={[styles.option, selected && styles.optionSelected]}
        onPress={() => setSelectedKey(key)}
        activeOpacity={0.85}
      >
        <View style={styles.optionIcon}>
          <Ionicons name="person-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.optionText}>
          <Text style={styles.optionLabel}>{seller.businessName}</Text>
          <Text style={styles.optionSubtitle}>{formatDistance(seller.distanceKm)} away</Text>
        </View>
        {selected ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}
      </TouchableOpacity>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={canDismissWithoutSelection ? handleDismiss : undefined}
    >
      <View style={styles.overlay}>
        {canDismissWithoutSelection ? (
          <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />
        ) : null}
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Choose workplace</Text>
              <Text style={styles.subtitle}>
                Pick a nearby store, or a seller — or work for all sellers in your area
              </Text>
            </View>
            {canDismissWithoutSelection && onClose ? (
              <TouchableOpacity style={styles.closeBtn} onPress={handleDismiss} hitSlop={8}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingText}>Finding stores and sellers near you…</Text>
            </View>
          ) : (
            <SectionList
              sections={sections}
              keyExtractor={(item, index) => {
                if (item.kind === 'all_sellers') return ALL_SELLERS_OPTION_ID;
                if (item.kind === 'store') return storeKey(item.store.id);
                return sellerKey(item.seller.id) + index;
              }}
              renderItem={renderRow}
              renderSectionHeader={({ section: { title, data } }) => (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{title}</Text>
                  {title === 'Stores' && data.length === 0 ? (
                    <Text style={styles.sectionEmpty}>No stores found near this location.</Text>
                  ) : null}
                  {title === 'Sellers' && data.length === 0 ? (
                    <Text style={styles.sectionEmpty}>No sellers found.</Text>
                  ) : null}
                </View>
              )}
              stickySectionHeadersEnabled={false}
              style={styles.list}
              contentContainerStyle={styles.listContent}
            />
          )}

          {loadError ? <Text style={styles.error}>{loadError}</Text> : null}
          {saveError ? <Text style={styles.error}>{saveError}</Text> : null}

          {!loading && !hasNearbyWorkplaces ? (
            <Button title="Browse app" onPress={handleDismiss} fullWidth />
          ) : (
            <Button
              title="Continue"
              onPress={handleConfirm}
              loading={saving}
              disabled={!selectedKey || loading}
              fullWidth
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    maxHeight: '88%',
    ...shadows.lg,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  headerText: { flex: 1, paddingRight: spacing.md },
  title: { ...typography.h3, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  list: { maxHeight: 400 },
  listContent: { paddingBottom: spacing.sm },
  sectionHeader: { marginTop: spacing.sm, marginBottom: spacing.xs },
  sectionTitle: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sectionEmpty: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1 },
  optionLabel: { ...typography.body, fontWeight: '600', color: colors.text },
  optionSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  optionAddress: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  loadingText: { ...typography.caption, color: colors.textSecondary },
  error: {
    ...typography.caption,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
