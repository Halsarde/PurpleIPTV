import React, { useState } from 'react';
import { AppContextProvider, useAppContext } from './context/AppContext';
import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import PlayerScreen from './screens/PlayerScreen';
import DetailsScreen from './screens/DetailsScreen';
import UnifiedSearchScreen from './screens/UnifiedSearchScreen';
import SplashScreen from './screens/SplashScreen';
import { Screen, PlayerArgs, DetailsArgs } from './types';

const AppContent: React.FC = () => {
  const { screen, screenArgs, isLoggedIn, isPipActive } = useAppContext();

  if (!isLoggedIn) {
    return <AuthScreen />;
  }
  
  // Don't render other screens if PiP is active, to avoid background activity.
  // The player logic handles restoring the view when leaving PiP.
  if (isPipActive && screen !== Screen.PLAYER) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-[#0D0D12] dark:to-[#1a0e2a] flex items-center justify-center">
            <p className="text-white">Playback is in Picture-in-Picture mode.</p>
        </div>
    );
  }

  const renderScreen = () => {
    switch (screen) {
      case Screen.HOME:
        return <HomeScreen />;
      case Screen.PLAYER:
        const playerArgs = screenArgs as PlayerArgs;
        return <PlayerScreen {...playerArgs} />;
      case Screen.DETAILS:
        const detailsArgs = screenArgs as DetailsArgs;
        return <DetailsScreen {...detailsArgs} />;
      case Screen.SEARCH:
        return <UnifiedSearchScreen />;
      case Screen.AUTH:
      default:
        return <AuthScreen />;
    }
  };

  return <>{renderScreen()}</>;
};

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <AppContextProvider>
      <AppContent />
    </AppContextProvider>
  );
};

export default App;
