import { Tabs } from 'expo-router';
import { View, StyleSheet, Text, type ColorValue } from 'react-native';
import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

function TabIcon({
  name,
  color,
  size,
  focused,
  label,
  filled,
}: {
  name: IoniconName;
  color: ColorValue;
  size: number;
  focused: boolean;
  label: string;
  filled: IoniconName;
}) {
  const { colors, layout } = useTheme();

  return (
    <View
      style={[styles.iconWrap, { height: layout.tabContentHeight }]}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
    >
      {focused ? (
        <View style={[styles.indicator, { backgroundColor: colors.primary }]} />
      ) : null}
      <Ionicons name={focused ? filled : name} size={size} color={color} />
    </View>
  );
}

export default function TabsLayout() {
  const { colors, layout, shadows, fontFamily } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarPaddingBottom = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.borderSubtle,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: layout.tabContentHeight + tabBarPaddingBottom + layout.tabBarPaddingTop,
          paddingBottom: tabBarPaddingBottom,
          paddingTop: layout.tabBarPaddingTop,
          ...shadows.sm,
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.04,
        },
        tabBarLabel: ({ color, children }) => (
          <Text style={{ fontSize: 10, fontFamily: fontFamily.semiBold, color, marginTop: 0 }} numberOfLines={1}>
            {children}
          </Text>
        ),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="home-outline" filled="home" color={color} size={size} focused={focused} label="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Requests',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="list-outline" filled="list" color={color} size={size} focused={focused} label="Requests" />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="cube-outline" filled="cube" color={color} size={size} focused={focused} label="Orders" />
          ),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: 'Earnings',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              name="wallet-outline"
              filled="wallet"
              color={color}
              size={size}
              focused={focused}
              label="Earnings"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              name="person-outline"
              filled="person"
              color={color}
              size={size}
              focused={focused}
              label="Profile"
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: 22,
    height: 3,
    borderRadius: 2,
  },
});
