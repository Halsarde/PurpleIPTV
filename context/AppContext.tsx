import React, { createContext, useContext, useState } from "react";

export type Screen =
|  "splash"
| "auth"
| "player"
| "details"
| "settings"
;

type AppContextType = {
  isLoggedIn: boolean;
  setIsLoggedIn: (v: boolean) => void;
  screen: Screen;
  setScreen: (v: Screen, params?: any) => void;
  screenParams: any;
};

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [screen, setScreenState] = useState<Screen>("splash");
  const [screenParams, setScreenParams] = useState<any>(null);

  const setScreen = (newScreen: Screen, params?: any) => {
    setScreenState(newScreen);
    setScreenParams(params || null);
  };

  return (
    <AppContext.Provider
      value={{ isLoggedIn, setIsLoggedIn, screen, setScreen, screenParams }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
};
