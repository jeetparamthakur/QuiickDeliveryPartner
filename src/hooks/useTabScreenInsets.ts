import { useContext } from 'react';
import { BottomTabBarHeightContext } from 'expo-router/build/react-navigation/bottom-tabs/utils/BottomTabBarHeightContext';
import { spacing } from '@/theme';

function useOptionalBottomTabBarHeight() {
  return useContext(BottomTabBarHeightContext) ?? 0;
}

export function useTabScreenInsets(extra = spacing.lg) {
  const tabBarHeight = useOptionalBottomTabBarHeight();

  return {
    tabBarHeight,
    contentPaddingBottom: tabBarHeight + extra,
  };
}
