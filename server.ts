import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';

interface DishRecord {
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

interface SauceRecord {
  id: string;
  name: string;
  shortName: string;
  image: string;
  clipTop?: boolean;
  colorHex?: string;
  active: boolean;
}

interface DrinkRecord {
  id: string;
  name: string;
  shortName: string;
  image: string;
  colorHex?: string;
  useKrTariff: boolean;
  fixedPrice: number;
  active: boolean;
}

interface StoreSettingsRecord {
  extraCremaPrice: number;
  maxExtraPerSaucePerPlato: number;
  krDayPrice: number;
  krNightPrice: number;
  openHour24: number;
  prepMinutesLabel: string;
  discountBannerText: string;
  storeWhatsapp: string;
}

interface CatalogRecord {
  dishes: DishRecord[];
  sauces: SauceRecord[];
  drinks: DrinkRecord[];
  settings: StoreSettingsRecord;
}

interface OrderSauceLineRecord {
  id: string;
  name: string;
  qty: number;
  freeQty: number;
  extraQty: number;
  cost: number;
}

interface OrderDrinkLineRecord {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
  cost: number;
}

interface StoredOrder {
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
  sauces: OrderSauceLineRecord[];
  sauceExtraCount: number;
  sauceSubtotal: number;
  drinks: OrderDrinkLineRecord[];
  drinkCount: number;
  drinkSubtotal: number;
  isNightRate: boolean;
  totalPrice: number;
  status: 'pendiente' | 'preparando' | 'listo' | 'entregado' | 'cancelado';
  paymentMethod: 'efectivo' | 'yape' | 'plin';
  redeemedGiftCode: string | null;
  source: 'web' | 'local';
}

interface StoredCustomer {
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

interface DatabaseSchema {
  nextOrderSeq: number;
  catalog: CatalogRecord;
  orders: StoredOrder[];
  customers: Record<string, StoredCustomer>;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'brospat-db.json');

const INITIAL_CATALOG: CatalogRecord = {
  dishes: [
    {
      id: 'broaster',
      name: 'Broaster',
      subtitle: 'Papas + Chaufa + Cremas',
      price: 12.0,
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
  ],
  sauces: [
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
  ],
  drinks: [
    {
      id: 'kr-negra',
      name: 'KR Kola Negra',
      shortName: 'KR Negra',
      image: '/assets/brospat/kr_negra.png',
      colorHex: '#DC2626',
      useKrTariff: true,
      fixedPrice: 1.0,
      active: true,
    },
    {
      id: 'kr-oro',
      name: 'KR Amarilla',
      shortName: 'KR Amarilla',
      image: '/assets/brospat/kr_oro.png',
      colorHex: '#FACC15',
      useKrTariff: true,
      fixedPrice: 1.0,
      active: true,
    },
  ],
  settings: {
    extraCremaPrice: 1.0,
    maxExtraPerSaucePerPlato: 4,
    krDayPrice: 1.0,
    krNightPrice: 1.5,
    openHour24: 17,
    prepMinutesLabel: '15 MINS',
    discountBannerText: '8.33 % DE DESCUENTO',
    storeWhatsapp: '+51 985636812',
  },
};

function loadDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
      const loadedCatalog = parsed.catalog || structuredClone(INITIAL_CATALOG);
      let needsSave = false;
      if (!loadedCatalog.settings?.storeWhatsapp?.trim()) {
        loadedCatalog.settings = {
          ...INITIAL_CATALOG.settings,
          ...(loadedCatalog.settings || {}),
          storeWhatsapp: '+51 985636812',
        };
        needsSave = true;
      }
      const loadedState: DatabaseSchema = {
        nextOrderSeq: parsed.nextOrderSeq || 1001,
        catalog: loadedCatalog,
        orders: Array.isArray(parsed.orders) ? parsed.orders : [],
        customers: parsed.customers || {},
      };
      if (needsSave) {
        saveDb(loadedState);
      }
      return loadedState;
    }
  } catch (err) {
    console.error('Error loading brospat-db.json, initializing fresh DB:', err);
  }
  const initial: DatabaseSchema = {
    nextOrderSeq: 1001,
    catalog: structuredClone(INITIAL_CATALOG),
    orders: [],
    customers: {},
  };
  saveDb(initial);
  return initial;
}

