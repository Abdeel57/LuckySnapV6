# 📊 CAPACIDAD DE ALMACENAMIENTO - Lucky Snap

## 🗄️ CONFIGURACIÓN ACTUAL

**Base de Datos:** PostgreSQL (Railway)
**Modelo de Datos:**
- **Raffles (Sorteos):** Tabla `raffles`
- **Orders (Órdenes):** Tabla `orders` - Contiene arrays de números de boletos
- **Users:** Tabla `users`
- **Winners:** Tabla `winners`
- **AdminUsers:** Tabla `admin_users`

---

## 📈 LÍMITES TEÓRICOS DE POSTGRESQL

### Límites Absolutos de PostgreSQL

| Recurso | Límite Teórico | Límite Práctico Recomendado |
|---------|---------------|----------------------------|
| **Filas por tabla** | ~2,147,483,647 (2.1 billones) | Depende del plan |
| **Tamaño de base de datos** | Ilimitado (hasta 32TB) | Depende del almacenamiento |
| **Tamaño de tabla** | 32TB | Depende del plan |
| **Arrays en PostgreSQL** | Máximo 1GB por array | Práctico: ~100,000 elementos |

---

## 🎯 CAPACIDAD PARA TU CASO ESPECÍFICO

### Análisis del Schema Actual

#### 1. **Sorteos (Raffles)**

**Estructura:**
```typescript
{
  id: String (cuid)        // ~25 bytes
  title: String            // ~100-200 bytes promedio
  description: String?      // ~500 bytes promedio
  imageUrl: String?         // ~200 bytes
  gallery: Json?            // ~2KB por imagen URL
  price: Float             // 8 bytes
  tickets: Int              // 4 bytes (cantidad total de boletos)
  sold: Int                 // 4 bytes
  drawDate: DateTime        // 8 bytes
  status: String            // ~20 bytes
  slug: String?             // ~50 bytes
  boletosConOportunidades: Boolean  // 1 byte
  numeroOportunidades: Int          // 4 bytes
  giftTickets: Int?                 // 4 bytes
  createdAt: DateTime       // 8 bytes
  updatedAt: DateTime       // 8 bytes
}
```

**Tamaño promedio por sorteo:** ~3-5 KB (sin imágenes grandes)

**Capacidad estimada:**
- **Railway Free Plan:** 500MB de almacenamiento
  - **Sorteos teóricos:** ~100,000 a 170,000 sorteos
  - **Sorteos prácticos (con índices):** ~50,000 a 80,000 sorteos

- **Railway Pro Plan ($20/mes):** 5GB de almacenamiento
  - **Sorteos teóricos:** ~1,000,000 a 1,700,000 sorteos
  - **Sorteos prácticos:** ~500,000 a 800,000 sorteos

---

#### 2. **Boletos (Tickets) - Almacenados en Orders**

**Estructura actual:**
```typescript
Order {
  id: String              // ~25 bytes
  folio: String           // ~30 bytes
  raffleId: String        // ~25 bytes
  userId: String          // ~25 bytes
  tickets: Int[]          // ⚠️ ARRAY DE NÚMEROS DE BOLETOS
  total: Float            // 8 bytes
  status: String          // ~20 bytes
  paymentMethod: String?   // ~30 bytes
  notes: String?           // ~200 bytes
  createdAt: DateTime     // 8 bytes
  updatedAt: DateTime     // 8 bytes
  expiresAt: DateTime      // 8 bytes
}
```

**⚠️ IMPORTANTE:** Los boletos se almacenan como **arrays** en `orders.tickets: Int[]`

**Cálculo de capacidad:**

Para un sorteo con **1,000 boletos** vendidos:
- Si cada boleta se vende individual: **1,000 órdenes** × ~200 bytes = **200 KB**
- Si se venden en paquetes de 10: **100 órdenes** × ~300 bytes = **30 KB**

