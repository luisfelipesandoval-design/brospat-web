import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Clock,
  Copy,
  Gift,
  MessageCircle,
  Minus,
  Plus,
  Receipt,
  ShieldCheck,
  Tag,
  X,
} from 'lucide-react';
import {
  DEFAULT_STORE_WHATSAPP,
  PaymentMethod,
  isNightHour,
} from '../types/menu';
import { CircularClockPicker } from './CircularClockPicker';
import {
  ChristmasBackdropOverlay,
  ChristmasToggleButton,
  ChristmasTreeIcon,
} from './ChristmasDecor';
import {
  STAMPS_PER_REWARD,
  StampOrderResult,
  useLoyalty,
} from '../context/LoyaltyContext';
import {
  GoogleLogoIcon,
  LoyaltyHeaderButton,
} from './LoyaltyComponents';
import { useStore } from '../context/StoreContext';
import { DrinkBottleVisual, SauceBottleVisual } from './ItemVisuals';

interface CustomizeScreenProps {
  dishId: string;
  isChristmas?: boolean;
  onToggleChristmas?: () => void;
  isHalloween?: boolean;
  onToggleHalloween?: () => void;
  onBack: () => void;
  onEnterAdmin: () => void;
}

function getInitialPickupTime(): { hours: number; minutes: number } {
  return { hours: 20, minutes: 15 };
}

function formatAmPmLabel(hours24: number, minutes: number): string {
  const displayHour = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const paddedMin = String(minutes).padStart(2, '0');
  const period = hours24 >= 12 ? 'PM' : 'AM';
  return `${displayHour}:${paddedMin} ${period}`;
}

function clampSaucesPerFlavor(
  counts: Record<string, number>,
  nextDishCount: number,
  maxExtraPerFlavorPerPlato: number
): Record<string, number> {
  const maxUnitsPerFlavor = nextDishCount * (1 + maxExtraPerFlavorPerPlato);
  const updated: Record<string, number> = {};
  for (const [id, q] of Object.entries(counts)) {
    const clamped = Math.min(q, maxUnitsPerFlavor);
    if (clamped > 0) {
      updated[id] = clamped;
    }
  }
  return updated;
}

function renderWhatsAppFormattedLine(line: string, lineIdx: number) {
  const parts = line.split(/(\*[^*]+\*)/g);
  return (
    <span key={lineIdx} className="block min-h-[1.15em]">
      {parts.map((part, idx) => {
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return (
            <strong key={idx} className="font-extrabold text-white">
              {part.slice(1, -1)}
            </strong>
          );
        }
        return <React.Fragment key={idx}>{part}</React.Fragment>;
      })}
    </span>
  );
}

