import React, { useState } from 'react';
import {
  Check,
  Flame,
  Gift,
  LogOut,
  Sparkles,
  Store,
  Ticket,
  X,
} from 'lucide-react';
import { STAMPS_PER_REWARD, useLoyalty } from '../context/LoyaltyContext';

export const GoogleLogoIcon: React.FC<{ className?: string }> = ({
  className = 'w-4 h-4',
}) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      fill="#EA4335"
      d="M12 10.2v3.9h5.5c-.24 1.26-.96 2.33-2.04 3.05l3.3 2.56c1.92-1.77 3.03-4.38 3.03-7.47 0-.72-.06-1.41-.19-2.08H12z"
    />
    <path
      fill="#34A853"
      d="M12 22c2.75 0 5.06-.91 6.75-2.47l-3.3-2.56c-.91.61-2.08.98-3.45.98-2.65 0-4.9-1.79-5.7-4.2l-3.4 2.63C4.58 19.72 8.02 22 12 22z"
    />
    <path
      fill="#FBBC05"
      d="M6.3 13.75A5.98 5.98 0 0 1 5.98 12c0-.61.11-1.2.32-1.75L2.9 7.62A9.96 9.96 0 0 0 2 12c0 1.61.39 3.14 1.07 4.49l3.23-2.74z"
    />
    <path
      fill="#4285F4"
      d="M12 6.05c1.5 0 2.84.52 3.9 1.53l2.92-2.92C17.05 3.01 14.75 2 12 2 8.02 2 4.58 4.28 2.9 7.62l3.4 2.63c.8-2.41 3.05-4.2 5.7-4.2z"
    />
  </svg>
);

import { ChristmasTreeIcon } from './ChristmasDecor';

interface LoyaltyHeaderButtonProps {
  isChristmas?: boolean;
  isHalloween?: boolean;
}

