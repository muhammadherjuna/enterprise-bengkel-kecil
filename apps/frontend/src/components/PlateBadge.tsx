import React from 'react';

interface PlateBadgeProps {
  plate?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export const PlateBadge: React.FC<PlateBadgeProps> = ({ plate, size = 'sm' }) => {
  if (!plate || plate.trim() === '') {
    return (
      <span className="inline-flex items-center text-zinc-400 text-xs italic">
        Tanpa Plat
      </span>
    );
  }

  const clean = plate.trim().toUpperCase();

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 tracking-wider',
    md: 'text-xs px-2.5 py-1 tracking-widest',
    lg: 'text-sm px-3.5 py-1.5 tracking-widest font-bold',
  };

  return (
    <span
      className={`inline-flex items-center font-mono font-bold bg-zinc-900 text-zinc-100 border border-zinc-700/80 rounded-md shadow-subtle ${sizeClasses[size]}`}
    >
      {clean}
    </span>
  );
};
