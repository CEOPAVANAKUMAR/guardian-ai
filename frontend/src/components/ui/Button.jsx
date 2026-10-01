import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Button - Standardized Enterprise Button Component System
 * Satisfies Requirement #8: Consistent height, radius, padding, hover, focus, disabled states.
 */
export function PrimaryButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  icon: Icon,
  variant = 'emerald', // 'emerald' | 'violet' | 'amber' | 'crimson' | 'cyan'
  size = 'md', // 'sm' | 'md' | 'lg'
  type = 'button',
  className = '',
  title,
}) {
  const variantStyles = {
    emerald: 'bg-emerald-500 hover:bg-emerald-400 text-[#050608] shadow-emerald-500/20 font-bold',
    violet: 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-500/20 font-semibold',
    amber: 'bg-amber-500 hover:bg-amber-400 text-[#050608] shadow-amber-500/20 font-bold',
    crimson: 'bg-rose-500 hover:bg-rose-400 text-[#050608] shadow-rose-500/20 font-bold',
    cyan: 'bg-cyan-500 hover:bg-cyan-400 text-[#050608] shadow-cyan-500/20 font-bold',
  };

  const sizeStyles = {
    sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
    md: 'h-9 sm:h-10 px-4 text-xs sm:text-sm gap-2 rounded-xl',
    lg: 'h-11 sm:h-12 px-6 text-sm sm:text-base gap-2.5 rounded-xl',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      className={`inline-flex items-center justify-center font-sans tracking-wide transition-all duration-150 shadow-md active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-emerald-400/50 ${
        variantStyles[variant] || variantStyles.emerald
      } ${sizeStyles[size]} ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  icon: Icon,
  size = 'md',
  type = 'button',
  className = '',
  title,
}) {
  const sizeStyles = {
    sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
    md: 'h-9 sm:h-10 px-4 text-xs sm:text-sm gap-2 rounded-xl',
    lg: 'h-11 sm:h-12 px-5 text-sm gap-2 rounded-xl',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      className={`inline-flex items-center justify-center font-sans font-medium text-[#C8D0DC] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-white/20 ${sizeStyles[size]} ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0 text-[#B5BEC9]" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0 text-[#B5BEC9]" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}

export function DangerButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  icon: Icon,
  size = 'md',
  type = 'button',
  className = '',
  title,
}) {
  const sizeStyles = {
    sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
    md: 'h-9 sm:h-10 px-4 text-xs sm:text-sm gap-2 rounded-xl',
    lg: 'h-11 sm:h-12 px-5 text-sm gap-2 rounded-xl',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      className={`inline-flex items-center justify-center font-sans font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 hover:border-rose-500/70 transition-all duration-150 shadow-md shadow-rose-950/30 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-rose-500/40 ${sizeStyles[size]} ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0 text-rose-400" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0 text-rose-400" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
