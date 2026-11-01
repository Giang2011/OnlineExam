import toast from 'react-hot-toast';

const toastOptions = {
  duration: 3500,
  style: {
    borderRadius: '14px',
    padding: '12px 14px',
    fontSize: '14px',
    maxWidth: '420px',
  },
};

export const appToast = {
  success: (message: string) => toast.success(message, toastOptions),
  error: (message: string) => toast.error(message, toastOptions),
  warning: (message: string) => toast(message, { ...toastOptions, icon: '⚠️' }),
  info: (message: string) => toast(message, { ...toastOptions, icon: 'ℹ️' }),
};

export default appToast;
