/* ═══════════════════════════════════════════════════════════
   DESIGN SYSTEM UTILITIES - FUNCIONES DE ARMONÍA DE COLORES
   ═══════════════════════════════════════════════════════════ */

/**
 * Utilidades para generar combinaciones de colores armónicas
 * y asegurar accesibilidad WCAG AA/AAA
 */

class DesignSystemUtils {
  /**
   * Convierte hex a RGB
   * @param {string} hex - Color en formato hex (#ffffff)
   * @returns {object} - Objeto con r, g, b
   */
  static hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Convierte RGB a hex
   * @param {number} r - Red (0-255)
   * @param {number} g - Green (0-255)
   * @param {number} b - Blue (0-255)
   * @returns {string} - Color en formato hex
   */
  static rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /**
   * Convierte RGB a HSL
   * @param {number} r - Red (0-255)
   * @param {number} g - Green (0-255)
   * @param {number} b - Blue (0-255)
   * @returns {object} - Objeto con h, s, l
   */
  static rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  /**
   * Convierte HSL a RGB
   * @param {number} h - Hue (0-360)
   * @param {number} s - Saturation (0-100)
   * @param {number} l - Lightness (0-100)
   * @returns {object} - Objeto con r, g, b
   */
  static hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;

    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  /**
   * Calcula la luminancia relativa de un color
   * @param {string} hex - Color en formato hex
   * @returns {number} - Luminancia (0-1)
   */
  static getLuminance(hex) {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return 0;

    const { r, g, b } = rgb;
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  /**
   * Calcula el ratio de contraste entre dos colores
   * @param {string} color1 - Primer color (hex)
   * @param {string} color2 - Segundo color (hex)
   * @returns {number} - Ratio de contraste
   */
  static getContrastRatio(color1, color2) {
    const lum1 = this.getLuminance(color1);
    const lum2 = this.getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  }

  /**
   * Determina el color de texto óptimo para un fondo dado
   * @param {string} backgroundColor - Color de fondo (hex)
   * @returns {string} - Color de texto óptimo (#FFFFFF o #000000)
   */
  static getContrastText(backgroundColor) {
    const whiteContrast = this.getContrastRatio(backgroundColor, '#FFFFFF');
    const blackContrast = this.getContrastRatio(backgroundColor, '#000000');
    
    return whiteContrast > blackContrast ? '#FFFFFF' : '#000000';
  }

  /**
   * Aclara un color en un porcentaje dado
   * @param {string} color - Color base (hex)
   * @param {number} percentage - Porcentaje de aclarado (0-100)
   * @returns {string} - Color aclarado (hex)
   */
  static lighten(color, percentage) {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Percentage must be between 0 and 100');
    }

    const rgb = this.hexToRgb(color);
    if (!rgb) return color;

    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    const newL = Math.min(100, hsl.l + percentage);
    const newRgb = this.hslToRgb(hsl.h, hsl.s, newL);
    
    return this.rgbToHex(newRgb.r, newRgb.g, newRgb.b);
  }

  /**
   * Oscurece un color en un porcentaje dado
   * @param {string} color - Color base (hex)
   * @param {number} percentage - Porcentaje de oscurecimiento (0-100)
   * @returns {string} - Color oscurecido (hex)
   */
  static darken(color, percentage) {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Percentage must be between 0 and 100');
    }

    const rgb = this.hexToRgb(color);
    if (!rgb) return color;

    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    const newL = Math.max(0, hsl.l - percentage);
    const newRgb = this.hslToRgb(hsl.h, hsl.s, newL);
    
