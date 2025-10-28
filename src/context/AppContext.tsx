import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { Screen, Playlist, XtreamUserInfo, PlayerArgs, DetailsArgs, Stream } from '../types';

interface AppContextType {
  isLoggedIn: boolean;
  playlist: Playlist | null;
  userInfo: XtreamUserInfo | null;
  screen: Screen;
  screenArgs: PlayerArgs | DetailsArgs | null;
  favorites: Stream[];
  recentlyWatched: Stream[];
  isPipActive: boolean;
  login: (playlist: Playlist, userInfo: XtreamUserInfo) => void;
  logout: () => void;
  setScreen: (screen: Screen, args?: PlayerArgs | DetailsArgs) => void;
  isFavorite: (streamId: number) => boolean;
  toggleFavorite: (stream: Stream) => void;
  addRecentlyWatched: (stream: Stream) => void;
  setIsPipActive: (isActive: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [playlist, setPlaylist] = useState<Playlist | null>(() => {
    const saved = localStorage.getItem('playlist');
    return saved ? JSON.parse(saved) : null;
  });

  const [userInfo, setUserInfo] = useState<XtreamUserInfo | null>(() => {
    const saved = localStorage.getItem('userInfo');
    return saved ? JSON.parse(saved) : null;
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!playlist);
  const [screen, setScreenState] = useState<Screen>(Screen.HOME);
  const [screenArgs, setScreenArgs] = useState<PlayerArgs | DetailsArgs | null>(null);

  const [favorites, setFavorites] = useState<Stream[]>(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const [recentlyWatched, setRecentlyWatched] = useState<Stream[]>(() => {
    const saved = localStorage.getItem('recentlyWatched');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isPipActive, setIsPipActive] = useState(false);

  useEffect(() => {
    if (playlist) {
      localStorage.setItem('playlist', JSON.stringify(playlist));
      setIsLoggedIn(true);
    } else {
      localStorage.removeItem('playlist');
      setIsLoggedIn(false);
    }
  }, [playlist]);

  useEffect(() => {
    if (userInfo) {
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
    } else {
      localStorage.removeItem('userInfo');
    }
  }, [userInfo]);

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('recentlyWatched', JSON.stringify(recentlyWatched));
  }, [recentlyWatched]);

  const login = useCallback((newPlaylist: Playlist, newUserInfo: XtreamUserInfo) => {
    setPlaylist(newPlaylist);
    setUserInfo(newUserInfo);
    setScreenState(Screen.HOME);
  }, []);

  const logout = useCallback(() => {
    setPlaylist(null);
    setUserInfo(null);
    setScreenState(Screen.AUTH);
  }, []);

  const setScreen = useCallback((newScreen: Screen, args?: PlayerArgs | DetailsArgs) => {
    setScreenState(newScreen);
    setScreenArgs(args || null);
  }, []);
  
  const isFavorite = useCallback((streamId: number) => {
    return favorites.some(fav => fav.stream_id === streamId);
  }, [favorites]);

  const toggleFavorite = useCallback((stream: Stream) => {
    setFavorites(prev => {
      const isFav = prev.some(fav => fav.stream_id === stream.stream_id);
      if (isFav) {
        return prev.filter(fav => fav.stream_id !== stream.stream_id);
      } else {
        return [stream, ...prev];
      }
    });
  }, []);

  const addRecentlyWatched = useCallback((stream: Stream) => {
    setRecentlyWatched(prev => {
      const existing = prev.find(s => s.stream_id === stream.stream_id);
      if (existing) {
        // Move to front if it already exists
        return [existing, ...prev.filter(s => s.stream_id !== stream.stream_id)];
      }
      // Add to front, keep list size limited (e.g., 50)
      return [stream, ...prev].slice(0, 50);
    });
  }, []);
  
  const memoizedSetIsPipActive = useCallback((isActive: boolean) => {
      setIsPipActive(isActive);
  }, []);

  const contextValue: AppContextType = useMemo(() => ({
    isLoggedIn,
    playlist,
    userInfo,
    screen,
    screenArgs,
    favorites,
    recentlyWatched,
    isPipActive,
    login,
    logout,
    setScreen,
    isFavorite,
    toggleFavorite,
    addRecentlyWatched,
    setIsPipActive: memoizedSetIsPipActive,
  }), [isLoggedIn, playlist, userInfo, screen, screenArgs, favorites, recentlyWatched, isPipActive, login, logout, setScreen, isFavorite, toggleFavorite, addRecentlyWatched, memoizedSetIsPipActive]);

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};
