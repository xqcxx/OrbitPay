'use client'

import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rect' | 'circle' | 'text';
}

export const Skeleton = ({ className = '', variant = 'rect', ...props }: SkeletonProps) => {
  const baseStyles = "animate-pulse bg-gray-800/60 rounded-xl";
  
  const variants: Record<string, string> = {
    rect: "w-full h-full",
    circle: "rounded-full aspect-square",
    text: "h-4 w-3/4 rounded-md"
  };

  return (
    <div className={`${baseStyles} ${variants[variant]} ${className}`} {...props} />
  );
};
