import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getSettings } from '../services/api';
import { AppearanceSettings, LogoAnimation } from '../types';

interface ThemeContextType {
  appearance: AppearanceSettings;
  setAppearance: React.Dispatch<React.SetStateAction<AppearanceSettings>>;
  isLoading: boolean;
  updateAppearance: (newAppearance: AppearanceSettings) => void;
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

  const updateAppearance = (newAppearance: AppearanceSettings) => {
    console.log('🎨 Updating appearance:', newAppearance);
    setAppearance(newAppearance);
  };

  useEffect(() => {
    getSettings().then(settings => {
      console.log('🎨 Loading settings for theme:', settings);
      if (settings.appearance) {
        console.log('✅ Using backend appearance settings');
        setAppearance(settings.appearance);
      } else {
        console.log('⚠️ No appearance settings, using defaults');
        setAppearance(defaultAppearance);
      }
      setIsLoading(false);
    }).catch(err => {
      console.error("Failed to load settings, using defaults", err);
      setAppearance(defaultAppearance);
      setIsLoading(false);
    })
  }, []);

  useEffect(() => {
    if (!isLoading && appearance?.colors) {
      console.log('🎨 Applying appearance colors:', appearance.colors);
      const root = document.documentElement;
      
      try {
        // Apply color variables with validation
        const colors = appearance.colors;
        if (colors.backgroundPrimary) {
          root.style.setProperty('--color-background-primary', hexToRgb(colors.backgroundPrimary));
        }
        if (colors.backgroundSecondary) {
          root.style.setProperty('--color-background-secondary', hexToRgb(colors.backgroundSecondary));
        }
        if (colors.accent) {
          root.style.setProperty('--color-accent', hexToRgb(colors.accent));
        }
        if (colors.action) {
          root.style.setProperty('--color-action', hexToRgb(colors.action));
        }
        
        // Apply site name to document title
        if (appearance.siteName) {
          document.title = appearance.siteName;
        }
        
        // Apply favicon if available
        if (appearance.favicon) {
          const faviconLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
          if (faviconLink) {
            faviconLink.href = appearance.favicon;
          } else {
            const link = document.createElement('link');
            link.rel = 'icon';
            link.href = appearance.favicon;
            document.head.appendChild(link);
          }
        }
        
        console.log('✅ Appearance applied successfully');
      } catch (error) {
        console.error('❌ Error applying appearance:', error);
      }
    }
  }, [appearance, isLoading]);

  return (
    <ThemeContext.Provider value={{ appearance, setAppearance, isLoading, updateAppearance }}>
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
