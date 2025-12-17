/* ═══════════════════════════════════════════════════════════
   TESTING SUITE - BACKEND INTEGRATION
   ═══════════════════════════════════════════════════════════ */

import { getSettings, adminUpdateSettings } from '../services/api';

class BackendIntegrationTester {
  constructor() {
    this.testResults = [];
    this.passedTests = 0;
    this.failedTests = 0;
  }

  // Función para ejecutar un test
  async runTest(testName, testFunction) {
    try {
      const result = await testFunction();
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

  // Test 1: Obtener configuración
  async testGetSettings() {
    console.log('\n🧪 TESTING GET SETTINGS...');
    
    await this.runTest('Get settings from backend', async () => {
      const settings = await getSettings();
      return settings && 
             settings.appearance && 
             settings.appearance.colors &&
             settings.contactInfo &&
             settings.socialLinks;
    });

    await this.runTest('Settings have required fields', async () => {
      const settings = await getSettings();
      return settings.appearance.colors.backgroundPrimary &&
             settings.appearance.colors.backgroundSecondary &&
             settings.appearance.colors.accent &&
             settings.appearance.colors.action;
    });

    await this.runTest('Settings have valid color format', async () => {
      const settings = await getSettings();
      const colors = settings.appearance.colors;
      return /^#[0-9A-F]{6}$/i.test(colors.backgroundPrimary) &&
             /^#[0-9A-F]{6}$/i.test(colors.backgroundSecondary) &&
             /^#[0-9A-F]{6}$/i.test(colors.accent) &&
             /^#[0-9A-F]{6}$/i.test(colors.action);
    });
  }

  // Test 2: Actualizar configuración
  async testUpdateSettings() {
    console.log('\n🧪 TESTING UPDATE SETTINGS...');
    
    const testSettings = {
      appearance: {
        siteName: 'Lucky Snap Test',
        logoAnimation: 'rotate',
        colors: {
          backgroundPrimary: '#111827',
          backgroundSecondary: '#1F2937',
          accent: '#ec4899',
          action: '#0ea5e9'
        }
      },
      contactInfo: {
        whatsapp: '+50499999999',
        email: 'test@example.com'
      },
      socialLinks: {
        facebookUrl: 'https://facebook.com/test',
        instagramUrl: 'https://instagram.com/test',
        twitterUrl: 'https://twitter.com/test'
      },
      paymentAccounts: [
        {
          name: 'Test Account',
          number: '1234567890',
          type: 'bank'
        }
      ],
      faqs: [
        {
          question: 'Test Question',
          answer: 'Test Answer'
        }
      ]
    };

    await this.runTest('Update settings with valid data', async () => {
      const result = await adminUpdateSettings(testSettings);
      return result && result.appearance && result.appearance.siteName === 'Lucky Snap Test';
    });

    await this.runTest('Settings persist after update', async () => {
      const settings = await getSettings();
      return settings.appearance.siteName === 'Lucky Snap Test';
    });

    await this.runTest('Payment accounts are properly stored', async () => {
      const settings = await getSettings();
      return settings.paymentAccounts && 
             Array.isArray(settings.paymentAccounts) &&
             settings.paymentAccounts.length > 0;
    });

    await this.runTest('FAQs are properly stored', async () => {
      const settings = await getSettings();
      return settings.faqs && 
             Array.isArray(settings.faqs) &&
             settings.faqs.length > 0;
    });
  }

  // Test 3: Validación de datos
  async testDataValidation() {
    console.log('\n🧪 TESTING DATA VALIDATION...');
    
    await this.runTest('Invalid color format handling', async () => {
      try {
        const invalidSettings = {
          appearance: {
            colors: {
              backgroundPrimary: 'invalid-color',
              backgroundSecondary: '#1F2937',
              accent: '#ec4899',
              action: '#0ea5e9'
            }
          }
        };
        await adminUpdateSettings(invalidSettings);
        return false; // Should not succeed
      } catch (error) {
        return true; // Expected to fail
      }
    });

    await this.runTest('Empty required fields handling', async () => {
      try {
        const emptySettings = {
          appearance: {
            siteName: '', // Empty required field
            colors: {
              backgroundPrimary: '#111827',
              backgroundSecondary: '#1F2937',
              accent: '#ec4899',
              action: '#0ea5e9'
            }
          }
        };
        await adminUpdateSettings(emptySettings);
        return false; // Should not succeed
      } catch (error) {
        return true; // Expected to fail
      }
    });
  }

  // Test 4: Rendimiento
  async testPerformance() {
    console.log('\n🧪 TESTING PERFORMANCE...');
    
    await this.runTest('Get settings response time', async () => {
      const startTime = performance.now();
      await getSettings();
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      console.log(`   Response time: ${responseTime.toFixed(2)}ms`);
      return responseTime < 2000; // Less than 2 seconds
    });

    await this.runTest('Update settings response time', async () => {
      const testSettings = {
        appearance: {
          siteName: 'Performance Test',
          colors: {
            backgroundPrimary: '#111827',
            backgroundSecondary: '#1F2937',
            accent: '#ec4899',
            action: '#0ea5e9'
          }
        }
      };
      
      const startTime = performance.now();
      await adminUpdateSettings(testSettings);
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      console.log(`   Response time: ${responseTime.toFixed(2)}ms`);
      return responseTime < 3000; // Less than 3 seconds
    });
  }

  // Test 5: Casos edge
  async testEdgeCases() {
    console.log('\n🧪 TESTING EDGE CASES...');
    
    await this.runTest('Large data handling', async () => {
      const largeSettings = {
        appearance: {
          siteName: 'Large Data Test',
          colors: {
            backgroundPrimary: '#111827',
            backgroundSecondary: '#1F2937',
            accent: '#ec4899',
            action: '#0ea5e9'
          }
        },
        paymentAccounts: Array(100).fill().map((_, i) => ({
          name: `Account ${i}`,
          number: `123456789${i}`,
          type: 'bank'
        })),
        faqs: Array(100).fill().map((_, i) => ({
          question: `Question ${i}`,
          answer: `Answer ${i}`.repeat(10) // Long answer
        }))
      };
      
      const result = await adminUpdateSettings(largeSettings);
      return result && result.paymentAccounts.length === 100;
    });

    await this.runTest('Special characters handling', async () => {
      const specialSettings = {
        appearance: {
          siteName: 'Test with special chars: áéíóú ñü',
          colors: {
            backgroundPrimary: '#111827',
            backgroundSecondary: '#1F2937',
            accent: '#ec4899',
            action: '#0ea5e9'
          }
        }
      };
      
      const result = await adminUpdateSettings(specialSettings);
      return result && result.appearance.siteName.includes('áéíóú');
    });
  }

  // Ejecutar todos los tests
  async runAllTests() {
    console.log('🚀 STARTING BACKEND INTEGRATION TESTING SUITE...\n');
    
    await this.testGetSettings();
    await this.testUpdateSettings();
    await this.testDataValidation();
    await this.testPerformance();
    await this.testEdgeCases();
    
    this.printSummary();
  }

  // Imprimir resumen de resultados
  printSummary() {
    console.log('\n📊 BACKEND INTEGRATION TESTING SUMMARY:');
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
    
    console.log('\n🎯 BACKEND INTEGRATION TESTING COMPLETE!');
    return this.failedTests === 0;
  }
}

// Ejecutar tests si se llama directamente
if (typeof window !== 'undefined') {
  window.BackendIntegrationTester = BackendIntegrationTester;
  
  // Auto-ejecutar tests en desarrollo
  if (process.env.NODE_ENV === 'development') {
    const tester = new BackendIntegrationTester();
    tester.runAllTests();
  }
}

export default BackendIntegrationTester;
