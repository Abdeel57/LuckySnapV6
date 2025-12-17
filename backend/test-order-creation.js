// Script para probar la creación de órdenes
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_URL = 'http://localhost:3000/api';

async function testOrderCreation() {
    console.log('🧪 Probando creación de órdenes...');
    
    try {
        // 1. Crear una nueva orden
        console.log('📝 Creando nueva orden...');
        const orderData = {
            raffleId: '1',
            customer: {
                name: 'Ana García',
                phone: '5559876543',
                email: 'ana@email.com'
            },
            tickets: [20, 25, 30],
            totalAmount: 150
        };
        
        const response = await fetch(`${API_URL}/public/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        
        if (response.ok) {
            const order = await response.json();
            console.log('✅ Orden creada exitosamente:', {
                id: order.id,
                folio: order.folio,
                customer: order.customer,
                tickets: order.tickets,
                amount: order.total
            });
            
            // 2. Buscar la orden por folio
            console.log('🔍 Buscando orden por folio...');
            const folioResponse = await fetch(`${API_URL}/public/orders/folio/${order.folio}`);
            if (folioResponse.ok) {
                const foundOrder = await folioResponse.json();
                console.log('✅ Orden encontrada por folio:', {
                    folio: foundOrder.folio,
                    customer: foundOrder.customer,
                    status: foundOrder.status
                });
            }
            
            // 3. Verificar estadísticas actualizadas
            console.log('📊 Verificando estadísticas...');
            const statsResponse = await fetch(`${API_URL}/admin/stats`);
            if (statsResponse.ok) {
                const stats = await statsResponse.json();
                console.log('✅ Estadísticas actualizadas:', {
                    totalOrders: stats.totalOrders,
                    pendingOrders: stats.pendingOrders,
                    totalRevenue: stats.totalRevenue
                });
            }
            
        } else {
            const error = await response.text();
            console.error('❌ Error creando orden:', response.status, error);
        }
        
    } catch (error) {
        console.error('❌ Error en prueba:', error);
    }
}

// Ejecutar prueba si se llama directamente
if (require.main === module) {
    testOrderCreation()
        .then(() => {
            console.log('✅ Prueba completada');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Prueba falló:', error);
            process.exit(1);
        });
}

module.exports = { testOrderCreation };
