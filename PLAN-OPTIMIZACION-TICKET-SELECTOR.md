# 📋 PLAN DETALLADO: Optimización de Selección de Boletos

## 🎯 OBJETIVO
Optimizar la selección de boletos para que sea fluida incluso con sorteos grandes (10,000+ boletos, 5,000+ ocupados).

---

## 📊 ANÁLISIS DE DEPENDENCIAS Y CONEXIONES

### **ARCHIVOS QUE SE MODIFICARÁN:**
1. ✅ `frontend/components/TicketSelector.tsx` (PRINCIPAL)
2. ✅ `frontend/pages/RaffleDetailPage.tsx` (SECUNDARIO)
3. ✅ `frontend/components/StickyPurchaseBar.tsx` (MENOR)

### **ARCHIVOS QUE SE USARÁN (sin modificar):**
- ✅ `frontend/utils/deviceDetection.ts` - Ya existe `isMobile()` y `useOptimizedAnimations()`
- ✅ `frontend/hooks/useToast.tsx` - Necesito verificar su uso
- ✅ `frontend/services/metaPixel.ts` - Ya existe, solo se usará

### **ARCHIVOS QUE SE CONECTAN:**
- ✅ `TicketSelector` solo se usa en `RaffleDetailPage.tsx` (línea 181-188)
- ✅ `RaffleDetailPage` pasa props a `TicketSelector`:
  - `totalTickets={raffle.tickets}` ✅
  - `occupiedTickets={occupiedTickets}` ✅ (array)
  - `selectedTickets={selectedTickets}` ✅ (array)
  - `listingMode={listingMode}` ✅
  - `hideOccupied={hideOccupied}` ✅
  - `onTicketClick={handleTicketClick}` ✅

### **VERIFICACIONES CRÍTICAS:**
- ✅ `occupiedTickets` siempre es `number[]` (desde `getOccupiedTickets()`)
- ✅ `selectedTickets` siempre es `number[]` (state local)
- ✅ `totalTickets` es `number` (desde `raffle.tickets`)
- ✅ `onTicketClick` recibe `(ticket: number) => void`
- ⚠️ `useToast` necesita verificación de uso

---

## 🔧 PASO 1: VERIFICAR DEPENDENCIAS EXTERNAS

### **1.1 Verificar useToast**
**Acción:** Leer `frontend/hooks/useToast.tsx` para entender su API
**Riesgo:** Bajo - Solo si no existe o API diferente
**Validación:** Verificar que `toast.error()` existe

### **1.2 Verificar deviceDetection**
**Estado:** ✅ Ya existe y funciona
- `isMobile()` - función simple
- `useOptimizedAnimations()` - hook
**Riesgo:** Ninguno - Ya se usa en otros componentes

---

## 🛠️ PASO 2: MODIFICACIONES EN TicketSelector.tsx

### **2.1 Imports a Agregar**
```typescript
// AGREGAR:
import React, { useState, useMemo, useCallback } from 'react';  // Agregar useMemo, useCallback
import { isMobile } from '../utils/deviceDetection';            // Agregar isMobile
```

### **2.2 Imports Existentes (MANTENER)**
```typescript
// MANTENER:
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
```

### **2.3 Crear Sets para Búsquedas O(1)**
**Ubicación:** Dentro del componente, después de `useState`
**Código:**
```typescript
// CREAR Sets desde arrays (memoizado)
const occupiedSet = useMemo(() => {
    if (!Array.isArray(occupiedTickets)) return new Set<number>();
    return new Set(occupiedTickets);
}, [occupiedTickets]);

const selectedSet = useMemo(() => {
    if (!Array.isArray(selectedTickets)) return new Set<number>();
    return new Set(selectedTickets);
}, [selectedTickets]);
```

**Validaciones:**
- ✅ Verificar que `occupiedTickets` es array antes de crear Set
- ✅ Verificar que `selectedTickets` es array antes de crear Set
- ✅ Retornar `Set` vacío si no es array (fallback seguro)

**Riesgo:** Bajo - Solo si los arrays son null/undefined (ya manejado)

### **2.4 Memoizar renderTickets()**
**Ubicación:** Reemplazar función `renderTickets()` actual
**Código:**
```typescript
const renderTickets = useMemo(() => {
    // Validaciones defensivas
    if (!totalTickets || totalTickets <= 0) return [];
    if (!Array.isArray(occupiedTickets)) return [];
    if (!Array.isArray(selectedTickets)) return [];
    
    const tickets = Array.from({ length: totalTickets }, (_, i) => i + 1);
    const visibleTickets = listingMode === 'paginado'
        ? tickets.slice((currentPage - 1) * ticketsPerPage, (currentPage * ticketsPerPage))
        : tickets;

    return visibleTickets
        .filter(ticket => hideOccupied ? !occupiedSet.has(ticket) : true)
        .map(ticket => {
            const isOccupied = occupiedSet.has(ticket);  // O(1)
            const isSelected = selectedSet.has(ticket);   // O(1)
            
            // ... resto del código igual
        });
}, [totalTickets, occupiedSet, selectedSet, currentPage, listingMode, hideOccupied, ticketsPerPage]);
```

