'use client';

import { useEffect } from 'react';
import { CheckCircle2, XCircle, Info } from 'lucide-react';
import { useToastStore, Toast } from '@/lib/toast';

const ICONS: Record<Toast['type'], React.ReactNode> = {
  success: <CheckCircle2 size={20} />,
  error: <XCircle size={20} />,
  info: <Info size={20} />,
};

const STYLES: Record<Toast['type'], string> = {
  success: 'bg-green-600/95 border-green-400 text-white',
  error: 'bg-red-600/95 border-red-400 text-white',
  info: 'bg-blue-600/95 border-blue-400 text-white',
};

const DURATION_MS = 3000;

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div
      aria-live="polite"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none w-[90vw] max-w-sm"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);

  useEffect(() => {
    const t = setTimeout(() => dismiss(toast.id), DURATION_MS);
    return () => clearTimeout(t);
  }, [toast.id, dismiss]);

  return (
    <div
      role="status"
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur pointer-events-auto ${STYLES[toast.type]}`}
    >
      <span aria-hidden className="flex-shrink-0">{ICONS[toast.type]}</span>
      <span className="text-sm flex-1">{toast.message}</span>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        aria-label="ปิด"
        className="opacity-70 hover:opacity-100 text-sm flex-shrink-0"
      >
        ✕
      </button>
    </div>
  );
}
