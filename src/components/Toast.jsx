import { createContext, useContext, useState, useCallback, useMemo } from "react";

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((msg, type = "success", ttl = 2500) => {
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
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`animate-in fade-in slide-in-from-top-2 rounded-xl2 border px-4 py-3 shadow-card
              ${t.type === "error" ? "border-red-200 bg-white text-red-700" : "border-emerald-200 bg-white text-emerald-700"}`}
            >
              {t.msg}
            </div>
          ))}
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
