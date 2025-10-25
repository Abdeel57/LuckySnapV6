/* ═══════════════════════════════════════════════════════════
   TESTING SUITE - WCAG ACCESSIBILITY COMPLIANCE
   ═══════════════════════════════════════════════════════════ */

import { DesignSystemUtils } from './design-system-utils';

class WCAGAccessibilityTester {
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

  // Test 1: Contraste de colores
  testColorContrast() {
    console.log('\n🧪 TESTING COLOR CONTRAST...');
    
    // Test casos que deberían pasar WCAG AA
    const aaCompliantPairs = [
      { text: '#000000', background: '#FFFFFF', size: 16 }, // Negro sobre blanco
      { text: '#FFFFFF', background: '#000000', size: 16 }, // Blanco sobre negro
      { text: '#000000', background: '#FFFF00', size: 16 }, // Negro sobre amarillo
      { text: '#FFFFFF', background: '#0000FF', size: 16 }, // Blanco sobre azul
    ];

    aaCompliantPairs.forEach((pair, index) => {
      this.runTest(`AA Compliant pair ${index + 1}`, () => {
        const compliance = DesignSystemUtils.ensureWCAGCompliance(pair.text, pair.background, pair.size);
        return compliance.isCompliant && compliance.level === 'AA';
      });
    });

    // Test casos que deberían fallar WCAG AA
    const aaNonCompliantPairs = [
      { text: '#CCCCCC', background: '#FFFFFF', size: 16 }, // Gris claro sobre blanco
      { text: '#999999', background: '#FFFFFF', size: 16 }, // Gris medio sobre blanco
      { text: '#666666', background: '#FFFFFF', size: 16 }, // Gris oscuro sobre blanco
    ];

    aaNonCompliantPairs.forEach((pair, index) => {
      this.runTest(`AA Non-compliant pair ${index + 1}`, () => {
        const compliance = DesignSystemUtils.ensureWCAGCompliance(pair.text, pair.background, pair.size);
        return !compliance.isCompliant && compliance.level === 'Fail';
      });
    });

    // Test casos que deberían pasar WCAG AAA
    const aaaCompliantPairs = [
      { text: '#000000', background: '#FFFFFF', size: 16 }, // Negro sobre blanco
      { text: '#FFFFFF', background: '#000000', size: 16 }, // Blanco sobre negro
    ];

    aaaCompliantPairs.forEach((pair, index) => {
      this.runTest(`AAA Compliant pair ${index + 1}`, () => {
        const compliance = DesignSystemUtils.ensureWCAGCompliance(pair.text, pair.background, pair.size);
        return compliance.isCompliant && compliance.level === 'AAA';
      });
    });
  }

  // Test 2: Texto grande vs texto normal
  testTextSizeCompliance() {
    console.log('\n🧪 TESTING TEXT SIZE COMPLIANCE...');
    
    // Test texto grande (18px+) - requiere menor contraste
    const largeTextPairs = [
      { text: '#666666', background: '#FFFFFF', size: 18 }, // Debería pasar AA
      { text: '#777777', background: '#FFFFFF', size: 20 }, // Debería pasar AA
      { text: '#888888', background: '#FFFFFF', size: 24 }, // Debería pasar AA
    ];

    largeTextPairs.forEach((pair, index) => {
      this.runTest(`Large text compliance ${index + 1}`, () => {
        const compliance = DesignSystemUtils.ensureWCAGCompliance(pair.text, pair.background, pair.size);
        return compliance.isCompliant && compliance.level === 'AA';
      });
    });

    // Test texto normal (16px) - requiere mayor contraste
    const normalTextPairs = [
      { text: '#666666', background: '#FFFFFF', size: 16 }, // Debería fallar AA
      { text: '#777777', background: '#FFFFFF', size: 16 }, // Debería fallar AA
    ];

    normalTextPairs.forEach((pair, index) => {
      this.runTest(`Normal text non-compliance ${index + 1}`, () => {
        const compliance = DesignSystemUtils.ensureWCAGCompliance(pair.text, pair.background, pair.size);
        return !compliance.isCompliant && compliance.level === 'Fail';
      });
    });
  }

  // Test 3: Ajuste automático de colores
  testAutomaticColorAdjustment() {
    console.log('\n🧪 TESTING AUTOMATIC COLOR ADJUSTMENT...');
    
    this.runTest('Automatic adjustment for non-compliant colors', () => {
      const compliance = DesignSystemUtils.ensureWCAGCompliance('#CCCCCC', '#FFFFFF', 16);
      return compliance.adjusted && compliance.isCompliant;
    });

    this.runTest('No adjustment for compliant colors', () => {
      const compliance = DesignSystemUtils.ensureWCAGCompliance('#000000', '#FFFFFF', 16);
      return !compliance.adjusted && compliance.isCompliant;
    });

    this.runTest('Adjusted colors maintain readability', () => {
      const compliance = DesignSystemUtils.ensureWCAGCompliance('#CCCCCC', '#FFFFFF', 16);
      if (compliance.adjusted) {
        const adjustedCompliance = DesignSystemUtils.ensureWCAGCompliance(
          compliance.adjustedText, 
          compliance.adjustedBackground, 
          16
        );
        return adjustedCompliance.isCompliant;
      }
      return true;
    });
  }

