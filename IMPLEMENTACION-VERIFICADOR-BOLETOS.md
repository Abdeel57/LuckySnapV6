# 🚀 IMPLEMENTACIÓN: Verificador de Boletos Mejorado

## 📋 RESUMEN EJECUTIVO

**Objetivo:** Crear un verificador unificado que permita buscar boletos por:
- ✅ Número de boleto (sin requerir sorteo)
- ✅ Nombre del cliente
- ✅ Teléfono del cliente
- ✅ Folio

**Características:**
- ✅ Selector dropdown para tipo de búsqueda
- ✅ Agrupación por cliente (muestra todas sus compras)
- ✅ Tarjetas expandibles para ver boletos de cada compra
- ✅ Límite de 50 resultados máximo

---

## 🛠️ IMPLEMENTACIÓN PASO A PASO

### FASE 1: Backend - Nuevo Endpoint de Búsqueda

#### Paso 1.1: Agregar método en PublicService

**Archivo:** `backend/src/public/public.service.ts`

```typescript
async searchTickets(criteria: {
  numero_boleto?: number;
  nombre_cliente?: string;
  telefono?: string;
  folio?: string;
}) {
  try {
    console.log('🔍 Searching tickets with criteria:', criteria);
    
    // Validar que al menos un criterio esté presente
    if (!criteria.numero_boleto && !criteria.nombre_cliente && !criteria.telefono && !criteria.folio) {
      throw new Error('Se requiere al menos un criterio de búsqueda');
    }
    
    const where: any = {
      // Excluir órdenes canceladas y expiradas de la búsqueda pública
      status: {
        in: ['PENDING', 'PAID']
      }
    };
    
    // Construir condiciones dinámicas
    if (criteria.numero_boleto) {
      where.tickets = {
        has: criteria.numero_boleto
      };
    }
    
    if (criteria.nombre_cliente) {
      where.user = {
        name: {
          contains: criteria.nombre_cliente,
          mode: 'insensitive'
        }
      };
    }
    
    if (criteria.telefono) {
      where.user = {
        ...where.user,
        phone: {
          contains: criteria.telefono
        }
      };
    }
    
    if (criteria.folio) {
      where.folio = {
        contains: criteria.folio,
        mode: 'insensitive'
      };
    }
    
    // Buscar órdenes
    const orders = await this.prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            district: true
          }
        },
        raffle: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Límite recomendado
    });
    
    if (orders.length === 0) {
      return {
        clientes: [],
        totalClientes: 0,
        totalOrdenes: 0
      };
    }
    
    // Agrupar órdenes por cliente (userId)
    const ordersByUser = new Map<string, typeof orders>();
    
    orders.forEach(order => {
      const userId = order.userId;
      if (!ordersByUser.has(userId)) {
        ordersByUser.set(userId, []);
      }
      ordersByUser.get(userId)!.push(order);
    });
    
    // Transformar a formato agrupado
    const clientesAgrupados = Array.from(ordersByUser.entries()).map(([userId, userOrders]) => {
      const primerOrder = userOrders[0];
      const totalBoletos = userOrders.reduce((sum, o) => sum + o.tickets.length, 0);
      const totalPagado = userOrders.reduce((sum, o) => sum + (o.status === 'PAID' ? o.total : 0), 0);
      
      return {
        clienteId: userId,
        nombre: primerOrder.user.name || 'Sin nombre',
        telefono: primerOrder.user.phone || 'Sin teléfono',
        distrito: primerOrder.user.district || 'Sin distrito',
        totalOrdenes: userOrders.length,
        totalBoletos: totalBoletos,
        totalPagado: totalPagado,
        ordenes: userOrders.map(order => ({
          ordenId: order.id,
          folio: order.folio,
          rifa: {
            id: order.raffle.id,
            titulo: order.raffle.title
          },
          boletos: order.tickets,
          cantidadBoletos: order.tickets.length,
          estado: order.status,
          monto: order.total,
          fechaCreacion: order.createdAt,
          fechaPago: order.status === 'PAID' ? order.updatedAt : null,
          metodoPago: order.paymentMethod || null
        }))
      };
    });
    
    console.log(`✅ Found ${clientesAgrupados.length} clients with ${orders.length} orders`);
    
    return {
      clientes: clientesAgrupados,
      totalClientes: clientesAgrupados.length,
      totalOrdenes: orders.length
    };
  } catch (error) {
    console.error('❌ Error searching tickets:', error);
    throw error;
  }
}
```

#### Paso 1.2: Agregar endpoint en PublicController

**Archivo:** `backend/src/public/public.controller.ts`

```typescript
@Post('buscar-boletos')
async searchTickets(@Body() body: {
  numero_boleto?: number;
  nombre_cliente?: string;
  telefono?: string;
  folio?: string;
}) {
  try {
    const result = await this.publicService.searchTickets(body);
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('❌ Error in searchTickets controller:', error);
    throw new HttpException(
      error instanceof Error ? error.message : 'Error al buscar boletos',
      HttpStatus.BAD_REQUEST
    );
  }
}
```

---

### FASE 2: Frontend - Función API

