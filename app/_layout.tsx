import { useEffect, useCallback, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { processLastNotificationResponse } from '@/hooks/useNotifications';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useAuthStore } from '@/stores/authStore';
import {
  setAuthTokenGetter,
  setOnTokensRefreshed,
  setOnUnauthorized,
  setRefreshTokenGetter,
} from '@/services/api/client';
import { AppDialogHost } from '@/components/ui/AppDialogHost';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 30000 },
  },
});

function ColdStartNotificationHandler() {
  const client = useQueryClient();
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const handledRef = useRef(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    if (handledRef.current) return;
    handledRef.current = true;
    void processLastNotificationResponse(client);
  }, [isLoading, isAuthenticated, client]);

  return null;
}

function RootStack() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(app)" />
      </Stack>
      <AppDialogHost />
    </>
  );
}

export default function RootLayout() {
  const loadSession = useAuthStore((s) => s.loadSession);
  const logout = useAuthStore((s) => s.logout);

  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    setAuthTokenGetter(() => useAuthStore.getState().token);
    setRefreshTokenGetter(() => useAuthStore.getState().refreshToken);
    setOnTokensRefreshed((token, refreshToken) =>
      useAuthStore.getState().setTokens(token, refreshToken),
    );
    setOnUnauthorized(() => logout());
  }, [logout]);

  useEffect(() => {
    loadSession().finally(() => {
      if (fontsLoaded || fontError) {
        void SplashScreen.hideAsync();
      }
    });
  }, [loadSession, fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <ColdStartNotificationHandler />
            <BottomSheetModalProvider>
              <RootStack />
            </BottomSheetModalProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
