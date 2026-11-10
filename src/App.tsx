/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ScreenName } from './types/menu';
import { MenuScreen } from './components/MenuScreen';
import { CustomizeScreen } from './components/CustomizeScreen';
import { LoyaltyProvider } from './context/LoyaltyContext';
import { LoyaltyCardModal } from './components/LoyaltyComponents';
import { StoreProvider } from './context/StoreContext';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminDashboard } from './components/AdminDashboard';

function AppRoutes() {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>(
    ScreenName.CARTA
  );
  const [selectedDishId, setSelectedDishId] = useState<string>('broaster');
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isChristmas, setIsChristmas] = useState<boolean>(false);

  const handleSelectDish = (dishId: string) => {
    setSelectedDishId(dishId);
    setDirection(1);
    setCurrentScreen(ScreenName.PERSONALIZAR);
    window.scrollTo({ top: 0 });
  };

  const handleBackToCarta = () => {
    setDirection(-1);
    setCurrentScreen(ScreenName.CARTA);
    window.scrollTo({ top: 0 });
  };

  const handleOpenAdminScreen = () => {
    setCurrentScreen(ScreenName.ADMIN);
    window.scrollTo({ top: 0 });
  };

  const toggleChristmas = () => {
    setIsChristmas((prev) => !prev);
  };

  if (currentScreen === ScreenName.ADMIN) {
    return (
      <>
        <AdminDashboard onBackToStore={handleBackToCarta} />
        <LoyaltyCardModal isChristmas={isChristmas} />
      </>
    );
  }

  return (
    <main
      className={`min-h-screen overflow-x-hidden transition-colors duration-300 ${
        isChristmas ? 'bg-[#0F1E17]' : 'bg-[#2A2A2F]'
      }`}
    >
      {currentScreen === ScreenName.CARTA ? (
        <motion.div
          key="carta-screen"
          initial={{ opacity: 0.9, x: direction === -1 ? -24 : 0 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        >
          <MenuScreen
            isChristmas={isChristmas}
            onToggleChristmas={toggleChristmas}
            onSelectDish={handleSelectDish}
            onEnterAdmin={handleOpenAdminScreen}
          />
        </motion.div>
      ) : (
        <motion.div
          key="personalizar-screen"
          initial={{ opacity: 0.9, x: direction === 1 ? 24 : -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        >
          <CustomizeScreen
            dishId={selectedDishId}
            isChristmas={isChristmas}
            onToggleChristmas={toggleChristmas}
            onBack={handleBackToCarta}
            onEnterAdmin={handleOpenAdminScreen}
          />
        </motion.div>
      )}

      <LoyaltyCardModal isChristmas={isChristmas} />
      <AdminLoginModal onSuccess={handleOpenAdminScreen} />
    </main>
  );
}

export default function App() {
  return (
    <LoyaltyProvider>
      <StoreProvider>
        <AppRoutes />
      </StoreProvider>
    </LoyaltyProvider>
  );
}
