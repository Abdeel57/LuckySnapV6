// Script para verificar que el sistema esté funcionando
const http = require('http');

console.log('🔍 Verificando sistema Lucky Snap...\n');

// Test 1: Backend Health
console.log('1. Verificando backend...');
const backendReq = http.request('http://localhost:3000/api/health', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const health = JSON.parse(data);
      console.log('✅ Backend funcionando:', health.status);
      console.log(`   📊 Datos: ${health.users} usuarios, ${health.raffles} rifas, ${health.orders} órdenes`);
      
      // Test 2: Admin Orders
      console.log('\n2. Verificando endpoint de órdenes...');
      const ordersReq = http.request('http://localhost:3000/api/admin/orders', (ordersRes) => {
        let ordersData = '';
        ordersRes.on('data', chunk => ordersData += chunk);
        ordersRes.on('end', () => {
          try {
            const orders = JSON.parse(ordersData);
            console.log(`✅ Órdenes cargadas: ${orders.length} órdenes`);
            
            // Test 3: Frontend
            console.log('\n3. Verificando frontend...');
            const frontendReq = http.request('http://localhost:5173', (frontendRes) => {
              console.log(`✅ Frontend respondiendo: ${frontendRes.statusCode}`);
              
              console.log('\n🎉 SISTEMA COMPLETAMENTE FUNCIONAL');
              console.log('📱 Frontend: http://localhost:5173');
              console.log('🔧 Backend: http://localhost:3000');
              console.log('📋 Admin: http://localhost:5173/admin/dashboard');
              console.log('📝 Apartados: http://localhost:5173/admin/apartados');
            });
            
            frontendReq.on('error', (err) => {
              console.log('❌ Frontend no disponible:', err.message);
              console.log('💡 Intenta: cd frontend && npm run dev');
            });
            
            frontendReq.end();
          } catch (err) {
            console.log('❌ Error parseando órdenes:', err.message);
          }
        });
      });
      
      ordersReq.on('error', (err) => {
        console.log('❌ Error cargando órdenes:', err.message);
      });
      
      ordersReq.end();
    } catch (err) {
      console.log('❌ Error parseando health:', err.message);
    }
  });
});

backendReq.on('error', (err) => {
  console.log('❌ Backend no disponible:', err.message);
  console.log('💡 Intenta: cd backend && node start-prisma-backend.js');
});

backendReq.end();
