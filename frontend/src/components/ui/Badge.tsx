'use client'

import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  outline?: boolean;
}

export const Badge = ({ className = '', variant = 'default', outline = false, children, ...props }: BadgeProps) => {
  const baseStyles = "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border";
  
  const variants: Record<string, string> = {
    default: "bg-gray-800/40 border-gray-700/50 text-gray-400",
    success: "bg-green-500/10 border-green-500/30 text-green-400",
    warning: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
    error: "bg-red-500/10 border-red-500/30 text-red-400",
    info: "bg-blue-500/10 border-blue-500/30 text-blue-400"
  };

  const outlines: Record<string, string> = {
    default: "bg-transparent border-gray-700 text-gray-500",
    success: "bg-transparent border-green-500/50 text-green-500",
    warning: "bg-transparent border-yellow-500/50 text-yellow-500",
    error: "bg-transparent border-red-500/50 text-red-500",
    info: "bg-transparent border-blue-500/50 text-blue-500"
  };

  const activeVariant = outline ? outlines[variant] : variants[variant];

  return (
    <span className={`${baseStyles} ${activeVariant} ${className}`} {...props}>
      {children}
    </span>
  );
};
