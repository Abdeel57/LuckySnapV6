import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getSettings } from '../services/api';
import { AppearanceSettings, LogoAnimation } from '../types';

// Importar utilidades de diseño
import { DesignSystemUtils } from '../utils/design-system-utils';

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
      console.log('🎨 Applying appearance colors with Design Tokens:', appearance.colors);
      const root = document.documentElement;
      
      try {
        const colors = appearance.colors;
        
        // Generar paleta armónica completa
        const primaryColor = colors.action || '#0ea5e9';
        const accentColor = colors.accent || '#ec4899';
        const harmoniousPalette = DesignSystemUtils.generateHarmoniousPalette(primaryColor);
        
        console.log('🎨 Generated harmonious palette:', harmoniousPalette);
        
        // Aplicar colores primitivos (Nivel 1)
        root.style.setProperty('--color-brand-primary', primaryColor);
        root.style.setProperty('--color-brand-secondary', harmoniousPalette.complementary.base);
        root.style.setProperty('--color-brand-accent', accentColor);
        
        // Aplicar colores de fondo con validación WCAG
        const bgPrimary = colors.backgroundPrimary || '#111827';
        const bgSecondary = colors.backgroundSecondary || '#1f2937';
        
        // Validar contraste y ajustar si es necesario
        const textOnPrimary = DesignSystemUtils.getContrastText(bgPrimary);
        const textOnSecondary = DesignSystemUtils.getContrastText(bgSecondary);
        
        root.style.setProperty('--color-background-primary', hexToRgb(bgPrimary));
        root.style.setProperty('--color-background-secondary', hexToRgb(bgSecondary));
        root.style.setProperty('--color-accent', hexToRgb(accentColor));
        root.style.setProperty('--color-action', hexToRgb(primaryColor));
        
        // Aplicar colores semánticos generados (Nivel 2)
        root.style.setProperty('--bg-primary', textOnPrimary === '#FFFFFF' ? '#000000' : '#FFFFFF');
        root.style.setProperty('--bg-secondary', DesignSystemUtils.lighten(primaryColor, 95));
        root.style.setProperty('--btn-primary-bg', primaryColor);
        root.style.setProperty('--btn-primary-text', DesignSystemUtils.getContrastText(primaryColor));
        root.style.setProperty('--btn-primary-hover', DesignSystemUtils.darken(primaryColor, 10));
        root.style.setProperty('--text-primary', textOnPrimary);
        root.style.setProperty('--text-link', primaryColor);
        root.style.setProperty('--text-link-hover', DesignSystemUtils.darken(primaryColor, 20));
        root.style.setProperty('--border-brand', DesignSystemUtils.lighten(primaryColor, 70));
        root.style.setProperty('--border-focus', primaryColor);
        
        // Aplicar sombras con color primario
        root.style.setProperty('--shadow-brand-sm', `0 2px 4px ${DesignSystemUtils.adjustOpacity(primaryColor, 0.2)}`);
        root.style.setProperty('--shadow-brand-md', `0 8px 16px ${DesignSystemUtils.adjustOpacity(primaryColor, 0.15)}`);
        
        // Aplicar nombre del sitio
        if (appearance.siteName) {
          document.title = appearance.siteName;
        }
        
        // Aplicar favicon - usar logo si no hay favicon específico
        const faviconUrl = appearance.favicon || appearance.logo;
        if (faviconUrl) {
          const faviconLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
          if (faviconLink) {
            faviconLink.href = faviconUrl;
          } else {
            const link = document.createElement('link');
            link.rel = 'icon';
            link.href = faviconUrl;
            document.head.appendChild(link);
          }
        }
        
        console.log('✅ Design Tokens applied successfully with WCAG compliance');
      } catch (error) {
        console.error('❌ Error applying Design Tokens:', error);
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
