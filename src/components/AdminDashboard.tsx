import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Check,
  ChefHat,
  Clock,
  DollarSign,
  ExternalLink,
  Flame,
  Gift,
  LogOut,
  Minus,
  Package,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  ShoppingBag,
  Trash2,
  TrendingUp,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import {
  CatalogData,
  DishItem,
  DrinkItem,
  OrderStatus,
  PaymentMethod,
  SauceItem,
} from '../types/menu';
import { useStore } from '../context/StoreContext';
import { DrinkBottleVisual, SauceBottleVisual } from './ItemVisuals';

type AdminTab = 'stats' | 'orders' | 'customers' | 'dishes' | 'extras';
type StatsRange = 'today' | '7d' | '30d' | 'all';

interface AdminDashboardProps {
  onBackToStore: () => void;
}

const DISH_IMAGE_PRESETS = [
  { label: 'Plato Broaster', value: '/assets/brospat/broaster.png' },
  { label: 'Caldo de Gallina', value: '/assets/brospat/caldo.png' },
  { label: 'Salchipapa', value: '/assets/brospat/salchipapa.png' },
  { label: 'Salchicono', value: '/assets/brospat/salchicono.png' },
];

const SAUCE_IMAGE_PRESETS = [
  { label: 'Botella Verde (Rocoto)', value: '/assets/brospat/crema_verde.png' },
  { label: 'Botella Roja (Ketchup)', value: '/assets/brospat/crema_roja.png' },
  {
    label: 'Botella Blanca (Mayonesa)',
    value: '/assets/brospat/crema_blanca.png',
  },
  {
    label: 'Botella Amarilla (Mostaza)',
    value: '/assets/brospat/crema_amarilla.png',
  },
  { label: 'Botella Color Personalizado', value: 'custom-bottle' },
];

const DRINK_IMAGE_PRESETS = [
  { label: 'Botella KR Negra', value: '/assets/brospat/kr_negra.png' },
  { label: 'Botella KR Amarilla', value: '/assets/brospat/kr_oro.png' },
  { label: 'Botella Color Personalizado', value: 'custom-drink' },
];

const STATUS_META: Record<
  OrderStatus,
  { label: string; badgeClass: string }
> = {
  pendiente: {
    label: 'Pendiente',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
  },
  preparando: {
    label: 'Preparando',
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
  },
  listo: {
    label: 'Listo recojo',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
  },
  entregado: {
    label: 'Entregado',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
  },
  cancelado: {
    label: 'Cancelado',
    badgeClass: 'bg-red-500/20 text-red-300 border-red-400/40',
  },
};

