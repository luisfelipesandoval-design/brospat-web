export enum ScreenName {
  CARTA = 'carta',
  PERSONALIZAR = 'personalizar',
  ADMIN = 'admin',
}

export const BROASTER_BASE_PRICE = 12.0;
export const EXTRA_CREMA_PRICE = 1.0;
export const MAX_EXTRA_PER_SAUCE_PER_BROASTER = 4;
export const KR_DAY_PRICE = 1.0;
export const KR_NIGHT_PRICE = 1.5;

/**
 * Night rate applies from 6:00 PM (18:00) through 5:59 AM (05:59).
 * Day rate applies from 6:00 AM (06:00) through 5:59 PM (17:59).
 */
export function isNightHour(hours24: number): boolean {
  return hours24 >= 18 || hours24 < 6;
}

export interface DishItem {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  image: string;
  promoTag?: string;
  onlineOrderable: boolean;
  active: boolean;
  earnsLoyaltyStamp: boolean;
}

export interface SauceItem {
  id: string;
  name: string;
  shortName: string;
  image: string;
  clipTop?: boolean;
  colorHex?: string;
  active: boolean;
}

export interface DrinkItem {
  id: string;
  name: string;
  shortName: string;
  image: string;
  colorHex?: string;
  useKrTariff: boolean;
  fixedPrice: number;
  active: boolean;
}

export interface StoreSettings {
  extraCremaPrice: number;
  maxExtraPerSaucePerPlato: number;
  krDayPrice: number;
  krNightPrice: number;
  openHour24: number;
  prepMinutesLabel: string;
  discountBannerText: string;
  storeWhatsapp: string;
}

export interface CatalogData {
  dishes: DishItem[];
  sauces: SauceItem[];
  drinks: DrinkItem[];
  settings: StoreSettings;
}

export type OrderStatus =
  | 'pendiente'
  | 'preparando'
  | 'listo'
  | 'entregado'
  | 'cancelado';

export type PaymentMethod = 'efectivo' | 'yape' | 'plin';

export interface OrderSauceLine {
  id: string;
  name: string;
  qty: number;
  freeQty: number;
  extraQty: number;
  cost: number;
}

export interface OrderDrinkLine {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
  cost: number;
}

export interface OrderRecord {
  id: string;
  orderCode: string;
  createdAt: string;
  pickupTimeLabel: string;
  pickupHour24: number;
  pickupMinutes: number;
  customerName: string;
  customerNote: string;
  customerUid: string | null;
  dishId: string;
  dishName: string;
  dishUnitPrice: number;
  dishQty: number;
  dishSubtotal: number;
  sauces: OrderSauceLine[];
  sauceExtraCount: number;
  sauceSubtotal: number;
  drinks: OrderDrinkLine[];
  drinkCount: number;
  drinkSubtotal: number;
  isNightRate: boolean;
  totalPrice: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  redeemedGiftCode: string | null;
  source: 'web' | 'local';
}

export interface CustomerRecord {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  stamps: number;
  totalBroasters: number;
  availableRewards: number;
  redeemedRewards: number;
  activeRewardCode: string;
  ordersCount: number;
  totalSpent: number;
  lastSeenAt: string;
}

export const DEFAULT_STORE_WHATSAPP = '+51 985636812';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  extraCremaPrice: EXTRA_CREMA_PRICE,
  maxExtraPerSaucePerPlato: MAX_EXTRA_PER_SAUCE_PER_BROASTER,
  krDayPrice: KR_DAY_PRICE,
  krNightPrice: KR_NIGHT_PRICE,
  openHour24: 17,
  prepMinutesLabel: '15 MINS',
  discountBannerText: '8.33 % DE DESCUENTO',
  storeWhatsapp: DEFAULT_STORE_WHATSAPP,
};

export const DEFAULT_DISHES: DishItem[] = [
  {
    id: 'broaster',
    name: 'Broaster',
    subtitle: 'Papas + Chaufa + Cremas',
    price: BROASTER_BASE_PRICE,
    image: '/assets/brospat/broaster.png',
    promoTag: '-8.33%',
    onlineOrderable: true,
    active: true,
    earnsLoyaltyStamp: true,
  },
  {
    id: 'caldo-gallina',
    name: 'Caldo de gallina',
    subtitle: 'Presa + Huevo + Fideos',
    price: 11.0,
    image: '/assets/brospat/caldo.png',
    promoTag: '',
    onlineOrderable: false,
    active: true,
    earnsLoyaltyStamp: false,
  },
  {
    id: 'salchipapa',
    name: 'Salchipapa',
    subtitle: 'Papas crocantes + Hot dog',
    price: 8.0,
    image: '/assets/brospat/salchipapa.png',
    promoTag: '',
    onlineOrderable: false,
    active: true,
    earnsLoyaltyStamp: false,
  },
  {
    id: 'salchicono',
    name: 'Salchicono',
    subtitle: 'Cono al paso + Cremas',
    price: 9.0,
    image: '/assets/brospat/salchicono.png',
    promoTag: '',
    onlineOrderable: false,
    active: true,
    earnsLoyaltyStamp: false,
  },
];

export const SAUCES: SauceItem[] = [
  {
    id: 'rocoto',
    name: 'Ají de Rocoto',
    shortName: 'Ají Rocoto',
    image: '/assets/brospat/crema_verde.png',
    colorHex: '#4ADE80',
    active: true,
  },
  {
    id: 'ketchup',
    name: 'Ketchup',
    shortName: 'Ketchup',
    image: '/assets/brospat/crema_roja.png',
    clipTop: true,
    colorHex: '#EF4444',
    active: true,
  },
  {
    id: 'mayonesa',
    name: 'Mayonesa',
    shortName: 'Mayonesa',
    image: '/assets/brospat/crema_blanca.png',
    colorHex: '#F5E6CA',
    active: true,
  },
  {
    id: 'mostaza',
    name: 'Mostaza / Ají',
    shortName: 'Mostaza',
    image: '/assets/brospat/crema_amarilla.png',
    colorHex: '#FACC15',
    active: true,
  },
];

export const DRINKS: DrinkItem[] = [
  {
    id: 'kr-negra',
    name: 'KR Kola Negra',
    shortName: 'KR Negra',
    image: '/assets/brospat/kr_negra.png',
    colorHex: '#DC2626',
    useKrTariff: true,
    fixedPrice: KR_DAY_PRICE,
    active: true,
  },
  {
    id: 'kr-oro',
    name: 'KR Amarilla',
    shortName: 'KR Amarilla',
    image: '/assets/brospat/kr_oro.png',
    colorHex: '#FACC15',
    useKrTariff: true,
    fixedPrice: KR_DAY_PRICE,
    active: true,
  },
];

export const DEFAULT_CATALOG: CatalogData = {
  dishes: DEFAULT_DISHES,
  sauces: SAUCES,
  drinks: DRINKS,
  settings: DEFAULT_STORE_SETTINGS,
};
