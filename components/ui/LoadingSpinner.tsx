'use client';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({
  message = 'กำลังโหลด...',
  fullScreen = false,
}: LoadingSpinnerProps) {
  const wrapperClass = fullScreen
    ? 'min-h-screen flex flex-col items-center justify-center gap-4'
    : 'flex flex-col items-center justify-center gap-4 py-12';

  return (
    <div className={wrapperClass} role="status" aria-live="polite">
      <div className="relative w-20 h-20">
        <svg
          className="absolute inset-0 animate-spin"
          style={{ animationDuration: '1.2s' }}
          viewBox="0 0 80 80"
          aria-hidden
        >
          <circle cx="40" cy="40" r="34" fill="none" stroke="#2A2A2A" strokeWidth="4" />
          <path
            d="M 40 6 A 34 34 0 0 1 74 40"
            fill="none"
            stroke="#FF4444"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
        <svg
          className="absolute inset-0 m-auto"
          width="36"
          height="36"
          viewBox="0 0 32 40"
          fill="none"
          stroke="#FF4444"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="22" cy="5" r="2.5" />
          <line x1="22" y1="7.5" x2="22" y2="22" />
          <path d="M 22 22 Q 22 35 12 35 Q 4 35 4 27" />
          <line x1="4" y1="27" x2="7.5" y2="29.5" />
        </svg>
      </div>
      {message && <p className="text-gray-400 text-sm">{message}</p>}
    </div>
  );
}
