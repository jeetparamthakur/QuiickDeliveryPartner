import { create } from 'zustand';

export type DialogVariant = 'default' | 'success' | 'error' | 'warning' | 'destructive';

export type DialogActionStyle = 'default' | 'cancel' | 'destructive';

export type DialogAction = {
  text: string;
  style?: DialogActionStyle;
  onPress?: () => void;
};

export type DialogOptions = {
  title: string;
  message?: string;
  variant?: DialogVariant;
  actions?: DialogAction[];
  dismissOnBackdrop?: boolean;
};

type DialogState = {
  visible: boolean;
  options: DialogOptions | null;
  queue: DialogOptions[];
  show: (options: DialogOptions) => void;
  hide: () => void;
};

export const useDialogStore = create<DialogState>((set, get) => ({
  visible: false,
  options: null,
  queue: [],

  show: (options) => {
    const { visible } = get();
    if (visible) {
      set({ queue: [...get().queue, options] });
      return;
    }
    set({ visible: true, options });
  },

  hide: () => {
    const { queue } = get();
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      set({ options: next, queue: rest });
      return;
    }
    set({ visible: false, options: null });
  },
}));