function slugifyId(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32) || `item-${Date.now()}`
  );
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBackToStore,
}) => {
  const {
    catalog,
    adminOrders,
    adminCustomers,
    isLoadingAdmin,
    refreshAdminDashboard,
    saveAdminCatalog,
    updateAdminOrder,
    deleteAdminOrder,
    createAdminCounterOrder,
    adjustAdminCustomer,
    logoutAdmin,
  } = useStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [statsRange, setStatsRange] = useState<StatsRange>('7d');
  const [orderFilter, setOrderFilter] = useState<OrderStatus | 'todos'>('todos');
  const [orderSearch, setOrderSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Local editable draft for catalog changes
  const [draftCatalog, setDraftCatalog] = useState<CatalogData>(catalog);
  const [isSavingCatalog, setIsSavingCatalog] = useState(false);

  // Sync draft when catalog updates from server
  React.useEffect(() => {
    setDraftCatalog(catalog);
  }, [catalog]);

  // Quick Counter Sale Modal
  const [isCounterModalOpen, setIsCounterModalOpen] = useState(false);
  const [counterDishId, setCounterDishId] = useState(
    catalog.dishes[0]?.id || 'broaster'
  );
  const [counterQty, setCounterQty] = useState(1);
  const [counterExtras, setCounterExtras] = useState(0);
  const [counterDrinks, setCounterDrinks] = useState(0);
  const [counterCustomer, setCounterCustomer] = useState('');
  const [counterPayment, setCounterPayment] =
    useState<PaymentMethod>('efectivo');

  // New Dish Form
  const [newDishName, setNewDishName] = useState('');
  const [newDishSubtitle, setNewDishSubtitle] = useState('');
  const [newDishPrice, setNewDishPrice] = useState('12.00');
  const [newDishImage, setNewDishImage] = useState(
    '/assets/brospat/broaster.png'
  );
  const [newDishPromo, setNewDishPromo] = useState('');
  const [newDishOnline, setNewDishOnline] = useState(true);

  // New Sauce Form
  const [newSauceName, setNewSauceName] = useState('');
  const [newSauceShort, setNewSauceShort] = useState('');
  const [newSauceImage, setNewSauceImage] = useState('custom-bottle');
  const [newSauceColor, setNewSauceColor] = useState('#A3E635');

  // New Drink Form
  const [newDrinkName, setNewDrinkName] = useState('');
  const [newDrinkShort, setNewDrinkShort] = useState('');
  const [newDrinkImage, setNewDrinkImage] = useState('custom-drink');
  const [newDrinkColor, setNewDrinkColor] = useState('#7E22CE');
  const [newDrinkUseKr, setNewDrinkUseKr] = useState(false);
  const [newDrinkFixedPrice, setNewDrinkFixedPrice] = useState('2.50');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const handlePersistCatalog = async (next: CatalogData, message: string) => {
    setDraftCatalog(next);
    setIsSavingCatalog(true);
    const ok = await saveAdminCatalog(next);
    setIsSavingCatalog(false);
    if (ok) {
      showToast(message);
    } else {
      showToast('No se pudieron guardar los cambios.');
    }
  };

  // --- Computed Analytics ---
  const analytics = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime();

    const rangeFiltered = adminOrders.filter((o) => {
      const t = new Date(o.createdAt).getTime();
      if (statsRange === 'today') return t >= startOfToday;
      if (statsRange === '7d') return t >= now.getTime() - 7 * 86400000;
      if (statsRange === '30d') return t >= now.getTime() - 30 * 86400000;
      return true;
    });

    const validOrders = rangeFiltered.filter((o) => o.status !== 'cancelado');
    const cancelledCount = rangeFiltered.length - validOrders.length;
    const pendingCount = validOrders.filter(
      (o) => o.status === 'pendiente' || o.status === 'preparando'
    ).length;

    let totalRevenue = 0;
    let dishesRevenue = 0;
    let saucesRevenue = 0;
    let drinksRevenue = 0;
    let totalDishesSold = 0;
    let totalDrinksSold = 0;

    const byPayment: Record<PaymentMethod, number> = {
      efectivo: 0,
      yape: 0,
      plin: 0,
    };

    const dishRanking: Record<string, { name: string; qty: number; rev: number }> =
      {};
    const sauceRanking: Record<string, { name: string; qty: number; extra: number }> =
      {};
    const drinkRanking: Record<string, { name: string; qty: number; rev: number }> =
      {};

    // Hourly demand 17..23
    const hourlyCounts: Record<number, number> = {
      17: 0,
      18: 0,
      19: 0,
      20: 0,
      21: 0,
      22: 0,
      23: 0,
    };

    for (const o of validOrders) {
      totalRevenue += o.totalPrice;
      dishesRevenue += o.dishSubtotal;
      saucesRevenue += o.sauceSubtotal;
      drinksRevenue += o.drinkSubtotal;
      totalDishesSold += o.dishQty;
      totalDrinksSold += o.drinkCount;
      byPayment[o.paymentMethod] =
        (byPayment[o.paymentMethod] || 0) + o.totalPrice;

      if (!dishRanking[o.dishId]) {
        dishRanking[o.dishId] = { name: o.dishName, qty: 0, rev: 0 };
      }
      dishRanking[o.dishId].qty += o.dishQty;
      dishRanking[o.dishId].rev += o.dishSubtotal;

      for (const s of o.sauces) {
        if (!sauceRanking[s.id]) {
          sauceRanking[s.id] = { name: s.name, qty: 0, extra: 0 };
        }
        sauceRanking[s.id].qty += s.qty;
        sauceRanking[s.id].extra += s.extraQty;
      }

      for (const d of o.drinks) {
        if (!drinkRanking[d.id]) {
          drinkRanking[d.id] = { name: d.name, qty: 0, rev: 0 };
        }
        drinkRanking[d.id].qty += d.qty;
        drinkRanking[d.id].rev += d.cost;
      }

      const h = Math.max(17, Math.min(23, o.pickupHour24 || 20));
      hourlyCounts[h] = (hourlyCounts[h] || 0) + 1;
    }

    // Last 7 days daily revenue series (always 7 days for chart clarity)
    const dailySeries: { label: string; dateKey: string; revenue: number; count: number }[] =
      [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        '0'
      )}-${String(d.getDate()).padStart(2, '0')}`;
      const label = d.toLocaleDateString('es-PE', {
        weekday: 'short',
        day: 'numeric',
      });
      dailySeries.push({ label, dateKey: key, revenue: 0, count: 0 });
    }

    for (const o of adminOrders) {
      if (o.status === 'cancelado') continue;
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        '0'
      )}-${String(d.getDate()).padStart(2, '0')}`;
      const bucket = dailySeries.find((b) => b.dateKey === key);
      if (bucket) {
        bucket.revenue += o.totalPrice;
        bucket.count += 1;
      }
    }

    const avgTicket =
      validOrders.length > 0 ? totalRevenue / validOrders.length : 0;

    return {
      totalRevenue,
      dishesRevenue,
      saucesRevenue,
      drinksRevenue,
      validCount: validOrders.length,
      cancelledCount,
      pendingCount,
      avgTicket,
      totalDishesSold,
      totalDrinksSold,
      byPayment,
      dailySeries,
      hourlyCounts,
      topDishes: Object.values(dishRanking).sort((a, b) => b.qty - a.qty),
      topSauces: Object.values(sauceRanking).sort((a, b) => b.qty - a.qty),
      topDrinks: Object.values(drinkRanking).sort((a, b) => b.qty - a.qty),
    };
  }, [adminOrders, statsRange]);

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return adminOrders.filter((o) => {
      if (orderFilter !== 'todos' && o.status !== orderFilter) return false;
      if (!q) return true;
      return (
        o.orderCode.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.dishName.toLowerCase().includes(q)
      );
    });
  }, [adminOrders, orderFilter, orderSearch]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return adminCustomers;
    return adminCustomers.filter(
      (c) =>
        c.displayName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.activeRewardCode.toLowerCase().includes(q)
    );
  }, [adminCustomers, customerSearch]);

  // --- Handlers for Adding / Editing Catalog Items ---
  const handleAddDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDishName.trim()) return;
    const price = Math.max(0.5, parseFloat(newDishPrice) || 12);
    const id = `${slugifyId(newDishName)}-${Date.now().toString().slice(-4)}`;
    const dish: DishItem = {
      id,
      name: newDishName.trim(),
      subtitle: newDishSubtitle.trim() || 'Especialidad BROSPAT',
      price: Math.round(price * 100) / 100,
      image: newDishImage.trim() || '/assets/brospat/broaster.png',
      promoTag: newDishPromo.trim(),
      onlineOrderable: newDishOnline,
      active: true,
      earnsLoyaltyStamp: newDishName.toLowerCase().includes('broaster'),
    };
    const next: CatalogData = {
      ...draftCatalog,
      dishes: [...draftCatalog.dishes, dish],
    };
    setNewDishName('');
    setNewDishSubtitle('');
    setNewDishPromo('');
    await handlePersistCatalog(next, `Plato "${dish.name}" añadido a la carta.`);
  };

  const handleRemoveDish = async (dishId: string) => {
    if (draftCatalog.dishes.length <= 1) {
      showToast('Debe quedar al menos 1 plato en la carta.');
      return;
    }
    const next: CatalogData = {
      ...draftCatalog,
      dishes: draftCatalog.dishes.filter((d) => d.id !== dishId),
    };
    await handlePersistCatalog(next, 'Plato eliminado de la carta.');
  };

  const handleAddSauce = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSauceName.trim()) return;
    const id = `${slugifyId(newSauceName)}-${Date.now().toString().slice(-4)}`;
    const sauce: SauceItem = {
      id,
      name: newSauceName.trim(),
      shortName: (newSauceShort.trim() || newSauceName.trim()).slice(0, 16),
      image: newSauceImage,
      clipTop: newSauceImage.includes('crema_roja'),
      colorHex: newSauceColor,
      active: true,
    };
    const next: CatalogData = {
      ...draftCatalog,
      sauces: [...draftCatalog.sauces, sauce],
    };
    setNewSauceName('');
    setNewSauceShort('');
    await handlePersistCatalog(next, `Crema "${sauce.name}" añadida.`);
  };

  const handleRemoveSauce = async (sauceId: string) => {
    const next: CatalogData = {
      ...draftCatalog,
      sauces: draftCatalog.sauces.filter((s) => s.id !== sauceId),
    };
    await handlePersistCatalog(next, 'Crema eliminada.');
  };

  const handleAddDrink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDrinkName.trim()) return;
    const id = `${slugifyId(newDrinkName)}-${Date.now().toString().slice(-4)}`;
    const drink: DrinkItem = {
      id,
      name: newDrinkName.trim(),
      shortName: (newDrinkShort.trim() || newDrinkName.trim()).slice(0, 16),
      image: newDrinkImage,
      colorHex: newDrinkColor,
      useKrTariff: newDrinkUseKr,
      fixedPrice: Math.max(0.5, parseFloat(newDrinkFixedPrice) || 2.0),
      active: true,
    };
    const next: CatalogData = {
      ...draftCatalog,
      drinks: [...draftCatalog.drinks, drink],
    };
    setNewDrinkName('');
    setNewDrinkShort('');
    await handlePersistCatalog(next, `Bebida "${drink.name}" añadida.`);
  };

  const handleRemoveDrink = async (drinkId: string) => {
    const next: CatalogData = {
      ...draftCatalog,
      drinks: draftCatalog.drinks.filter((d) => d.id !== drinkId),
    };
    await handlePersistCatalog(next, 'Bebida eliminada.');
  };

  const handleCreateCounterSale = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await createAdminCounterOrder({
      dishId: counterDishId,
      dishQty: counterQty,
      sauceExtraCount: counterExtras,
      drinkCount: counterDrinks,
      customerName: counterCustomer.trim() || 'Cliente en Salón',
      paymentMethod: counterPayment,
      status: 'entregado',
    });
    if (created) {
      setIsCounterModalOpen(false);
      setCounterQty(1);
      setCounterExtras(0);
      setCounterDrinks(0);
      setCounterCustomer('');
      showToast(`Venta ${created.orderCode} registrada (S/ ${created.totalPrice.toFixed(2)}).`);
    }
  };

  const maxDailyRev = Math.max(
    1,
    ...analytics.dailySeries.map((d) => d.revenue)
  );
  const maxHourlyCount = Math.max(
    1,
    ...Object.values(analytics.hourlyCounts)
  );

  return (
    <div className="min-h-screen bg-[#0E0E12] text-white flex flex-col">
      {/* Top Admin Command Bar */}
      <header className="sticky top-0 z-30 bg-[#14141A]/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FF6012] text-white flex items-center justify-center shadow-sm">
              <Flame className="w-5 h-5 fill-white/20" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-base sm:text-lg tracking-tight uppercase leading-none">
                  BROSPAT · Administrador
                </h1>
                <span className="bg-emerald-500/20 border border-emerald-400/35 text-emerald-300 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md">
                  En vivo
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Gestión de pedidos, clientes, carta, cremas e ingresos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void refreshAdminDashboard()}
              title="Actualizar datos"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-200 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoadingAdmin ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            <button
              type="button"
              onClick={onBackToStore}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-extrabold cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Tienda</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                await logoutAdmin();
                onBackToStore();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-400/30 text-red-200 text-xs font-bold cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto mt-3.5 flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            {
              id: 'stats' as AdminTab,
              label: 'Ingresos y Estadísticas',
              icon: BarChart3,
              badge: null,
            },
            {
              id: 'orders' as AdminTab,
              label: 'Pedidos',
              icon: ShoppingBag,
              badge:
                analytics.pendingCount > 0 ? analytics.pendingCount : null,
            },
            {
              id: 'customers' as AdminTab,
              label: 'Clientes y Cartillas',
              icon: Users,
              badge: adminCustomers.length || null,
            },
            {
              id: 'dishes' as AdminTab,
              label: 'Platos y Precios',
              icon: UtensilsCrossed,
              badge: draftCatalog.dishes.length,
            },
            {
              id: 'extras' as AdminTab,
              label: 'Cremas, Bebidas y Config',
              icon: Settings,
              badge: null,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#FF6012] text-white shadow-sm'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
                {tab.badge !== null && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-black tabular-nums ${
                      isActive
                        ? 'bg-black/30 text-white'
                        : 'bg-white/10 text-zinc-200'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Toast Notification */}
      {toastMsg && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 bg-[#1B1B24] border border-[#FF6012] text-white text-xs sm:text-sm font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2"
        >
          <Check className="w-4 h-4 text-[#FF6012]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Content Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* ================= TAB 1: ESTADÍSTICAS E INGRESOS ================= */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Period Filter + Counter Sale Action */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 bg-[#17171E] p-1 rounded-xl border border-white/10">
                {(
                  [
                    { id: 'today', label: 'Hoy' },
                    { id: '7d', label: 'Últimos 7 días' },
                    { id: '30d', label: '30 días' },
                    { id: 'all', label: 'Todo' },
                  ] as { id: StatsRange; label: string }[]
                ).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setStatsRange(r.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      statsRange === r.id
                        ? 'bg-[#FF6012] text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIsCounterModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Venta en Salón</span>
              </button>
            </div>

            {/* 4 Primary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#17171E] border border-white/10 rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-bold uppercase">
                  <span>Ingresos Netos</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white tabular-nums">
                  S/ {analytics.totalRevenue.toFixed(2)}
                </p>
                <p className="text-[11px] text-zinc-400 tabular-nums">
                  Platos S/ {analytics.dishesRevenue.toFixed(2)} · Extras S/{' '}
                  {(analytics.saucesRevenue + analytics.drinksRevenue).toFixed(2)}
                </p>
              </div>

              <div className="bg-[#17171E] border border-white/10 rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-bold uppercase">
                  <span>Pedidos Válidos</span>
                  <ShoppingBag className="w-4 h-4 text-[#FF6012]" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white tabular-nums">
                  {analytics.validCount}
                </p>
                <p className="text-[11px] text-zinc-400 tabular-nums">
                  {analytics.pendingCount} en curso · {analytics.cancelledCount}{' '}
                  cancelados
                </p>
              </div>

              <div className="bg-[#17171E] border border-white/10 rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-bold uppercase">
                  <span>Ticket Promedio</span>
                  <TrendingUp className="w-4 h-4 text-sky-400" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white tabular-nums">
                  S/ {analytics.avgTicket.toFixed(2)}
                </p>
                <p className="text-[11px] text-zinc-400 tabular-nums">
                  Promedio por pedido confirmado
                </p>
              </div>

              <div className="bg-[#17171E] border border-white/10 rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-bold uppercase">
                  <span>Unidades Vendidas</span>
                  <Package className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white tabular-nums">
                  {analytics.totalDishesSold}{' '}
                  <span className="text-sm font-bold text-zinc-400">platos</span>
                </p>
                <p className="text-[11px] text-zinc-400 tabular-nums">
                  + {analytics.totalDrinksSold} bebidas vendidas
                </p>
              </div>
            </div>

            {/* Charts Row: 7-Day Revenue + Peak Pickup Hours */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* 7-Day Revenue Bar Chart */}
              <div className="lg:col-span-7 bg-[#17171E] border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm sm:text-base font-extrabold text-white">
                      Ingresos de los últimos 7 días
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Evolución diaria en soles (excluye cancelados)
                    </p>
                  </div>
                </div>

                <div className="h-52 flex items-end justify-between gap-2 sm:gap-3 pt-6 pb-2 border-b border-white/10">
                  {analytics.dailySeries.map((day) => {
                    const heightPct =
                      day.revenue > 0
                        ? Math.max(10, Math.round((day.revenue / maxDailyRev) * 100))
                        : 4;
                    return (
                      <div
                        key={day.dateKey}
                        className="flex-1 flex flex-col items-center justify-end h-full group"
                      >
                        <span className="text-[10px] font-bold text-zinc-300 mb-1.5 tabular-nums">
                          {day.revenue > 0 ? `S/${day.revenue.toFixed(0)}` : '—'}
                        </span>
                        <div className="w-full max-w-[44px] h-36 flex items-end">
                          <div
                            style={{ height: `${heightPct}%` }}
                            className={`w-full rounded-t-xl transition-all ${
                              day.revenue > 0
                                ? 'bg-gradient-to-t from-[#E04800] to-[#FF7A38]'
                                : 'bg-white/10'
                            }`}
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-zinc-400 mt-2 capitalize">
                          {day.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Revenue Composition & Payment Breakdown */}
                <div className="grid grid-cols-3 gap-2 pt-4 text-xs tabular-nums">
                  <div className="bg-black/25 rounded-xl p-2.5 border border-white/5">
                    <span className="text-zinc-400 block text-[11px]">
                      Efectivo
                    </span>
                    <span className="font-extrabold text-white">
                      S/ {analytics.byPayment.efectivo.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-black/25 rounded-xl p-2.5 border border-white/5">
                    <span className="text-zinc-400 block text-[11px]">Yape</span>
                    <span className="font-extrabold text-purple-300">
                      S/ {analytics.byPayment.yape.toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-black/25 rounded-xl p-2.5 border border-white/5">
                    <span className="text-zinc-400 block text-[11px]">Plin</span>
                    <span className="font-extrabold text-sky-300">
                      S/ {analytics.byPayment.plin.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Peak Hours & Source Breakdown */}
              <div className="lg:col-span-5 bg-[#17171E] border border-white/10 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-white">
                    Demanda por Hora de Recojo
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Pedidos concentrados desde la apertura (5:00 PM – 11:00 PM)
                  </p>
                </div>

                <div className="space-y-2.5">
                  {[17, 18, 19, 20, 21, 22, 23].map((h) => {
                    const count = analytics.hourlyCounts[h] || 0;
                    const pct =
                      count > 0 ? Math.round((count / maxHourlyCount) * 100) : 0;
                    const label12 = `${h - 12}:00 PM`;
                    return (
                      <div key={h} className="flex items-center gap-3 text-xs">
                        <span className="w-16 text-zinc-400 font-semibold tabular-nums shrink-0">
                          {label12}
                        </span>
                        <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className="h-full bg-[#FF6012] rounded-full transition-all"
                          />
                        </div>
                        <span className="w-8 text-right font-bold text-zinc-200 tabular-nums">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-center text-xs tabular-nums">
                  <div>
                    <span className="text-zinc-400 block text-[11px]">Platos</span>
                    <strong className="text-white">
                      S/ {analytics.dishesRevenue.toFixed(2)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[11px]">
                      Cremas extra
                    </span>
                    <strong className="text-[#FF8547]">
                      S/ {analytics.saucesRevenue.toFixed(2)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[11px]">
                      Bebidas
                    </span>
                    <strong className="text-emerald-300">
                      S/ {analytics.drinksRevenue.toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Rankings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#17171E] border border-white/10 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">
                  Platos más vendidos
                </h3>
                {analytics.topDishes.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-4 text-center">
                    Aún no hay pedidos en este periodo.
                  </p>
                ) : (
                  <ul className="space-y-2 text-xs tabular-nums">
                    {analytics.topDishes.map((d) => (
                      <li
                        key={d.name}
                        className="flex items-center justify-between bg-black/25 px-3 py-2 rounded-xl"
                      >
                        <span className="font-bold text-white">{d.name}</span>
                        <span className="text-zinc-300">
                          {d.qty} unid ·{' '}
                          <strong className="text-[#FF6012]">
                            S/ {d.rev.toFixed(2)}
                          </strong>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-[#17171E] border border-white/10 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">
                  Cremas más pedidas
                </h3>
                {analytics.topSauces.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-4 text-center">
                    Sin cremas registradas aún.
                  </p>
                ) : (
                  <ul className="space-y-2 text-xs tabular-nums">
                    {analytics.topSauces.map((s) => (
                      <li
                        key={s.name}
                        className="flex items-center justify-between bg-black/25 px-3 py-2 rounded-xl"
                      >
                        <span className="font-bold text-white">{s.name}</span>
                        <span className="text-zinc-300">
                          {s.qty} total ({s.extra} extra)
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-[#17171E] border border-white/10 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">
                  Bebidas más pedidas
                </h3>
                {analytics.topDrinks.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-4 text-center">
                    Sin bebidas registradas aún.
                  </p>
                ) : (
                  <ul className="space-y-2 text-xs tabular-nums">
                    {analytics.topDrinks.map((d) => (
                      <li
                        key={d.name}
                        className="flex items-center justify-between bg-black/25 px-3 py-2 rounded-xl"
                      >
                        <span className="font-bold text-white">{d.name}</span>
                        <span className="text-zinc-300">
                          {d.qty} bot ·{' '}
                          <strong className="text-emerald-300">
                            S/ {d.rev.toFixed(2)}
                          </strong>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: GESTIÓN DE PEDIDOS ================= */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    'todos',
                    'pendiente',
                    'preparando',
                    'listo',
                    'entregado',
                    'cancelado',
                  ] as const
                ).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setOrderFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer ${
                      orderFilter === st
                        ? 'bg-[#FF6012] text-white'
                        : 'bg-[#17171E] text-zinc-400 hover:text-white border border-white/10'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Buscar código o cliente..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#17171E] border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF6012]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsCounterModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-xs whitespace-nowrap cursor-pointer"
                >
                  + Venta Salón
                </button>
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="bg-[#17171E] border border-white/10 rounded-2xl p-10 text-center space-y-2">
                <ChefHat className="w-9 h-9 text-zinc-500 mx-auto" />
                <p className="text-sm font-bold text-zinc-300">
                  No hay pedidos en esta vista
                </p>
                <p className="text-xs text-zinc-500">
                  Los pedidos enviados desde la tienda o registrados en salón
                  aparecerán aquí al instante.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => {
                  const meta = STATUS_META[order.status];
                  return (
                    <div
                      key={order.id}
                      className="bg-[#17171E] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-black text-sm text-[#FF6012]">
                            {order.orderCode}
                          </span>
                          <span
                            className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${meta.badgeClass}`}
                          >
                            {meta.label}
                          </span>
                          <span className="inline-flex items-center gap-1 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full text-xs font-bold text-white">
                            <Clock className="w-3 h-3 text-[#FF6012]" />
                            Recojo: {order.pickupTimeLabel}
                          </span>
                          <span className="text-xs font-bold text-zinc-200">
                            · {order.customerName}
                          </span>
                          <span className="text-[11px] text-zinc-500">
                            (
                            {new Date(order.createdAt).toLocaleString('es-PE', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            )
                          </span>
                        </div>

                        <div className="text-xs sm:text-sm text-zinc-200 space-y-1">
                          <p>
                            <strong className="text-white">
                              {order.dishQty}× {order.dishName}
                            </strong>{' '}
                            (S/ {order.dishSubtotal.toFixed(2)})
                            {order.sauces.length > 0 && (
                              <span className="text-zinc-300">
                                {' '}
                                · Cremas:{' '}
                                {order.sauces
                                  .map((s) =>
                                    s.extraQty > 0
                                      ? `${s.qty}x ${s.name} (+${s.extraQty} extra)`
                                      : `${s.qty}x ${s.name}`
                                  )
                                  .join(', ')}
                              </span>
                            )}
                            {order.drinks.length > 0 && (
                              <span className="text-zinc-300">
                                {' '}
                                · Bebidas:{' '}
                                {order.drinks
                                  .map((d) => `${d.qty}x ${d.name}`)
                                  .join(', ')}
                              </span>
                            )}
                          </p>

                          {order.customerNote && (
                            <p className="text-xs text-amber-300">
                              Nota: “{order.customerNote}”
                            </p>
                          )}

                          {order.redeemedGiftCode && (
                            <p className="inline-flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-xs font-extrabold px-2.5 py-1 rounded-lg">
                              <Gift className="w-3.5 h-3.5" />
                              Reclama Regalo Sorpresa Cartilla 10/10 (Código:{' '}
                              {order.redeemedGiftCode})
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right Actions & Total */}
                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/10">
                        <div className="mr-2 tabular-nums">
                          <span className="block text-[10px] uppercase text-zinc-400 font-bold">
                            Total
                          </span>
                          <span className="text-lg font-black text-white">
                            S/ {order.totalPrice.toFixed(2)}
                          </span>
                        </div>

                        <select
                          aria-label="Método de pago"
                          value={order.paymentMethod}
                          onChange={(e) =>
                            void updateAdminOrder(order.id, {
                              paymentMethod: e.target.value as PaymentMethod,
                            })
                          }
                          className="bg-[#0F0F14] border border-white/15 rounded-xl px-2.5 py-2 text-xs font-bold text-zinc-200 focus:outline-none focus:border-[#FF6012]"
                        >
                          <option value="efectivo">Efectivo</option>
                          <option value="yape">Yape</option>
                          <option value="plin">Plin</option>
                        </select>

                        <select
                          aria-label="Estado del pedido"
                          value={order.status}
                          onChange={(e) =>
                            void updateAdminOrder(order.id, {
                              status: e.target.value as OrderStatus,
                            })
                          }
                          className="bg-[#0F0F14] border border-white/15 rounded-xl px-3 py-2 text-xs font-extrabold text-white focus:outline-none focus:border-[#FF6012]"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="preparando">Preparando</option>
                          <option value="listo">Listo recojo</option>
                          <option value="entregado">Entregado</option>
                          <option value="cancelado">Cancelado</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => void deleteAdminOrder(order.id)}
                          title="Eliminar registro"
                          className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/25 text-red-300 border border-red-400/20 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: CLIENTES Y CARTILLAS ================= */}
        {activeTab === 'customers' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-white">
                  Directorio de Clientes y Cartillas Google
                </h2>
                <p className="text-xs text-zinc-400">
                  Visualiza compras, sellos acumulados (10 = Regalo Sorpresa) y
                  valida canjes en tienda.
                </p>
              </div>

              <div className="relative sm:w-72">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Buscar cliente, correo o código..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#17171E] border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF6012]"
                />
              </div>
            </div>

            {filteredCustomers.length === 0 ? (
              <div className="bg-[#17171E] border border-white/10 rounded-2xl p-10 text-center space-y-2">
                <Users className="w-9 h-9 text-zinc-500 mx-auto" />
                <p className="text-sm font-bold text-zinc-300">
                  Aún no hay clientes registrados
                </p>
                <p className="text-xs text-zinc-500">
                  Cuando los clientes entren con Google o realicen un pedido,
                  aparecerán aquí automáticamente.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCustomers.map((c) => {
                  const isGoogleAccount = !c.uid.startsWith('guest:');
                  return (
                    <div
                      key={c.uid}
                      className="bg-[#17171E] border border-white/10 rounded-2xl p-4 space-y-3 flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {c.photoURL ? (
                            <img
                              src={c.photoURL}
                              alt=""
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-full object-cover border border-white/20 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#FF6012]/20 border border-[#FF6012]/40 text-[#FF6012] font-black flex items-center justify-center uppercase shrink-0">
                              {(c.displayName || 'C')[0]}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-extrabold text-sm text-white truncate">
                                {c.displayName}
                              </p>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  isGoogleAccount
                                    ? 'bg-sky-500/15 text-sky-300 border border-sky-400/30'
                                    : 'bg-white/5 text-zinc-400'
                                }`}
                              >
                                {isGoogleAccount ? 'Google' : 'Web / Salón'}
                              </span>
                            </div>
                            {c.email && (
                              <p className="text-xs text-zinc-400 truncate">
                                {c.email}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right tabular-nums shrink-0">
                          <span className="block text-sm font-black text-emerald-300">
                            S/ {c.totalSpent.toFixed(2)}
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            {c.ordersCount}{' '}
                            {c.ordersCount === 1 ? 'pedido' : 'pedidos'}
                          </span>
                        </div>
                      </div>

                      <div className="bg-black/30 rounded-xl p-3 border border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs tabular-nums">
                        <div>
                          <span className="text-zinc-400">Cartilla: </span>
                          <strong className="text-[#FF6012]">
                            {c.stamps}/10 sellos
                          </strong>
                          <span className="text-zinc-500">
                            {' '}
                            ({c.totalBroasters} Broasters hist.)
                          </span>
                        </div>

                        {c.availableRewards > 0 ? (
                          <span className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-extrabold px-2 py-0.5 rounded-md">
                            🎁 {c.availableRewards} disponible (
                            {c.activeRewardCode})
                          </span>
                        ) : (
                          <span className="text-zinc-500">
                            Canjeados: {c.redeemedRewards}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={async () => {
                              await adjustAdminCustomer(c.uid, {
                                deltaBroasters: -1,
                              });
                              showToast(`-1 sello a ${c.displayName}`);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-xs font-bold text-zinc-300 flex items-center gap-1 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" /> Sello
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await adjustAdminCustomer(c.uid, {
                                deltaBroasters: 1,
                              });
                              showToast(`+1 sello sumado a ${c.displayName}`);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-[#FF6012]/20 hover:bg-[#FF6012]/35 border border-[#FF6012]/40 text-xs font-bold text-[#FF9B6A] flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Sello
                          </button>
                        </div>

                        {c.availableRewards > 0 && (
                          <button
                            type="button"
                            onClick={async () => {
                              await adjustAdminCustomer(c.uid, {
                                redeemGift: true,
                              });
                              showToast(
                                `Regalo sorpresa de ${c.displayName} marcado como canjeado.`
                              );
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <Gift className="w-3.5 h-3.5" />
                            <span>Validar Canje</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: PLATOS Y PRECIOS ================= */}
        {activeTab === 'dishes' && (
          <div className="space-y-6">
            {/* Add New Dish Form */}
            <form
              onSubmit={(e) => void handleAddDish(e)}
              className="bg-[#17171E] border border-white/10 rounded-2xl p-5 space-y-4"
            >
              <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#FF6012]" />
                <span>Añadir nuevo plato a la Carta</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <input
                  type="text"
                  required
                  value={newDishName}
                  onChange={(e) => setNewDishName(e.target.value)}
                  placeholder="Nombre ej. Mostrito"
                  className="px-3.5 py-2 rounded-xl bg-[#0F0F14] border border-white/15 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF6012]"
                />
                <input
                  type="text"
                  value={newDishSubtitle}
                  onChange={(e) => setNewDishSubtitle(e.target.value)}
                  placeholder="Descripción ej. Chaufa + Papas"
                  className="px-3.5 py-2 rounded-xl bg-[#0F0F14] border border-white/15 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF6012]"
                />
                <input
                  type="number"
                  step="0.50"
                  min="1"
                  required
                  value={newDishPrice}
                  onChange={(e) => setNewDishPrice(e.target.value)}
                  placeholder="Precio S/ 12.00"
                  className="px-3.5 py-2 rounded-xl bg-[#0F0F14] border border-white/15 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF6012]"
                />
                <select
                  value={newDishImage}
                  onChange={(e) => setNewDishImage(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#0F0F14] border border-white/15 text-xs sm:text-sm text-white focus:outline-none focus:border-[#FF6012]"
                >
                  {DISH_IMAGE_PRESETS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newDishPromo}
                  onChange={(e) => setNewDishPromo(e.target.value)}
                  placeholder="Etiqueta ej. -10% (opc.)"
                  className="px-3.5 py-2 rounded-xl bg-[#0F0F14] border border-white/15 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FF6012]"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newDishOnline}
                    onChange={(e) => setNewDishOnline(e.target.checked)}
                    className="accent-[#FF6012] w-4 h-4 rounded"
                  />
                  <span>
                    Habilitar para pedido online con cremas y hora de recojo
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isSavingCatalog}
                  className="px-4 py-2 rounded-xl bg-[#FF6012] hover:bg-[#e55209] text-white font-extrabold text-xs uppercase cursor-pointer"
                >
                  + Añadir Plato
                </button>
              </div>
            </form>

            {/* Editable Dishes List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm sm:text-base font-extrabold text-white">
                  Platos actuales en Carta ({draftCatalog.dishes.length})
                </h2>
                <button
                  type="button"
                  disabled={isSavingCatalog}
                  onClick={() =>
                    void handlePersistCatalog(
                      draftCatalog,
                      'Precios y platos actualizados.'
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-xs uppercase cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar cambios</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {draftCatalog.dishes.map((dish, idx) => (
                  <div
                    key={dish.id}
                    className={`bg-[#17171E] border rounded-2xl p-4 space-y-3 ${
                      dish.active ? 'border-white/10' : 'border-white/5 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={dish.image}
                        alt={dish.name}
                        className="w-16 h-16 object-contain shrink-0 bg-black/30 rounded-xl p-1"
                      />
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-zinc-400">
                            Nombre
                          </label>
                          <input
                            type="text"
                            value={dish.name}
                            onChange={(e) => {
                              const copy = [...draftCatalog.dishes];
                              copy[idx] = { ...dish, name: e.target.value };
                              setDraftCatalog({ ...draftCatalog, dishes: copy });
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#0F0F14] border border-white/15 text-xs font-bold text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-zinc-400">
                            Precio (S/)
                          </label>
                          <input
                            type="number"
                            step="0.50"
                            min="0.5"
                            value={dish.price}
                            onChange={(e) => {
                              const copy = [...draftCatalog.dishes];
                              copy[idx] = {
                                ...dish,
                                price: Math.max(0, parseFloat(e.target.value) || 0),
                              };
                              setDraftCatalog({ ...draftCatalog, dishes: copy });
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#0F0F14] border border-white/15 text-xs font-black text-[#FF6012] tabular-nums"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-zinc-400">
                          Subtítulo
                        </label>
                        <input
                          type="text"
                          value={dish.subtitle}
                          onChange={(e) => {
                            const copy = [...draftCatalog.dishes];
                            copy[idx] = { ...dish, subtitle: e.target.value };
                            setDraftCatalog({ ...draftCatalog, dishes: copy });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#0F0F14] border border-white/15 text-xs text-zinc-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-zinc-400">
                          Etiqueta Promo
                        </label>
                        <input
                          type="text"
                          value={dish.promoTag || ''}
                          onChange={(e) => {
                            const copy = [...draftCatalog.dishes];
                            copy[idx] = { ...dish, promoTag: e.target.value };
                            setDraftCatalog({ ...draftCatalog, dishes: copy });
                          }}
                          placeholder="Ej. -8.33%"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#0F0F14] border border-white/15 text-xs text-zinc-200"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-xs">
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={dish.onlineOrderable}
                            onChange={(e) => {
                              const copy = [...draftCatalog.dishes];
                              copy[idx] = {
                                ...dish,
                                onlineOrderable: e.target.checked,
                              };
                              setDraftCatalog({ ...draftCatalog, dishes: copy });
                            }}
                            className="accent-[#FF6012]"
                          />
                          <span className="text-zinc-300 font-semibold">
                            Pedido Online
                          </span>
                        </label>

                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={dish.active}
                            onChange={(e) => {
                              const copy = [...draftCatalog.dishes];
                              copy[idx] = { ...dish, active: e.target.checked };
                              setDraftCatalog({ ...draftCatalog, dishes: copy });
                            }}
                            className="accent-emerald-500"
                          />
                          <span className="text-zinc-300 font-semibold">
                            Visible en Carta
                          </span>
                        </label>
                      </div>

                      {dish.id !== 'broaster' && (
                        <button
                          type="button"
                          onClick={() => void handleRemoveDish(dish.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 font-bold cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Quitar</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: CREMAS, BEBIDAS Y CONFIG ================= */}
        {activeTab === 'extras' && (
          <div className="space-y-7">
            {/* Global Store Pricing & Settings */}
            <div className="bg-[#17171E] border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-white">
                    Tarifas Globales y Configuración de Tienda
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Ajusta el cobro por crema extra, topes por plato, precios KR
                    día/noche y WhatsApp receptor.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isSavingCatalog}
                  onClick={() =>
                    void handlePersistCatalog(
                      draftCatalog,
                      'Configuración, cremas y bebidas guardadas.'
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-xs uppercase cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Todo</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">
                    Precio por Crema Extra (S/)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    value={draftCatalog.settings.extraCremaPrice}
                    onChange={(e) =>
                      setDraftCatalog({
                        ...draftCatalog,
                        settings: {
                          ...draftCatalog.settings,
                          extraCremaPrice: Math.max(
                            0,
                            parseFloat(e.target.value) || 0
                          ),
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#0F0F14] border border-white/15 text-white font-bold tabular-nums"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-300 mb-1">
                    Tope Extra por Sabor y por Plato
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={draftCatalog.settings.maxExtraPerSaucePerPlato}
                    onChange={(e) =>
                      setDraftCatalog({
                        ...draftCatalog,
                        settings: {
                          ...draftCatalog.settings,
                          maxExtraPerSaucePerPlato: Math.max(
                            1,
                            parseInt(e.target.value, 10) || 4
                          ),
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#0F0F14] border border-white/15 text-white font-bold tabular-nums"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-300 mb-1">
                    KR Precio Día (&lt; 6 PM) (S/)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    value={draftCatalog.settings.krDayPrice}
                    onChange={(e) =>
                      setDraftCatalog({
                        ...draftCatalog,
                        settings: {
                          ...draftCatalog.settings,
                          krDayPrice: Math.max(
                            0,
                            parseFloat(e.target.value) || 0
                          ),
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#0F0F14] border border-white/15 text-white font-bold tabular-nums"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-300 mb-1">
                    KR Precio Noche (&ge; 6 PM) (S/)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    value={draftCatalog.settings.krNightPrice}
                    onChange={(e) =>
                      setDraftCatalog({
                        ...draftCatalog,
                        settings: {
                          ...draftCatalog.settings,
                          krNightPrice: Math.max(
                            0,
                            parseFloat(e.target.value) || 0
                          ),
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#0F0F14] border border-white/15 text-white font-bold tabular-nums"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-300 mb-1">
                    Banner Superior de Descuento
                  </label>
                  <input
                    type="text"
                    value={draftCatalog.settings.discountBannerText}
                    onChange={(e) =>
                      setDraftCatalog({
                        ...draftCatalog,
                        settings: {
                          ...draftCatalog.settings,
                          discountBannerText: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#0F0F14] border border-white/15 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-300 mb-1">
                    WhatsApp Oficial de Tienda (ej. 51999888777)
                  </label>
                  <input
                    type="tel"
                    value={draftCatalog.settings.storeWhatsapp}
                    onChange={(e) =>
                      setDraftCatalog({
                        ...draftCatalog,
                        settings: {
                          ...draftCatalog.settings,
                          storeWhatsapp: e.target.value,
                        },
                      })
                    }
                    placeholder="Si se llena, el cliente envía directo a este número"
                    className="w-full px-3 py-2 rounded-xl bg-[#0F0F14] border border-white/15 text-white font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Sauces Management */}
            <div className="bg-[#17171E] border border-white/10 rounded-2xl p-5 space-y-4">
              <h2 className="text-sm sm:text-base font-extrabold text-white">
                Gestión de Cremas ({draftCatalog.sauces.length})
              </h2>

              <form
                onSubmit={(e) => void handleAddSauce(e)}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 items-end bg-black/25 p-3.5 rounded-xl border border-white/5"
              >
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    required
                    value={newSauceName}
                    onChange={(e) => setNewSauceName(e.target.value)}
                    placeholder="Ej. Crema Tártara"
                    className="w-full px-3 py-2 rounded-lg bg-[#0F0F14] border border-white/15 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                    Nombre corto
                  </label>
                  <input
                    type="text"
                    value={newSauceShort}
                    onChange={(e) => setNewSauceShort(e.target.value)}
                    placeholder="Ej. Tártara"
                    className="w-full px-3 py-2 rounded-lg bg-[#0F0F14] border border-white/15 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                    Estilo de botella
                  </label>
                  <select
                    value={newSauceImage}
                    onChange={(e) => setNewSauceImage(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-[#0F0F14] border border-white/15 text-xs text-white"
                  >
                    {SAUCE_IMAGE_PRESETS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                    Color botella
                  </label>
                  <input
                    type="color"
                    value={newSauceColor}
                    onChange={(e) => setNewSauceColor(e.target.value)}
                    className="w-full h-9 rounded-lg bg-[#0F0F14] border border-white/15 px-1 cursor-pointer"
                  />
                </div>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-lg bg-[#FF6012] hover:bg-[#e55209] text-white font-extrabold text-xs uppercase cursor-pointer h-9"
                >
                  + Añadir Crema
                </button>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {draftCatalog.sauces.map((sauce, idx) => (
                  <div
                    key={sauce.id}
                    className={`bg-black/30 border rounded-2xl p-3.5 flex flex-col justify-between gap-3 ${
                      sauce.active
                        ? 'border-white/10'
                        : 'border-white/5 opacity-55'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <SauceBottleVisual
                        sauce={sauce}
                        className="h-14 w-auto shrink-0"
                      />
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <input
                          type="text"
                          value={sauce.name}
                          onChange={(e) => {
                            const copy = [...draftCatalog.sauces];
                            copy[idx] = { ...sauce, name: e.target.value };
                            setDraftCatalog({ ...draftCatalog, sauces: copy });
                          }}
                          className="w-full px-2 py-1 rounded bg-[#0F0F14] border border-white/15 text-xs font-bold text-white"
                        />
                        <input
                          type="text"
                          value={sauce.shortName}
                          onChange={(e) => {
                            const copy = [...draftCatalog.sauces];
                            copy[idx] = { ...sauce, shortName: e.target.value };
                            setDraftCatalog({ ...draftCatalog, sauces: copy });
                          }}
                          className="w-full px-2 py-1 rounded bg-[#0F0F14] border border-white/15 text-[11px] text-zinc-300"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sauce.active}
                          onChange={(e) => {
                            const copy = [...draftCatalog.sauces];
                            copy[idx] = { ...sauce, active: e.target.checked };
                            setDraftCatalog({ ...draftCatalog, sauces: copy });
                          }}
                          className="accent-emerald-500"
                        />
                        <span className="text-zinc-300 font-semibold">
                          Disponible
                        </span>
                      </label>

                      <button
                        type="button"
                        onClick={() => void handleRemoveSauce(sauce.id)}
                        className="text-red-300 hover:text-red-200 p-1 cursor-pointer"
                        title="Eliminar crema"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Drinks Management */}
            <div className="bg-[#17171E] border border-white/10 rounded-2xl p-5 space-y-4">
              <h2 className="text-sm sm:text-base font-extrabold text-white">
                Gestión de Bebidas ({draftCatalog.drinks.length})
              </h2>

              <form
                onSubmit={(e) => void handleAddDrink(e)}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 items-end bg-black/25 p-3.5 rounded-xl border border-white/5"
              >
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                    Nombre bebida
                  </label>
                  <input
                    type="text"
                    required
                    value={newDrinkName}
                    onChange={(e) => setNewDrinkName(e.target.value)}
                    placeholder="Ej. Chicha Morada"
                    className="w-full px-3 py-2 rounded-lg bg-[#0F0F14] border border-white/15 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                    Nombre corto
                  </label>
                  <input
                    type="text"
                    value={newDrinkShort}
                    onChange={(e) => setNewDrinkShort(e.target.value)}
                    placeholder="Ej. Chicha"
                    className="w-full px-3 py-2 rounded-lg bg-[#0F0F14] border border-white/15 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                    Botella
                  </label>
                  <select
                    value={newDrinkImage}
                    onChange={(e) => setNewDrinkImage(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-[#0F0F14] border border-white/15 text-xs text-white"
                  >
                    {DRINK_IMAGE_PRESETS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                    Tipo de precio
                  </label>
                  <select
                    value={newDrinkUseKr ? 'kr' : 'fixed'}
                    onChange={(e) => setNewDrinkUseKr(e.target.value === 'kr')}
                    className="w-full px-2.5 py-2 rounded-lg bg-[#0F0F14] border border-white/15 text-xs text-white"
                  >
                    <option value="kr">Tarifa KR Día/Noche</option>
                    <option value="fixed">Precio fijo propio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                    {newDrinkUseKr ? 'Color botella' : 'Precio fijo (S/)'}
                  </label>
                  {newDrinkUseKr ? (
                    <input
                      type="color"
                      value={newDrinkColor}
                      onChange={(e) => setNewDrinkColor(e.target.value)}
                      className="w-full h-9 rounded-lg bg-[#0F0F14] border border-white/15 px-1 cursor-pointer"
                    />
                  ) : (
                    <input
                      type="number"
                      step="0.50"
                      min="0.5"
                      value={newDrinkFixedPrice}
                      onChange={(e) => setNewDrinkFixedPrice(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#0F0F14] border border-white/15 text-xs text-white"
                    />
                  )}
                </div>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-lg bg-[#FF6012] hover:bg-[#e55209] text-white font-extrabold text-xs uppercase cursor-pointer h-9"
                >
                  + Añadir Bebida
                </button>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {draftCatalog.drinks.map((drink, idx) => (
                  <div
                    key={drink.id}
                    className={`bg-black/30 border rounded-2xl p-3.5 flex flex-col justify-between gap-3 ${
                      drink.active
                        ? 'border-white/10'
                        : 'border-white/5 opacity-55'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <DrinkBottleVisual
                        drink={drink}
                        className="h-14 w-auto shrink-0"
                      />
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <input
                          type="text"
                          value={drink.name}
                          onChange={(e) => {
                            const copy = [...draftCatalog.drinks];
                            copy[idx] = { ...drink, name: e.target.value };
                            setDraftCatalog({ ...draftCatalog, drinks: copy });
                          }}
                          className="w-full px-2 py-1 rounded bg-[#0F0F14] border border-white/15 text-xs font-bold text-white"
                        />
                        <div className="flex items-center gap-2">
                          <label className="inline-flex items-center gap-1 text-[11px] text-zinc-300">
                            <input
                              type="checkbox"
                              checked={drink.useKrTariff}
                              onChange={(e) => {
                                const copy = [...draftCatalog.drinks];
                                copy[idx] = {
                                  ...drink,
                                  useKrTariff: e.target.checked,
                                };
                                setDraftCatalog({
                                  ...draftCatalog,
                                  drinks: copy,
                                });
                              }}
                              className="accent-[#FF6012]"
                            />
                            <span>Tarifa KR</span>
                          </label>
                          {!drink.useKrTariff && (
                            <input
                              type="number"
                              step="0.50"
                              min="0.5"
                              value={drink.fixedPrice}
                              onChange={(e) => {
                                const copy = [...draftCatalog.drinks];
                                copy[idx] = {
                                  ...drink,
                                  fixedPrice: Math.max(
                                    0,
                                    parseFloat(e.target.value) || 0
                                  ),
                                };
                                setDraftCatalog({
                                  ...draftCatalog,
                                  drinks: copy,
                                });
                              }}
                              className="w-20 px-2 py-0.5 rounded bg-[#0F0F14] border border-white/15 text-xs font-bold text-[#FF6012]"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={drink.active}
                          onChange={(e) => {
                            const copy = [...draftCatalog.drinks];
                            copy[idx] = { ...drink, active: e.target.checked };
                            setDraftCatalog({ ...draftCatalog, drinks: copy });
                          }}
                          className="accent-emerald-500"
                        />
                        <span className="text-zinc-300 font-semibold">
                          Disponible
                        </span>
                      </label>

                      <button
                        type="button"
                        onClick={() => void handleRemoveDrink(drink.id)}
                        className="text-red-300 hover:text-red-200 p-1 cursor-pointer"
                        title="Eliminar bebida"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Registrar Venta Rápida en Salón */}
      {isCounterModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4"
        >
          <form
            onSubmit={(e) => void handleCreateCounterSale(e)}
            className="bg-[#181820] border border-white/15 rounded-3xl max-w-md w-full p-6 space-y-4 text-white shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black uppercase text-[#FF6012]">
                Registrar Venta en Salón
              </h3>
              <button
                type="button"
                onClick={() => setIsCounterModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-300 mb-1">
                  Plato vendido
                </label>
                <select
                  value={counterDishId}
                  onChange={(e) => setCounterDishId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0F0F14] border border-white/15 text-sm text-white"
                >
                  {catalog.dishes.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — S/ {d.price.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">
                    Cant. Platos
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={counterQty}
                    onChange={(e) =>
                      setCounterQty(Math.max(1, parseInt(e.target.value, 10) || 1))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#0F0F14] border border-white/15 text-sm font-bold text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">
                    Cremas extra
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={counterExtras}
                    onChange={(e) =>
                      setCounterExtras(
                        Math.max(0, parseInt(e.target.value, 10) || 0)
                      )
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#0F0F14] border border-white/15 text-sm font-bold text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">
                    Bebidas KR
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={counterDrinks}
                    onChange={(e) =>
                      setCounterDrinks(
                        Math.max(0, parseInt(e.target.value, 10) || 0)
                      )
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#0F0F14] border border-white/15 text-sm font-bold text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">
                    Cliente / Mesa
                  </label>
                  <input
                    type="text"
                    value={counterCustomer}
                    onChange={(e) => setCounterCustomer(e.target.value)}
                    placeholder="Ej. Mesa 3"
                    className="w-full px-3 py-2 rounded-xl bg-[#0F0F14] border border-white/15 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">
                    Método de pago
                  </label>
                  <select
                    value={counterPayment}
                    onChange={(e) =>
                      setCounterPayment(e.target.value as PaymentMethod)
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#0F0F14] border border-white/15 text-sm text-white"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="yape">Yape</option>
                    <option value="plin">Plin</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-sm uppercase cursor-pointer"
            >
              Guardar Venta
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
