import React from 'react';

export const ChristmasTreeIcon: React.FC<{ className?: string }> = ({
  className = 'w-4 h-4',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    {/* Star on top */}
    <polygon
      points="12,1.5 13.2,4.2 16,4.5 13.8,6.5 14.5,9.2 12,7.8 9.5,9.2 10.2,6.5 8,4.5 10.8,4.2"
      fill="#FACC15"
    />
    {/* Top Tree Tier */}
    <path
      d="M12 4.5L16.5 9.5H13.8L17.5 13.5H14.5L19 18H5L9.5 13.5H6.5L10.2 9.5H7.5L12 4.5Z"
      fill="#15803D"
    />
    {/* Tree highlights / snow layers */}
    <path
      d="M12 4.5L16.5 9.5H7.5L12 4.5Z"
      fill="#16A34A"
    />
    <path
      d="M10.2 9.5L13.8 9.5L17.5 13.5H6.5L10.2 9.5Z"
      fill="#15803D"
    />
    {/* Baubles / Ornaments */}
    <circle cx="12" cy="8" r="1.1" fill="#EF4444" />
    <circle cx="9.5" cy="12" r="1.1" fill="#FACC15" />
    <circle cx="14.5" cy="12" r="1.1" fill="#38BDF8" />
    <circle cx="8" cy="16.5" r="1.2" fill="#EF4444" />
    <circle cx="12" cy="15.8" r="1.2" fill="#FACC15" />
    <circle cx="16" cy="16.5" r="1.2" fill="#EC4899" />
    {/* Trunk */}
    <rect x="10.5" y="18" width="3" height="4" rx="0.8" fill="#78350F" />
  </svg>
);

export const SantaHatIcon: React.FC<{ className?: string }> = ({
  className = 'w-4 h-4',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    {/* Hat cone */}
    <path
      d="M4 16C4 16 6 6 15 5C17.5 4.7 20 6.5 20.5 9C21 11.5 19 13.5 17 14L4 16Z"
      fill="#DC2626"
    />
    {/* Pom pom */}
    <circle cx="18" cy="14" r="2.5" fill="#FFFFFF" />
    {/* Brim / Fur band */}
    <rect x="2.5" y="15" width="16.5" height="5.5" rx="2.75" fill="#FFFFFF" />
  </svg>
);

export const ChristmasToggleButton: React.FC<{
  isChristmas: boolean;
  onToggle: () => void;
}> = ({ isChristmas, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-pressed={isChristmas}
    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold tracking-tight transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 ${
      isChristmas
        ? 'bg-gradient-to-r from-[#DC2626] to-[#15803D] hover:brightness-110 text-white ring-2 ring-[#FACC15] shadow-[0_0_16px_rgba(220,38,38,0.65)]'
        : 'bg-white/12 hover:bg-white/20 text-white border border-white/15'
    }`}
  >
    <ChristmasTreeIcon className="w-4 h-4 shrink-0" />
    <span>{isChristmas ? 'Navidad: ON 🎄' : 'Modo Navidad'}</span>
  </button>
);

export const ChristmasBackdropOverlay: React.FC = () => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 overflow-hidden z-0"
  >
    {/* Warm Christmas Red, Emerald & Golden Glows */}
    <div className="absolute -top-20 -left-16 w-96 h-96 rounded-full bg-[#DC2626]/18 blur-3xl" />
    <div className="absolute top-1/4 -right-20 w-96 h-96 rounded-full bg-[#15803D]/20 blur-3xl" />
    <div className="absolute bottom-10 left-1/3 w-80 h-80 rounded-full bg-[#FACC15]/10 blur-3xl" />

    {/* Elegant falling snowflakes & stars */}
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full text-white/18"
      fill="currentColor"
    >
      {/* Snowflakes */}
      <circle cx="8" cy="14" r="1.2" className="animate-pulse" />
      <circle cx="18" cy="42" r="0.9" />
      <circle cx="28" cy="18" r="1.5" className="animate-pulse" />
      <circle cx="36" cy="68" r="1" />
      <circle cx="48" cy="12" r="1.8" className="animate-pulse" />
      <circle cx="58" cy="52" r="1.2" />
      <circle cx="68" cy="22" r="1" className="animate-pulse" />
      <circle cx="76" cy="74" r="1.6" />
      <circle cx="88" cy="16" r="1.3" className="animate-pulse" />
      <circle cx="94" cy="48" r="0.9" />
      <circle cx="14" cy="85" r="1.4" />
      <circle cx="52" cy="88" r="1.1" className="animate-pulse" />
      <circle cx="84" cy="90" r="1.5" />
    </svg>

    {/* Top Corner Pine Garlands with Ornaments */}
    <svg
      viewBox="0 0 200 100"
      className="absolute top-0 left-0 w-44 h-24 sm:w-64 sm:h-32 text-emerald-400/25"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M-10 10 Q40 50 90 20 Q140 60 200 10" stroke="rgba(22,163,74,0.45)" strokeWidth="3" />
      <path d="M-10 16 Q35 60 85 28 Q135 70 190 18" stroke="rgba(21,128,61,0.35)" strokeWidth="2.5" />
      {/* Hanging Baubles */}
      <circle cx="45" cy="52" r="4" fill="#DC2626" stroke="none" />
      <circle cx="88" cy="30" r="3.5" fill="#FACC15" stroke="none" />
      <circle cx="140" cy="62" r="4" fill="#DC2626" stroke="none" />
    </svg>

    <svg
      viewBox="0 0 200 100"
      className="absolute top-0 right-0 w-44 h-24 sm:w-64 sm:h-32 text-emerald-400/25 -scale-x-100"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M-10 10 Q40 50 90 20 Q140 60 200 10" stroke="rgba(22,163,74,0.45)" strokeWidth="3" />
      <path d="M-10 16 Q35 60 85 28 Q135 70 190 18" stroke="rgba(21,128,61,0.35)" strokeWidth="2.5" />
      {/* Hanging Baubles */}
      <circle cx="45" cy="52" r="4" fill="#DC2626" stroke="none" />
      <circle cx="88" cy="30" r="3.5" fill="#FACC15" stroke="none" />
      <circle cx="140" cy="62" r="4" fill="#DC2626" stroke="none" />
    </svg>
  </div>
);

// Backward compatibility aliases if any component imports old names
export const PumpkinIcon = ChristmasTreeIcon;
export const HalloweenToggleButton = ChristmasToggleButton;
export const HalloweenBackdropOverlay = ChristmasBackdropOverlay;
