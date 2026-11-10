import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  CatalogData,
  CustomerRecord,
  DEFAULT_CATALOG,
  OrderDrinkLine,
  OrderRecord,
  OrderSauceLine,
  OrderStatus,
  PaymentMethod,
} from '../types/menu';
import { useLoyalty } from './LoyaltyContext';

export interface CreateOrderPayload {
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
  sauces: OrderSauceLine[];
  drinks: OrderDrinkLine[];
  isNightRate: boolean;
  paymentMethod?: PaymentMethod;
  redeemedGiftCode: string | null;
}

export interface CreateCounterOrderPayload {
  dishId: string;
  dishQty: number;
  sauceExtraCount: number;
  drinkCount: number;
  customerName: string;
  customerNote?: string;
  paymentMethod: PaymentMethod;
  status?: OrderStatus;
}

interface StoreContextValue {
  catalog: CatalogData;
  isCatalogLoaded: boolean;
  isAdminAuthenticated: boolean;
  isAdminLoginOpen: boolean;
  adminOrders: OrderRecord[];
  adminCustomers: CustomerRecord[];
  isLoadingAdmin: boolean;
  openAdminLogin: () => void;
  closeAdminLogin: () => void;
  loginAdmin: (username: string, password: string) => Promise<string | null>;
  logoutAdmin: () => Promise<void>;
  refreshCatalog: () => Promise<void>;
  refreshAdminDashboard: () => Promise<void>;
  submitCustomerOrder: (
    payload: CreateOrderPayload
  ) => Promise<OrderRecord | null>;
  saveAdminCatalog: (nextCatalog: CatalogData) => Promise<boolean>;
  updateAdminOrder: (
    orderId: string,
    patch: { status?: OrderStatus; paymentMethod?: PaymentMethod }
  ) => Promise<boolean>;
  deleteAdminOrder: (orderId: string) => Promise<boolean>;
  createAdminCounterOrder: (
    payload: CreateCounterOrderPayload
  ) => Promise<OrderRecord | null>;
  adjustAdminCustomer: (
    uid: string,
    patch: { deltaBroasters?: number; redeemGift?: boolean }
  ) => Promise<boolean>;
}

