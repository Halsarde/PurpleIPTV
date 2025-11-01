import React from "react";
import { AppProvider, useAppContext } from "./context/AppContext";
import SplashScreen from "./screens/SplashScreen";
import AuthScreen from "./screens/AuthScreen";
import HomeScreen from "./screens/HomeScreen";
import PlayerScreen from "./screens/PlayerScreen";
import SettingsScreen from "./screens/SettingsScreen";
import DetailsScreen from "./screens/DetailsScreen";

const AppContent = () => {
  const { screen, isLoggedIn, setScreen, screenParams } = useAppContext();

  switch (screen) {
    case "splash":
      return <SplashScreen />;
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
      return <SplashScreen />;
  }
};

export const App = () => (
  <AppProvider>
    <AppContent />
  </AppProvider>
);

export default App;
