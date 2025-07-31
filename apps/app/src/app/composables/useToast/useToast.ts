import { ref } from 'vue';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

const toasts = ref<Toast[]>([]);
let idCounter = 0;

export const useToast = () => {
  const showToast = (
    message: string,
    type: Toast['type'] = 'info',
    duration = 4000,
  ) => {
    const id = `${Date.now()}_${++idCounter}`;
    const toast: Toast = {
      id,
      message,
      type,
      duration,
    };

    toasts.value.push(toast);

    // Auto remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  };

  const removeToast = (id: string) => {
    const index = toasts.value.findIndex((toast) => toast.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
  };

  const clearAll = () => {
    toasts.value.splice(0);
  };

  // Convenience methods
  const success = (message: string, duration?: number) =>
    showToast(message, 'success', duration);
  const error = (message: string, duration?: number) =>
    showToast(message, 'error', duration);
  const warning = (message: string, duration?: number) =>
    showToast(message, 'warning', duration);
  const info = (message: string, duration?: number) =>
    showToast(message, 'info', duration);

  return {
    toasts: toasts,
    showToast,
    removeToast,
    clearAll,
    success,
    error,
    warning,
    info,
  };
};
