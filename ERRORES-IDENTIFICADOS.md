# 🔍 ERRORES IDENTIFICADOS EN EL CÓDIGO

## ❌ ERRORES CRÍTICOS

### 1. **Dependencias incompletas en `useMemo` - `pricePerTicket`**

**Ubicación:** `frontend/pages/RaffleDetailPage.tsx:97-100`

**Problema:**
```typescript
const pricePerTicket = useMemo(() => {
    if (!raffle) return 50;
    return raffle.price || raffle.packs?.find(p => p.tickets === 1 || p.q === 1)?.price || 50;
}, [raffle?.id]); // ❌ Solo usa raffle?.id
```

**Error:**
- Accede a `raffle.price` y `raffle.packs` pero solo depende de `raffle?.id`
- Si `raffle.price` o `raffle.packs` cambian sin cambiar el ID, el valor memoizado estará **desactualizado**
- Esto puede causar que el precio mostrado sea incorrecto

**Solución:**
```typescript
}, [raffle?.id, raffle?.price, raffle?.packs?.length]); // ✅ Incluir valores usados
```

---

### 2. **Dependencias incompletas en `useMemo` - `raffleImages`**

**Ubicación:** `frontend/pages/RaffleDetailPage.tsx:118-144`

**Problema:**
```typescript
const raffleImages = useMemo(() => {
    // ... usa raffle.imageUrl, raffle.heroImage, raffle.gallery
}, [raffle?.id]); // ❌ Solo usa raffle?.id
```

**Error:**
- Accede a `raffle.imageUrl`, `raffle.heroImage`, `raffle.gallery` pero solo depende de `raffle?.id`
- Si las imágenes cambian sin cambiar el ID, el valor memoizado estará **desactualizado**
- Las imágenes no se actualizarán aunque cambien en el backend

**Solución:**
```typescript
}, [raffle?.id, raffle?.imageUrl, raffle?.heroImage, raffle?.gallery?.length]); // ✅ Incluir valores usados
```

---

### 3. **Dependencias problemáticas en `useMemo` - `boletosAdicionales`**

**Ubicación:** `frontend/pages/RaffleDetailPage.tsx:106-109`

**Problema:**
```typescript
const boletosAdicionales = useMemo(() => {
    if (!raffle?.boletosConOportunidades || raffle.numeroOportunidades <= 1) return 0;
    return selectedTickets.length * (raffle.numeroOportunidades - 1);
}, [raffle?.id, raffle?.boletosConOportunidades, raffle?.numeroOportunidades, selectedTickets.length]);
```

**Error:**
- Incluye `raffle?.id` pero realmente no lo necesita
- Si `raffle?.id` cambia pero los otros valores no, puede causar recálculos innecesarios
- Es redundante: si el ID cambia, todo el objeto `raffle` cambia

**Solución:**
```typescript
}, [raffle?.boletosConOportunidades, raffle?.numeroOportunidades, selectedTickets.length]); // ✅ Sin raffle?.id redundante
```

---

### 4. **Función `onTicketClick` en dependencias de `renderTickets`**

**Ubicación:** `frontend/components/TicketSelector.tsx:120`

**Problema:**
```typescript
const renderTickets = useMemo(() => {
    // ... usa onTicketClick
}, [..., onTicketClick]); // ⚠️ onTicketClick puede cambiar en cada render
```

**Error:**
- `onTicketClick` es una función que puede cambiar en cada render si no está memoizada correctamente
- Esto causa que `renderTickets` se recalcule en cada render, perdiendo el beneficio de la memoización
- Aunque `handleTicketClick` está memoizado con `useCallback`, si `raffle`, `occupiedTickets`, `selectedTickets` o `toast` cambian, se recrea la función

**Solución:**
- Ya está memoizado con `useCallback`, pero podemos optimizar las dependencias de `handleTicketClick` para que cambie menos

---

### 5. **Arrays como dependencias - posible problema de referencia**

**Ubicación:** `frontend/components/TicketSelector.tsx:120`

**Problema:**
```typescript
}, [totalTickets, occupiedTickets, selectedTickets, ...]); // ⚠️ Arrays como dependencias
```

**Error:**
- `occupiedTickets` y `selectedTickets` son arrays
- React compara arrays por referencia, no por contenido
- Si estos arrays cambian pero tienen el mismo contenido, puede causar recálculos innecesarios
- Si los arrays tienen contenido diferente pero la misma referencia, puede causar valores desactualizados

**Solución:**
- Usar `useMemo` para crear una versión estable de los arrays, o
- Usar una comparación profunda (pero es costoso), o
- Aceptar que los arrays son dependencias válidas si se recrean correctamente

---

## ⚠️ ERRORES MENORES / ADVERTENCIAS

### 6. **`calculateTimeLeft` no está en dependencias de `useEffect`**

**Ubicación:** `frontend/components/CountdownTimer.tsx:31-37`

**Problema:**
```typescript
useEffect(() => {
    const timer = setInterval(() => {
        setTimeLeft(calculateTimeLeft()); // ⚠️ Usa calculateTimeLeft
    }, 1000);
    return () => clearInterval(timer);
}, [targetDate]); // ❌ No incluye calculateTimeLeft
```

**Error:**
- `calculateTimeLeft` está definida fuera del `useEffect` y puede cambiar
- Si `calculateTimeLeft` cambia, el efecto no se actualiza
- En este caso específico, `calculateTimeLeft` no tiene dependencias, así que es estable, pero es mejor práctica moverla dentro del `useEffect` o memoizarla

**Solución:**
- Mover `calculateTimeLeft` dentro del `useEffect`, o
- Usar `useCallback` para memoizarla

---

## 📊 RESUMEN DE PRIORIDADES

1. **CRÍTICO:** `pricePerTicket` - Dependencias incompletas (puede mostrar precio incorrecto)
2. **CRÍTICO:** `raffleImages` - Dependencias incompletas (imágenes no se actualizan)
3. **MEDIO:** `boletosAdicionales` - Dependencia redundante (recálculos innecesarios)
4. **BAJO:** `onTicketClick` en dependencias - Ya está optimizado, pero puede mejorarse
5. **BAJO:** Arrays como dependencias - Comportamiento esperado, pero puede optimizarse
6. **BAJO:** `calculateTimeLeft` - Funcional pero mejor práctica

---

## ✅ SOLUCIÓN RECOMENDADA

Corregir los errores críticos primero (1 y 2), ya que pueden causar comportamiento incorrecto visible para el usuario.