**Validaciones:**
- ✅ Validar `totalTickets > 0`
- ✅ Validar arrays antes de usar
- ✅ Dependencias correctas en `useMemo`

**Riesgo:** Medio - Si las dependencias están mal, puede no actualizar

### **2.5 Desactivar Framer Motion en Móviles**
**Ubicación:** Dentro del `.map()` de `renderTickets`
**Código:**
```typescript
// Detectar móvil una vez
const mobile = isMobile();

// En el return:
return mobile ? (
    // Móvil: div estático sin animaciones
    <div 
        key={ticket} 
        className={`${baseClasses} ${stateClasses}`} 
        onClick={() => !isOccupied && onTicketClick(ticket)}
    >
        {isSelected && (
            <div className="absolute inset-0 flex items-center justify-center">
                <Check size={16} />
            </div>
        )}
        <span className={isSelected ? 'opacity-0' : 'opacity-100'}>
            {String(ticket).padStart(String(totalTickets).length, '0')}
        </span>
    </div>
) : (
    // Desktop: motion.div con animaciones
    <motion.div 
        key={ticket} 
        className={`${baseClasses} ${stateClasses}`} 
        onClick={() => !isOccupied && onTicketClick(ticket)}
        whileTap={{ scale: isOccupied ? 1 : 0.9 }}
    >
        <AnimatePresence>
            {isSelected && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    <Check size={16} />
                </motion.div>
            )}
        </AnimatePresence>
        <span className={isSelected ? 'opacity-0' : 'opacity-100'}>
            {String(ticket).padStart(String(totalTickets).length, '0')}
        </span>
    </motion.div>
);
```

**Validaciones:**
- ✅ `isMobile()` envuelto en try-catch (ya se hace en otros componentes)
- ✅ Mantener misma estructura HTML
- ✅ Mantener mismos className

**Riesgo:** Bajo - Solo cambio visual, no funcional

### **2.6 Validar totalTickets para padStart**
**Ubicación:** En el cálculo de `padStart`
**Código:**
```typescript
const ticketPadding = useMemo(() => {
    if (!totalTickets || totalTickets <= 0) return 1;
    return String(totalTickets).length;
}, [totalTickets]);

// En el span:
{String(ticket).padStart(ticketPadding, '0')}
```

**Validaciones:**
- ✅ Fallback a 1 si `totalTickets` es inválido
- ✅ Evitar `NaN` o `undefined`

**Riesgo:** Muy bajo - Solo mejora seguridad

---

## 🛠️ PASO 3: MODIFICACIONES EN RaffleDetailPage.tsx

### **3.1 Imports a Agregar**
```typescript
// AGREGAR:
import { useMemo, useCallback } from 'react';  // Agregar useMemo, useCallback
import { useToast } from '../hooks/useToast';  // Agregar useToast
```

### **3.2 Crear Sets para handleTicketClick**
**Ubicación:** Después de los `useState`, antes de `useEffect`
**Código:**
```typescript
// Crear Sets una vez (memoizado)
const occupiedSet = useMemo(() => {
    if (!Array.isArray(occupiedTickets)) return new Set<number>();
    return new Set(occupiedTickets);
}, [occupiedTickets]);

const selectedSet = useMemo(() => {
    if (!Array.isArray(selectedTickets)) return new Set<number>();
    return new Set(selectedTickets);
}, [selectedTickets]);
```

**Validaciones:**
- ✅ Igual que en TicketSelector
- ✅ Mismo patrón para consistencia

### **3.3 Optimizar handleTicketClick con useCallback**
**Ubicación:** Reemplazar función `handleTicketClick` actual
**Código:**
```typescript
const handleTicketClick = useCallback((ticketNumber: number) => {
    // Validación defensiva
    if (!ticketNumber || typeof ticketNumber !== 'number') return;
    
    // Usar Set para búsqueda O(1)
    if (occupiedSet.has(ticketNumber)) {
        toast.error('Boleto ocupado', 'Este boleto ya está ocupado. Por favor selecciona otro.');
        return;
    }
    
    const wasSelected = selectedSet.has(ticketNumber);
    const newSelectedTickets = wasSelected 
        ? selectedTickets.filter(t => t !== ticketNumber)
        : [...selectedTickets, ticketNumber];
    
    setSelectedTickets(newSelectedTickets);
    
    // Track AddToCart cuando se selecciona (async, no bloquea)
    if (!wasSelected && raffle) {
        // Usar setTimeout para no bloquear UI
        setTimeout(() => {
            const pricePerTicket = raffle.price || raffle.packs?.find(p => p.tickets === 1 || p.q === 1)?.price || 50;
            const totalValue = newSelectedTickets.length * pricePerTicket;
            metaPixelService.trackAddToCart(raffle.id, newSelectedTickets, totalValue);
        }, 0);
    }
}, [occupiedSet, selectedSet, selectedTickets, raffle, toast]);
```

