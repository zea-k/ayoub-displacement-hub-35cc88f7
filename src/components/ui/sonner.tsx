// Toast notifications disabled - no popups will be shown
const Toaster = () => null;

// No-op toast function - all toast calls will be silently ignored
const toast = {
  success: () => {},
  error: () => {},
  info: () => {},
  warning: () => {},
  loading: () => {},
  custom: () => {},
  promise: () => {},
  dismiss: () => {},
  message: () => {},
};

export { Toaster, toast };
