// Save as: src/context/ThemeContext.tsx
//
// Global dark-mode switch. Replaces the local `useState` toggle that used
// to live only inside HomeScreen.tsx. Persists to AsyncStorage so the
// choice survives app restarts, and any screen can read/toggle it via
// `useAppTheme()`.

import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'app_is_dark_mode';

interface ThemeContextValue {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDarkMode: true,
  toggleDarkMode: () => {},
  setDarkMode: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved !== null) setIsDarkMode(saved === 'true');
      } catch (e) {
        console.log('Failed to load theme preference:', e);
      }
    })();
  }, []);

  const persist = async (value: boolean) => {
    setIsDarkMode(value);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, String(value));
    } catch (e) {
      console.log('Failed to save theme preference:', e);
    }
  };

  const toggleDarkMode = () => persist(!isDarkMode);
  const setDarkMode = (value: boolean) => persist(value);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);