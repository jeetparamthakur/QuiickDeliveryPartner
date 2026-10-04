import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/stores/authStore';
import {
  setAuthTokenGetter,
  setOnTokensRefreshed,
  setOnUnauthorized,
  setRefreshTokenGetter,
} from '@/services/api/client';
import { AppDialogHost } from '@/components/ui/AppDialogHost';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 30000 },
  },
});

export default function RootLayout() {
  const loadSession = useAuthStore((s) => s.loadSession);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    setAuthTokenGetter(() => useAuthStore.getState().token);
    setRefreshTokenGetter(() => useAuthStore.getState().refreshToken);
    setOnTokensRefreshed((token, refreshToken) =>
      useAuthStore.getState().setTokens(token, refreshToken)
    );
    setOnUnauthorized(() => logout());
  }, [logout]);

  useEffect(() => {
    loadSession().finally(() => SplashScreen.hideAsync());
  }, [loadSession]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <BottomSheetModalProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(app)" />
          </Stack>
          <AppDialogHost />
        </BottomSheetModalProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
