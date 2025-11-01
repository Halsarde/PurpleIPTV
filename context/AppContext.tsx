// src/context/AppContext.tsx
import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import type { Playlist, Stream } from "../types";

export type Screen = "splash" | "auth" | "home" | "player" | "details" | "settings";

type AppContextType = {
  // حالة الجلسة
  isLoggedIn: boolean;
  setIsLoggedIn: (v: boolean) => void;

  // التنقل بين الشاشات
  screen: Screen;
  setScreen: (s: Screen, params?: any) => void;
  screenParams: any;

  // بيانات التشغيل
  playlist?: Partial<Playlist>;
  setPlaylist: (p: Partial<Playlist> | undefined) => void;

  // المفضلة
  favorites: Stream[];
  isFavorite: (id: number) => boolean;
  toggleFavorite: (stream: Stream) => void;

  // مؤخّرًا
  recentlyWatched: Stream[];
  addRecentlyWatched: (stream: Stream) => void;

  // PiP
  isPipActive: boolean;
  setIsPipActive: (v: boolean) => void;

  // تسجيل الخروج
  logout: () => void;
};

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [screen, setScreenState] = useState<Screen>("splash");
  const [screenParams, setScreenParams] = useState<any>(null);

  const [playlist, setPlaylist] = useState<Partial<Playlist> | undefined>(undefined);
  const [favorites, setFavorites] = useState<Stream[]>([]);
  const [recentlyWatched, setRecentlyWatched] = useState<Stream[]>([]);
  const [isPipActive, setIsPipActive] = useState<boolean>(false);

  const setScreen = useCallback((s: Screen, params?: any) => {
    setScreenState(s);
    setScreenParams(params ?? null);
  }, []);

  const isFavorite = useCallback(
    (id: number) => favorites.some((f) => f.stream_id === id),
    [favorites]
  );

  const toggleFavorite = useCallback((stream: Stream) => {
    setFavorites((prev) =>
      prev.some((f) => f.stream_id === stream.stream_id)
        ? prev.filter((f) => f.stream_id !== stream.stream_id)
        : [stream, ...prev].slice(0, 200)
    );
  }, []);

  const addRecentlyWatched = useCallback((stream: Stream) => {
    setRecentlyWatched((prev) => {
      const next = [stream, ...prev.filter((s) => s.stream_id !== stream.stream_id)];
      return next.slice(0, 200);
    });
  }, []);

  const logout = useCallback(() => {
    try {
      setIsLoggedIn(false);
      setPlaylist(undefined);
      setScreen("auth");
    } catch (err) {
      console.error("Logout error:", err);
    }
  }, [setScreen]);

  const value = useMemo<AppContextType>(
    () => ({
      isLoggedIn,
      setIsLoggedIn,
      screen,
      setScreen,
      screenParams,
      playlist,
      setPlaylist,
      favorites,
      isFavorite,
      toggleFavorite,
      recentlyWatched,
      addRecentlyWatched,
      isPipActive,
      setIsPipActive,
      logout,
    }),
    [
      isLoggedIn,
      screen,
      setScreen,
      screenParams,
      playlist,
      favorites,
      isFavorite,
      toggleFavorite,
      recentlyWatched,
      addRecentlyWatched,
      isPipActive,
      logout,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
};
