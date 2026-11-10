import React, { useState } from 'react';
import {
  ArrowRight,
  Clock,
  Flame,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { DishItem } from '../types/menu';
import {
  ChristmasBackdropOverlay,
  ChristmasToggleButton,
  ChristmasTreeIcon,
} from './ChristmasDecor';
import {
  LoyaltyHeaderButton,
  LoyaltyPromoBanner,
} from './LoyaltyComponents';
import { useStore } from '../context/StoreContext';

interface MenuScreenProps {
  isChristmas: boolean;
  onToggleChristmas: () => void;
  onSelectDish: (dishId: string) => void;
  onEnterAdmin: () => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({
  isChristmas,
  onToggleChristmas,
  onSelectDish,
  onEnterAdmin,
}) => {
  const { catalog, isAdminAuthenticated, openAdminLogin } = useStore();
  const [notice, setNotice] = useState<string | null>(null);

  const visibleDishes = catalog.dishes.filter((d) => d.active);

  const handleDishCardClick = (dish: DishItem) => {
    if (dish.onlineOrderable) {
      onSelectDish(dish.id);
      return;
    }
    setNotice(
      `${dish.name} (S/ ${dish.price.toFixed(
        2
      )}) disponible directamente en salón. Selecciona un plato con botón Ordenar para pedir online.`
    );
    setTimeout(() => {
      setNotice((prev) => (prev?.startsWith(dish.name) ? null : prev));
    }, 3200);
  };

  const handleAdminClick = () => {
    if (isAdminAuthenticated) {
      onEnterAdmin();
    } else {
      openAdminLogin();
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col select-none transition-colors duration-300 ${
        isChristmas ? 'bg-[#0D1C14]' : 'bg-[#F2F2F4]'
      }`}
    >
      {/* Top Brand Header */}
      <header
        className={`w-full py-3.5 px-4 sm:px-6 shrink-0 shadow-md transition-colors duration-300 border-b ${
          isChristmas
            ? 'bg-[#0A160F] border-emerald-500/30'
            : 'bg-[#0B0B0E] border-white/10'
        }`}
      >
        <div className="max-w-[980px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="hidden lg:flex items-center gap-1.5 text-xs font-medium text-zinc-400">
            <Clock className="w-3.5 h-3.5 text-[#FF6012]" aria-hidden="true" />
            <span>
              Desde 5:00 PM · Recojo {catalog.settings.prepMinutesLabel}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isChristmas ? (
              <ChristmasTreeIcon className="w-7 h-7" />
            ) : (
              <Flame
                className="w-6 h-6 text-[#FF6012] fill-[#FF6012]/20"
                aria-hidden="true"
              />
            )}
            <span className="text-[#FF6012] text-[24px] sm:text-[32px] font-bold tracking-[0.06em] leading-none uppercase">
              BROSPAT
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <LoyaltyHeaderButton isChristmas={isChristmas} />
            <ChristmasToggleButton
              isChristmas={isChristmas}
              onToggle={onToggleChristmas}
            />
            <button
              type="button"
              onClick={handleAdminClick}
              title="Modo Administrador"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer shrink-0 border ${
                isAdminAuthenticated
                  ? 'bg-[#FF6012] text-white border-[#FF6012]'
                  : 'bg-white/10 hover:bg-white/20 text-zinc-200 border-white/15'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">
                {isAdminAuthenticated ? 'Panel Admin' : 'Admin'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Upper CARTA Section */}
      <section
        aria-label="Carta principal"
        className={`relative w-full pt-6 pb-14 sm:pt-8 sm:pb-16 px-4 sm:px-8 overflow-hidden transition-colors duration-300 ${
          isChristmas
            ? 'bg-gradient-to-b from-[#14291D] via-[#1C3827] to-[#122319]'
            : 'bg-gradient-to-b from-[#2A2A2F] via-[#38383F] to-[#2D2D33]'
        }`}
      >
        {isChristmas ? (
          <ChristmasBackdropOverlay />
        ) : (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/4 w-[420px] h-[420px] rounded-full bg-[#FF6012]/12 blur-3xl"
          />
        )}

        <div className="max-w-[960px] mx-auto relative z-10">
          {/* Iconic CARTA Display Header */}
          <div className="text-center mb-12 sm:mb-14">
            <h1
              className={`font-black uppercase leading-[0.84] tracking-[0.08em] text-[clamp(4.4rem,16vw,10.5rem)] select-none transition-colors duration-300 ${
                isChristmas
                  ? 'text-emerald-300/25 drop-shadow-[0_0_24px_rgba(22,163,74,0.3)]'
                  : 'text-[#767680]/65'
              }`}
            >
              CARTA
            </h1>
            <p className="text-xs sm:text-sm font-medium text-zinc-300 -mt-2 sm:-mt-3 relative z-10">
              {isChristmas
                ? '¡Feliz Navidad en BROSPAT! 🎄✨ Sabor crujiente para celebrar en familia'
                : 'Selecciona tu plato para personalizar cremas, bebida y hora de recojo'}
            </p>
          </div>

          {/* Dynamic Sculpted Dish Cards */}
          <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-14 sm:gap-x-6 sm:gap-y-16 pt-4 items-stretch">
            {visibleDishes.map((dish) => {
              const isFeatured = dish.onlineOrderable;
              const isTallCone = dish.image.includes('salchicono');

              return (
                <article
                  key={dish.id}
                  onClick={() => handleDishCardClick(dish)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleDishCardClick(dish);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={
                    isFeatured ? `Ordenar ${dish.name}` : dish.name
                  }
                  className={`group relative rounded-[30px] pt-20 sm:pt-24 pb-5 px-4 flex flex-col items-center justify-between min-h-[210px] sm:min-h-[230px] cursor-pointer transition-all duration-200 ${
                    isFeatured
                      ? isChristmas
                        ? 'bg-[#FFFDF9] ring-2 ring-[#16A34A] shadow-[0_18px_40px_-8px_rgba(22,163,74,0.4)] hover:-translate-y-2 active:scale-[0.98]'
                        : 'bg-white ring-2 ring-[#FF6012] shadow-[0_18px_38px_-10px_rgba(0,0,0,0.5)] hover:-translate-y-2 active:scale-[0.98]'
                      : 'bg-white/95 hover:bg-white shadow-[0_16px_34px_-12px_rgba(0,0,0,0.45)] hover:-translate-y-1.5'
                  }`}
                >
                  {dish.promoTag && (
                    <span
                      className={`absolute top-3 right-3 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-xs ${
                        isChristmas ? 'bg-[#DC2626]' : 'bg-[#FF6012]'
                      }`}
                    >
                      {dish.promoTag}
                    </span>
                  )}

                  <img
                    src={dish.image}
                    alt={dish.name}
                    className={`absolute left-1/2 -translate-x-1/2 object-contain pointer-events-none drop-shadow-[0_12px_12px_rgba(0,0,0,0.42)] transition-transform duration-200 group-hover:scale-105 ${
                      isTallCone
                        ? '-top-16 sm:-top-18 w-[62%] max-w-[122px]'
                        : '-top-12 sm:-top-14 w-[88%] max-w-[180px]'
                    }`}
                  />

                  <div className="text-center mt-1">
                    <h3 className="text-[#FF6012] font-extrabold text-[21px] sm:text-[24px] leading-tight tracking-tight">
                      {dish.name}
                    </h3>
                    {dish.subtitle && (
                      <p className="text-zinc-500 text-[11px] font-medium mt-0.5">
                        {dish.subtitle}
                      </p>
                    )}
                  </div>

                  {isFeatured ? (
                    <div className="w-full mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between gap-2">
                      <span className="text-zinc-900 font-extrabold text-sm sm:text-base tabular-nums">
                        S/ {dish.price.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDish(dish.id);
                        }}
                        className={`inline-flex items-center gap-1 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
                          isChristmas
                            ? 'bg-gradient-to-r from-[#DC2626] to-[#16A34A] hover:brightness-110'
                            : 'bg-[#FF6012] group-hover:bg-[#e55209]'
                        }`}
                      >
                        Ordenar
                        <ArrowRight
                          className="w-3.5 h-3.5"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between gap-2">
                      <span className="text-zinc-700 font-bold text-xs sm:text-sm tabular-nums">
                        S/ {dish.price.toFixed(2)}
                      </span>
                      <span className="text-[11px] font-semibold text-zinc-400">
                        Solo en salón
                      </span>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {notice && (
            <div
              role="status"
              className="mt-6 mx-auto max-w-lg bg-[#141417]/95 border border-white/10 text-zinc-100 text-xs sm:text-sm font-medium text-center px-5 py-2.5 rounded-full shadow-lg"
            >
              {notice}
            </div>
          )}

          {/* 10-Broaster Google Loyalty Card Banner */}
          <LoyaltyPromoBanner isChristmas={isChristmas} />
        </div>
      </section>

      {/* Lower COMBOS Section */}
      <section
        aria-label="Combos próximamente"
        className={`flex-1 w-full py-10 sm:py-12 px-5 sm:px-10 flex flex-col items-center transition-colors duration-300 ${
          isChristmas
            ? 'bg-[#0B1710] border-t border-emerald-500/20'
            : 'bg-[#F2F2F4]'
        }`}
      >
        <div className="max-w-[900px] w-full mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-black uppercase text-[#FF6012] leading-[0.9] tracking-tight text-[clamp(3.2rem,11vw,6.4rem)]">
              COMBOS
            </h2>
            <p
              className={`inline-flex items-center gap-1.5 font-extrabold text-base sm:text-xl mt-1 ${
                isChristmas ? 'text-emerald-300' : 'text-[#FF6012]'
              }`}
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span>Próximamente</span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10">
            <div
              className={`relative overflow-hidden rounded-[30px] h-[165px] sm:h-[200px] p-6 flex flex-col justify-between shadow-md border ${
                isChristmas
                  ? 'bg-gradient-to-br from-[#1B3625] to-[#102217] border-emerald-400/25'
                  : 'bg-gradient-to-br from-[#3B3B42] to-[#29292E] border-black/5'
              }`}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF6012]">
                {isChristmas ? 'Edición Navideña 🎄' : 'En preparación'}
              </span>
              <div>
                <p className="text-white/90 font-extrabold text-lg sm:text-xl">
                  Combo Dúo Broaster + 2 KR
                </p>
                <p className="text-zinc-400 text-xs sm:text-sm mt-0.5">
                  Ideal para compartir · Muy pronto disponible
                </p>
              </div>
            </div>

            <div
              className={`relative overflow-hidden rounded-[30px] h-[165px] sm:h-[200px] p-6 flex flex-col justify-between shadow-md border ${
                isChristmas
                  ? 'bg-gradient-to-br from-[#1B3625] to-[#102217] border-emerald-400/25'
                  : 'bg-gradient-to-br from-[#3B3B42] to-[#29292E] border-black/5'
              }`}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF6012]">
                {isChristmas ? 'Edición Navideña 🎄' : 'En preparación'}
              </span>
              <div>
                <p className="text-white/90 font-extrabold text-lg sm:text-xl">
                  Combo Broaster + Salchipapa
                </p>
                <p className="text-zinc-400 text-xs sm:text-sm mt-0.5">
                  Doble sabor con cremas a elección · Muy pronto
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
