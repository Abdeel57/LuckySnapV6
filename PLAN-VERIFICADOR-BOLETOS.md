# 🎫 PLAN: Mejorar el Verificador de Boletos

## ✅ DECISIONES FINALES

1. **Selector de tipo de búsqueda:** ✅ Dropdown con opciones (Número de boleto, Nombre, Teléfono, Folio)
2. **Límite de resultados:** ✅ 50 órdenes máximo (recomendado)
3. **Agrupación:** ✅ Agrupar por cliente, mostrar todas sus compras/órdenes
4. **Visualización de boletos:** ✅ Tarjetas expandibles por orden, botón "Ver boletos" para expandir

---

## 🔍 ANÁLISIS DEL ESTADO ACTUAL

### Funcionalidades Actuales

1. **Búsqueda por Folio**
   - ✅ Funciona: Busca por folio exacto
   - Endpoint: `getOrderByFolio(folio)`
   - Muestra: Información completa de la orden

2. **Búsqueda por Número de Boleto**
   - ✅ Funciona: Requiere número de boleto + sorteo_id
   - Endpoint: `verifyTicket({ numero_boleto, sorteo_id })`
   - Muestra: Información del boleto y estado

3. **Escaner QR**
   - ✅ Funciona: Escanea código QR del boleto
   - Mismo endpoint que búsqueda por número

### Problemas Identificados

1. ❌ **No se puede buscar por nombre del cliente**
2. ❌ **No se puede buscar por teléfono**
3. ❌ **No se puede buscar boleto sin seleccionar sorteo**
4. ❌ **Búsqueda fragmentada** (dos tabs diferentes)
5. ❌ **No muestra todos los boletos de un cliente** (solo uno)

---

## 🎯 OBJETIVOS

Crear un verificador unificado que permita:
1. ✅ Buscar por **número de boleto** (sin necesidad de sorteo)
2. ✅ Buscar por **nombre del cliente**
3. ✅ Buscar por **número de teléfono**
4. ✅ Mostrar **todos los boletos** encontrados para ese cliente
5. ✅ Mostrar **estado claro** de cada boleto (Pagado/Pendiente)
6. ✅ Interfaz **simple y unificada**

---

## 📋 PLAN DE IMPLEMENTACIÓN

### FASE 1: Backend - Nuevo Endpoint de Búsqueda Unificado

#### 1.1. Crear nuevo método en `PublicService`

**Método:** `searchTickets(searchCriteria)`

**Criterios de búsqueda:**
- `numero_boleto?: number` - Buscar por número de boleto
- `nombre_cliente?: string` - Buscar por nombre (parcial)
- `telefono?: string` - Buscar por teléfono
- `folio?: string` - Buscar por folio (opcional, ya existe)

**Lógica:**
1. Si viene `numero_boleto`: Buscar ordenes que contengan ese número
2. Si viene `nombre_cliente`: Buscar por nombre del usuario (LIKE)
3. Si viene `telefono`: Buscar por teléfono del usuario
4. Pueden combinarse criterios

**Respuesta Agrupada por Cliente:**
```typescript
{
  clientes: [
    {
      clienteId: string,
      nombre: string,
      telefono: string,
      distrito: string,
      totalOrdenes: number,
      totalBoletos: number,
      totalPagado: number,
      ordenes: [
        {
          ordenId: string,
          folio: string,
          rifa: {
            id: string,
            titulo: string
          },
          boletos: number[],
          cantidadBoletos: number,
          estado: 'PAID' | 'PENDING' | 'CANCELLED',
          monto: number,
          fechaCreacion: Date,
          fechaPago?: Date | null,
          metodoPago?: string
        }
      ]
    }
  ],
  totalClientes: number,
  totalOrdenes: number
}
```

**⚠️ IMPORTANTE:** Agrupar por cliente para facilitar visualización

#### 1.2. Endpoint en `PublicController`

```typescript
@Post('buscar-boletos')
async searchTickets(@Body() body: {
  numero_boleto?: number;
  nombre_cliente?: string;
  telefono?: string;
  folio?: string;
}) {
  return this.publicService.searchTickets(body);
}
```

