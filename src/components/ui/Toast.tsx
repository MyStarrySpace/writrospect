"use client";

import { createContext, useContext, useState, useCallback, ReactNode, CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { neuRaised, neuColors } from "@/lib/styles/neu";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  action?: ToastAction;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, options?: { duration?: number; action?: ToastAction }) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

const icons: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const toastStyles: Record<ToastType, CSSProperties> = {
  success: {
    ...neuRaised,
    background: neuColors.success.background,
    color: neuColors.success.color,
  },
  error: {
    ...neuRaised,
    background: neuColors.danger.background,
    color: neuColors.danger.color,
  },
  info: {
    ...neuRaised,
    background: neuColors.info.background,
    color: neuColors.info.color,
  },
  warning: {
    ...neuRaised,
    background: neuColors.warning.background,
    color: neuColors.warning.color,
  },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const Icon = icons[toast.type];

  const handleAction = () => {
    toast.action?.onClick();
    onRemove();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="flex items-center gap-3 rounded-2xl px-4 py-3"
      style={toastStyles[toast.type]}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      {toast.action && (
        <button
          onClick={handleAction}
          className="flex-shrink-0 rounded-lg px-2 py-1 text-xs font-semibold transition-all hover:opacity-80"
          style={{
            background: "rgba(255,255,255,0.3)",
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={onRemove}
        className="flex-shrink-0 rounded-lg p-1 opacity-70 transition-opacity hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((
    type: ToastType,
    message: string,
    options?: { duration?: number; action?: ToastAction }
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    const duration = options?.duration ?? 5000;
    const toast: Toast = { id, type, message, duration, action: options?.action };

    setToasts((prev) => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onRemove={() => removeToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
