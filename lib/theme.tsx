import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@gunpla/theme';

export type ThemeMode = 'dark' | 'light';

export type Theme = {
  mode: ThemeMode;
  bg: string;
  card: string;
  header: string;
  border: string;
  text: string;
  subtext: string;
  muted: string;
  accent: string;
  input: string;
  placeholder: string;
};

export const dark: Theme = {
  mode: 'dark',
  bg: '#12121f',
  card: '#1e1e32',
  header: '#1a1a2e',
  border: '#2d2d44',
  text: '#ffffff',
  subtext: '#aaaaaa',
  muted: '#888888',
  accent: '#e8a838',
  input: '#1e1e32',
  placeholder: '#555555',
};

export const light: Theme = {
  mode: 'light',
  bg: '#f2f2f7',
  card: '#ffffff',
  header: '#ffffff',
  border: '#d1d1d8',
  text: '#1a1a2e',
  subtext: '#5a5a72',
  muted: '#8a8a9a',
  accent: '#e8a838',
  input: '#ffffff',
  placeholder: '#9a9aaa',
};

type ThemeCtx = { theme: Theme; toggleTheme: () => void };

const ThemeContext = createContext<ThemeCtx>({ theme: dark, toggleTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(dark);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === 'light') setTheme(light);
    });
  }, []);

  const toggleTheme = async () => {
    const next = theme.mode === 'dark' ? light : dark;
    setTheme(next);
    await AsyncStorage.setItem(STORAGE_KEY, next.mode);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
