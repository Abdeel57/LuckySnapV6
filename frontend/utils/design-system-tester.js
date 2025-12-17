/* ═══════════════════════════════════════════════════════════
   TESTING SUITE - DESIGN SYSTEM UTILITIES
   ═══════════════════════════════════════════════════════════ */

// Importar las utilidades
import { DesignSystemUtils } from './design-system-utils';

class DesignSystemTester {
  constructor() {
    this.testResults = [];
    this.passedTests = 0;
    this.failedTests = 0;
  }

  // Función para ejecutar un test
  runTest(testName, testFunction) {
    try {
      const result = testFunction();
      if (result) {
        this.passedTests++;
        this.testResults.push({ name: testName, status: 'PASS', message: 'OK' });
        console.log(`✅ ${testName}: PASS`);
      } else {
        this.failedTests++;
        this.testResults.push({ name: testName, status: 'FAIL', message: 'Test returned false' });
        console.log(`❌ ${testName}: FAIL`);
      }
    } catch (error) {
      this.failedTests++;
      this.testResults.push({ name: testName, status: 'ERROR', message: error.message });
      console.log(`❌ ${testName}: ERROR - ${error.message}`);
    }
  }

  // Test 1: Conversión de colores
  testColorConversions() {
    console.log('\n🧪 TESTING COLOR CONVERSIONS...');
    
    this.runTest('Hex to RGB conversion', () => {
      const rgb = DesignSystemUtils.hexToRgb('#FF0000');
      return rgb && rgb.r === 255 && rgb.g === 0 && rgb.b === 0;
    });

    this.runTest('RGB to Hex conversion', () => {
      const hex = DesignSystemUtils.rgbToHex(255, 0, 0);
      return hex === '#ff0000';
    });

    this.runTest('RGB to HSL conversion', () => {
      const hsl = DesignSystemUtils.rgbToHsl(255, 0, 0);
      return hsl && hsl.h === 0 && hsl.s === 100 && hsl.l === 50;
    });

    this.runTest('HSL to RGB conversion', () => {
      const rgb = DesignSystemUtils.hslToRgb(0, 100, 50);
      return rgb && rgb.r === 255 && rgb.g === 0 && rgb.b === 0;
    });
  }

  // Test 2: Funciones de luminancia y contraste
  testLuminanceAndContrast() {
    console.log('\n🧪 TESTING LUMINANCE AND CONTRAST...');
    
    this.runTest('Luminance calculation', () => {
      const whiteLuminance = DesignSystemUtils.getLuminance('#FFFFFF');
      const blackLuminance = DesignSystemUtils.getLuminance('#000000');
      return whiteLuminance > blackLuminance && whiteLuminance === 1 && blackLuminance === 0;
    });

    this.runTest('Contrast ratio calculation', () => {
      const ratio = DesignSystemUtils.getContrastRatio('#FFFFFF', '#000000');
      return ratio === 21; // Máximo ratio posible
    });

    this.runTest('Contrast text selection', () => {
      const whiteText = DesignSystemUtils.getContrastText('#000000');
      const blackText = DesignSystemUtils.getContrastText('#FFFFFF');
      return whiteText === '#FFFFFF' && blackText === '#000000';
    });
  }

  // Test 3: Funciones de ajuste de color
  testColorAdjustments() {
    console.log('\n🧪 TESTING COLOR ADJUSTMENTS...');
    
    this.runTest('Lighten color', () => {
      const lightened = DesignSystemUtils.lighten('#000000', 50);
      const rgb = DesignSystemUtils.hexToRgb(lightened);
      return rgb && rgb.r === 128 && rgb.g === 128 && rgb.b === 128;
    });

    this.runTest('Darken color', () => {
      const darkened = DesignSystemUtils.darken('#FFFFFF', 50);
      const rgb = DesignSystemUtils.hexToRgb(darkened);
      return rgb && rgb.r === 128 && rgb.g === 128 && rgb.b === 128;
    });

    this.runTest('Adjust opacity', () => {
      const rgba = DesignSystemUtils.adjustOpacity('#FF0000', 0.5);
      return rgba === 'rgba(255, 0, 0, 0.5)';
    });
  }

