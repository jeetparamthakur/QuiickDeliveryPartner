import { useDialogStore, type DialogAction, type DialogVariant } from '@/stores/dialogStore';

type AlertButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

function inferVariant(title: string, buttons?: AlertButton[]): DialogVariant {
  const normalized = title.toLowerCase();
  if (buttons?.some((button) => button.style === 'destructive')) return 'destructive';
  if (normalized.includes('delete') || normalized.includes('remove')) return 'destructive';
  if (normalized.includes('saved') || normalized.includes('success') || normalized.includes('added')) {
    return 'success';
  }
  if (normalized.includes('error') || normalized.includes('failed') || normalized.includes('cannot')) {
    return 'error';
  }
  if (
    normalized.includes('required') ||
    normalized.includes('invalid') ||
    normalized.includes('incomplete') ||
    normalized.includes('negative') ||
    normalized.includes('permission')
  ) {
    return 'warning';
  }
  return 'default';
}

export function appAlert(title: string, message?: string, buttons?: AlertButton[]) {
  const actions: DialogAction[] =
    buttons?.length && buttons.length > 0
      ? buttons.map((button) => ({
          text: button.text,
          style: button.style ?? 'default',
          onPress: button.onPress,
        }))
      : [{ text: 'OK', style: 'default' }];

  useDialogStore.getState().show({
    title,
    message,
    variant: inferVariant(title, buttons),
    actions,
    dismissOnBackdrop: !actions.some((action) => action.style === 'destructive'),
  });
}

export function appConfirm(
  title: string,
  message?: string,
  options?: {
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
    onConfirm?: () => void;
    onCancel?: () => void;
  },
) {
  appAlert(title, message, [
    { text: options?.cancelText ?? 'Cancel', style: 'cancel', onPress: options?.onCancel },
    {
      text: options?.confirmText ?? 'Confirm',
      style: options?.destructive ? 'destructive' : 'default',
      onPress: options?.onConfirm,
    },
  ]);
}
