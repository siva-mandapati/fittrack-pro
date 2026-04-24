import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

let toastId = 1;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (message, type = "success") => {
      const id = toastId++;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), 3200);
    },
    [removeToast]
  );

  const value = useMemo(
    () => ({
      success: (message) => pushToast(message, "success"),
      error: (message) => pushToast(message, "error"),
      removeToast,
      toasts,
    }),
    [pushToast, removeToast, toasts]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};

export const useToast = () => useContext(ToastContext);
