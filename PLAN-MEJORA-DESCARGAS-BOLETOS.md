# Plan de Mejora: Descarga de Boletos en Excel/CSV

## 📋 Objetivo

Mejorar la funcionalidad de descarga de boletos apartados y pagados en formato Excel y CSV para facilitar la administración y análisis de datos de cada rifa.

## 🔍 Problemas Identificados

1. **Datos limitados**: Solo se exportan datos básicos del cliente
2. **Formato de fechas**: No son muy legibles
3. **Sin estadísticas**: No hay resumen de los datos
4. **Encoding CSV**: Puede tener problemas con caracteres especiales
5. **Sin validación de paquete**: XLSX puede no estar instalado

## ✅ Mejoras a Implementar

### 1. Datos Mejorados

**Información adicional a incluir:**
- ✅ Distrito del cliente
- ✅ Notas de la orden (si existen)
- ✅ Cantidad de boletos por orden
- ✅ Estado del pedido
- ✅ Monto individual por boleto
- ✅ Fecha y hora completa (no solo fecha)

### 2. Estadísticas Resumidas (Solo Excel)

Agregar una hoja adicional con:
- Total de boletos vendidos/apartados
- Total de clientes únicos
- Monto total recaudado
- Promedio de boletos por cliente
- Método de pago más usado
- Distribución por distrito

### 3. Formato Mejorado

- ✅ Fechas en formato legible: `DD/MM/YYYY HH:MM`
- ✅ Montos con formato de moneda: `LPS 1,234.56`
- ✅ Encoding UTF-8 con BOM para CSV (mejor compatibilidad con Excel)
- ✅ Altura de filas automática en Excel

### 4. Validación y Dependencias

- ✅ Verificar instalación de XLSX
- ✅ Agregar fallback si no está instalado
- ✅ Mensajes de error descriptivos

## 📊 Estructura del Archivo Excel

### Hoja 1: Boletos Detallados
- Cada fila = un boleto
- Columnas: Número, Cliente, Teléfono, Email, Distrito, Fecha Apartado, Fecha Pago, Método Pago, Monto Boleto, Folio, Estado, Notas

### Hoja 2: Resumen de Estadísticas
- Total de boletos
- Total de clientes
- Monto total
- Promedio por cliente
- Método de pago más usado
- Top 5 distritos

### Hoja 3: Ór Fuentes por Cliente (Si aplica)
- Cliente, Total Boletos, Monto Total, Fecha Primera Compra, Fecha Última Compra

## 🔧 Implementación

### Backend Changes

1. **Mejorar `downloadTickets`** en `admin.service.ts`:
   - Incluir datos adicionales del usuario
   - Mejorar formato de fechas
   - Agregar cálculo de estadísticas

2. **Mejorar `generateExcel`**:
   - Crear múltiples hojas
   - Agregar formato de columnas (moneda, fechas)
   - Agregar estilos (negrita en headers)

3. **Mejorar `generateCSV`**:
   - UTF-8 con BOM para mejor compatibilidad
   - Escapar comillas correctamente
   - Mejor formato de fechas

### Frontend Changes

1. **Mejorar UI** en `OptimizedRaffleManager.tsx`:
   - Indicadores visuales de descarga
   - Mensajes más claros
   - Preview de datos antes de descargar

2. **Mejorar manejo de errores** en `api.ts`:
   - Percibir errores descriptivos
   - Mostrar tamaño del archivo antes de descargar

## 📝 Flujo de Trabajo

1. Usuario hace clic en "Descargar Boletos Apartados (Excel)"
2. Sistema consulta todas las órdenes PENDING para esa rifa
3. Sistema genera Excel con:
   - Hoja de boletos detallados
   - Hoja de estadísticas
   - Hoja de resumen por cliente
4. Sistema descarga automáticamente
5. Usuario puede abrir en Excel/Google Sheets

## 🎯 Prioridades

### Alta Prioridad
- ✅ Mejorar datos exportados
- ✅ Corregir encoding CSV
- ✅ Validar paquete XLSX

### Media Prioridad
- ⏳ Agregar estadísticas
- ⏳ Formato mejorado de fechas

### Baja Prioridad
- ⏳ Preview antes de descargar
- ⏳ Múltiples hojas en Excel

## ⏱️ Tiempo Estimado

- Backend: 1-2 horas
- Frontend: 30 minutos
- Testing: 30 minutos
- **Total: 2-3 horas**