**Por sorteo (ejemplo):**
- Sorteo con 10,000 boletos totales
- Supongamos 5,000 boletos vendidos
- Si promedio de boletos por orden = 5
- Entonces: 1,000 órdenes × ~250 bytes = **250 KB por sorteo**

**Capacidad estimada de boletos:**

| Plan | Almacenamiento | Boletos Totales (estimado) |
|------|----------------|---------------------------|
| **Railway Free (500MB)** | 250MB para datos | **~1,000,000 boletos** |
| **Railway Pro (5GB)** | 2.5GB para datos | **~10,000,000 boletos** |

**⚠️ LIMITACIÓN CRÍTICA DEL ARRAY:**
- PostgreSQL permite arrays de hasta **1GB**
- Un `Int` = 4 bytes
- Máximo teórico por array: **~268,435,456 números** (268 millones)
- **Límite práctico recomendado:** ~10,000 boletos por orden

---

## 📊 CÁLCULOS REALISTAS

### Escenario 1: Pequeña Empresa (Railway Free)

**Almacenamiento disponible:** ~500MB

**Asignación sugerida:**
- Sorteos: 100MB (~20,000 sorteos)
- Órdenes/Boletos: 300MB (~1,200,000 boletos vendidos)
- Usuarios: 50MB (~500,000 usuarios)
- Otros (ganadores, config): 50MB

**Capacidad total:**
- **Sorteos activos:** 50-100 simultáneos
- **Sorteos históricos:** 20,000 total
- **Boletos vendidos:** ~1,200,000 boletos
- **Usuarios:** ~500,000 usuarios registrados

### Escenario 2: Empresa Mediana (Railway Pro $20/mes)

**Almacenamiento disponible:** ~5GB

**Asignación sugerida:**
- Sorteos: 1GB (~200,000 sorteos)
- Órdenes/Boletos: 3GB (~12,000,000 boletos)
- Usuarios: 500MB (~5,000,000 usuarios)
- Otros: 500MB

**Capacidad total:**
- **Sorteos activos:** 500-1,000 simultáneos
- **Sorteos históricos:** 200,000 total
- **Boletos vendidos:** ~12,000,000 boletos
- **Usuarios:** ~5,000,000 usuarios

---

## ⚠️ CONSIDERACIONES IMPORTANTES

### 1. Límite de Arrays en Orders

**Problema potencial:**
Si un solo sorteo tiene 100,000 boletos y alguien compra 50,000, el array `tickets: Int[]` tendrá 50,000 elementos.

**Solución recomendada:**
- Limitar boletos por orden a 1,000-5,000 máximo
- Dividir compras grandes en múltiples órdenes
- Considerar modelo `Ticket` separado para sorteos muy grandes

### 2. Rendimiento con Muchos Datos

**Cuando tengas:**
- **>10,000 sorteos:** Agregar índice en `raffles.slug` y `raffles.status`
- **>100,000 órdenes:** Agregar índice en `orders.raffleId` y `orders.status`
- **>1,000,000 boletos:** Considerar particionado de tablas

### 3. Consultas con Límites

Tu código ya tiene límites implementados:
```javascript
// backend/src/admin/admin.service.ts
limitNum = limit ? Math.min(parseInt(limit, 10), 100) : 50; // Máximo 100
```

**✅ Esto es correcto** para evitar consultas que consuman mucha memoria.

---

## 🚀 RECOMENDACIONES DE ESCALABILIDAD

### Optimizaciones Implementadas

1. ✅ **Consultas con límites** (máximo 100 registros)
2. ✅ **Paginación** en endpoints de órdenes
3. ✅ **Índices únicos** (`username`, `slug`)
4. ✅ **Arrays eficientes** para números de boletos

### Optimizaciones Futuras (si creces mucho)

1. **Para >100,000 sorteos:**
   ```sql
   CREATE INDEX idx_raffles_status ON raffles(status);
   CREATE INDEX idx_raffles_drawdate ON raffles(drawDate);
   ```

