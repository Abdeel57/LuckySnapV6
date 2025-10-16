const API_URL = 'http://localhost:3000/api';

async function getFetch() {
  if (typeof fetch === 'function') return fetch;
  const mod = await import('node-fetch');
  return mod.default;
}

async function testOrdersEndpoint() {
  console.log('🧪 Iniciando pruebas del endpoint de órdenes...');

  try {
    const fetch = await getFetch();
    // Probar el endpoint de salud
    console.log('1️⃣ Probando endpoint de salud...');
    const healthResponse = await fetch(`${API_URL}/health`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Endpoint de salud funcionando:', healthData);
    } else {
      console.log('❌ Endpoint de salud falló:', healthResponse.status);
    }

    // Probar el endpoint de órdenes del admin
    console.log('2️⃣ Probando endpoint de órdenes del admin...');
    const ordersResponse = await fetch(`${API_URL}/admin/orders`);
    if (ordersResponse.ok) {
      const ordersData = await ordersResponse.json();
      console.log('✅ Endpoint de órdenes funcionando:', {
        total: ordersData.length,
        sample: ordersData[0] ? {
          id: ordersData[0].id,
          folio: ordersData[0].folio,
          status: ordersData[0].status,
          customer: ordersData[0].customer?.name || 'Sin cliente'
        } : 'No hay órdenes'
      });
    } else {
      const errorText = await ordersResponse.text();
      console.log('❌ Endpoint de órdenes falló:', ordersResponse.status, errorText);
    }

    // Probar el endpoint de rifas
    console.log('3️⃣ Probando endpoint de rifas...');
    const rafflesResponse = await fetch(`${API_URL}/admin/raffles`);
    if (rafflesResponse.ok) {
      const rafflesData = await rafflesResponse.json();
      console.log('✅ Endpoint de rifas funcionando:', {
        total: rafflesData.length,
        sample: rafflesData[0] ? {
          id: rafflesData[0].id,
          title: rafflesData[0].title,
          status: rafflesData[0].status
        } : 'No hay rifas'
      });
    } else {
      const errorText = await rafflesResponse.text();
      console.log('❌ Endpoint de rifas falló:', rafflesResponse.status, errorText);
    }

    console.log('🎉 Pruebas completadas');
  } catch (error) {
    console.error('💥 Error durante las pruebas:', error.message);
  }
}

// Ejecutar las pruebas
testOrdersEndpoint();