---

### FASE 2: Backend - Implementación del Servicio

#### 2.1. Lógica de Búsqueda

```typescript
async searchTickets(criteria: {
  numero_boleto?: number;
  nombre_cliente?: string;
  telefono?: string;
  folio?: string;
}) {
  const where: any = {};
  
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
  
  const orders = await this.prisma.order.findMany({
    where,
    include: {
      user: true,
      raffle: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 50 // Límite de resultados
  });
  
  // Agrupar órdenes por cliente (userId)
  const ordersByUser = new Map<string, any[]>();
  
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
  
  return {
    clientes: clientesAgrupados,
    totalClientes: clientesAgrupados.length,
    totalOrdenes: orders.length
  };
}
```

---

### FASE 3: Frontend - Nueva Función API

#### 3.1. Agregar función en `api.ts`

```typescript
export const searchTickets = async (criteria: {
  numero_boleto?: number;
  nombre_cliente?: string;
  telefono?: string;
  folio?: string;
}): Promise<SearchTicketsResponse> => {
  try {
    const response = await fetch(`${API_URL}/public/buscar-boletos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(criteria),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error al buscar boletos' }));
      throw new Error(error.message || 'Error al buscar boletos');
    }
    
    const result = await response.json();
    // El backend devuelve { success: true, data: {...} } o directamente el objeto
    return result.data || result;
  } catch (error) {
    console.error('❌ Error searching tickets:', error);
    throw error instanceof Error ? error : new Error('Error desconocido al buscar boletos');
  }
};
```

---

### FASE 4: Frontend - Rediseñar VerifierPage

#### 4.1. Nuevo Formulario Unificado

**✅ DECISIÓN FINAL: Campo con Selector**

- **Selector dropdown:** "Buscar por..."
  - Número de boleto
  - Nombre del cliente
  - Teléfono
  - Folio
- **Campo de búsqueda:** Texto o número según selección
- **Botón de buscar:** Con ícono de lupa
- **Indicador visual:** Placeholder cambia según tipo de búsqueda seleccionada

#### 4.2. Interfaz de Resultados Agrupados (DECISIÓN FINAL)

**Diseño con Agrupación por Cliente:**

```
┌─────────────────────────────────────────────┐
│ 👤 Juan Pérez                               │
│ 📞 50499999999                              │
│ 📍 Francisco Morazán                        │
│                                             │
│ 📊 Resumen:                                 │
│   • 3 órdenes total                         │
│   • 15 boletos en total                     │
│   • L. 450.00 pagado                        │
└─────────────────────────────────────────────┘
  ┌─────────────────────────────────────┐
  │ 📦 Orden #1                          │
  │ 🏷️ Folio: ORD-2024-00123            │
  │ 🎰 Rifa: iPhone 15 Pro Max           │
  │ 🎫 5 boletos                          │
  │ ✅ PAGADO                             │
  │ 💰 L. 150.00                          │
  │ [Ver boletos ▼]  ← Expandir          │
  └─────────────────────────────────────┘
    [Al hacer clic en "Ver boletos"]
    ┌─────────────────────────────────┐
    │ 🎫 Boletos de esta compra:       │
    │ 123, 124, 125, 126, 127         │
    └─────────────────────────────────┘
  ┌─────────────────────────────────────┐
  │ 📦 Orden #2                          │
  │ 🏷️ Folio: ORD-2024-00145            │
  │ 🎰 Rifa: Motocicleta Yamaha         │
  │ 🎫 10 boletos                        │
  │ ⏳ PENDIENTE                         │
  │ 💰 L. 300.00                         │
  │ [Ver boletos ▼]                     │
  └─────────────────────────────────────┘
