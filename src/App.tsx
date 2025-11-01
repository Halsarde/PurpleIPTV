// src/App.tsx
import React, { useEffect, useState } from "react";
import { langService } from "./services/langService";
import { AppProvider, useAppContext } from "./context/AppContext";
import SplashScreen from "./screens/SplashScreen";
import AuthScreen from "./screens/AuthScreen";
import HomeScreen from "./screens/HomeScreen";
import PlayerScreen from "./screens/PlayerScreen";
import SettingsScreen from "./screens/SettingsScreen";
import DetailsScreen from "./screens/DetailsScreen";

// ✅ مكوّن المحتوى الأساسي
const AppContent: React.FC = () => {
  const { screen, isLoggedIn, setScreen, screenParams } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);
  const [, setLangTick] = useState(0);

  // ⏳ إظهار SplashScreen لفترة قصيرة فقط (1.5 ثانية)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);

      // ✅ الانتقال للشاشة المناسبة بعد الـ Splash
      if (screen === "splash") {
        if (!isLoggedIn) {
          setScreen("auth");
        } else {
          setScreen("home");
        }
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [isLoggedIn, setScreen, screen]);

  // Re-render on language change so components using langService.t update
  useEffect(() => {
    const unsub = langService.subscribe(() => setLangTick((x) => x + 1));
    return () => { try { unsub(); } catch {} };
  }, []);

  // أثناء التحميل الأولي
  if (isLoading) {
    return <SplashScreen onComplete={() => setIsLoading(false)} />;
  }

  // ✅ عرض الشاشة الصحيحة حسب الحالة
  switch (screen) {
    case "auth":
      return <AuthScreen />;
    case "home":
      return <HomeScreen />;
    case "player":
      return <PlayerScreen />;
    case "details":
      return <DetailsScreen stream={screenParams?.stream} />;
    case "settings":
      return <SettingsScreen />;
    default:
      return <SplashScreen onComplete={() => setIsLoading(false)} />;
  }
};

// ✅ المزوّد الرئيسي للتطبيق
export const App: React.FC = () => (
  <AppProvider>
    <AppContent />
  </AppProvider>
);

export default App;


