# PLAN DE MEJORA - SECCIÓN DE GANADORES

## OBJETIVO
Mejorar la sección de ganadores con:
1. Agregar ganadores manualmente con foto
2. Mejorar la animación del sorteo aleatorio
3. Añadir campos adicionales para transmitir confianza

## CAMBIOS NECESARIOS

### 1. Tipo Winner (frontend/types.ts)
- Agregar campos opcionales:
  - `ticketNumber?: number` - Número de boleto ganador
  - `testimonial?: string` - Testimonio del ganador
  - `phone?: string` - Teléfono del ganador
  - `city?: string` - Ciudad del ganador

### 2. Componentes Nuevos
- `WinnerForm.tsx` - Formulario para agregar ganador manualmente
- `WinnerDrawAnimation.tsx` - Animación de sorteo mejorada

### 3. Mejoras en AdminWinnersPage.tsx
- Agregar botón "Agregar Ganador Manual"
- Modal con formulario para datos del ganador
- Subida de imagen personalizada
- Mejorar animación de sorteo aleatorio con:
  - Números girando rápidamente
  - Contador regresivo
  - Efecto de "ruleta"
  - Sonido opcional (opcional)

### 4. Backend
- Actualizar schema de Winner en Prisma
- Migración de base de datos
- Endpoint para subir imágenes

## IMPLEMENTACIÓN PASO A PASO

### Paso 1: Actualizar tipo Winner
### Paso 2: Crear componente WinnerForm
### Paso 3: Crear componente WinnerDrawAnimation
### Paso 4: Actualizar AdminWinnersPage con nuevas funcionalidades
### Paso 5: Actualizar backend con nuevos campos
### Paso 6: Probar funcionalidad completa