#### Paso 2.1: Agregar función en api.ts

**Archivo:** `frontend/services/api.ts`

```typescript
export const searchTickets = async (criteria: {
  numero_boleto?: number;
  nombre_cliente?: string;
  telefono?: string;
  folio?: string;
}): Promise<any> => {
  try {
    console.log('🔍 Buscando boletos con criterios:', criteria);
    
    const response = await fetch(`${API_URL}/public/buscar-boletos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(criteria),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        message: `Error ${response.status}: ${response.statusText}` 
      }));
      throw new Error(error.message || 'Error al buscar boletos');
    }
    
    const result = await response.json();
    console.log('✅ Búsqueda exitosa:', result);
    
    // El backend devuelve { success: true, data: {...} }
    return result.data || result;
  } catch (error) {
    console.error('❌ Error searching tickets:', error);
    throw error instanceof Error ? error : new Error('Error desconocido al buscar boletos');
  }
};
```

---

### FASE 3: Frontend - Rediseñar VerifierPage

#### Paso 3.1: Nuevo estado y formulario

**Archivo:** `frontend/pages/VerifierPage.tsx`

**Cambios principales:**
1. Eliminar tabs (folio/boleto)
2. Agregar selector dropdown "Buscar por"
3. Campo de búsqueda único
4. Nuevo estado para resultados agrupados

```typescript
type SearchType = 'numero_boleto' | 'nombre_cliente' | 'telefono' | 'folio';