2. **Para >1,000,000 boletos:**
   - Considerar tabla separada `tickets` en lugar de arrays
   - Particionar tablas por año
   - Usar archiving para sorteos finalizados

3. **Para >10,000,000 boletos:**
   - Migrar a plan empresarial
   - Implementar caché (Redis)
   - CDN para imágenes

---

## 📋 RESUMEN POR PLAN

### Railway Free (500MB)

| Recurso | Cantidad Realista |
|---------|------------------|
| **Sorteos totales** | ~20,000 |
| **Sorteos activos** | 50-100 |
| **Boletos vendidos** | ~1,200,000 |
| **Usuarios** | ~500,000 |
| **Órdenes** | ~240,000 |

**✅ Suficiente para:** Negocio pequeño-mediano

### Railway Pro ($20/mes - 5GB)

| Recurso | Cantidad Realista |
|---------|------------------|
| **Sorteos totales** | ~200,000 |
| **Sorteos activos** | 500-1,000 |
| **Boletos vendidos** | ~12,000,000 |
| **Usuarios** | ~5,000,000 |
| **Órdenes** | ~2,400,000 |

**✅ Suficiente para:** Empresa mediana-grande

---

## 🎯 CONCLUSIÓN

### Tu capacidad actual (Railway Free):

✅ **Puedes almacenar:**
- **~20,000 sorteos** en total
- **~1,000,000 de boletos vendidos**
- **~500,000 usuarios**
- **~240,000 órdenes**

### Si necesitas más:

1. **Upgrade a Railway Pro** ($20/mes)
   - 10x más capacidad
   - Más recursos de CPU/RAM
   - Mejor rendimiento

2. **Optimizar almacenamiento:**
   - Archivar sorteos muy antiguos
   - Comprimir imágenes grandes
   - Limpiar órdenes canceladas/vencidas periódicamente

---

## 💡 TIPS DE OPTIMIZACIÓN

1. **Limpieza periódica:**
   ```sql
   -- Eliminar órdenes canceladas/vencidas antiguas (opcional)
   DELETE FROM orders 
   WHERE status IN ('CANCELLED', 'EXPIRED') 
   AND "createdAt" < NOW() - INTERVAL '1 year';
   ```

2. **Monitorear espacio:**
   ```sql
   -- Ver tamaño de tablas
   SELECT 
     schemaname,
     tablename,
     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
   FROM pg_tables
   WHERE schemaname = 'public'
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
   ```

3. **Índices importantes:**
   ```sql
   -- Ya tienes estos implícitos por UNIQUE constraints:
   -- - users.email (UNIQUE)
   -- - raffles.slug (UNIQUE)
   -- - orders.folio (UNIQUE)
   -- - admin_users.username (UNIQUE)
   
   -- Considera agregar estos:
   CREATE INDEX IF NOT EXISTS idx_orders_raffle_id ON orders(raffleId);
   CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
   CREATE INDEX IF NOT EXISTS idx_raffles_status ON raffles(status);
   ```

---

## ❓ PREGUNTAS FRECUENTES

**P: ¿Puedo tener un sorteo con 1 millón de boletos?**
R: Sí, pero cada orden debe tener máximo ~10,000 boletos. Divide en múltiples órdenes.

**P: ¿Cuánto espacio ocupa un sorteo con 10,000 boletos vendidos?**
R: ~500KB-1MB (dependiendo de cuántas órdenes)

**P: ¿Qué pasa si llego al límite de almacenamiento?**
R: Railway te notificará. Puedes:
   - Upgrade a Pro
   - Archivar datos antiguos
   - Limpiar datos innecesarios

**P: ¿Afecta el rendimiento con muchos sorteos?**
R: Tu código ya tiene límites implementados. Con índices adecuados, puede manejar cientos de miles sin problemas.

---

**Última actualización:** Basado en tu schema actual y plan de Railway