  // Test 4: Generación de paletas
  testPaletteGeneration() {
    console.log('\n🧪 TESTING PALETTE GENERATION...');
    
    this.runTest('Generate color shades', () => {
      const shades = DesignSystemUtils.generateColorShades('#FF0000');
      return shades && Object.keys(shades).length === 9 && shades[500] === '#FF0000';
    });

    this.runTest('Generate complementary color', () => {
      const complementary = DesignSystemUtils.generateComplementaryColor('#FF0000');
      const rgb = DesignSystemUtils.hexToRgb(complementary);
      return rgb && rgb.r === 0 && rgb.g === 255 && rgb.b === 255; // Cyan
    });

    this.runTest('Generate analogous colors', () => {
      const analogous = DesignSystemUtils.generateAnalogousColors('#FF0000');
      return analogous && analogous.analogous1 && analogous.analogous2;
    });

    this.runTest('Generate harmonious palette', () => {
      const palette = DesignSystemUtils.generateHarmoniousPalette('#FF0000');
      return palette && palette.primary && palette.complementary && palette.analogous;
    });
  }

  // Test 5: Validación WCAG
  testWCAGCompliance() {
    console.log('\n🧪 TESTING WCAG COMPLIANCE...');
    
    this.runTest('WCAG compliance check - AA compliant', () => {
      const compliance = DesignSystemUtils.ensureWCAGCompliance('#000000', '#FFFFFF', 16);
      return compliance.isCompliant && compliance.level === 'AAA';
    });

    this.runTest('WCAG compliance check - AA non-compliant', () => {
      const compliance = DesignSystemUtils.ensureWCAGCompliance('#CCCCCC', '#FFFFFF', 16);
      return !compliance.isCompliant && compliance.level === 'Fail';
    });

    this.runTest('WCAG compliance check - large text', () => {
      const compliance = DesignSystemUtils.ensureWCAGCompliance('#666666', '#FFFFFF', 18);
      return compliance.isCompliant && compliance.level === 'AA';
    });
  }

  // Test 6: Casos edge y validación de errores
  testEdgeCases() {
    console.log('\n🧪 TESTING EDGE CASES...');
    
    this.runTest('Invalid hex color handling', () => {
      const rgb = DesignSystemUtils.hexToRgb('invalid');
      return rgb === null;
    });

    this.runTest('Percentage validation - lighten', () => {
      try {
        DesignSystemUtils.lighten('#FF0000', 150);
        return false; // Should throw error
      } catch (error) {
        return error.message.includes('Percentage must be between 0 and 100');
      }
    });

    this.runTest('Percentage validation - darken', () => {
      try {
        DesignSystemUtils.darken('#FF0000', -10);
        return false; // Should throw error
      } catch (error) {
        return error.message.includes('Percentage must be between 0 and 100');
      }
    });

    this.runTest('Opacity validation', () => {
      try {
        DesignSystemUtils.adjustOpacity('#FF0000', 1.5);
        return false; // Should throw error
      } catch (error) {
        return error.message.includes('Opacity must be between 0 and 1');
      }
    });
  }

  // Ejecutar todos los tests
  runAllTests() {
    console.log('🚀 STARTING DESIGN SYSTEM TESTING SUITE...\n');
    
    this.testColorConversions();
    this.testLuminanceAndContrast();
    this.testColorAdjustments();
    this.testPaletteGeneration();
    this.testWCAGCompliance();
    this.testEdgeCases();
    
    this.printSummary();
  }

  // Imprimir resumen de resultados
  printSummary() {
    console.log('\n📊 TESTING SUMMARY:');
    console.log(`✅ Passed: ${this.passedTests}`);
    console.log(`❌ Failed: ${this.failedTests}`);
    console.log(`📈 Success Rate: ${((this.passedTests / (this.passedTests + this.failedTests)) * 100).toFixed(1)}%`);
    
    if (this.failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults
        .filter(result => result.status !== 'PASS')
        .forEach(result => {
          console.log(`  - ${result.name}: ${result.message}`);
        });
    }
    
    console.log('\n🎯 TESTING COMPLETE!');
    return this.failedTests === 0;
  }
}

// Ejecutar tests si se llama directamente
if (typeof window !== 'undefined') {
  window.DesignSystemTester = DesignSystemTester;
  
  // Auto-ejecutar tests en desarrollo
  if (process.env.NODE_ENV === 'development') {
    const tester = new DesignSystemTester();
    tester.runAllTests();
  }
}

export default DesignSystemTester;
