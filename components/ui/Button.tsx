'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyle = 'font-medium rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2';

  const variants = {
    primary: 'bg-primary hover:bg-opacity-80 text-light',
    secondary: 'bg-dark-gray hover:bg-opacity-80 text-light',
    accent: 'bg-accent hover:bg-blue-400 text-light',
    danger: 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600',
    outline: 'bg-transparent border border-primary text-primary hover:bg-primary/10',
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      disabled={loading}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
      {...props}
    >
      {loading && <div className="animate-spin">⟳</div>}
      {children}
    </button>
  );
}
