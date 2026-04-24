import { useToast } from "../context/ToastContext";

const ToastViewport = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed right-4 top-4 z-50 space-y-2">
      {toasts.map((toast) => {
        const styles =
          toast.type === "success"
            ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
            : "border-rose-500/30 bg-rose-500/15 text-rose-200";

        return (
          <button
            key={toast.id}
            type="button"
            onClick={() => removeToast(toast.id)}
            className={`block w-80 rounded-xl border px-4 py-3 text-left text-sm shadow-lg backdrop-blur ${styles}`}
          >
            {toast.message}
          </button>
        );
      })}
    </div>
  );
};

export default ToastViewport;
