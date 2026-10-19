import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, RefreshControl, FlatList } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { useTabScreenInsets } from '@/hooks/useTabScreenInsets';
import { PartnerOrderCard } from '@/components/cards/PartnerOrderCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { usePartnerOrdersQuery } from '@/hooks/usePartnerOrdersQuery';
import type { PartnerOrder, PartnerOrdersTab } from '@/types/partner';
import { spacing, typography } from '@/theme';
import { useTheme } from '@/context/ThemeContext';

const TAB_OPTIONS: { value: PartnerOrdersTab; label: string }[] = [
  { value: 'active', label: 'In delivery' },
  { value: 'delivered', label: 'Delivered' },
];

export default function OrdersScreen() {
  const { colors } = useTheme();
  const { contentPaddingBottom } = useTabScreenInsets();
  const [tab, setTab] = useState<PartnerOrdersTab>('active');
  const ordersQuery = usePartnerOrdersQuery(tab);

  useFocusEffect(
    useCallback(() => {
      ordersQuery.refetch();
    }, [tab]),
  );

  const handlePress = useCallback(
    (order: PartnerOrder) => {
      if (tab === 'active') {
        router.push(`/(app)/trip/${order.orderId}`);
        return;
      }
      router.push({
        pathname: '/(app)/orders/[orderId]',
        params: { orderId: order.orderId },
      });
    },
    [tab],
  );

  const renderItem = useCallback(
    ({ item }: { item: PartnerOrder }) => (
      <PartnerOrderCard order={item} onPress={() => handlePress(item)} />
    ),
    [handlePress],
  );

  const empty =
    tab === 'active'
      ? {
          icon: 'bicycle-outline' as const,
          title: 'No deliveries in progress',
          message: 'Accept a request to start a trip. Active orders appear here.',
        }
      : {
          icon: 'checkmark-circle-outline' as const,
          title: 'No delivered orders yet',
          message: 'Completed trips will show up in this list.',
        };

  return (
    <ScreenWrapper scroll={false} edges={['top']}>
      <Text style={[styles.title, { color: colors.text }]}>Orders</Text>
      <View style={styles.segmentWrap}>
        <SegmentedControl options={TAB_OPTIONS} value={tab} onChange={setTab} />
      </View>

      <FlatList
        data={ordersQuery.data ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: contentPaddingBottom },
          !(ordersQuery.data?.length) && styles.listEmpty,
        ]}
        refreshControl={
          <RefreshControl refreshing={ordersQuery.isRefetching} onRefresh={() => ordersQuery.refetch()} />
        }
        ListEmptyComponent={
          ordersQuery.isLoading ? null : (
            <EmptyState icon={empty.icon} title={empty.title} message={empty.message} />
          )
        }
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h1, marginHorizontal: spacing.lg, marginBottom: spacing.md },
  segmentWrap: { marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  list: { padding: spacing.lg, paddingTop: spacing.md, flexGrow: 1 },
  listEmpty: { flex: 1, justifyContent: 'center' },
});
