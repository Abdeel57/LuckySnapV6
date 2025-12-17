/* ═══════════════════════════════════════════════════════════
   MANUAL TESTING SCRIPT - BROWSER CONSOLE
   ═══════════════════════════════════════════════════════════ */

// Ejecutar este script en la consola del navegador para testing manual

console.log('🚀 STARTING MANUAL TESTING SCRIPT...');
console.log('═══════════════════════════════════════════════════════════');

// Test 1: Verificar que los Design Tokens están cargados
function testDesignTokens() {
  console.log('\n🧪 Testing Design Tokens...');
  
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  
  const requiredTokens = [
    '--color-brand-primary',
    '--color-brand-secondary', 
    '--color-brand-accent',
    '--bg-primary',
    '--bg-secondary',
    '--btn-primary-bg',
    '--btn-primary-text',
    '--text-primary',
    '--text-secondary',
    '--border-brand',
    '--shadow-brand-sm',
    '--shadow-brand-md'
  ];
  
  let tokensLoaded = 0;
  requiredTokens.forEach(token => {
    const value = computedStyle.getPropertyValue(token);
    if (value && value.trim() !== '') {
      tokensLoaded++;
      console.log(`   ✅ ${token}: ${value}`);
    } else {
      console.log(`   ❌ ${token}: NOT FOUND`);
    }
  });
  
  console.log(`   📊 Tokens loaded: ${tokensLoaded}/${requiredTokens.length}`);
  return tokensLoaded === requiredTokens.length;
}

// Test 2: Verificar que los componentes de personalización están presentes
function testCustomizationComponents() {
  console.log('\n🧪 Testing Customization Components...');
  
  // Verificar ColorPreview
  const colorPreview = document.querySelector('[data-testid="color-preview"]') || 
                      document.querySelector('.color-preview') ||
                      document.querySelector('iframe[title*="Preview"]');
  
  if (colorPreview) {
    console.log('   ✅ ColorPreview component found');
  } else {
    console.log('   ❌ ColorPreview component not found');
  }
  
  // Verificar ColorPresets
  const colorPresets = document.querySelector('[data-testid="color-presets"]') ||
                      document.querySelector('.color-presets') ||
                      document.querySelector('button:contains("Presets Profesionales")');
  
  if (colorPresets) {
    console.log('   ✅ ColorPresets component found');
  } else {
    console.log('   ❌ ColorPresets component not found');
  }
  
  return colorPreview && colorPresets;
}

// Test 3: Verificar que las funciones de diseño están disponibles
function testDesignSystemFunctions() {
  console.log('\n🧪 Testing Design System Functions...');
  
  if (typeof window.DesignSystemUtils !== 'undefined') {
    console.log('   ✅ DesignSystemUtils available');
    
    // Test función básica
    try {
      const contrastText = window.DesignSystemUtils.getContrastText('#000000');
      console.log(`   ✅ getContrastText('#000000'): ${contrastText}`);
    } catch (error) {
      console.log(`   ❌ getContrastText error: ${error.message}`);
    }
    
    return true;
  } else {
    console.log('   ❌ DesignSystemUtils not available');
    return false;
  }
}

// Test 4: Verificar que la página pública carga correctamente
function testPublicPageLoad() {
  console.log('\n🧪 Testing Public Page Load...');
  
  // Verificar elementos principales
  const heroSection = document.querySelector('section[class*="hero"]') ||
                     document.querySelector('.hero') ||
                     document.querySelector('h1');
  
  if (heroSection) {
    console.log('   ✅ Hero section found');
  } else {
    console.log('   ❌ Hero section not found');
  }
  
  // Verificar cards de rifas
  const raffleCards = document.querySelectorAll('[class*="card"]');
  console.log(`   📊 Raffle cards found: ${raffleCards.length}`);
  
  // Verificar botones
  const buttons = document.querySelectorAll('button');
  console.log(`   📊 Buttons found: ${buttons.length}`);
  
  return heroSection && raffleCards.length > 0;
}

// Test 5: Verificar que las animaciones funcionan
function testAnimations() {
  console.log('\n🧪 Testing Animations...');
  
  // Verificar que Framer Motion está cargado
  if (typeof window.motion !== 'undefined' || 
      document.querySelector('[data-framer-motion]')) {
    console.log('   ✅ Framer Motion detected');
  } else {
    console.log('   ❌ Framer Motion not detected');
  }
  
  // Verificar transiciones CSS
  const elementsWithTransitions = document.querySelectorAll('*[style*="transition"]');
  console.log(`   📊 Elements with transitions: ${elementsWithTransitions.length}`);
  
  return elementsWithTransitions.length > 0;
}

// Test 6: Verificar que la configuración del admin funciona
function testAdminConfiguration() {
  console.log('\n🧪 Testing Admin Configuration...');
  
  // Verificar que estamos en la página de admin
  const isAdminPage = window.location.pathname.includes('/admin');
  
  if (isAdminPage) {
    console.log('   ✅ Admin page detected');
    
    // Verificar formulario de configuración
    const configForm = document.querySelector('form') ||
                      document.querySelector('[class*="settings"]');
    
    if (configForm) {
      console.log('   ✅ Configuration form found');
    } else {
      console.log('   ❌ Configuration form not found');
    }
    
    return configForm;
  } else {
    console.log('   ⚠️  Not on admin page - skipping admin tests');
    return true;
  }
}

// Test 7: Verificar performance básica
function testBasicPerformance() {
  console.log('\n🧪 Testing Basic Performance...');
  
  // Verificar tiempo de carga
  const loadTime = performance.now();
  console.log(`   ⏱️  Page load time: ${loadTime.toFixed(2)}ms`);
  
  // Verificar uso de memoria
  if (performance.memory) {
    const memoryUsage = performance.memory.usedJSHeapSize;
    const memoryLimit = performance.memory.jsHeapSizeLimit;
    const memoryPercentage = (memoryUsage / memoryLimit) * 100;
    
    console.log(`   💾 Memory usage: ${(memoryUsage / 1024 / 1024).toFixed(2)}MB (${memoryPercentage.toFixed(1)}%)`);
    
    return memoryPercentage < 80;
  }
  
  return true;
}

// Ejecutar todos los tests manuales
function runManualTests() {
  console.log('🎯 RUNNING MANUAL TESTING SUITE...\n');
  
  const results = {
    designTokens: testDesignTokens(),
    customizationComponents: testCustomizationComponents(),
    designSystemFunctions: testDesignSystemFunctions(),
    publicPageLoad: testPublicPageLoad(),
    animations: testAnimations(),
    adminConfiguration: testAdminConfiguration(),
    basicPerformance: testBasicPerformance()
  };
  
  // Resumen
  console.log('\n📊 MANUAL TESTING SUMMARY:');
  console.log('═══════════════════════════════════════════════════════════');
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅' : '❌';
    console.log(`   ${status} ${test}: ${passed ? 'PASS' : 'FAIL'}`);
  });
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL MANUAL TESTS PASSED! System is ready!');
  } else {
    console.log('⚠️  Some tests failed - review issues above');
  }
  
  return results;
}

// Auto-ejecutar tests
const manualTestResults = runManualTests();

// Exportar resultados para inspección
window.manualTestResults = manualTestResults;

console.log('\n🔍 Test results available in window.manualTestResults');
console.log('═══════════════════════════════════════════════════════════');