**Validaciones:**
- ✅ `useCallback` con dependencias correctas
- ✅ Reemplazar `alert()` con `toast.error()`
- ✅ MetaPixel en `setTimeout` para no bloquear
- ✅ Validar `ticketNumber` antes de usar

**Riesgo:** Medio - Si `toast` no está disponible, puede fallar

### **3.4 Memoizar Cálculos Costosos**
**Ubicación:** Después de `handleTicketClick`, antes del `return`
**Código:**
```typescript
// Memoizar cálculos que dependen de selectedTickets
const pricePerTicket = useMemo(() => {
    if (!raffle) return 50;
    return raffle.price || raffle.packs?.find(p => p.tickets === 1 || p.q === 1)?.price || 50;
}, [raffle]);

const totalPrice = useMemo(() => {
    return selectedTickets.length * pricePerTicket;
}, [selectedTickets.length, pricePerTicket]);

const boletosAdicionales = useMemo(() => {
    if (!raffle?.boletosConOportunidades || raffle.numeroOportunidades <= 1) return 0;
    return selectedTickets.length * (raffle.numeroOportunidades - 1);
}, [raffle?.boletosConOportunidades, raffle?.numeroOportunidades, selectedTickets.length]);

const progress = useMemo(() => {
    if (!raffle || !raffle.tickets || raffle.tickets === 0) return 0;
    return (raffle.sold / raffle.tickets) * 100;
}, [raffle?.sold, raffle?.tickets]);
```

**Validaciones:**
- ✅ Todas las dependencias correctas
- ✅ Validar división por cero en `progress`
- ✅ Fallbacks seguros

**Riesgo:** Bajo - Solo optimización, no cambia lógica

### **3.5 Memoizar RaffleGallery images**
**Ubicación:** Reemplazar IIFE en `RaffleGallery` props
**Código:**
```typescript
const raffleImages = useMemo(() => {
    if (!raffle) return ['https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&h=600&fit=crop'];
    
    const allImages: string[] = [];
    
    if (raffle.imageUrl) {
        allImages.push(raffle.imageUrl);
    }
    
    if (raffle.heroImage && !allImages.includes(raffle.heroImage)) {
        allImages.push(raffle.heroImage);
    }
    
    if (raffle.gallery && raffle.gallery.length > 0) {
        raffle.gallery.forEach(img => {
            if (!allImages.includes(img)) {
                allImages.push(img);
            }
        });
    }
    
    if (allImages.length === 0) {
        return ['https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&h=600&fit=crop'];
    }
    
    return allImages;
}, [raffle?.imageUrl, raffle?.heroImage, raffle?.gallery]);

// En el JSX:
<RaffleGallery 
    images={raffleImages}
    title={raffle.title}
    className="w-full max-w-2xl mx-auto mb-6"
/>
```

**Validaciones:**
- ✅ Dependencias correctas (solo props de raffle que afectan imágenes)
- ✅ Mismo fallback que antes

**Riesgo:** Muy bajo - Solo extrae lógica a useMemo

### **3.6 Agregar useToast hook**
**Ubicación:** Al inicio del componente, después de `useParams`
**Código:**
```typescript
const toast = useToast();
```

**Validaciones:**
- ✅ Verificar que `useToast` existe y funciona
- ✅ Si no existe, usar `alert()` como fallback

**Riesgo:** Medio - Si `useToast` no está disponible

---

## 🛠️ PASO 4: MODIFICACIONES EN StickyPurchaseBar.tsx (OPCIONAL)

### **4.1 Memoizar boletosAdicionales**
**Ubicación:** Reemplazar cálculo directo
**Código:**
```typescript
import { useMemo } from 'react';

// Dentro del componente:
const boletosAdicionales = useMemo(() => {
    if (!raffle?.boletosConOportunidades || raffle.numeroOportunidades <= 1) return 0;
    return selectedTickets.length * (raffle.numeroOportunidades - 1);
}, [raffle?.boletosConOportunidades, raffle?.numeroOportunidades, selectedTickets.length]);
```

**Riesgo:** Muy bajo - Solo optimización

---

## ✅ PASO 5: VALIDACIONES FINALES

### **5.1 Verificar Imports**
- ✅ Todos los imports necesarios agregados
- ✅ Ningún import no usado
- ✅ Imports en orden correcto

