import { create } from 'zustand';

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  onConfirm?: () => void;
  showCancel?: boolean;
  openModal: (options: { title: string; message: string; type?: 'info' | 'success' | 'error' | 'warning'; showCancel?: boolean; onConfirm?: () => void }) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  title: '',
  message: '',
  type: 'info',
  onConfirm: undefined,
  showCancel: false,
  openModal: (options) => set({ 
    isOpen: true, 
    title: options.title, 
    message: options.message,
    type: options.type || 'info',
    showCancel: options.showCancel || false,
    onConfirm: options.onConfirm
  }),
  closeModal: () => set({ isOpen: false, onConfirm: undefined }),
}));