const VerifierPage = () => {
  const [searchType, setSearchType] = useState<SearchType>('numero_boleto');
  const [searchValue, setSearchValue] = useState('');
  const [resultados, setResultados] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedOrdenes, setExpandedOrdenes] = useState<Set<string>>(new Set());
  // ... otros estados

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;
    
    setIsLoading(true);
    setResultados(null);
    
    try {
      // Construir criterios según el tipo de búsqueda
      const criteria: any = {};
      
      if (searchType === 'numero_boleto') {
        criteria.numero_boleto = parseInt(searchValue);
      } else if (searchType === 'nombre_cliente') {
        criteria.nombre_cliente = searchValue.trim();
      } else if (searchType === 'telefono') {
        criteria.telefono = searchValue.trim().replace(/\D/g, ''); // Solo números
      } else if (searchType === 'folio') {
        criteria.folio = searchValue.trim();
      }
      
      const result = await searchTickets(criteria);
      setResultados(result);
    } catch (error: any) {
      console.error('Error searching:', error);
      toast.error('Error al buscar', error.message || 'No se encontraron resultados');
      setResultados(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  // ... resto del componente
};
```

#### Paso 3.2: Componente de resultados agrupados

```typescript
// Dentro del JSX de VerifierPage
{resultados && resultados.clientes && resultados.clientes.length > 0 && (
  <div className="space-y-6">
    {resultados.clientes.map((cliente: any) => (
      <div key={cliente.clienteId} className="bg-background-secondary p-6 rounded-lg border border-slate-700/50">
        {/* Encabezado del Cliente */}
        <div className="mb-4 pb-4 border-b border-slate-700">
          <h3 className="text-xl font-bold text-white mb-2">{cliente.nombre}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-slate-300">
            <p>📞 {cliente.telefono}</p>
            <p>📍 {cliente.distrito}</p>
            <p>📊 {cliente.totalOrdenes} orden(es) • {cliente.totalBoletos} boletos</p>
          </div>
          {cliente.totalPagado > 0 && (
            <p className="text-green-400 font-semibold mt-2">💰 Total pagado: L. {cliente.totalPagado.toFixed(2)}</p>
          )}
        </div>
        
        {/* Lista de Órdenes */}
        <div className="space-y-3">
          {cliente.ordenes.map((orden: any) => (
            <OrdenCard
              key={orden.ordenId}
              orden={orden}
              isExpanded={expandedOrdenes.has(orden.ordenId)}
              onToggle={() => {
                const newExpanded = new Set(expandedOrdenes);
                if (newExpanded.has(orden.ordenId)) {
                  newExpanded.delete(orden.ordenId);
                } else {
                  newExpanded.add(orden.ordenId);
                }
                setExpandedOrdenes(newExpanded);
              }}
            />
          ))}
        </div>
      </div>
    ))}
  </div>
)}
```

#### Paso 3.3: Componente OrdenCard

```typescript
const OrdenCard = ({ orden, isExpanded, onToggle }: {
  orden: any;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const statusColor = orden.estado === 'PAID' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400';
  const statusText = orden.estado === 'PAID' ? '✅ PAGADO' : '⏳ PENDIENTE';
  
  return (
    <div className="bg-background-primary p-4 rounded-lg border border-slate-700/50">
      {/* Información principal */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-sm bg-slate-800 px-2 py-1 rounded">🏷️ {orden.folio}</span>
            <span className={`text-xs font-bold px-2 py-1 rounded ${statusColor}`}>
              {statusText}
            </span>
          </div>
          <p className="text-white font-semibold mb-1">🎰 {orden.rifa.titulo}</p>
          <div className="flex gap-4 text-sm text-slate-400">
            <span>🎫 {orden.cantidadBoletos} boletos</span>
            <span>💰 L. {orden.monto.toFixed(2)}</span>
            {orden.fechaPago && (
              <span>📅 {new Date(orden.fechaPago).toLocaleDateString('es-ES')}</span>
            )}
          </div>
        </div>
        <button
          onClick={onToggle}
          className="text-accent hover:text-action transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>
      </div>
      
      {/* Boletos expandibles */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <p className="text-sm text-slate-400 mb-2">🎫 Boletos de esta compra:</p>
          <div className="flex flex-wrap gap-2">
            {orden.boletos.map((boleto: number, idx: number) => (
              <span
                key={idx}
                className="bg-slate-800 text-white px-2 py-1 rounded text-sm font-mono"
              >
                {boleto}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Backend
- [ ] Agregar método `searchTickets` en `PublicService`
- [ ] Validar que al menos un criterio esté presente
- [ ] Implementar búsqueda por número de boleto (sin sorteo)
- [ ] Implementar búsqueda por nombre (LIKE, case-insensitive)
- [ ] Implementar búsqueda por teléfono (contains)
- [ ] Implementar búsqueda por folio (contains)
- [ ] Agrupar resultados por cliente (userId)
- [ ] Calcular totales por cliente (ordenes, boletos, monto pagado)
- [ ] Agregar endpoint `POST /public/buscar-boletos`
- [ ] Agregar límite de 50 resultados
- [ ] Excluir órdenes CANCELED y EXPIRED
- [ ] Probar todas las búsquedas

### Frontend
- [ ] Agregar función `searchTickets` en `api.ts`
- [ ] Rediseñar formulario (eliminar tabs)
- [ ] Agregar selector dropdown "Buscar por"
- [ ] Campo de búsqueda único con placeholder dinámico
- [ ] Crear componente `OrdenCard` para mostrar cada orden
- [ ] Implementar expansión de boletos (estado `expandedOrdenes`)
- [ ] Mostrar encabezado del cliente con resumen
- [ ] Mostrar todas las órdenes del cliente agrupadas
- [ ] Badges de estado (Pagado/Pendiente) con colores
- [ ] Lista de boletos al expandir
- [ ] Manejar sin resultados
- [ ] Manejar múltiples clientes encontrados
- [ ] Validaciones del formulario

---

## 🧪 CASOS DE PRUEBA

### Test 1: Buscar por Número de Boleto
- Buscar boleto `123` → Debe mostrar todas las órdenes que contienen el boleto 123
- Verificar que no requiere seleccionar sorteo
- Verificar agrupación por cliente

### Test 2: Buscar por Nombre Parcial
- Buscar "Juan" → Debe mostrar todos los clientes cuyo nombre contenga "Juan"
- Verificar que es case-insensitive
- Verificar que muestra todas las órdenes de esos clientes

### Test 3: Buscar por Teléfono
- Buscar "50499999999" → Debe mostrar todas las órdenes del cliente
- Verificar que acepta números con o sin formato
- Verificar agrupación

### Test 4: Cliente con Múltiples Órdenes
- Cliente con 3 órdenes → Debe mostrar las 3 en grupo
- Resumen debe mostrar: 3 órdenes, X boletos, Y monto
- Cada orden debe ser expandible independientemente

### Test 5: Ver Boletos Expandidos
- Hacer clic en "Ver boletos" → Debe mostrar lista completa
- Verificar que se pueden expandir/contraer múltiples órdenes
- Verificar formato de los números de boletos

---

## 🎨 DISEÑO FINAL

### Formulario de Búsqueda

```
┌─────────────────────────────────────────┐
│ Verificador de Boletos                  │
│                                         │
│ Buscar por:                             │
│ ┌─────────────────────────────────────┐ │
│ │ [Número de boleto ▼]               │ │
│ │   • Número de boleto               │ │
│ │   • Nombre del cliente              │ │
│ │   • Teléfono                        │ │
│ │   • Folio                           │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ [Ingresa el número de boleto...] [🔍]│ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Resultados Agrupados

```
┌──────────────────────────────────────────────┐
│ 👤 Juan Pérez                                 │
│ 📞 50499999999 • 📍 Francisco Morazán        │
│ 📊 3 órdenes • 15 boletos • L. 450.00 pagado │
│                                               │
│ ┌──────────────────────────────────────────┐ │
│ │ 🏷️ ORD-2024-00123  ✅ PAGADO            │ │
│ │ 🎰 iPhone 15 Pro Max                     │ │
│ │ 🎫 5 boletos • 💰 L. 150.00              │ │
│ │ [Ver boletos ▼]                          │ │
│ │                                           │ │
│ │ 📋 123, 124, 125, 126, 127               │ │
│ └──────────────────────────────────────────┘ │
│                                               │
│ ┌──────────────────────────────────────────┐ │
│ │ 🏷️ ORD-2024-00145  ⏳ PENDIENTE         │ │
│ │ 🎰 Motocicleta Yamaha                    │ │
│ │ 🎫 10 boletos • 💰 L. 300.00            │ │
│ │ [Ver boletos ▶]                          │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

---

**¿Listo para implementar?**