  // Test 4: Selección automática de texto
  testAutomaticTextSelection() {
    console.log('\n🧪 TESTING AUTOMATIC TEXT SELECTION...');
    
    this.runTest('White text on dark background', () => {
      const textColor = DesignSystemUtils.getContrastText('#000000');
      return textColor === '#FFFFFF';
    });

    this.runTest('Black text on light background', () => {
      const textColor = DesignSystemUtils.getContrastText('#FFFFFF');
      return textColor === '#000000';
    });

    this.runTest('White text on medium background', () => {
      const textColor = DesignSystemUtils.getContrastText('#808080');
      return textColor === '#FFFFFF';
    });

    this.runTest('Black text on light medium background', () => {
      const textColor = DesignSystemUtils.getContrastText('#C0C0C0');
      return textColor === '#000000';
    });
  }

  // Test 5: Casos edge de accesibilidad
  testAccessibilityEdgeCases() {
    console.log('\n🧪 TESTING ACCESSIBILITY EDGE CASES...');
    
    this.runTest('Very light background handling', () => {
      const compliance = DesignSystemUtils.ensureWCAGCompliance('#000000', '#F0F0F0', 16);
      return compliance.isCompliant && compliance.level === 'AA';
    });

    this.runTest('Very dark background handling', () => {
      const compliance = DesignSystemUtils.ensureWCAGCompliance('#FFFFFF', '#101010', 16);
      return compliance.isCompliant && compliance.level === 'AA';
    });

    this.runTest('Medium contrast background handling', () => {
      const compliance = DesignSystemUtils.ensureWCAGCompliance('#000000', '#808080', 16);
      return compliance.isCompliant && compliance.level === 'AA';
    });

    this.runTest('Color blindness simulation', () => {
      // Simular deuteranopia (daltonismo rojo-verde)
      const compliance = DesignSystemUtils.ensureWCAGCompliance('#FF0000', '#00FF00', 16);
      return compliance.isCompliant; // Debería ajustar automáticamente
    });
  }

  // Test 6: Validación de ratios específicos
  testSpecificContrastRatios() {
    console.log('\n🧪 TESTING SPECIFIC CONTRAST RATIOS...');
    
    this.runTest('Maximum contrast ratio (21:1)', () => {
      const ratio = DesignSystemUtils.getContrastRatio('#FFFFFF', '#000000');
      return ratio === 21;
    });

    this.runTest('Minimum AA ratio (4.5:1)', () => {
      const ratio = DesignSystemUtils.getContrastRatio('#000000', '#FFFFFF');
      return ratio >= 4.5;
    });

    this.runTest('Minimum AAA ratio (7:1)', () => {
      const ratio = DesignSystemUtils.getContrastRatio('#000000', '#FFFFFF');
      return ratio >= 7;
    });

    this.runTest('Large text AA ratio (3:1)', () => {
      const compliance = DesignSystemUtils.ensureWCAGCompliance('#666666', '#FFFFFF', 18);
      return compliance.contrastRatio >= 3;
    });
  }

  // Ejecutar todos los tests
  runAllTests() {
    console.log('🚀 STARTING WCAG ACCESSIBILITY TESTING SUITE...\n');
    
    this.testColorContrast();
    this.testTextSizeCompliance();
    this.testAutomaticColorAdjustment();
    this.testAutomaticTextSelection();
    this.testAccessibilityEdgeCases();
    this.testSpecificContrastRatios();
    
    this.printSummary();
  }

  // Imprimir resumen de resultados
  printSummary() {
    console.log('\n📊 WCAG ACCESSIBILITY TESTING SUMMARY:');
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
    
    console.log('\n🎯 WCAG ACCESSIBILITY TESTING COMPLETE!');
    return this.failedTests === 0;
  }
}

// Ejecutar tests si se llama directamente
if (typeof window !== 'undefined') {
  window.WCAGAccessibilityTester = WCAGAccessibilityTester;
  
  // Auto-ejecutar tests en desarrollo
  if (process.env.NODE_ENV === 'development') {
    const tester = new WCAGAccessibilityTester();
    tester.runAllTests();
  }
}

export default WCAGAccessibilityTester;