    return this.rgbToHex(newRgb.r, newRgb.g, newRgb.b);
  }

  /**
   * Ajusta la opacidad de un color
   * @param {string} color - Color base (hex)
   * @param {number} opacity - Opacidad (0-1)
   * @returns {string} - Color con opacidad (rgba)
   */
  static adjustOpacity(color, opacity) {
    if (opacity < 0 || opacity > 1) {
      throw new Error('Opacity must be between 0 and 1');
    }

    const rgb = this.hexToRgb(color);
    if (!rgb) return color;

    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
  }

  /**
   * Genera 9 variaciones de un color base (50-900)
   * @param {string} baseColor - Color base (hex)
   * @returns {object} - Objeto con todas las variaciones
   */
  static generateColorShades(baseColor) {
    const rgb = this.hexToRgb(baseColor);
    if (!rgb) return {};

    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    
    const shades = {};
    const lightnessValues = [95, 90, 80, 70, 60, 50, 40, 30, 20]; // 50-900
    
    lightnessValues.forEach((lightness, index) => {
      const shadeNumber = (index + 1) * 100;
      const newRgb = this.hslToRgb(hsl.h, hsl.s, lightness);
      shades[shadeNumber] = this.rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    });

    return shades;
  }

  /**
   * Valida y ajusta colores para cumplir WCAG AA
   * @param {string} textColor - Color del texto (hex)
   * @param {string} bgColor - Color de fondo (hex)
   * @param {number} fontSize - Tamaño de fuente (px)
   * @returns {object} - Colores ajustados y estado de cumplimiento
   */
  static ensureWCAGCompliance(textColor, bgColor, fontSize = 16) {
    const contrastRatio = this.getContrastRatio(textColor, bgColor);
    const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700);
    const requiredRatio = isLargeText ? 3 : 4.5;
    
    const result = {
      textColor,
      bgColor,
      contrastRatio,
      isCompliant: contrastRatio >= requiredRatio,
      level: contrastRatio >= 7 ? 'AAA' : contrastRatio >= requiredRatio ? 'AA' : 'Fail',
      adjusted: false
    };

    if (!result.isCompliant) {
      // Intentar ajustar el color del texto
      const adjustedText = this.adjustColorForContrast(textColor, bgColor, requiredRatio);
      const newContrast = this.getContrastRatio(adjustedText, bgColor);
      
      if (newContrast >= requiredRatio) {
        result.textColor = adjustedText;
        result.contrastRatio = newContrast;
        result.isCompliant = true;
        result.adjusted = true;
        result.level = newContrast >= 7 ? 'AAA' : 'AA';
      }
    }

    return result;
  }

  /**
   * Ajusta un color para cumplir con el ratio de contraste requerido
   * @param {string} textColor - Color del texto (hex)
   * @param {string} bgColor - Color de fondo (hex)
   * @param {number} requiredRatio - Ratio de contraste requerido
   * @returns {string} - Color ajustado (hex)
   */
  static adjustColorForContrast(textColor, bgColor, requiredRatio) {
    const bgLuminance = this.getLuminance(bgColor);
    const targetLuminance = bgLuminance > 0.5 
      ? bgLuminance - (0.05 / requiredRatio)
      : bgLuminance + (0.05 / requiredRatio);

    const rgb = this.hexToRgb(textColor);
    if (!rgb) return textColor;

    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    
    // Ajustar luminancia manteniendo hue y saturación
    const newRgb = this.hslToRgb(hsl.h, hsl.s, targetLuminance * 100);
    return this.rgbToHex(newRgb.r, newRgb.g, newRgb.b);
  }

  /**
   * Genera color complementario (opuesto en rueda de colores)
   * @param {string} baseColor - Color base (hex)
   * @returns {string} - Color complementario (hex)
   */
  static generateComplementaryColor(baseColor) {
    const rgb = this.hexToRgb(baseColor);
    if (!rgb) return baseColor;

    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    const complementaryHue = (hsl.h + 180) % 360;
    const newRgb = this.hslToRgb(complementaryHue, hsl.s, hsl.l);
    
    return this.rgbToHex(newRgb.r, newRgb.g, newRgb.b);
  }

  /**
   * Genera 2 colores análogos (±30° en rueda de colores)
   * @param {string} baseColor - Color base (hex)
   * @returns {object} - Objeto con colores análogos
   */
  static generateAnalogousColors(baseColor) {
    const rgb = this.hexToRgb(baseColor);
    if (!rgb) return {};

    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    
    const analogous1Hue = (hsl.h + 30) % 360;
    const analogous2Hue = (hsl.h - 30 + 360) % 360;
    
    const analogous1Rgb = this.hslToRgb(analogous1Hue, hsl.s, hsl.l);
    const analogous2Rgb = this.hslToRgb(analogous2Hue, hsl.s, hsl.l);
    
    return {
      analogous1: this.rgbToHex(analogous1Rgb.r, analogous1Rgb.g, analogous1Rgb.b),
      analogous2: this.rgbToHex(analogous2Rgb.r, analogous2Rgb.g, analogous2Rgb.b)
    };
  }

  /**
   * Genera paleta completa de colores armónicos
   * @param {string} primaryColor - Color primario (hex)
   * @returns {object} - Paleta completa de colores
   */
  static generateHarmoniousPalette(primaryColor) {
    const complementary = this.generateComplementaryColor(primaryColor);
    const analogous = this.generateAnalogousColors(primaryColor);
    const primaryShades = this.generateColorShades(primaryColor);
    const complementaryShades = this.generateColorShades(complementary);
    
    return {
      primary: {
        base: primaryColor,
        shades: primaryShades,
        light: this.lighten(primaryColor, 20),
        dark: this.darken(primaryColor, 20)
      },
      complementary: {
        base: complementary,
        shades: complementaryShades,
        light: this.lighten(complementary, 20),
        dark: this.darken(complementary, 20)
      },
      analogous: {
        ...analogous,
        light1: this.lighten(analogous.analogous1, 20),
        light2: this.lighten(analogous.analogous2, 20),
        dark1: this.darken(analogous.analogous1, 20),
        dark2: this.darken(analogous.analogous2, 20)
      },
      neutral: {
        white: '#FFFFFF',
        black: '#000000',
        gray50: '#F9FAFB',
        gray100: '#F3F4F6',
        gray200: '#E5E7EB',
        gray300: '#D1D5DB',
        gray400: '#9CA3AF',
        gray500: '#6B7280',
        gray600: '#4B5563',
        gray700: '#374151',
        gray800: '#1F2937',
        gray900: '#111827'
      }
    };
  }
}

// Exportar para uso en módulos ES6
export { DesignSystemUtils };

// Exportar como default también
export default DesignSystemUtils;

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
  window.DesignSystemUtils = DesignSystemUtils;
}
