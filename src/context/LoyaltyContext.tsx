import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  OperationType,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
} from '../firebase';

export const STAMPS_PER_REWARD = 10;

// Validation constants synchronized verbatim with firebase-blueprint.json & firestore.rules
const OWNER_ID_REGEX = /^[a-zA-Z0-9_\-]+$/;
const REWARD_CODE_REGEX = /^[A-Z0-9\-]+$/;
const DISPLAY_NAME_MAX_LEN = 80;

export interface LoyaltyCardData {
  ownerId: string;
  displayName: string;
  stamps: number;
  totalBroasters: number;
  availableRewards: number;
  redeemedRewards: number;
  activeRewardCode: string;
}

export interface StampOrderResult {
  stampsAdded: number;
  newStamps: number;
  newAvailableRewards: number;
  unlockedNewGift: boolean;
  rewardCode: string;
}

interface LoyaltyContextValue {
  user: User | null;
  isAuthReady: boolean;
  card: LoyaltyCardData | null;
  isCardModalOpen: boolean;
  isBusy: boolean;
  statusError: string | null;
  openCardModal: () => void;
  closeCardModal: () => void;
  signInWithGoogle: () => Promise<boolean>;
  signOutUser: () => Promise<void>;
  recordBroasterPurchase: (
    broasterQty: number
  ) => Promise<StampOrderResult | null>;
  redeemSurpriseGiftInStore: () => Promise<boolean>;
  clearStatusError: () => void;
}

const LoyaltyContext = createContext<LoyaltyContextValue | undefined>(
  undefined
);

function sanitizeDisplayName(rawName: string | null | undefined): string {
  const cleaned = (rawName || 'Cliente BROSPAT').trim();
  if (!cleaned) return 'Cliente BROSPAT';
  return cleaned.slice(0, DISPLAY_NAME_MAX_LEN);
}

function generateRewardCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 5; i += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  const candidate = `BRS-${suffix}`;
  return REWARD_CODE_REGEX.test(candidate) ? candidate : 'BRS-REGALO';
}

