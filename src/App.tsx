import React, { useState, useEffect, Suspense } from "react";
import { AppProvider, useAppContext } from "./context/AppContext";
import SplashScreen from "./screens/SplashScreen";
import { LoadingSpinner } from "./components/LoadingSpinner";

// ✅ Lazy loading للشاشات الثقيلة
const AuthScreen = React.lazy(() => import("./screens/AuthScreen"));
const HomeScreen = React.lazy(() => import("./screens/HomeScreen"));
const DetailsScreen = React.lazy(() => import("./screens/DetailsScreen"));
const SettingsScreen = React.lazy(() => import("./screens/SettingsScreen"));
const PlayerScreen = React.lazy(() => import("./screens/PlayerScreen"));

const AppContent: React.FC = () => {
  const { screen, screenParams } = useAppContext();
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCheckingSession(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  if (isCheckingSession) {
    return <SplashScreen onComplete={() => setIsCheckingSession(false)} />;
  }

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen bg-[#0D0D12] text-white">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      {(() => {
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
      })()}
    </Suspense>
  );
};

const App: React.FC = () => (
  <AppProvider>
    <AppContent />
  </AppProvider>
);

export default App;
