import React from 'react';
import { DrinkItem, SauceItem } from '../types/menu';

export const SauceBottleVisual: React.FC<{
  sauce: SauceItem;
  className?: string;
}> = ({ sauce, className = 'h-[94px] sm:h-[110px] w-auto' }) => {
  if (sauce.image && sauce.image !== 'custom-bottle') {
    return (
      <img
        src={sauce.image}
        alt={sauce.name}
        className={`${className} object-contain pointer-events-none drop-shadow-[0_8px_10px_rgba(0,0,0,0.45)] ${
          sauce.clipTop ? '[clip-path:inset(2px_0_0_0)]' : ''
        }`}
      />
    );
  }

  const fill = sauce.colorHex || '#F97316';
  return (
    <svg
      viewBox="0 0 80 180"
      className={`${className} pointer-events-none drop-shadow-[0_8px_10px_rgba(0,0,0,0.45)]`}
      aria-label={sauce.name}
    >
      {/* Nozzle */}
      <path d="M36 6 L44 6 L47 32 L33 32 Z" fill="#F4F4F5" />
      {/* Cap */}
      <rect x="24" y="30" width="32" height="14" rx="4" fill="#FFFFFF" />
      {/* Squeeze Bottle Body */}
      <path
        d="M18 46 Q40 42 62 46 L57 88 L62 164 Q62 174 40 174 Q18 174 18 164 L23 88 Z"
        fill={fill}
      />
      {/* Ridges & Highlight */}
      <path
        d="M28 52 L29 166 M40 52 L40 168 M52 52 L51 166"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M22 54 L25 88 L22 158"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
};

export const DrinkBottleVisual: React.FC<{
  drink: DrinkItem;
  className?: string;
}> = ({ drink, className = 'h-[94px] sm:h-[110px] w-auto' }) => {
  if (drink.image && drink.image !== 'custom-drink') {
    return (
      <img
        src={drink.image}
        alt={drink.name}
        className={`${className} object-contain pointer-events-none drop-shadow-[0_8px_10px_rgba(0,0,0,0.45)]`}
      />
    );
  }

  const fill = drink.colorHex || '#DC2626';
  return (
    <svg
      viewBox="0 0 76 180"
      className={`${className} pointer-events-none drop-shadow-[0_8px_10px_rgba(0,0,0,0.45)]`}
      aria-label={drink.name}
    >
      {/* Bottle Cap */}
      <rect x="27" y="8" width="22" height="12" rx="3" fill="#EF4444" />
      {/* Neck */}
      <path
        d="M29 20 L47 20 L56 54 L20 54 Z"
        fill="rgba(255,255,255,0.28)"
      />
      {/* Liquid Body */}
      <rect x="17" y="50" width="42" height="120" rx="14" fill={fill} />
      {/* Label Band */}
      <rect
        x="17"
        y="76"
        width="42"
        height="34"
        fill="rgba(255,255,255,0.9)"
      />
      <circle cx="38" cy="93" r="10" fill={fill} />
      {/* Highlight */}
      <rect
        x="23"
        y="56"
        width="5"
        height="104"
        rx="2.5"
        fill="rgba(255,255,255,0.32)"
      />
    </svg>
  );
};