export const CustomizeScreen: React.FC<CustomizeScreenProps> = ({
  dishId,
  isChristmas = false,
  onToggleChristmas,
  isHalloween = false,
  onToggleHalloween,
  onBack,
  onEnterAdmin,
}) => {
  const isHoliday = isChristmas || isHalloween;
  const toggleHoliday = onToggleChristmas || onToggleHalloween || (() => {});
  const {
    catalog,
    isAdminAuthenticated,
    openAdminLogin,
    submitCustomerOrder,
  } = useStore();

  const {
    user,
    card,
    isBusy: isLoyaltyBusy,
    signInWithGoogle,
    recordBroasterPurchase,
    openCardModal,
  } = useLoyalty();

  const selectedDish = useMemo(() => {
    return (
      catalog.dishes.find((d) => d.id === dishId) ||
      catalog.dishes.find((d) => d.id === 'broaster') ||
      catalog.dishes[0]
    );
  }, [catalog.dishes, dishId]);

  const activeSauces = useMemo(
    () => catalog.sauces.filter((s) => s.active),
    [catalog.sauces]
  );
  const activeDrinks = useMemo(
    () => catalog.drinks.filter((d) => d.active),
    [catalog.drinks]
  );

  const settings = catalog.settings;
  const dishUnitPrice = selectedDish?.price ?? 12.0;
  const dishName = selectedDish?.name ?? 'Broaster';
  const earnsStamps = Boolean(
    selectedDish?.earnsLoyaltyStamp || dishName.toLowerCase().includes('broaster')
  );

  const [dishCount, setDishCount] = useState<number>(1);
  const [sauceCounts, setSauceCounts] = useState<Record<string, number>>({
    ketchup: 1,
  });
  const [drinkCounts, setDrinkCounts] = useState<Record<string, number>>({});
  const [pickupTime, setPickupTime] = useState<{
    hours: number;
    minutes: number;
  }>(getInitialPickupTime);
  const [limitReachedSauceName, setLimitReachedSauceName] = useState<
    string | null
  >(null);

  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('efectivo');
  const [copied, setCopied] = useState(false);
  const [sentInApp, setSentInApp] = useState(false);
  const [createdOrderCode, setCreatedOrderCode] = useState<string | null>(null);
  const [includeGiftRedeem, setIncludeGiftRedeem] = useState(false);
  const [hasProcessedThisOrder, setHasProcessedThisOrder] = useState(false);
  const [orderStampResult, setOrderStampResult] =
    useState<StampOrderResult | null>(null);

  useEffect(() => {
    if (user?.displayName && !customerName.trim()) {
      setCustomerName(user.displayName);
    }
  }, [user, customerName]);

  const maxExtrasPerFlavor = dishCount * settings.maxExtraPerSaucePerPlato;
  const maxTotalUnitsPerFlavor = dishCount + maxExtrasPerFlavor;

  const sauceSummary = useMemo(() => {
    let freeCount = 0;
    let extraCount = 0;
    const items: {
      id: string;
      name: string;
      shortName: string;
      qty: number;
      freeQty: number;
      extraQty: number;
      cost: number;
    }[] = [];

    activeSauces.forEach((sauce) => {
      const qty = sauceCounts[sauce.id] || 0;
      if (qty > 0) {
        const freeQty = Math.min(qty, dishCount);
        const extraQty = Math.max(0, qty - dishCount);
        const cost = extraQty * settings.extraCremaPrice;
        freeCount += freeQty;
        extraCount += extraQty;
        items.push({
          id: sauce.id,
          name: sauce.name,
          shortName: sauce.shortName,
          qty,
          freeQty,
          extraQty,
          cost,
        });
      }
    });

    const totalSauceCost = extraCount * settings.extraCremaPrice;
    return { items, freeCount, extraCount, totalSauceCost };
  }, [activeSauces, sauceCounts, dishCount, settings.extraCremaPrice]);

  const updateDishCount = (delta: number) => {
    setDishCount((prev) => {
      const next = Math.max(1, Math.min(25, prev + delta));
      setSauceCounts((currSauces) =>
        clampSaucesPerFlavor(
          currSauces,
          next,
          settings.maxExtraPerSaucePerPlato
        )
      );
      setLimitReachedSauceName(null);
      return next;
    });
  };

  const canIncrementSauce = (sauceId: string): boolean => {
    const currentQty = sauceCounts[sauceId] || 0;
    return currentQty < maxTotalUnitsPerFlavor;
  };

  const updateSauceCount = (sauceId: string, delta: number) => {
    if (delta > 0 && !canIncrementSauce(sauceId)) {
      const found = activeSauces.find((s) => s.id === sauceId);
      setLimitReachedSauceName(found?.shortName || 'esta crema');
      setTimeout(() => setLimitReachedSauceName(null), 2600);
      return;
    }

    setLimitReachedSauceName(null);
    setSauceCounts((prev) => {
      const current = prev[sauceId] || 0;
      const next = Math.max(
        0,
        Math.min(maxTotalUnitsPerFlavor, current + delta)
      );
      const updated = { ...prev };
      if (next === 0) {
        delete updated[sauceId];
      } else {
        updated[sauceId] = next;
      }
      return updated;
    });
  };

  const updateDrinkCount = (drinkId: string, delta: number) => {
    setDrinkCounts((prev) => {
      const current = prev[drinkId] || 0;
      const next = Math.max(0, Math.min(30, current + delta));
      const updated = { ...prev };
      if (next === 0) {
        delete updated[drinkId];
      } else {
        updated[drinkId] = next;
      }
      return updated;
    });
  };

  const isNight = isNightHour(pickupTime.hours);
  const krUnitPrice = isNight ? settings.krNightPrice : settings.krDayPrice;

  const drinkSummary = useMemo(() => {
    let totalBottles = 0;
    let totalDrinkCost = 0;
    const items: {
      id: string;
      name: string;
      shortName: string;
      qty: number;
      unitPrice: number;
      cost: number;
    }[] = [];

    activeDrinks.forEach((drink) => {
      const qty = drinkCounts[drink.id] || 0;
      if (qty > 0) {
        const unitPrice = drink.useKrTariff ? krUnitPrice : drink.fixedPrice;
        const cost = qty * unitPrice;
        totalBottles += qty;
        totalDrinkCost += cost;
        items.push({
          id: drink.id,
          name: drink.name,
          shortName: drink.shortName,
          qty,
          unitPrice,
          cost,
        });
      }
    });

    return { items, totalBottles, totalDrinkCost };
  }, [activeDrinks, drinkCounts, krUnitPrice]);

  const dishSubtotal = dishCount * dishUnitPrice;
  const totalOrderPrice =
    dishSubtotal + sauceSummary.totalSauceCost + drinkSummary.totalDrinkCost;

  const formattedAmPm = formatAmPmLabel(pickupTime.hours, pickupTime.minutes);

  const orderMessageText = useMemo(() => {
    const header = isHoliday
      ? '🎄 *PEDIDO BROSPAT — MODO NAVIDAD* 🎅'
      : '🍗 *PEDIDO BROSPAT — PARA RECOGER*';

    const paymentLabel =
      paymentMethod === 'yape'
        ? 'Yape'
        : paymentMethod === 'plin'
        ? 'Plin'
        : 'Efectivo';

    const sections: string[] = [
      header,
      '────────────────',
      ...(createdOrderCode ? [`🔖 *Código:* ${createdOrderCode}`] : []),
      ...(customerName.trim()
        ? [`👤 *Cliente:* ${customerName.trim()}`]
        : []),
      `🕒 *Hora de recojo:* ${formattedAmPm} (aprox. ${settings.prepMinutesLabel})`,
      `💳 *Medio de pago:* ${paymentLabel}`,
      '',
      '🍽️ *PLATO PRINCIPAL*',
      `• *${dishCount}x ${dishName}* — S/ ${dishSubtotal.toFixed(2)}` +
        (dishCount > 1 ? ` (S/ ${dishUnitPrice.toFixed(2)} c/u)` : ''),
      '',
      '🌶️ *CREMAS*',
      ...(sauceSummary.items.length === 0
        ? ['• Sin cremas']
        : sauceSummary.items.map((s) =>
            s.extraQty > 0
              ? `• ${s.qty}x ${s.name} (${s.freeQty} gratis + ${s.extraQty} extra → +S/ ${s.cost.toFixed(2)})`
              : `• ${s.qty}x ${s.name} (Gratis)`
          )),
      '',
      ...(drinkSummary.items.length === 0
        ? ['🥤 *BEBIDAS*', '• Sin bebida']
        : [
            `🥤 *BEBIDAS* (${
              isNight
                ? `Tarifa noche KR S/ ${settings.krNightPrice.toFixed(2)}`
                : `Tarifa día KR S/ ${settings.krDayPrice.toFixed(2)}`
            })`,
            ...drinkSummary.items.map(
              (d) => `• ${d.qty}x ${d.name} — S/ ${d.cost.toFixed(2)}`
            ),
          ]),
    ];

    if (customerNote.trim()) {
      sections.push('', `📝 *Nota:* ${customerNote.trim()}`);
    }

    if (user && card && earnsStamps) {
      const baseTotal = hasProcessedThisOrder
        ? card.totalBroasters
        : card.totalBroasters + dishCount;
      const projectedStamps = baseTotal % STAMPS_PER_REWARD;
      sections.push(
        '',
        `🎟️ *Cartilla BROSPAT:* +${dishCount} ${
          dishCount === 1 ? 'sello' : 'sellos'
        } (${projectedStamps}/${STAMPS_PER_REWARD} en cartilla)`
      );

      if (includeGiftRedeem && card.availableRewards > 0) {
        sections.push(
          `🎁 *CANJE EN TIENDA:* Reclamo 1 Regalo Sorpresa (Código: *${card.activeRewardCode}*)`
        );
      }
    }

    sections.push('', '────────────────');

    if (sauceSummary.totalSauceCost > 0 || drinkSummary.totalDrinkCost > 0) {
      sections.push('🧾 *RESUMEN DE CUENTA*');
      sections.push(
        `• ${dishName} (${dishCount}): S/ ${dishSubtotal.toFixed(2)}`
      );
      if (sauceSummary.extraCount > 0) {
        sections.push(
          `• Cremas extra (${sauceSummary.extraCount}): S/ ${sauceSummary.totalSauceCost.toFixed(2)}`
        );
      }
      if (drinkSummary.totalBottles > 0) {
        sections.push(
          `• Bebidas (${drinkSummary.totalBottles}): S/ ${drinkSummary.totalDrinkCost.toFixed(2)}`
        );
      }
    }

    sections.push(
      '',
      isHoliday
        ? '¡Hola! Te envío mi pedido navideño para recoger, ¿me confirmas por favor? 🎄🎅'
        : '¡Hola! Te envío mi pedido para recoger, ¿me confirmas por favor? 🙌'
    );

    return sections.join('\n');
  }, [
    isHoliday,
    createdOrderCode,
    customerName,
    formattedAmPm,
    settings.prepMinutesLabel,
    settings.krNightPrice,
    settings.krDayPrice,
    paymentMethod,
    dishCount,
    dishName,
    dishSubtotal,
    dishUnitPrice,
    sauceSummary,
    drinkSummary,
    isNight,
    customerNote,
    user,
    card,
    earnsStamps,
    hasProcessedThisOrder,
    includeGiftRedeem,
    totalOrderPrice,
  ]);

  const handleConfirmAndRegisterOrder = async () => {
    setSentInApp(true);
    if (hasProcessedThisOrder) return;
    setHasProcessedThisOrder(true);

    // 1. Save order to backend database so Admin Dashboard sees it immediately
    const savedOrder = await submitCustomerOrder({
      pickupTimeLabel: formattedAmPm,
      pickupHour24: pickupTime.hours,
      pickupMinutes: pickupTime.minutes,
      customerName: customerName.trim() || user?.displayName || 'Cliente Web',
      customerNote: customerNote.trim(),
      customerUid: user?.uid || null,
      dishId: selectedDish?.id || 'broaster',
      dishName,
      dishUnitPrice,
      dishQty: dishCount,
      sauces: sauceSummary.items.map((s) => ({
        id: s.id,
        name: s.name,
        qty: s.qty,
        freeQty: s.freeQty,
        extraQty: s.extraQty,
        cost: s.cost,
      })),
      drinks: drinkSummary.items.map((d) => ({
        id: d.id,
        name: d.name,
        qty: d.qty,
        unitPrice: d.unitPrice,
        cost: d.cost,
      })),
      isNightRate: isNight,
      paymentMethod,
      redeemedGiftCode:
        includeGiftRedeem && card && card.availableRewards > 0
          ? card.activeRewardCode
          : null,
    });

    if (savedOrder) {
      setCreatedOrderCode(savedOrder.orderCode);
    }

    // 2. Add loyalty stamps to Google user's Firestore Cartilla if eligible
    if (user && earnsStamps) {
      const res = await recordBroasterPurchase(dishCount);
      if (res) {
        setOrderStampResult(res);
      }
    }
  };

  const destinationWhatsappDisplay =
    settings.storeWhatsapp?.trim() || DEFAULT_STORE_WHATSAPP;

  const whatsappUrl = useMemo(() => {
    const cleanPhone =
      destinationWhatsappDisplay.replace(/\D/g, '') || '51985636812';
    const encoded = encodeURIComponent(orderMessageText);
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
  }, [destinationWhatsappDisplay, orderMessageText]);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(orderMessageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const cardSurfaceClass = isHoliday
    ? 'bg-[#102419]/80 border-emerald-500/25'
    : 'bg-white/[0.03] border-white/10';

  return (
    <div
      className={`min-h-screen flex flex-col text-white select-none transition-colors duration-300 ${
        isHoliday
          ? 'bg-gradient-to-b from-[#0F2318] via-[#173322] to-[#0A1810]'
          : 'bg-gradient-to-b from-[#2A2A2F] via-[#35353C] to-[#26262B]'
      }`}
    >
      {/* Top Promo Bar */}
      <header
        className={`w-full px-4 sm:px-8 py-3.5 shadow-md shrink-0 transition-all duration-300 ${
          isHoliday
            ? 'bg-gradient-to-r from-[#DC2626] via-[#B91C1C] to-[#15803D]'
            : 'bg-gradient-to-r from-[#FF6012] via-[#FF5500] to-[#E64900]'
        }`}
      >
        <div className="max-w-[980px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isHoliday ? (
              <ChristmasTreeIcon className="w-6 h-6 shrink-0" />
            ) : (
              <Tag className="w-5 h-5 text-white shrink-0" aria-hidden="true" />
            )}
            <span className="font-extrabold text-base sm:text-[22px] tracking-tight text-white uppercase leading-none">
              {settings.discountBannerText || '8.33 % DE DESCUENTO'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <LoyaltyHeaderButton isChristmas={isHoliday} />
            <ChristmasToggleButton
              isChristmas={isHoliday}
              onToggle={toggleHoliday}
            />
            <button
              type="button"
              onClick={() =>
                isAdminAuthenticated ? onEnterAdmin() : openAdminLogin()
              }
              title="Modo Administrador"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-black/25 hover:bg-black/40 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden md:inline">Admin</span>
            </button>

            <button
              type="button"
              aria-label="Volver a la carta"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/30 hover:bg-black/45 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Volver a la carta</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Stage */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-8 py-8 sm:py-10 relative overflow-hidden">
        {isHoliday ? (
          <ChristmasBackdropOverlay />
        ) : (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-8 left-12 w-80 h-80 rounded-full bg-[#FF6012]/10 blur-3xl"
          />
        )}

        <div className="max-w-[980px] w-full mx-auto space-y-6 sm:space-y-7 relative z-10">
          {/* Upper Stage: Dish Card (with Quantity Stepper) + Cremas & Bebidas */}
          <div
            className={`border rounded-[32px] p-5 sm:p-7 pt-12 sm:pt-12 shadow-xl transition-colors duration-300 ${cardSurfaceClass}`}
          >
            <div className="flex flex-col md:flex-row md:items-center gap-8 md:gap-6">
              {/* Left Sculpted White Dish Card with Quantity Stepper */}
              <div
                className={`relative bg-white rounded-[30px] w-[205px] sm:w-[220px] pt-20 sm:pt-24 pb-4 px-4 flex flex-col items-center justify-end shrink-0 mx-auto md:mx-0 ${
                  isHoliday
                    ? 'ring-2 ring-emerald-500 shadow-[0_18px_38px_-8px_rgba(22,163,74,0.45)]'
                    : 'shadow-[0_18px_36px_-8px_rgba(0,0,0,0.45)]'
                }`}
              >
                <img
                  src={selectedDish?.image || '/assets/brospat/broaster.png'}
                  alt={dishName}
                  className="absolute -top-12 sm:-top-13 left-1/2 -translate-x-1/2 w-[90%] max-w-[190px] object-contain pointer-events-none drop-shadow-[0_12px_12px_rgba(0,0,0,0.42)]"
                />
                <h1 className="text-[#FF6012] font-extrabold text-[24px] sm:text-[28px] leading-tight tracking-tight text-center">
                  {dishName}
                </h1>
                <p className="text-[11px] font-semibold text-zinc-500 mt-1 tabular-nums">
                  S/ {dishUnitPrice.toFixed(2)} c/u
                </p>

                {/* Dish Quantity Stepper */}
                <div className="mt-3 w-full bg-zinc-100 rounded-2xl p-1.5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => updateDishCount(-1)}
                    disabled={dishCount <= 1}
                    aria-label="Restar un plato"
                    className="w-8 h-8 rounded-xl bg-white hover:bg-zinc-200 disabled:opacity-35 text-zinc-900 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="text-center leading-tight tabular-nums">
                    <span className="block text-sm font-black text-zinc-900">
                      {dishCount} {dishCount === 1 ? 'plato' : 'platos'}
                    </span>
                    <span className="block text-[11px] font-extrabold text-[#FF6012]">
                      S/ {dishSubtotal.toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => updateDishCount(1)}
                    aria-label="Añadir otro plato"
                    className="w-8 h-8 rounded-xl bg-[#FF6012] hover:bg-[#e55209] text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Right Cremas & Bebidas Clean Columns */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1.5fr_auto_1fr] items-end gap-6 sm:gap-5">
                {/* ELIGE TUS CREMAS */}
                <div className="flex flex-col items-center">
                  <h2 className="text-zinc-100 font-extrabold text-lg sm:text-[22px] tracking-tight uppercase text-center leading-none">
                    ELIGE TUS CREMAS
                  </h2>
                  <p className="text-[11px] sm:text-xs text-zinc-400 mt-1 text-center tabular-nums">
                    {dishCount} de cada sabor{' '}
                    <strong className="text-emerald-300">GRATIS</strong> · Extra
                    +S/ {settings.extraCremaPrice.toFixed(2)} c/u
                  </p>
                  <p
                    className={`text-[11px] font-bold mt-0.5 mb-2.5 px-2.5 py-0.5 rounded-full tabular-nums transition-colors text-center ${
                      limitReachedSauceName
                        ? 'bg-[#FF6012]/25 text-[#FF9B6A] border border-[#FF6012]/40'
                        : 'text-zinc-400'
                    }`}
                  >
                    {limitReachedSauceName
                      ? `Tope en ${limitReachedSauceName}: máx. ${maxExtrasPerFlavor} extra (${settings.maxExtraPerSaucePerPlato} por plato)`
                      : `Máx. ${maxExtrasPerFlavor} extra por crema (${settings.maxExtraPerSaucePerPlato} por plato)`}
                  </p>

                  <div className="flex flex-wrap items-end justify-center gap-2 sm:gap-3">
                    {activeSauces.map((sauce) => {
                      const qty = sauceCounts[sauce.id] || 0;
                      const isSelected = qty > 0;
                      const extraQty = Math.max(0, qty - dishCount);
                      const extraCost = extraQty * settings.extraCremaPrice;
                      const canAdd = canIncrementSauce(sauce.id);

                      return (
                        <div
                          key={sauce.id}
                          className={`flex flex-col items-center px-2 py-2.5 rounded-2xl transition-all duration-150 ${
                            isSelected
                              ? isHoliday
                                ? 'bg-emerald-600/15 ring-2 ring-emerald-400 shadow-[0_0_16px_rgba(34,197,94,0.35)]'
                                : 'bg-white/[0.08] ring-2 ring-[#FF6012] shadow-md'
                              : 'bg-white/[0.02] hover:bg-white/[0.05]'
                          }`}
                        >
                          <span
                            className={`text-[10px] font-extrabold mb-1 px-2 py-0.5 rounded-full tabular-nums ${
                              qty === 0
                                ? 'opacity-0'
                                : extraQty === 0
                                ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/30'
                                : 'bg-[#FF6012] text-white'
                            }`}
                          >
                            {qty === 0
                              ? '0'
                              : extraQty === 0
                              ? 'GRATIS'
                              : `+S/ ${extraCost.toFixed(
                                  extraCost % 1 === 0 ? 0 : 2
                                )}`}
                          </span>

                          <button
                            type="button"
                            onClick={() => updateSauceCount(sauce.id, 1)}
                            title={
                              canAdd
                                ? `Agregar ${sauce.name}`
                                : `Tope de ${maxExtrasPerFlavor} extra de ${sauce.name} alcanzado`
                            }
                            className={`px-1 pt-0.5 transition-transform duration-150 ${
                              canAdd
                                ? 'hover:-translate-y-1 active:scale-95 cursor-pointer'
                                : 'opacity-75 cursor-not-allowed'
                            }`}
                          >
                            <SauceBottleVisual sauce={sauce} />
                          </button>

                          <span className="text-[10px] sm:text-[11px] font-semibold text-zinc-200 mt-1.5 whitespace-nowrap">
                            {sauce.shortName}
                          </span>

                          <div className="mt-1 flex items-center gap-1 bg-[#15121E] border border-white/10 rounded-full px-1.5 py-0.5">
                            <button
                              type="button"
                              onClick={() => updateSauceCount(sauce.id, -1)}
                              disabled={qty === 0}
                              aria-label={`Quitar ${sauce.name}`}
                              className="w-5 h-5 rounded-full hover:bg-white/15 disabled:opacity-30 flex items-center justify-center text-white cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-4 text-center text-xs font-bold tabular-nums text-white">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateSauceCount(sauce.id, 1)}
                              disabled={!canAdd}
                              aria-label={`Agregar ${sauce.name}`}
                              className="w-5 h-5 rounded-full hover:bg-white/15 disabled:opacity-30 flex items-center justify-center text-white cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Subtle Vertical Hairline Divider */}
                <div
                  aria-hidden="true"
                  className={`hidden sm:block w-[1px] h-[190px] self-center ${
                    isHoliday ? 'bg-emerald-500/25' : 'bg-white/15'
                  }`}
                />

                {/* BEBIDAS */}
                <div className="flex flex-col items-center">
                  <h2 className="text-zinc-100 font-extrabold text-lg sm:text-[22px] tracking-tight uppercase text-center leading-none">
                    BEBIDAS
                  </h2>
                  <p className="text-[11px] sm:text-xs text-zinc-400 mt-1 mb-5 text-center tabular-nums">
                    {isNight ? (
                      <span>
                        Tarifa noche KR:{' '}
                        <strong className="text-[#FF8547]">
                          S/ {settings.krNightPrice.toFixed(2)}
                        </strong>
                      </span>
                    ) : (
                      <span>
                        Tarifa día KR:{' '}
                        <strong className="text-emerald-300">
                          S/ {settings.krDayPrice.toFixed(2)}
                        </strong>
                      </span>
                    )}
                  </p>

                  <div className="flex flex-wrap items-end justify-center gap-3 sm:gap-4">
                    {activeDrinks.map((drink) => {
                      const qty = drinkCounts[drink.id] || 0;
                      const isSelected = qty > 0;
                      const unitPrice = drink.useKrTariff
                        ? krUnitPrice
                        : drink.fixedPrice;
                      const itemCost = qty * unitPrice;

                      return (
                        <div
                          key={drink.id}
                          className={`flex flex-col items-center px-2.5 py-2.5 rounded-2xl transition-all duration-150 ${
                            isSelected
                              ? isHoliday
                                ? 'bg-emerald-600/15 ring-2 ring-emerald-400 shadow-[0_0_16px_rgba(34,197,94,0.35)]'
                                : 'bg-white/[0.08] ring-2 ring-[#FF6012] shadow-md'
                              : 'bg-white/[0.02] hover:bg-white/[0.05]'
                          }`}
                        >
                          <span
                            className={`text-[10px] font-extrabold mb-1 px-2 py-0.5 rounded-full tabular-nums ${
                              qty === 0
                                ? 'opacity-0'
                                : 'bg-[#FF6012] text-white'
                            }`}
                          >
                            {qty === 0 ? '0' : `+S/ ${itemCost.toFixed(2)}`}
                          </span>

                          <button
                            type="button"
                            onClick={() => updateDrinkCount(drink.id, 1)}
                            title={`Agregar ${drink.name} (S/ ${unitPrice.toFixed(
                              2
                            )})`}
                            className="px-1.5 pt-0.5 transition-transform duration-150 hover:-translate-y-1 active:scale-95 cursor-pointer"
                          >
                            <DrinkBottleVisual drink={drink} />
                          </button>

                          <span className="text-[10px] sm:text-[11px] font-semibold text-zinc-200 mt-1.5 whitespace-nowrap">
                            {drink.shortName}
                          </span>

                          <div className="mt-1 flex items-center gap-1 bg-[#15121E] border border-white/10 rounded-full px-1.5 py-0.5">
                            <button
                              type="button"
                              onClick={() => updateDrinkCount(drink.id, -1)}
                              disabled={qty === 0}
                              aria-label={`Quitar ${drink.name}`}
                              className="w-5 h-5 rounded-full hover:bg-white/15 disabled:opacity-30 flex items-center justify-center text-white cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-4 text-center text-xs font-bold tabular-nums text-white">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateDrinkCount(drink.id, 1)}
                              aria-label={`Agregar ${drink.name}`}
                              className="w-5 h-5 rounded-full hover:bg-white/15 flex items-center justify-center text-white cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lower Section: Circular Clock Pickup Selector + Price Receipt & CTA */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-7 items-stretch">
            <div
              className={`lg:col-span-7 border rounded-[28px] p-5 sm:p-6 flex flex-col justify-between gap-4 shadow-lg transition-colors duration-300 ${cardSurfaceClass}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Clock
                    className="w-4 h-4 text-[#FF6012]"
                    aria-hidden="true"
                  />
                  <span className="font-extrabold text-white text-sm sm:text-base tracking-tight uppercase">
                    TIEMPO APROX DE PREPARACIÓN
                  </span>
                </div>
                <span className="bg-[#130C1E] border border-white/10 text-zinc-200 px-4 py-1 rounded-full text-xs sm:text-sm font-extrabold uppercase">
                  {settings.prepMinutesLabel || '15 MINS'}
                </span>
              </div>

              <CircularClockPicker
                hours24={pickupTime.hours}
                minutes={pickupTime.minutes}
                isChristmas={isHoliday}
                onChange={setPickupTime}
              />
            </div>

            {/* Right Column: Ticket Price Summary + REALIZAR PEDIDO */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-4">
              <div
                aria-label="Resumen del precio"
                className={`border rounded-[26px] p-5 space-y-2.5 text-xs sm:text-sm shadow-lg flex-1 flex flex-col justify-between transition-colors duration-300 ${
                  isHoliday
                    ? 'bg-[#0E2016] border-emerald-500/25'
                    : 'bg-[#1B1B20] border-white/10'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-zinc-400 pb-2 border-b border-white/10">
                    <Receipt
                      className="w-3.5 h-3.5 text-[#FF6012]"
                      aria-hidden="true"
                    />
                    <span>Resumen del precio</span>
                  </div>

                  <div className="flex items-center justify-between tabular-nums">
                    <span className="text-zinc-200 font-medium">
                      {dishCount}× {dishName} (S/ {dishUnitPrice.toFixed(2)})
                    </span>
                    <span className="font-bold text-white">
                      S/ {dishSubtotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 tabular-nums">
                    <span className="text-zinc-300 truncate">
                      Cremas ({sauceSummary.freeCount} gratis
                      {sauceSummary.extraCount > 0
                        ? ` + ${sauceSummary.extraCount} extra`
                        : ''}
                      )
                    </span>
                    <span className="font-bold text-white shrink-0">
                      {sauceSummary.totalSauceCost === 0
                        ? 'S/ 0.00'
                        : `S/ ${sauceSummary.totalSauceCost.toFixed(2)}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 tabular-nums">
                    <span className="text-zinc-300 truncate">
                      {drinkSummary.totalBottles > 0
                        ? `${drinkSummary.totalBottles}× Bebidas (${
                            isNight ? 'Noche' : 'Día'
                          })`
                        : `Bebidas (${isNight ? 'Noche' : 'Día'})`}
                    </span>
                    <span className="font-bold text-white shrink-0">
                      S/ {drinkSummary.totalDrinkCost.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 tabular-nums text-zinc-400 text-xs pt-1">
                    <span>Hora de recojo</span>
                    <span className="font-bold text-zinc-200">
                      {formattedAmPm}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-dashed border-white/15 flex items-baseline justify-between tabular-nums">
                  <span className="font-extrabold uppercase text-white text-sm sm:text-base">
                    Total a pagar
                  </span>
                  <span className="font-black text-[#FF6012] text-2xl sm:text-[28px]">
                    S/ {totalOrderPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* REALIZAR PEDIDO CTA */}
              <button
                type="button"
                onClick={() => {
                  setSentInApp(false);
                  setCreatedOrderCode(null);
                  setHasProcessedThisOrder(false);
                  setOrderStampResult(null);
                  setIncludeGiftRedeem((card?.availableRewards ?? 0) > 0);
                  setIsMessageModalOpen(true);
                }}
                className={`w-full hover:brightness-110 active:scale-[0.98] transition-all duration-150 text-white font-black uppercase rounded-[24px] py-4 sm:py-5 px-6 text-[22px] sm:text-[26px] leading-[1.08] text-center cursor-pointer tabular-nums ${
                  isHoliday
                    ? 'bg-gradient-to-r from-[#DC2626] via-[#EA580C] to-[#16A34A] shadow-[0_12px_30px_-6px_rgba(220,38,38,0.55)]'
                    : 'bg-gradient-to-r from-[#FF6012] to-[#F04B00] shadow-[0_12px_28px_-6px_rgba(255,96,18,0.55)]'
                }`}
              >
                REALIZAR PEDIDO · S/ {totalOrderPrice.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Envío de Mensaje */}
      {isMessageModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Enviar mensaje de pedido"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-text"
        >
          <div
            className={`border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto ${
              isHoliday
                ? 'bg-[#0E2016] border-emerald-500/30'
                : 'bg-[#232329] border-white/15'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {isHoliday && <ChristmasTreeIcon className="w-5 h-5" />}
                <h3 className="text-lg font-extrabold text-[#FF6012] uppercase">
                  Enviar datos del pedido
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMessageModalOpen(false)}
                aria-label="Cerrar ventana"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Tu nombre (opcional)"
                  className="px-3.5 py-2 rounded-xl bg-[#11081C] border border-white/10 text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#FF6012]"
                />
                <select
                  aria-label="Medio de pago"
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as PaymentMethod)
                  }
                  className="px-3 py-2 rounded-xl bg-[#11081C] border border-white/10 text-sm text-white focus:outline-none focus:border-[#FF6012]"
                >
                  <option value="efectivo">Pago: Efectivo</option>
                  <option value="yape">Pago: Yape</option>
                  <option value="plin">Pago: Plin</option>
                </select>
              </div>

              <input
                type="text"
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                placeholder="Nota opcional (ej. parte pecho, bien dorado...)"
                className="w-full px-3.5 py-2 rounded-xl bg-[#11081C] border border-white/10 text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#FF6012]"
              />
            </div>

            {/* Loyalty Prompt or Active Reward Toggle inside Order Modal */}
            {earnsStamps && !user ? (
              <div className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
                <span className="text-[11px] text-zinc-300">
                  Suma <strong className="text-white">+{dishCount}</strong>{' '}
                  {dishCount === 1 ? 'sello' : 'sellos'} en tu Cartilla (10 =
                  Regalo Sorpresa)
                </span>
                <button
                  type="button"
                  disabled={isLoyaltyBusy}
                  onClick={() => void signInWithGoogle()}
                  className="inline-flex items-center gap-1.5 bg-white hover:bg-zinc-100 text-zinc-900 font-extrabold text-[11px] px-2.5 py-1.5 rounded-lg shrink-0 cursor-pointer"
                >
                  <GoogleLogoIcon className="w-3.5 h-3.5" />
                  <span>Entrar</span>
                </button>
              </div>
            ) : (
              card &&
              card.availableRewards > 0 && (
                <label className="flex items-center gap-2.5 bg-emerald-500/15 border border-emerald-400/40 rounded-xl px-3 py-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeGiftRedeem}
                    onChange={(e) => setIncludeGiftRedeem(e.target.checked)}
                    className="accent-emerald-400 w-4 h-4 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-emerald-200 flex items-center gap-1.5">
                    <Gift className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>
                      Reclamar mi Regalo Sorpresa en este recojo (
                      {card.activeRewardCode})
                    </span>
                  </span>
                </label>
              )
            )}

            <div className="bg-[#0B141A] border border-emerald-500/25 rounded-2xl p-3 max-h-52 overflow-y-auto">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-emerald-400/90 mb-2 px-1">
                <span>Para: {destinationWhatsappDisplay}</span>
                <span>{formattedAmPm}</span>
              </div>
              <div className="bg-[#005C4B] rounded-xl rounded-tr-xs px-3.5 py-2.5 text-xs sm:text-[13px] text-zinc-100 leading-relaxed shadow-sm">
                {orderMessageText
                  .split('\n')
                  .map((line, idx) => renderWhatsAppFormattedLine(line, idx))}
              </div>
            </div>

            {sentInApp && (
              <div
                role="status"
                className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs sm:text-sm font-semibold rounded-xl px-4 py-2.5 text-center space-y-1"
              >
                <p>
                  ¡Pedido {createdOrderCode ? `${createdOrderCode} ` : ''}
                  registrado! Total S/ {totalOrderPrice.toFixed(2)} · Recojo{' '}
                  {formattedAmPm}.
                </p>
                {orderStampResult && (
                  <p className="text-emerald-300 font-extrabold text-xs">
                    {orderStampResult.unlockedNewGift ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMessageModalOpen(false);
                          openCardModal();
                        }}
                        className="underline cursor-pointer"
                      >
                        🎁 ¡Completaste 10 Broasters y ganaste un Regalo
                        Sorpresa! Ver vale ({orderStampResult.rewardCode})
                      </button>
                    ) : (
                      `✨ +${orderStampResult.stampsAdded} ${
                        orderStampResult.stampsAdded === 1
                          ? 'sello sumado'
                          : 'sellos sumados'
                      } a tu Cartilla (${orderStampResult.newStamps}/10)`
                    )}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2.5 pt-1">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => void handleConfirmAndRegisterOrder()}
                className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-extrabold text-sm uppercase flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                <span>Enviar WhatsApp ({destinationWhatsappDisplay})</span>
              </a>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => void handleConfirmAndRegisterOrder()}
                  className="py-2.5 px-3 rounded-xl bg-[#FF6012] hover:bg-[#ff722b] text-white font-bold text-xs sm:text-sm uppercase cursor-pointer transition-colors"
                >
                  Confirmar pedido
                </button>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{copied ? '¡Copiado!' : 'Copiar datos'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