export const LoyaltyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [card, setCard] = useState<LoyaltyCardData | null>(null);
  const [hasCardDoc, setHasCardDoc] = useState<boolean>(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState<boolean>(false);
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setIsAuthReady(true);
      if (!nextUser) {
        setCard(null);
        setHasCardDoc(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !user) return;
    if (!OWNER_ID_REGEX.test(user.uid) || user.uid.length > 128) return;

    const cardPath = `loyaltyCards/${user.uid}`;
    const cardRef = doc(db, 'loyaltyCards', user.uid);

    const unsubscribeSnapshot = onSnapshot(
      cardRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setHasCardDoc(true);
          setCard({
            ownerId: String(data.ownerId || user.uid),
            displayName: sanitizeDisplayName(data.displayName || user.displayName),
            stamps: Number(data.stamps) || 0,
            totalBroasters: Number(data.totalBroasters) || 0,
            availableRewards: Number(data.availableRewards) || 0,
            redeemedRewards: Number(data.redeemedRewards) || 0,
            activeRewardCode: String(data.activeRewardCode || 'NONE'),
          });
        } else {
          // Initialize empty card for verified Google user
          setHasCardDoc(false);
          const fallbackCard: LoyaltyCardData = {
            ownerId: user.uid,
            displayName: sanitizeDisplayName(user.displayName),
            stamps: 0,
            totalBroasters: 0,
            availableRewards: 0,
            redeemedRewards: 0,
            activeRewardCode: 'NONE',
          };
          setCard(fallbackCard);

          if (user.emailVerified) {
            try {
              await setDoc(cardRef, {
                ...fallbackCard,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
              setHasCardDoc(true);
            } catch (err) {
              if (
                err instanceof Error &&
                err.message.includes('Quota exceeded')
              ) {
                setStatusError(
                  'Se alcanzó el límite diario gratuito de base de datos. Intenta mañana.'
                );
                return;
              }
              handleFirestoreError(err, OperationType.CREATE, cardPath);
            }
          }
        }
      },
      (error) => {
        if (error.message.includes('Quota exceeded')) {
          setStatusError(
            'Se alcanzó el límite diario gratuito de lecturas. Se restablecerá mañana.'
          );
          return;
        }
        handleFirestoreError(error, OperationType.GET, cardPath);
      }
    );

    return () => unsubscribeSnapshot();
  }, [isAuthReady, user]);

  const signInWithGoogle = useCallback(async (): Promise<boolean> => {
    setStatusError(null);
    setIsBusy(true);
    try {
      await signInWithPopup(auth, googleProvider);
      return true;
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('popup-closed-by-user') ||
          error.message.includes('cancelled-popup-request'))
      ) {
        return false;
      }
      setStatusError(
        'No se pudo iniciar sesión con Google. Verifica que las ventanas emergentes estén permitidas.'
      );
      return false;
    } finally {
      setIsBusy(false);
    }
  }, []);

  const signOutUser = useCallback(async () => {
    setStatusError(null);
    await signOut(auth);
  }, []);

  const recordBroasterPurchase = useCallback(
    async (broasterQty: number): Promise<StampOrderResult | null> => {
      if (!user || !user.emailVerified) return null;
      if (!OWNER_ID_REGEX.test(user.uid) || user.uid.length > 128) return null;

      const clampedQty = Math.max(1, Math.min(25, Math.floor(broasterQty)));
      const cardPath = `loyaltyCards/${user.uid}`;
      const cardRef = doc(db, 'loyaltyCards', user.uid);

      const prevTotal = card?.totalBroasters ?? 0;
      const prevRedeemed = card?.redeemedRewards ?? 0;
      const prevAvailable = card?.availableRewards ?? 0;
      const prevCode = card?.activeRewardCode ?? 'NONE';

      const nextTotal = Math.min(100000, prevTotal + clampedQty);
      const totalEarnedEver = Math.floor(nextTotal / STAMPS_PER_REWARD);
      const nextStamps = nextTotal % STAMPS_PER_REWARD;
      const nextAvailable = Math.max(0, totalEarnedEver - prevRedeemed);

      let nextCode = 'NONE';
      if (nextAvailable >= 1) {
        nextCode =
          prevAvailable >= 1 && prevCode !== 'NONE' && REWARD_CODE_REGEX.test(prevCode)
            ? prevCode
            : generateRewardCode();
      }

      const safeDisplayName = sanitizeDisplayName(
        card?.displayName || user.displayName
      );

      setIsBusy(true);
      setStatusError(null);
      try {
        if (!hasCardDoc) {
          await setDoc(cardRef, {
            ownerId: user.uid,
            displayName: safeDisplayName,
            stamps: nextStamps,
            totalBroasters: nextTotal,
            availableRewards: nextAvailable,
            redeemedRewards: 0,
            activeRewardCode: nextCode,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          setHasCardDoc(true);
        } else {
          await updateDoc(cardRef, {
            displayName: safeDisplayName,
            stamps: nextStamps,
            totalBroasters: nextTotal,
            availableRewards: nextAvailable,
            activeRewardCode: nextCode,
            updatedAt: serverTimestamp(),
          });
        }

        return {
          stampsAdded: clampedQty,
          newStamps: nextStamps,
          newAvailableRewards: nextAvailable,
          unlockedNewGift: nextAvailable > prevAvailable,
          rewardCode: nextCode,
        };
      } catch (error) {
        if (error instanceof Error && error.message.includes('Quota exceeded')) {
          setStatusError(
            'Cuota diaria de base de datos alcanzada. Se restablecerá mañana.'
          );
          return null;
        }
        handleFirestoreError(
          error,
          hasCardDoc ? OperationType.UPDATE : OperationType.CREATE,
          cardPath
        );
      } finally {
        setIsBusy(false);
      }
    },
    [user, card, hasCardDoc]
  );

  const redeemSurpriseGiftInStore = useCallback(async (): Promise<boolean> => {
    if (!user || !user.emailVerified || !card || card.availableRewards < 1) {
      return false;
    }

    const cardPath = `loyaltyCards/${user.uid}`;
    const cardRef = doc(db, 'loyaltyCards', user.uid);
    const nextAvailable = card.availableRewards - 1;
    const nextRedeemed = card.redeemedRewards + 1;
    const nextCode = nextAvailable >= 1 ? generateRewardCode() : 'NONE';

    setIsBusy(true);
    setStatusError(null);
    try {
      await updateDoc(cardRef, {
        availableRewards: nextAvailable,
        redeemedRewards: nextRedeemed,
        activeRewardCode: nextCode,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Quota exceeded')) {
        setStatusError(
          'Cuota diaria de base de datos alcanzada. Se restablecerá mañana.'
        );
        return false;
      }
      handleFirestoreError(error, OperationType.UPDATE, cardPath);
    } finally {
      setIsBusy(false);
    }
  }, [user, card]);

  return (
    <LoyaltyContext.Provider
      value={{
        user,
        isAuthReady,
        card,
        isCardModalOpen,
        isBusy,
        statusError,
        openCardModal: () => setIsCardModalOpen(true),
        closeCardModal: () => setIsCardModalOpen(false),
        signInWithGoogle,
        signOutUser,
        recordBroasterPurchase,
        redeemSurpriseGiftInStore,
        clearStatusError: () => setStatusError(null),
      }}
    >
      {children}
    </LoyaltyContext.Provider>
  );
};

export function useLoyalty(): LoyaltyContextValue {
  const ctx = useContext(LoyaltyContext);
  if (!ctx) {
    throw new Error('useLoyalty must be used within a LoyaltyProvider');
  }
  return ctx;
}
