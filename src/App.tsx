// src/App.tsx
import React, { useState, useEffect } from "react";
import { AppProvider, useAppContext } from "./context/AppContext";
import AuthScreen from "./screens/AuthScreen";
import HomeScreen from "./screens/HomeScreen";
import DetailsScreen from "./screens/DetailsScreen";
import SettingsScreen from "./screens/SettingsScreen";
import SplashScreen from "./screens/SplashScreen";
import PlayerScreen from "./screens/PlayerScreen";

const AppContent: React.FC = () => {
  const { screen, screenParams, isLoggedIn, setScreen } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);

  // ⏳ عرض شاشة التحميل 1.5 ثانية ثم التحقق من الجلسة
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      if (isLoggedIn) setScreen("home");
      else setScreen("auth");
    }, 1500);
    return () => clearTimeout(timer);
  }, [isLoggedIn, setScreen]);

  if (isLoading) {
    return <SplashScreen />;
  }

  // 🧭 التنقل بين الشاشات
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
      return <SplashScreen />;
  }
};

const App: React.FC = () => (
  <AppProvider>
    <AppContent />
  </AppProvider>
);

export default App;
