# 🎯 PLAN DE MEJORA - VERIFICADOR DE BOLETOS

## 📋 OBJETIVOS

1. **Simplificar búsqueda**: Solo 3 métodos: Número de boleto, Folio, y Código QR
2. **Activar QR Scanner**: Funcionalidad completa para escanear códigos QR del boleto digital
3. **Mejorar UX**: Interfaz más clara y funcional

## 🎨 DISEÑO PROPUESTO

### Métodos de Búsqueda

#### 1. **Número de Boleto** (Manual)
- Input numérico
- Valida que sea un número válido
- Busca usando `searchTickets({ numero_boleto })`

#### 2. **Folio** (Manual)
- Input de texto
- Formato: LKSNP-XXXXX o similar
- Busca usando `searchTickets({ folio })`

#### 3. **Código QR** (Escaneo)
- Botón destacado para abrir escáner
- Modal con cámara activa
- Escanea el QR del boleto digital
- Procesa: `{ folio, ticket, raffleId }`
- Busca por folio usando `searchTickets({ folio })`

## 🔄 FLUJO DE TRABAJO

### Búsqueda Manual (Número/Folio)
1. Usuario selecciona tipo: "Número de boleto" o "Folio"
2. Ingresa valor en input
3. Click en "Buscar"
4. Se llama a `searchTickets(criteria)`
5. Se muestran resultados

### Búsqueda por QR
1. Usuario hace click en "Escanear QR"
2. Se abre modal con cámara
3. Usuario apunta hacia QR del boleto digital
4. Se captura el JSON: `{ folio: "LKSNP-XXXXX", ticket: 123, raffleId: "..." }`
5. Se usa `folio` para buscar con `searchTickets({ folio })`
6. Se muestran resultados

## 📊 ESTRUCTURA DE DATOS QR

El QR del boleto digital contiene:
```json
{
  "folio": "LKSNP-XXXXX",
  "ticket": 123,
  "raffleId": "raffle-id-uuid"
}
```

## ✅ VENTAJAS DE ESTE ENFOQUE

1. **Simple**: Solo 3 opciones claras
2. **Funcional**: QR permite verificación rápida
3. **Consistente**: Todos los métodos usan `searchTickets` al final
4. **Escalable**: Fácil agregar más métodos después
5. **User-friendly**: Botones grandes y claros

## 🚀 IMPLEMENTACIÓN

1. Modificar `VerifierPage.tsx`:
   - Reducir tipos a: `'numero_boleto' | 'folio' | 'qr'`
   - Activar componente `QRScanner`
   - Procesar datos QR y buscar por folio
   
2. Mejoras UX:
   - Botón grande para QR con icono
   - Mensajes claros de instrucciones
   - Feedback visual al escanear

3. Validaciones:
   - Validar formato de número de boleto
   - Validar formato de folio
   - Validar JSON del QR antes de procesar

