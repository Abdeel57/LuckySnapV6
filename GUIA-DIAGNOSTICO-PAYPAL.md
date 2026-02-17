# 🔍 Guía de Diagnóstico para PayPal

## Problema: Error "Business Validation" o "Semantically Incorrect"

Si tus credenciales están correctas y la cuenta verificada, pero aún recibes errores, sigue esta guía.

## ✅ Checklist de Verificación

### 1. Variables de Entorno (Railway/Backend)

Verifica que estas variables estén configuradas correctamente:

```env
PAYPAL_CLIENT_ID=AXrbNEiaHYYpn_fDBv36ZxSPmEn7GDOvPXxv_Sy1KSlI2zYyIAbXdiPFOqlPcIIjNt3ef4V7zD84guTQ
PAYPAL_CLIENT_SECRET=TU_CLIENT_SECRET_AQUI
PAYPAL_MODE=production  # O 'sandbox' para pruebas
PAYPAL_EXCHANGE_RATE=24.7  # Tasa de cambio HNL a USD
FRONTEND_URL=https://luckysnaphn.com  # SIN / al final, SIN #
```

**Importante:**
- En producción, `FRONTEND_URL` DEBE ser HTTPS
- No debe terminar con `/`
- No debe contener `#` (hash)

### 2. Verificar Credenciales

1. Ve a [PayPal Developer Dashboard](https://developer.paypal.com/dashboard)
2. Verifica que estés usando las credenciales de la app correcta
3. Confirma que la app esté en modo "Live" (no Sandbox)
4. Verifica que la cuenta de PayPal esté completamente verificada

### 3. Verificar URLs de Retorno

Las URLs deben ser:
- ✅ Accesibles públicamente (no localhost)
- ✅ HTTPS en producción
- ✅ Sin caracteres especiales problemáticos
- ✅ Sin redirecciones que eliminen parámetros

**Ejemplo correcto:**
```
https://luckysnaphn.com/comprobante/ORD-123
https://luckysnaphn.com/purchase/ORD-123
```

**Ejemplo incorrecto:**
```
https://luckysnaphn.com/#/comprobante/ORD-123  ❌ (tiene #)
http://luckysnaphn.com/comprobante/ORD-123     ❌ (no HTTPS en producción)
https://luckysnaphn.com/comprobante/ORD-123/   ❌ (trailing slash)
```

### 4. Verificar Montos

- ✅ Monto mínimo: $0.01 USD
- ✅ Formato: 2 decimales exactos (ej: "10.50")
- ✅ Conversión HNL a USD correcta

**Ejemplo:**
```
L. 100 / 24.7 = $4.05 USD ✅
L. 0.50 / 24.7 = $0.02 USD ✅
L. 0.10 / 24.7 = $0.00 USD ❌ (muy pequeño)
```

### 5. Verificar Logs del Backend

En Railway, busca estos mensajes en los logs:

```
📤 Creando orden en PayPal con: { ... }
```

Verifica:
- `amountUSD`: Debe ser >= 0.01
- `returnUrl` y `cancelUrl`: Deben ser URLs válidas HTTPS
- `mode`: Debe ser "production" (no "sandbox")
- `orderRequest`: Revisa la estructura completa

### 6. Errores Comunes y Soluciones

#### Error: "UNPROCESSABLE_ENTITY"
**Causa:** ID duplicado o formato incorrecto
**Solución:** 
- Cada orden debe tener un `orderId` único
- El `referenceId` se genera automáticamente como `LS-{orderId}`

#### Error: "INVALID_RESOURCE_ID"
**Causa:** Mezcla de sandbox y production
**Solución:**
- Verifica que `PAYPAL_MODE=production`
- Usa credenciales de producción (no sandbox)

#### Error: "Business Validation Failed"
**Causa:** Estructura de orden incorrecta
**Solución:**
- Verifica que el monto sea >= $0.01 USD
- Verifica que las URLs sean HTTPS en producción
- Verifica que no haya campos faltantes

### 7. Probar con PayPal Sandbox Primero

Antes de usar producción, prueba con sandbox:

1. Cambia `PAYPAL_MODE=sandbox`
2. Usa credenciales de sandbox
3. Prueba una compra pequeña
4. Si funciona en sandbox, el problema es de configuración de producción

### 8. Contactar Soporte de PayPal

Si todo lo anterior está correcto y aún falla:

1. Ve a [PayPal Developer Support](https://paypal-techsupport.com)
2. Proporciona:
   - Order ID de PayPal (si lo tienes)
   - Logs del backend (mensaje completo de error)
   - Screenshot del error
   - Tu Client ID (puedes compartirlo, no es secreto)

### 9. Verificación de la Cuenta PayPal

Asegúrate de que tu cuenta PayPal:
- ✅ Esté completamente verificada
- ✅ Tenga permisos para recibir pagos
- ✅ No tenga restricciones geográficas
- ✅ Esté activa y en buen estado

### 10. Prueba Manual

1. Crea una orden pequeña (L. 25 = ~$1 USD)
2. Intenta pagar con PayPal
3. Revisa los logs del backend inmediatamente
4. Copia el error completo
5. Comparte el error para diagnóstico

## 📋 Comandos Útiles

### Ver logs en Railway:
```bash
# En Railway Dashboard → Deployments → View Logs
# Busca: "📤 Creando orden en PayPal"
```

### Verificar variables de entorno:
```bash
# En Railway Dashboard → Variables
# Verifica todas las variables PAYPAL_*
```

## 🔧 Cambios Recientes Implementados

1. ✅ Validación de monto mínimo ($0.01 USD)
2. ✅ Validación de URLs HTTPS en producción
3. ✅ Limpieza de URLs (sin #, sin trailing slash)
4. ✅ Agregado `customId` para webhooks
5. ✅ Agregado `locale: 'es-HN'` para Honduras
6. ✅ Mejor manejo de errores con detalles completos

## 📞 Próximos Pasos

1. Verifica todas las variables de entorno
2. Prueba con una orden pequeña
3. Revisa los logs del backend
4. Si persiste el error, comparte los logs completos

