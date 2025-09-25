import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getSettings } from '../services/api';
import { AppearanceSettings, LogoAnimation } from '../types';

interface ThemeContextType {
  appearance: AppearanceSettings;
  setAppearance: React.Dispatch<React.SetStateAction<AppearanceSettings>>;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const defaultAppearance: AppearanceSettings = {
  siteName: 'Lucky Snap',
  logoAnimation: 'rotate',
  colors: {
    backgroundPrimary: '#111827',
    backgroundSecondary: '#1f2937',
    accent: '#ec4899',
    action: '#0ea5e9',
  }
};

const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
    : '0 0 0';
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [appearance, setAppearance] = useState<AppearanceSettings>(defaultAppearance);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getSettings().then(settings => {
      if (settings.appearance) {
        setAppearance(settings.appearance);
      }
      setIsLoading(false);
    }).catch(err => {
      console.error("Failed to load settings, using defaults", err);
      setIsLoading(false);
    })
  }, []);

  useEffect(() => {
    if (!isLoading && appearance?.colors) {
      const root = document.documentElement;
      root.style.setProperty('--color-background-primary', hexToRgb(appearance.colors.backgroundPrimary));
      root.style.setProperty('--color-background-secondary', hexToRgb(appearance.colors.backgroundSecondary));
      root.style.setProperty('--color-accent', hexToRgb(appearance.colors.accent));
      root.style.setProperty('--color-action', hexToRgb(appearance.colors.action));
    }
  }, [appearance, isLoading]);

  return (
    <ThemeContext.Provider value={{ appearance, setAppearance, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
