import * as ExpoHaptics from 'expo-haptics';

export const ImpactFeedbackStyle = ExpoHaptics.ImpactFeedbackStyle;
export const NotificationFeedbackType = ExpoHaptics.NotificationFeedbackType;

export async function selectionAsync(): Promise<void> {
  try {
    await ExpoHaptics.selectionAsync();
  } catch {
    // unavailable on some platforms
  }
}

export async function impactAsync(style: ExpoHaptics.ImpactFeedbackStyle): Promise<void> {
  try {
    await ExpoHaptics.impactAsync(style);
  } catch {
    // unavailable on some platforms
  }
}

export async function notificationAsync(type: ExpoHaptics.NotificationFeedbackType): Promise<void> {
  try {
    await ExpoHaptics.notificationAsync(type);
  } catch {
    // unavailable on some platforms
  }
}