function saveDb(dbState: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving brospat-db.json:', err);
  }
}

function generateGiftCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = 'BRS-';
  for (let i = 0; i < 5; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function recomputeCustomerSpend(dbState: DatabaseSchema): void {
  const spendMap: Record<string, { count: number; spent: number }> = {};
  for (const order of dbState.orders) {
    if (order.status === 'cancelado') continue;
    const key =
      order.customerUid ||
      `guest:${(order.customerName || 'Cliente').trim().toLowerCase()}`;
    if (!spendMap[key]) {
      spendMap[key] = { count: 0, spent: 0 };
    }
    spendMap[key].count += 1;
    spendMap[key].spent += Number(order.totalPrice) || 0;

    if (!dbState.customers[key]) {
      dbState.customers[key] = {
        uid: key,
        displayName: (order.customerName || 'Cliente en tienda').trim(),
        email: '',
        photoURL: '',
        stamps: 0,
        totalBroasters: 0,
        availableRewards: 0,
        redeemedRewards: 0,
        activeRewardCode: 'NONE',
        ordersCount: 0,
        totalSpent: 0,
        lastSeenAt: order.createdAt,
      };
    }
  }

  for (const [uid, cust] of Object.entries(dbState.customers)) {
    const agg = spendMap[uid];
    cust.ordersCount = agg ? agg.count : 0;
    cust.totalSpent = agg ? Math.round(agg.spent * 100) / 100 : 0;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const dbState = loadDb();

  const adminSessions = new Set<string>();
  const ADMIN_USER = process.env.ADMIN_USER || 'admin';
  const ADMIN_PASS = process.env.ADMIN_PASS || 'admin';

  app.use(express.json({ limit: '1mb' }));

  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : '';
    if (!token || !adminSessions.has(token)) {
      res.status(401).json({ error: 'Sesión de administrador no válida.' });
      return;
    }
    next();
  };

  // --- Admin Auth ---
  app.post('/api/admin/login', (req: Request, res: Response) => {
    const { username, password } = req.body || {};
    if (
      String(username || '').trim() === ADMIN_USER &&
      String(password || '') === ADMIN_PASS
    ) {
      const token = crypto.randomBytes(32).toString('hex');
      adminSessions.add(token);
      res.json({ token, username: ADMIN_USER });
      return;
    }
    res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
  });

  app.post('/api/admin/logout', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : '';
    if (token) {
      adminSessions.delete(token);
    }
    res.json({ ok: true });
  });

  app.get('/api/admin/verify', requireAdmin, (_req: Request, res: Response) => {
    res.json({ ok: true, username: ADMIN_USER });
  });

  // --- Public Store Catalog ---
  app.get('/api/catalog', (_req: Request, res: Response) => {
    res.json(dbState.catalog);
  });

  // --- Sync Google Customer Loyalty Profile ---
  app.post('/api/customers/sync', (req: Request, res: Response) => {
    const body = req.body || {};
    const uid = String(body.uid || '').trim();
    if (!uid || uid.length > 128) {
      res.status(400).json({ error: 'UID inválido.' });
      return;
    }

    const existing = dbState.customers[uid];
    dbState.customers[uid] = {
      uid,
      displayName: String(
        body.displayName || existing?.displayName || 'Cliente Google'
      ).slice(0, 80),
      email: String(body.email || existing?.email || '').slice(0, 120),
      photoURL: String(body.photoURL || existing?.photoURL || '').slice(0, 500),
      stamps: Math.max(0, Math.min(9, Number(body.stamps ?? existing?.stamps ?? 0))),
      totalBroasters: Math.max(
        0,
        Number(body.totalBroasters ?? existing?.totalBroasters ?? 0)
      ),
      availableRewards: Math.max(
        0,
        Number(body.availableRewards ?? existing?.availableRewards ?? 0)
      ),
      redeemedRewards: Math.max(
        0,
        Number(body.redeemedRewards ?? existing?.redeemedRewards ?? 0)
      ),
      activeRewardCode: String(
        body.activeRewardCode || existing?.activeRewardCode || 'NONE'
      ).slice(0, 16),
      ordersCount: existing?.ordersCount ?? 0,
      totalSpent: existing?.totalSpent ?? 0,
      lastSeenAt: new Date().toISOString(),
    };

    recomputeCustomerSpend(dbState);
    saveDb(dbState);
    res.json({ ok: true, customer: dbState.customers[uid] });
  });

  // --- Create Customer Order ---
  app.post('/api/orders', (req: Request, res: Response) => {
    const b = req.body || {};
    const seq = dbState.nextOrderSeq++;
    const orderCode = `BRS-${seq}`;
    const nowIso = new Date().toISOString();

    const dishQty = Math.max(1, Math.min(50, Math.floor(Number(b.dishQty) || 1)));
    const dishUnitPrice = Math.max(0, Number(b.dishUnitPrice) || 12);
    const dishSubtotal = Math.round(dishQty * dishUnitPrice * 100) / 100;

    const sauces: OrderSauceLineRecord[] = Array.isArray(b.sauces)
      ? b.sauces.slice(0, 20).map((s: Record<string, unknown>) => ({
          id: String(s.id || ''),
          name: String(s.name || ''),
          qty: Math.max(0, Number(s.qty) || 0),
          freeQty: Math.max(0, Number(s.freeQty) || 0),
          extraQty: Math.max(0, Number(s.extraQty) || 0),
          cost: Math.max(0, Number(s.cost) || 0),
        }))
      : [];

    const drinks: OrderDrinkLineRecord[] = Array.isArray(b.drinks)
      ? b.drinks.slice(0, 20).map((d: Record<string, unknown>) => ({
          id: String(d.id || ''),
          name: String(d.name || ''),
          qty: Math.max(0, Number(d.qty) || 0),
          unitPrice: Math.max(0, Number(d.unitPrice) || 0),
          cost: Math.max(0, Number(d.cost) || 0),
        }))
      : [];

    const sauceSubtotal =
      Math.round(sauces.reduce((acc, s) => acc + s.cost, 0) * 100) / 100;
    const sauceExtraCount = sauces.reduce((acc, s) => acc + s.extraQty, 0);
    const drinkSubtotal =
      Math.round(drinks.reduce((acc, d) => acc + d.cost, 0) * 100) / 100;
    const drinkCount = drinks.reduce((acc, d) => acc + d.qty, 0);
    const totalPrice =
      Math.round((dishSubtotal + sauceSubtotal + drinkSubtotal) * 100) / 100;

    const customerName =
      String(b.customerName || '').trim().slice(0, 80) || 'Cliente Web';
    const customerUid = b.customerUid ? String(b.customerUid).slice(0, 128) : null;

    const newOrder: StoredOrder = {
      id: crypto.randomUUID(),
      orderCode,
      createdAt: nowIso,
      pickupTimeLabel: String(b.pickupTimeLabel || '8:15 PM').slice(0, 20),
      pickupHour24: Math.max(0, Math.min(23, Number(b.pickupHour24) || 20)),
      pickupMinutes: Math.max(0, Math.min(59, Number(b.pickupMinutes) || 15)),
      customerName,
      customerNote: String(b.customerNote || '').trim().slice(0, 200),
      customerUid,
      dishId: String(b.dishId || 'broaster').slice(0, 60),
      dishName: String(b.dishName || 'Broaster').slice(0, 80),
      dishUnitPrice,
      dishQty,
      dishSubtotal,
      sauces,
      sauceExtraCount,
      sauceSubtotal,
      drinks,
      drinkCount,
      drinkSubtotal,
      isNightRate: Boolean(b.isNightRate),
      totalPrice,
      status: 'pendiente',
      paymentMethod:
        b.paymentMethod === 'yape' || b.paymentMethod === 'plin'
          ? b.paymentMethod
          : 'efectivo',
      redeemedGiftCode: b.redeemedGiftCode
        ? String(b.redeemedGiftCode).slice(0, 16)
        : null,
      source: 'web',
    };

    dbState.orders.unshift(newOrder);
    recomputeCustomerSpend(dbState);
    saveDb(dbState);

    res.status(201).json({ order: newOrder });
  });

  // --- Protected Admin Endpoints ---
  app.get('/api/admin/dashboard', requireAdmin, (_req: Request, res: Response) => {
    recomputeCustomerSpend(dbState);
    const customersList = Object.values(dbState.customers).sort(
      (a, b) =>
        new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()
    );
    res.json({
      catalog: dbState.catalog,
      orders: dbState.orders,
      customers: customersList,
    });
  });

  app.put('/api/admin/catalog', requireAdmin, (req: Request, res: Response) => {
    const incoming = req.body as Partial<CatalogRecord>;
    if (incoming.dishes && Array.isArray(incoming.dishes)) {
      dbState.catalog.dishes = incoming.dishes;
    }
    if (incoming.sauces && Array.isArray(incoming.sauces)) {
      dbState.catalog.sauces = incoming.sauces;
    }
    if (incoming.drinks && Array.isArray(incoming.drinks)) {
      dbState.catalog.drinks = incoming.drinks;
    }
    if (incoming.settings && typeof incoming.settings === 'object') {
      dbState.catalog.settings = {
        ...dbState.catalog.settings,
        ...incoming.settings,
      };
    }
    saveDb(dbState);
    res.json({ ok: true, catalog: dbState.catalog });
  });

  app.post('/api/admin/orders', requireAdmin, (req: Request, res: Response) => {
    const b = req.body || {};
    const seq = dbState.nextOrderSeq++;
    const orderCode = `BRS-${seq}`;
    const now = new Date();
    const hour24 = now.getHours();
    const mins = now.getMinutes();
    const displayH = hour24 % 12 === 0 ? 12 : hour24 % 12;
    const label = `${displayH}:${String(mins).padStart(2, '0')} ${
      hour24 >= 12 ? 'PM' : 'AM'
    }`;

    const dish =
      dbState.catalog.dishes.find((d) => d.id === b.dishId) ||
      dbState.catalog.dishes[0];
    const dishQty = Math.max(1, Math.min(50, Math.floor(Number(b.dishQty) || 1)));
    const dishUnitPrice = dish ? dish.price : 12;
    const dishSubtotal = Math.round(dishQty * dishUnitPrice * 100) / 100;
    const extraSauces = Math.max(0, Math.floor(Number(b.sauceExtraCount) || 0));
    const sauceSubtotal =
      Math.round(
        extraSauces * dbState.catalog.settings.extraCremaPrice * 100
      ) / 100;
    const drinkQty = Math.max(0, Math.floor(Number(b.drinkCount) || 0));
    const isNight = hour24 >= 18 || hour24 < 6;
    const krPrice = isNight
      ? dbState.catalog.settings.krNightPrice
      : dbState.catalog.settings.krDayPrice;
    const drinkSubtotal = Math.round(drinkQty * krPrice * 100) / 100;
    const totalPrice =
      Math.round((dishSubtotal + sauceSubtotal + drinkSubtotal) * 100) / 100;

    const newOrder: StoredOrder = {
      id: crypto.randomUUID(),
      orderCode,
      createdAt: now.toISOString(),
      pickupTimeLabel: label,
      pickupHour24: hour24,
      pickupMinutes: mins,
      customerName:
        String(b.customerName || '').trim().slice(0, 80) || 'Venta en Salón',
      customerNote: String(b.customerNote || '').trim().slice(0, 200),
      customerUid: null,
      dishId: dish?.id || 'broaster',
      dishName: dish?.name || 'Broaster',
      dishUnitPrice,
      dishQty,
      dishSubtotal,
      sauces:
        extraSauces > 0
          ? [
              {
                id: 'extra-salon',
                name: 'Cremas extra',
                qty: extraSauces,
                freeQty: 0,
                extraQty: extraSauces,
                cost: sauceSubtotal,
              },
            ]
          : [],
      sauceExtraCount: extraSauces,
      sauceSubtotal,
      drinks:
        drinkQty > 0
          ? [
              {
                id: 'kr-salon',
                name: 'Bebida KR',
                qty: drinkQty,
                unitPrice: krPrice,
                cost: drinkSubtotal,
              },
            ]
          : [],
      drinkCount: drinkQty,
      drinkSubtotal,
      isNightRate: isNight,
      totalPrice,
      status: b.status || 'entregado',
      paymentMethod:
        b.paymentMethod === 'yape' || b.paymentMethod === 'plin'
          ? b.paymentMethod
          : 'efectivo',
      redeemedGiftCode: null,
      source: 'local',
    };

    dbState.orders.unshift(newOrder);
    recomputeCustomerSpend(dbState);
    saveDb(dbState);
    res.status(201).json({ order: newOrder });
  });

  app.patch(
    '/api/admin/orders/:id',
    requireAdmin,
    (req: Request, res: Response) => {
      const target = dbState.orders.find((o) => o.id === req.params.id);
      if (!target) {
        res.status(404).json({ error: 'Pedido no encontrado.' });
        return;
      }
      const { status, paymentMethod } = req.body || {};
      const validStatuses = [
        'pendiente',
        'preparando',
        'listo',
        'entregado',
        'cancelado',
      ];
      if (status && validStatuses.includes(status)) {
        target.status = status;
      }
      if (
        paymentMethod &&
        ['efectivo', 'yape', 'plin'].includes(paymentMethod)
      ) {
        target.paymentMethod = paymentMethod;
      }
      recomputeCustomerSpend(dbState);
      saveDb(dbState);
      res.json({ ok: true, order: target });
    }
  );

  app.delete(
    '/api/admin/orders/:id',
    requireAdmin,
    (req: Request, res: Response) => {
      const idx = dbState.orders.findIndex((o) => o.id === req.params.id);
      if (idx === -1) {
        res.status(404).json({ error: 'Pedido no encontrado.' });
        return;
      }
      dbState.orders.splice(idx, 1);
      recomputeCustomerSpend(dbState);
      saveDb(dbState);
      res.json({ ok: true });
    }
  );

  app.patch(
    '/api/admin/customers/:uid',
    requireAdmin,
    (req: Request, res: Response) => {
      const uid = req.params.uid;
      const cust = dbState.customers[uid];
      if (!cust) {
        res.status(404).json({ error: 'Cliente no encontrado.' });
        return;
      }

      const { deltaBroasters, redeemGift } = req.body || {};
      if (typeof deltaBroasters === 'number' && deltaBroasters !== 0) {
        const minAllowed = cust.redeemedRewards * 10;
        const nextTotal = Math.max(
          minAllowed,
          cust.totalBroasters + Math.trunc(deltaBroasters)
        );
        cust.totalBroasters = nextTotal;
        cust.stamps = nextTotal % 10;
        cust.availableRewards = Math.max(
          0,
          Math.floor(nextTotal / 10) - cust.redeemedRewards
        );
        if (cust.availableRewards === 0) {
          cust.activeRewardCode = 'NONE';
        } else if (cust.activeRewardCode === 'NONE') {
          cust.activeRewardCode = generateGiftCode();
        }
      }

      if (redeemGift && cust.availableRewards >= 1) {
        cust.availableRewards -= 1;
        cust.redeemedRewards += 1;
        cust.activeRewardCode =
          cust.availableRewards >= 1 ? generateGiftCode() : 'NONE';
      }

      cust.lastSeenAt = new Date().toISOString();
      saveDb(dbState);
      res.json({ ok: true, customer: cust });
    }
  );

  // --- Vite Middleware / Static Production Serving ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BROSPAT server running on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