export const LoyaltyHeaderButton: React.FC<LoyaltyHeaderButtonProps> = ({
  isChristmas = false,
  isHalloween = false,
}) => {
  const isHoliday = isChristmas || isHalloween;
  const { user, card, openCardModal } = useLoyalty();
  const stamps = card?.stamps ?? 0;
  const availableRewards = card?.availableRewards ?? 0;

  if (!user) {
    return (
      <button
        type="button"
        onClick={openCardModal}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 border ${
          isHoliday
            ? 'bg-[#122A1E] hover:bg-[#1A3A2B] text-emerald-100 border-emerald-400/40'
            : 'bg-white text-zinc-900 hover:bg-zinc-100 border-white/20 shadow-xs'
        }`}
      >
        <GoogleLogoIcon className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline">Entrar ·</span>
        <span>Cartilla</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openCardModal}
      className={`inline-flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer shrink-0 border ${
        availableRewards > 0
          ? 'bg-emerald-500 text-zinc-950 border-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.5)]'
          : isHoliday
          ? 'bg-[#153424] hover:bg-[#1D4530] text-white border-emerald-400/40'
          : 'bg-[#1C1C22] hover:bg-[#272730] text-white border-white/15'
      }`}
    >
      {user.photoURL ? (
        <img
          src={user.photoURL}
          alt=""
          referrerPolicy="no-referrer"
          className="w-5 h-5 rounded-full object-cover border border-white/30"
        />
      ) : (
        <span className="w-5 h-5 rounded-full bg-[#FF6012] text-white text-[10px] font-black flex items-center justify-center uppercase">
          {(user.displayName || 'B')[0]}
        </span>
      )}

      {availableRewards > 0 ? (
        <span className="inline-flex items-center gap-1 tabular-nums">
          <Gift className="w-3.5 h-3.5" aria-hidden="true" />
          <span>¡Regalo ({availableRewards})!</span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 tabular-nums">
          <Ticket
            className="w-3.5 h-3.5 text-[#FF6012]"
            aria-hidden="true"
          />
          <span>
            {stamps}/{STAMPS_PER_REWARD}
          </span>
        </span>
      )}
    </button>
  );
};

export const LoyaltyPromoBanner: React.FC<{
  isChristmas?: boolean;
  isHalloween?: boolean;
}> = ({ isChristmas = false, isHalloween = false }) => {
  const isHoliday = isChristmas || isHalloween;
  const { user, card, isBusy, signInWithGoogle, openCardModal } = useLoyalty();
  const stamps = card?.stamps ?? 0;
  const availableRewards = card?.availableRewards ?? 0;
  const remaining = STAMPS_PER_REWARD - stamps;

  return (
    <div
      className={`mt-10 rounded-[26px] p-4 sm:p-5 border transition-all duration-300 ${
        isHoliday
          ? 'bg-[#122A1E]/90 border-emerald-400/35 shadow-[0_12px_30px_-10px_rgba(22,163,74,0.45)]'
          : 'bg-[#1A1A1F]/95 border-white/10 shadow-[0_14px_32px_-12px_rgba(0,0,0,0.5)]'
      }`}
    >
      {!user ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                isHoliday
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  : 'bg-[#FF6012]/15 text-[#FF6012] border border-[#FF6012]/30'
              }`}
            >
              <Gift className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-white font-extrabold text-sm sm:text-base leading-snug">
                Cartilla BROSPAT: ¡10 Broasters = 1 Regalo Sorpresa!
              </p>
              <p className="text-zinc-400 text-xs mt-0.5">
                Entra con tu cuenta de Google para guardar tus sellos y canjear
                tu regalo sorpresa en tienda.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isBusy}
            onClick={() => void signInWithGoogle()}
            className="inline-flex items-center justify-center gap-2.5 bg-white hover:bg-zinc-100 disabled:opacity-60 text-zinc-900 font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-2xl transition-colors cursor-pointer shrink-0 shadow-sm"
          >
            <GoogleLogoIcon className="w-4 h-4" />
            <span>Continuar con Google</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#FF6012]">
                Cartilla de {card?.displayName || user.displayName || 'Cliente'}
              </span>
              {availableRewards > 0 ? (
                <span className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                  🎁 {availableRewards} regalo sorpresa listo para canjear
                </span>
              ) : (
                <span className="text-zinc-400 text-xs tabular-nums">
                  · Te {remaining === 1 ? 'falta 1 Broaster' : `faltan ${remaining} Broasters`} para tu regalo sorpresa
                </span>
              )}
            </div>

            {/* Mini 10-slot visual bar */}
            <div className="flex items-center gap-1.5 max-w-md">
              {Array.from({ length: STAMPS_PER_REWARD }).map((_, idx) => {
                const filled = idx < stamps;
                const isLast = idx === STAMPS_PER_REWARD - 1;
                return (
                  <div
                    key={idx}
                    className={`h-2.5 flex-1 rounded-full transition-all ${
                      filled
                        ? isHoliday
                          ? 'bg-gradient-to-r from-[#DC2626] to-[#16A34A]'
                          : 'bg-[#FF6012]'
                        : isLast
                        ? 'bg-amber-400/30 border border-amber-400/50'
                        : 'bg-white/10'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={openCardModal}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm transition-colors cursor-pointer shrink-0 ${
              availableRewards > 0
                ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950'
                : 'bg-[#FF6012] hover:bg-[#e55209] text-white'
            }`}
          >
            <Gift className="w-4 h-4" aria-hidden="true" />
            <span>
              {availableRewards > 0
                ? 'Ver vale de regalo'
                : `Ver cartilla (${stamps}/10)`}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export const LoyaltyCardModal: React.FC<{
  isChristmas?: boolean;
  isHalloween?: boolean;
}> = ({ isChristmas = false, isHalloween = false }) => {
  const isHoliday = isChristmas || isHalloween;
  const {
    user,
    card,
    isCardModalOpen,
    isBusy,
    statusError,
    closeCardModal,
    signInWithGoogle,
    signOutUser,
    redeemSurpriseGiftInStore,
    clearStatusError,
  } = useLoyalty();

  const [confirmingRedeem, setConfirmingRedeem] = useState(false);
  const [justRedeemed, setJustRedeemed] = useState(false);

  if (!isCardModalOpen) return null;

  const stamps = card?.stamps ?? 0;
  const availableRewards = card?.availableRewards ?? 0;
  const totalBroasters = card?.totalBroasters ?? 0;
  const redeemedRewards = card?.redeemedRewards ?? 0;
  const rewardCode = card?.activeRewardCode ?? 'NONE';
  const remaining = STAMPS_PER_REWARD - stamps;

  const handleConfirmRedeem = async () => {
    const ok = await redeemSurpriseGiftInStore();
    if (ok) {
      setConfirmingRedeem(false);
      setJustRedeemed(true);
      setTimeout(() => setJustRedeemed(false), 4000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cartilla de fidelidad BROSPAT"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none"
    >
      <div
        className={`border rounded-[30px] max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto ${
          isHoliday
            ? 'bg-[#102319] border-emerald-400/35 text-white'
            : 'bg-[#1E1E24] border-white/15 text-white'
        }`}
      >
        {/* Top Modal Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {isHoliday ? (
              <ChristmasTreeIcon className="w-6 h-6" />
            ) : (
              <Gift className="w-6 h-6 text-[#FF6012]" aria-hidden="true" />
            )}
            <div>
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white leading-none">
                Cartilla BROSPAT
              </h2>
              <p className="text-[11px] font-semibold text-[#FF6012] mt-0.5">
                10 Broasters = 1 Regalo Sorpresa en tienda
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setConfirmingRedeem(false);
              clearStatusError();
              closeCardModal();
            }}
            aria-label="Cerrar cartilla"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {statusError && (
          <div className="bg-red-500/15 border border-red-400/40 text-red-200 text-xs font-medium rounded-xl px-3.5 py-2.5">
            {statusError}
          </div>
        )}

        {!user ? (
          /* Signed-out state */
          <div className="space-y-5 py-2">
            <div className="bg-black/30 border border-white/10 rounded-2xl p-4 space-y-3">
              <p className="text-sm text-zinc-200 leading-relaxed">
                Inicia sesión con tu cuenta de{' '}
                <strong className="text-white">Google</strong> para activar tu
                cartilla digital personal:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-zinc-300">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#FF6012]/20 text-[#FF6012] font-black text-xs flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span>
                    Por cada <strong className="text-white">Broaster</strong>{' '}
                    que pidas sumas <strong className="text-white">1 sello</strong>.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#FF6012]/20 text-[#FF6012] font-black text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span>
                    Tus sellos quedan guardados en tu cuenta aunque cambies de
                    celular.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-xs flex items-center justify-center shrink-0">
                    3
                  </span>
                  <span>
                    Al completar <strong className="text-emerald-300">10 Broasters</strong>{' '}
                    desbloqueas un <strong className="text-emerald-300">Regalo Sorpresa</strong>{' '}
                    para canjear en tienda.
                  </span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              disabled={isBusy}
              onClick={() => void signInWithGoogle()}
              className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-zinc-100 disabled:opacity-60 text-zinc-900 font-extrabold text-sm flex items-center justify-center gap-3 shadow-md transition-colors cursor-pointer"
            >
              <GoogleLogoIcon className="w-5 h-5" />
              <span>{isBusy ? 'Conectando...' : 'Entrar con cuenta de Google'}</span>
            </button>
          </div>
        ) : (
          /* Signed-in Cartilla view */
          <div className="space-y-4">
            {/* User Account Strip */}
            <div className="flex items-center justify-between gap-3 bg-black/25 border border-white/10 rounded-2xl px-3.5 py-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full object-cover border border-white/25 shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#FF6012] text-white font-black flex items-center justify-center uppercase shrink-0">
                    {(card?.displayName || 'B')[0]}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-white truncate">
                    {card?.displayName || user.displayName || 'Cliente BROSPAT'}
                  </p>
                  <p className="text-[11px] text-zinc-400 tabular-nums">
                    Total acumulados: {totalBroasters}{' '}
                    {totalBroasters === 1 ? 'Broaster' : 'Broasters'}
                    {redeemedRewards > 0
                      ? ` · ${redeemedRewards} canjeado${redeemedRewards > 1 ? 's' : ''}`
                      : ''}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void signOutUser()}
                title="Cerrar sesión"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Salir</span>
              </button>
            </div>

            {justRedeemed && (
              <div
                role="status"
                className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs sm:text-sm font-bold rounded-2xl px-4 py-3 text-center"
              >
                🎉 ¡Regalo sorpresa canjeado con éxito en tienda! Disfrútalo.
              </div>
            )}

            {/* Active Surprise Gift Voucher if unlocked */}
            {availableRewards > 0 && (
              <div className="bg-gradient-to-br from-emerald-500/20 via-emerald-600/10 to-amber-500/15 border-2 border-dashed border-emerald-400/60 rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles
                      className="w-5 h-5 text-emerald-300 shrink-0"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-sm font-black uppercase text-emerald-300">
                        ¡Regalo Sorpresa Desbloqueado! ({availableRewards})
                      </p>
                      <p className="text-xs text-zinc-200 mt-0.5">
                        Muestra este vale en la tienda BROSPAT al recoger tu
                        pedido.
                      </p>
                    </div>
                  </div>
                  <span className="bg-black/50 border border-emerald-400/40 text-emerald-200 font-mono font-black text-xs px-2.5 py-1 rounded-lg tracking-wider shrink-0 select-all">
                    {rewardCode}
                  </span>
                </div>

                {!confirmingRedeem ? (
                  <button
                    type="button"
                    onClick={() => setConfirmingRedeem(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-xs sm:text-sm uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Store className="w-4 h-4" aria-hidden="true" />
                    <span>Canjear regalo sorpresa en tienda</span>
                  </button>
                ) : (
                  <div className="bg-black/40 rounded-xl p-3 space-y-2.5 border border-white/10">
                    <p className="text-xs text-center text-zinc-200 font-semibold">
                      ¿Ya estás en la tienda BROSPAT entregando este vale en
                      caja?
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleConfirmRedeem()}
                        className="py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-extrabold text-xs uppercase cursor-pointer"
                      >
                        {isBusy ? 'Canjeando...' : 'Sí, marcar canjeado'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingRedeem(false)}
                        className="py-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs cursor-pointer"
                      >
                        Todavía no
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 10-Slot Punch Card Grid */}
            <div
              className={`rounded-2xl p-4 border ${
                isHoliday
                  ? 'bg-[#0A1A12] border-emerald-400/25'
                  : 'bg-[#141418] border-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-300">
                  Tu cartilla actual
                </span>
                <span className="text-xs font-black text-[#FF6012] tabular-nums">
                  {stamps} / {STAMPS_PER_REWARD} sellos
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2.5 sm:gap-3">
                {Array.from({ length: STAMPS_PER_REWARD }).map((_, idx) => {
                  const slotNumber = idx + 1;
                  const isStamped = idx < stamps;
                  const isPrizeSlot = slotNumber === STAMPS_PER_REWARD;

                  return (
                    <div
                      key={slotNumber}
                      className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-1.5 transition-all ${
                        isStamped
                          ? isHoliday
                            ? 'bg-gradient-to-br from-[#DC2626] to-[#15803D] text-white shadow-[0_6px_16px_rgba(22,163,74,0.4)]'
                            : 'bg-gradient-to-br from-[#FF6012] to-[#E04800] text-white shadow-[0_6px_16px_rgba(255,96,18,0.35)]'
                          : isPrizeSlot
                          ? 'bg-amber-500/10 border-2 border-dashed border-amber-400/60 text-amber-300'
                          : 'bg-white/[0.03] border border-dashed border-white/15 text-zinc-500'
                      }`}
                    >
                      {isStamped ? (
                        <>
                          <Flame
                            className="w-5 h-5 sm:w-6 sm:h-6 fill-white/25"
                            aria-hidden="true"
                          />
                          <span className="text-[10px] font-black mt-0.5 flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" />#{slotNumber}
                          </span>
                        </>
                      ) : isPrizeSlot ? (
                        <>
                          <Gift
                            className="w-5 h-5 sm:w-6 sm:h-6"
                            aria-hidden="true"
                          />
                          <span className="text-[9px] font-extrabold uppercase mt-0.5 leading-none text-center">
                            Regalo
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-sm sm:text-base font-extrabold tabular-nums">
                            {slotNumber}
                          </span>
                          <span className="text-[9px] font-semibold uppercase">
                            Broaster
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="text-[11px] sm:text-xs text-zinc-400 text-center mt-3.5 tabular-nums">
                Te {remaining === 1 ? 'falta ' : 'faltan '}
                <strong className="text-white">
                  {remaining} {remaining === 1 ? 'Broaster' : 'Broasters'}
                </strong>{' '}
                para completar esta cartilla y ganar un regalo sorpresa.
              </p>
            </div>

            <p className="text-[11px] text-zinc-400 text-center leading-relaxed">
              Cada vez que confirmes o envíes por WhatsApp tu pedido de
              Broaster, tus platos se sumarán automáticamente a tu cartilla.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