const ADMIN_TOKEN_KEY = 'brospat_admin_token';

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, card } = useLoyalty();
  const [catalog, setCatalog] = useState<CatalogData>(DEFAULT_CATALOG);
  const [isCatalogLoaded, setIsCatalogLoaded] = useState<boolean>(false);
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(ADMIN_TOKEN_KEY);
    } catch {
      return null;
    }
  });
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);
  const [adminOrders, setAdminOrders] = useState<OrderRecord[]>([]);
  const [adminCustomers, setAdminCustomers] = useState<CustomerRecord[]>([]);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState<boolean>(false);

  const refreshCatalog = useCallback(async () => {
    try {
      const res = await fetch('/api/catalog');
      if (res.ok) {
        const data = (await res.json()) as CatalogData;
        if (data && Array.isArray(data.dishes)) {
          setCatalog(data);
        }
      }
    } catch {
      // Keep default fallback catalog if network is momentarily unavailable
    } finally {
      setIsCatalogLoaded(true);
    }
  }, []);

  useEffect(() => {
    void refreshCatalog();
  }, [refreshCatalog]);

  // Verify saved admin session token on mount
  useEffect(() => {
    if (!adminToken) return;
    fetch('/api/admin/verify', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
      .then((res) => {
        if (!res.ok) {
          setAdminToken(null);
          try {
            sessionStorage.removeItem(ADMIN_TOKEN_KEY);
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {
        // ignore transient error
      });
  }, [adminToken]);

  // Sync Google-authenticated customer + loyalty card to server directory
  useEffect(() => {
    if (!user || !card) return;
    fetch('/api/customers/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: user.uid,
        displayName: card.displayName || user.displayName || 'Cliente Google',
        email: user.email || '',
        photoURL: user.photoURL || '',
        stamps: card.stamps,
        totalBroasters: card.totalBroasters,
        availableRewards: card.availableRewards,
        redeemedRewards: card.redeemedRewards,
        activeRewardCode: card.activeRewardCode,
      }),
    }).catch(() => {
      // non-blocking sync
    });
  }, [user, card]);

  const refreshAdminDashboard = useCallback(async () => {
    if (!adminToken) return;
    setIsLoadingAdmin(true);
    try {
      const res = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status === 401) {
        setAdminToken(null);
        try {
          sessionStorage.removeItem(ADMIN_TOKEN_KEY);
        } catch {
          // ignore
        }
        return;
      }
      if (res.ok) {
        const data = (await res.json()) as {
          catalog: CatalogData;
          orders: OrderRecord[];
          customers: CustomerRecord[];
        };
        setCatalog(data.catalog);
        setAdminOrders(data.orders);
        setAdminCustomers(data.customers);
      }
    } finally {
      setIsLoadingAdmin(false);
    }
  }, [adminToken]);

  useEffect(() => {
    if (adminToken) {
      void refreshAdminDashboard();
    }
  }, [adminToken, refreshAdminDashboard]);

  const loginAdmin = useCallback(
    async (username: string, password: string): Promise<string | null> => {
      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        const data = (await res.json()) as { token?: string; error?: string };
        if (!res.ok || !data.token) {
          return data.error || 'Credenciales incorrectas.';
        }
        setAdminToken(data.token);
        try {
          sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token);
        } catch {
          // ignore
        }
        setIsAdminLoginOpen(false);
        return null;
      } catch {
        return 'Error de conexión con el servidor.';
      }
    },
    []
  );

  const logoutAdmin = useCallback(async () => {
    if (adminToken) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` },
        });
      } catch {
        // ignore
      }
    }
    setAdminToken(null);
    try {
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    } catch {
      // ignore
    }
  }, [adminToken]);

  const submitCustomerOrder = useCallback(
    async (payload: CreateOrderPayload): Promise<OrderRecord | null> => {
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) return null;
        const data = (await res.json()) as { order: OrderRecord };
        if (adminToken) {
          void refreshAdminDashboard();
        }
        return data.order;
      } catch {
        return null;
      }
    },
    [adminToken, refreshAdminDashboard]
  );

  const saveAdminCatalog = useCallback(
    async (nextCatalog: CatalogData): Promise<boolean> => {
      if (!adminToken) return false;
      try {
        const res = await fetch('/api/admin/catalog', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify(nextCatalog),
        });
        if (!res.ok) return false;
        const data = (await res.json()) as { catalog: CatalogData };
        setCatalog(data.catalog);
        return true;
      } catch {
        return false;
      }
    },
    [adminToken]
  );

  const updateAdminOrder = useCallback(
    async (
      orderId: string,
      patch: { status?: OrderStatus; paymentMethod?: PaymentMethod }
    ): Promise<boolean> => {
      if (!adminToken) return false;
      try {
        const res = await fetch(`/api/admin/orders/${orderId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify(patch),
        });
        if (!res.ok) return false;
        await refreshAdminDashboard();
        return true;
      } catch {
        return false;
      }
    },
    [adminToken, refreshAdminDashboard]
  );

  const deleteAdminOrder = useCallback(
    async (orderId: string): Promise<boolean> => {
      if (!adminToken) return false;
      try {
        const res = await fetch(`/api/admin/orders/${orderId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (!res.ok) return false;
        await refreshAdminDashboard();
        return true;
      } catch {
        return false;
      }
    },
    [adminToken, refreshAdminDashboard]
  );

  const createAdminCounterOrder = useCallback(
    async (payload: CreateCounterOrderPayload): Promise<OrderRecord | null> => {
      if (!adminToken) return null;
      try {
        const res = await fetch('/api/admin/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) return null;
        const data = (await res.json()) as { order: OrderRecord };
        await refreshAdminDashboard();
        return data.order;
      } catch {
        return null;
      }
    },
    [adminToken, refreshAdminDashboard]
  );

  const adjustAdminCustomer = useCallback(
    async (
      uid: string,
      patch: { deltaBroasters?: number; redeemGift?: boolean }
    ): Promise<boolean> => {
      if (!adminToken) return false;
      try {
        const res = await fetch(
          `/api/admin/customers/${encodeURIComponent(uid)}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${adminToken}`,
            },
            body: JSON.stringify(patch),
          }
        );
        if (!res.ok) return false;
        await refreshAdminDashboard();
        return true;
      } catch {
        return false;
      }
    },
    [adminToken, refreshAdminDashboard]
  );

  return (
    <StoreContext.Provider
      value={{
        catalog,
        isCatalogLoaded,
        isAdminAuthenticated: Boolean(adminToken),
        isAdminLoginOpen,
        adminOrders,
        adminCustomers,
        isLoadingAdmin,
        openAdminLogin: () => setIsAdminLoginOpen(true),
        closeAdminLogin: () => setIsAdminLoginOpen(false),
        loginAdmin,
        logoutAdmin,
        refreshCatalog,
        refreshAdminDashboard,
        submitCustomerOrder,
        saveAdminCatalog,
        updateAdminOrder,
        deleteAdminOrder,
        createAdminCounterOrder,
        adjustAdminCustomer,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return ctx;
}
