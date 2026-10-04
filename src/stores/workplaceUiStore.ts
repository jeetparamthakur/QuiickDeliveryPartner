import { create } from 'zustand';

type WorkplaceUiState = {
  openRequestId: number;
  requestOpen: () => void;
};

export const useWorkplaceUiStore = create<WorkplaceUiState>((set) => ({
  openRequestId: 0,
  requestOpen: () => set((state) => ({ openRequestId: state.openRequestId + 1 })),
}));
