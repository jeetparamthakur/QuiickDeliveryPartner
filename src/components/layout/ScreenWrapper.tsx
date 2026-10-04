import { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ViewStyle,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme';

const EXTRA_KEYBOARD_PADDING = spacing.xxl;

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  padding?: boolean;
  keyboardAware?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  style?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
};

export function ScreenWrapper({
  children,
  scroll = true,
  padding = true,
  keyboardAware = true,
  refreshing,
  onRefresh,
  style,
  edges = ['top'],
}: Props) {
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const shouldHandleKeyboard = scroll && keyboardAware;

  useEffect(() => {
    if (!shouldHandleKeyboard) return;

    const showSub = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [shouldHandleKeyboard]);

  const bottomPadding =
    spacing.xxxl +
    insets.bottom +
    (shouldHandleKeyboard ? keyboardHeight + EXTRA_KEYBOARD_PADDING : 0);

  const contentContainerStyle = [
    padding && styles.padding,
    padding && { paddingBottom: bottomPadding },
    style,
  ];

  const scrollContent = scroll ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="none"
      nestedScrollEnabled
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padding && styles.padding, style]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      {scrollContent}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  flex: { flex: 1 },
  padding: { padding: spacing.lg },
});
