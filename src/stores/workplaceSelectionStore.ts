import * as SecureStore from 'expo-secure-store';

const WORKPLACE_SELECTION_KEY = 'partner_workplace_selection_done';

export async function loadWorkplaceSelectionDone(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(WORKPLACE_SELECTION_KEY);
  return value === 'true';
}

export async function markWorkplaceSelectionDone(): Promise<void> {
  await SecureStore.setItemAsync(WORKPLACE_SELECTION_KEY, 'true');
}
