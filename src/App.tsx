import React, { useState, useEffect } from "react";
import { AppProvider, useAppContext } from './context/AppContext';
import AuthScreen from "./screens/AuthScreen";
import HomeScreen from "./screens/HomeScreen";
import DetailsScreen from "./screens/DetailsScreen";
import SettingsScreen from "./screens/SettingsScreen";
import SplashScreen from "./screens/SplashScreen";
import PlayerScreen from "./screens/PlayerScreen";

const AppContent: React.FC = () => {
  const { screen, screenParams } = useAppContext();
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCheckingSession(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (isCheckingSession) {
    return <SplashScreen onComplete={() => setIsCheckingSession(false)} />;
  }

  switch (screen) {
    case "auth":
      return <AuthScreen />;
    case "home":
      return <HomeScreen />;
    case "details":
      return <DetailsScreen {...(screenParams || {})} />;
    case "settings":
      return <SettingsScreen />;
    case "player":
      return <PlayerScreen {...(screenParams || {})} />;
    default:
      return <SplashScreen onComplete={() => setIsCheckingSession(false)} />;
  }
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