```

**Características:**
- Cada cliente en un grupo expandible
- Resumen del cliente al inicio
- Cada orden/comprar en tarjeta individual
- Botón "Ver boletos" para expandir y mostrar números
- Estado claro con colores (Verde = Pagado, Amarillo = Pendiente)

---

### FASE 5: Agrupación y Visualización

#### 5.1. Agrupación por Cliente (DECISIÓN FINAL)

**Cuando un cliente tiene múltiples órdenes:**
- Agrupar todas las órdenes del mismo cliente
- Mostrar encabezado del cliente con resumen:
  - Nombre
  - Teléfono
  - Total de órdenes
  - Total de boletos (suma de todos)
  - Total pagado (suma de todas las órdenes)

**Dentro de cada grupo:**
- Cada orden/comprar en una tarjeta expandible
- Mostrar por orden:
  - Folio
  - Rifa
  - Cantidad de boletos
  - Estado (Pagado/Pendiente)
  - Monto
- Botón "Ver boletos" para expandir y mostrar lista completa

#### 5.2. Visualización de Boletos

**Tarjeta expandible:**
- Inicialmente: muestra cantidad de boletos
- Al expandir: muestra lista completa de números
- Formato: "Boletos: 123, 124, 125..." o en grid si son muchos

#### 5.3. Sin Resultados

- Mensaje claro: "No se encontraron boletos con esos criterios"
- Sugerencias: Verificar datos ingresados
- Opción de buscar de nuevo

---

## 📝 ESTRUCTURA DE DATOS

### Request del Frontend

```typescript
interface SearchCriteria {
  numero_boleto?: number;
  nombre_cliente?: string;
  telefono?: string;
  folio?: string;
}
```

### Response del Backend (Agrupada por Cliente)

```typescript
interface SearchTicketsResponse {
  clientes: [
    {
      clienteId: string;
      nombre: string;
      telefono: string;
      distrito: string;
      totalOrdenes: number;
      totalBoletos: number;
      totalPagado: number;
      ordenes: [
        {
          ordenId: string;
          folio: string;
          rifa: {
            id: string;
            titulo: string;
          };
          boletos: number[];
          cantidadBoletos: number;
          estado: 'PAID' | 'PENDING' | 'CANCELLED' | 'EXPIRED';
          monto: number;
          fechaCreacion: Date;
          fechaPago?: Date | null;
          metodoPago?: string;
        }
      ];
    }
  ];
  totalClientes: number;
  totalOrdenes: number;
}
```

---

## 🎨 DISEÑO DE LA INTERFAZ

### Layout Propuesto (Con Agrupación)

```
┌──────────────────────────────────────────────┐
│   Verificador de Boletos                      │
│                                               │
│   Buscar por: [Número de boleto ▼]          │
│   ┌──────────────────────────────────────┐  │
│   │ [Campo de búsqueda]              [🔍] │  │
│   └──────────────────────────────────────┘  │
│                                               │
│   [Resultados Agrupados por Cliente]         │
│                                               │
│   ┌──────────────────────────────────────┐  │
│   │ 👤 Juan Pérez                         │  │
│   │ 📞 50499999999                        │  │
│   │ 📊 3 órdenes • 15 boletos • L.450     │  │
│   │                                        │  │
│   │ ┌──────────────────────────────────┐  │  │
│   │ │ 📦 ORD-2024-00123                │  │  │
│   │ │ 🎰 iPhone 15 Pro Max              │  │  │
│   │ │ 🎫 5 boletos • ✅ PAGADO          │  │  │
│   │ │ 💰 L. 150.00                       │  │  │
│   │ │ [Ver boletos ▼]                   │  │  │
│   │ └──────────────────────────────────┘  │  │
│   │                                        │  │
│   │ ┌──────────────────────────────────┐  │  │
│   │ │ 📦 ORD-2024-00145                │  │  │
│   │ │ 🎰 Motocicleta Yamaha            │  │  │
│   │ │ 🎫 10 boletos • ⏳ PENDIENTE     │  │  │
│   │ │ 💰 L. 300.00                      │  │  │
│   │ │ [Ver boletos ▶]                   │  │  │
│   │ └──────────────────────────────────┘  │  │
│   └──────────────────────────────────────┘  │
│                                               │
│   [Más clientes si hay múltiples...]         │
└──────────────────────────────────────────────┘
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Backend
- [ ] Crear método `searchTickets` en `PublicService`
- [ ] Implementar lógica de búsqueda por número de boleto
- [ ] Implementar lógica de búsqueda por nombre (LIKE)
- [ ] Implementar lógica de búsqueda por teléfono
- [ ] Agregar endpoint `POST /public/buscar-boletos`
- [ ] Probar búsquedas individuales
- [ ] Probar búsquedas combinadas
- [ ] Validar límites de resultados (máximo 50)

