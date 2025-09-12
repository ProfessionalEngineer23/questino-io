import { createContext, useContext, useState, useCallback, useMemo } from "react";

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((msg, type = "success", ttl = 4000) => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ttl);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="fixed inset-x-0 top-3 z-[60] flex justify-center px-3">
        <div className="flex w-full max-w-md flex-col gap-2">
          {toasts.map((t) => {
            const getToastStyles = (type) => {
              switch (type) {
                case "error":
                  return "border-red-200 bg-red-50 text-red-800";
                case "warning":
                  return "border-yellow-200 bg-yellow-50 text-yellow-800";
                case "info":
                  return "border-blue-200 bg-blue-50 text-blue-800";
                case "success":
                default:
                  return "border-emerald-200 bg-emerald-50 text-emerald-800";
              }
            };

            return (
              <div
                key={t.id}
                className={`animate-in fade-in slide-in-from-top-2 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm ${getToastStyles(t.type)}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{t.msg}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}