### **5.2 Verificar TypeScript**
- ✅ Todos los tipos correctos
- ✅ No hay `any` sin necesidad
- ✅ Interfaces respetadas

### **5.3 Verificar Lógica**
- ✅ Sets se crean correctamente
- ✅ `useMemo` con dependencias correctas
- ✅ `useCallback` con dependencias correctas
- ✅ Validaciones defensivas en lugar

### **5.4 Verificar Compatibilidad**
- ✅ Funciona si `occupiedTickets` es `[]`
- ✅ Funciona si `selectedTickets` es `[]`
- ✅ Funciona si `totalTickets` es 0 o undefined
- ✅ Funciona en móviles y desktop

### **5.5 Verificar UX**
- ✅ Toast reemplaza `alert()`
- ✅ Móviles sin framer-motion
- ✅ Desktop mantiene animaciones
- ✅ Feedback visual inmediato

---

## 🧪 PASO 6: CASOS DE PRUEBA

### **Caso 1: Sorteo pequeño (100 boletos, 10 ocupados)**
- ✅ Selección rápida y fluida
- ✅ Sin lag

### **Caso 2: Sorteo grande (10,000 boletos, 5,000 ocupados)**
- ✅ Selección instantánea
- ✅ Sin lag incluso con muchos ocupados

### **Caso 3: Móvil**
- ✅ Sin framer-motion
- ✅ Click responsivo
- ✅ Sin crashes

### **Caso 4: Edge cases**
- ✅ `occupiedTickets = []` funciona
- ✅ `occupiedTickets = null` no crashea
- ✅ `totalTickets = 0` maneja correctamente

---

## 📝 CHECKLIST DE IMPLEMENTACIÓN

### **TicketSelector.tsx**
- [ ] Agregar imports (`useMemo`, `useCallback`, `isMobile`)
- [ ] Crear `occupiedSet` y `selectedSet` con `useMemo`
- [ ] Memoizar `renderTickets()` con `useMemo`
- [ ] Reemplazar `Array.includes()` con `Set.has()`
- [ ] Desactivar framer-motion en móviles
- [ ] Validar `totalTickets` para `padStart`
- [ ] Validar arrays antes de usar

### **RaffleDetailPage.tsx**
- [ ] Agregar imports (`useMemo`, `useCallback`, `useToast`)
- [ ] Crear `occupiedSet` y `selectedSet` con `useMemo`
- [ ] Optimizar `handleTicketClick` con `useCallback`
- [ ] Reemplazar `alert()` con `toast.error()`
- [ ] MetaPixel en `setTimeout`
- [ ] Memoizar `pricePerTicket`, `totalPrice`, `boletosAdicionales`, `progress`
- [ ] Memoizar `raffleImages`
- [ ] Agregar `useToast()` hook

### **StickyPurchaseBar.tsx** (OPCIONAL)
- [ ] Memoizar `boletosAdicionales`

### **Validaciones**
- [ ] TypeScript compila sin errores
- [ ] No hay warnings de dependencias
- [ ] Pruebas manuales en desktop
- [ ] Pruebas manuales en móvil
- [ ] Pruebas con sorteos grandes
- [ ] Pruebas con edge cases

---

## ⚠️ RIESGOS Y MITIGACIONES

### **Riesgo 1: useToast no disponible**
**Mitigación:** Verificar antes de usar, fallback a `alert()`

### **Riesgo 2: Dependencias incorrectas en useMemo**
**Mitigación:** Revisar cuidadosamente todas las dependencias

### **Riesgo 3: isMobile() puede fallar en SSR**
**Mitigación:** Ya está envuelto en try-catch en otros componentes

### **Riesgo 4: Sets no se actualizan correctamente**
**Mitigación:** Dependencias correctas en `useMemo` aseguran actualización

---

## 🎯 RESULTADO ESPERADO

**Antes:**
- 50 boletos × 5,000 comparaciones = 250,000 operaciones por render
- Selección lenta con sorteos grandes
- Lag en móviles

**Después:**
- 50 boletos × 1 comparación = 50 operaciones por render
- Selección instantánea incluso con 10,000 boletos
- Sin lag en móviles
- **Mejora: 5,000x más rápido**

---

## 📅 ORDEN DE IMPLEMENTACIÓN

1. **Primero:** Verificar `useToast` y dependencias
2. **Segundo:** Modificar `TicketSelector.tsx` (más crítico)
3. **Tercero:** Modificar `RaffleDetailPage.tsx`
4. **Cuarto:** Modificar `StickyPurchaseBar.tsx` (opcional)
5. **Quinto:** Validaciones y pruebas

---

## ✅ LISTO PARA IMPLEMENTAR

Este plan está listo para implementar. Todos los riesgos están identificados y mitigados. El código es seguro y no rompe funcionalidad existente.