### Frontend
- [ ] Agregar función `searchTickets` en `api.ts`
- [ ] Rediseñar formulario de búsqueda (selector dropdown + campo)
- [ ] Crear componente `ClienteGroupCard` para agrupar resultados por cliente
- [ ] Crear componente `OrdenCard` para mostrar cada orden/comprar
- [ ] Implementar expansión de boletos (botón "Ver boletos")
- [ ] Mostrar resumen del cliente (total órdenes, boletos, monto)
- [ ] Manejar múltiples clientes encontrados
- [ ] Manejar sin resultados
- [ ] Mostrar estados claros con badges de color (Pagado/Pendiente)
- [ ] Agregar información completa (folio, rifa, cantidad boletos, monto)
- [ ] Mostrar lista completa de boletos al expandir
- [ ] Probar todas las opciones de búsqueda
- [ ] Validar que funciona con múltiples órdenes del mismo cliente

---

## 🔄 FLUJO DE USO

### Ejemplo 1: Buscar por Número de Boleto

1. Usuario selecciona: "Número de boleto"
2. Usuario ingresa: `123`
3. Sistema busca todas las órdenes que contienen el boleto 123
4. Muestra todas las órdenes encontradas con ese boleto

### Ejemplo 2: Buscar por Nombre

1. Usuario selecciona: "Nombre del cliente"
2. Usuario ingresa: `Juan`
3. Sistema busca todos los clientes cuyo nombre contenga "Juan"
4. Muestra todas las órdenes de esos clientes

### Ejemplo 3: Buscar por Teléfono

1. Usuario selecciona: "Teléfono"
2. Usuario ingresa: `50499999999`
3. Sistema busca cliente con ese teléfono
4. Muestra todas las órdenes de ese cliente

---

## 🎯 VENTAJAS DE ESTA IMPLEMENTACIÓN

1. ✅ **Búsqueda flexible**: Múltiples criterios
2. ✅ **Interfaz clara**: Selector explícito de tipo de búsqueda
3. ✅ **Resultados completos**: Muestra toda la información relevante
4. ✅ **Múltiples resultados**: Puede encontrar varios boletos
5. ✅ **Identificación fácil**: Folio visible en cada resultado
6. ✅ **Estado claro**: Pagado/Pendiente visible

---

## 📋 PRÓXIMOS PASOS

1. Implementar backend (Fase 1 y 2)
2. Actualizar función API del frontend (Fase 3)
3. Rediseñar interfaz (Fase 4)
4. Probar todos los casos de uso
5. Deploy a producción

---

## 🧪 CASOS DE PRUEBA

### Test 1: Búsqueda por Número de Boleto
- Buscar boleto que existe → Debe mostrar orden
- Buscar boleto que no existe → Debe mostrar "No encontrado"
- Buscar boleto que está en múltiples órdenes → Debe mostrar todas

### Test 2: Búsqueda por Nombre
- Buscar nombre exacto → Debe mostrar orden(es)
- Buscar nombre parcial → Debe mostrar todas las coincidencias
- Nombre que no existe → Debe mostrar "No encontrado"

### Test 3: Búsqueda por Teléfono
- Buscar teléfono exacto → Debe mostrar todas las órdenes del cliente
- Teléfono que no existe → Debe mostrar "No encontrado"

### Test 4: Resultados Múltiples
- Cliente con 3 órdenes → Debe mostrar las 3 tarjetas
- Boletos de diferentes rifas → Debe mostrar cada rifa separada

---

**¿Estás listo para implementar esta mejora?**

