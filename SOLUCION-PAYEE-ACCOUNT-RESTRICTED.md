# 🚫 Solución: PAYEE_ACCOUNT_RESTRICTED

## ❌ Error Identificado

```
"issue":"PAYEE_ACCOUNT_RESTRICTED",
"description":"The merchant account is restricted."
```

**Significado:** Tu cuenta de PayPal tiene restricciones que impiden recibir pagos.

## 🔍 Causas Comunes

1. **Cuenta no completamente verificada**
   - Falta verificación de identidad
   - Falta verificación de email
   - Falta verificación de teléfono

2. **Documentación pendiente**
   - Información fiscal incompleta
   - Documentos de identidad no subidos
   - Información bancaria pendiente

3. **Restricciones temporales**
   - Actividad sospechosa detectada
   - Límites de cuenta alcanzados
   - Revisión de cuenta en proceso

4. **Problemas de negocio**
   - Tipo de negocio no permitido
   - Restricciones geográficas
   - Políticas de PayPal no cumplidas

## ✅ Pasos para Resolver

### Paso 1: Verificar Estado de la Cuenta

1. Inicia sesión en [paypal.com](https://www.paypal.com)
2. Ve a **Configuración** → **Estado de la cuenta**
3. Revisa todas las notificaciones y alertas
4. Completa cualquier verificación pendiente

### Paso 2: Completar Verificaciones

**Verificaciones comunes:**
- ✅ Email verificado
- ✅ Teléfono verificado
- ✅ Identidad verificada (documento de identidad)
- ✅ Información fiscal completa
- ✅ Información bancaria (si aplica)

### Paso 3: Revisar Notificaciones

1. Ve a **Centro de mensajes** en PayPal
2. Busca notificaciones sobre restricciones
3. Lee las instrucciones específicas
4. Sigue los pasos indicados

### Paso 4: Contactar Soporte de PayPal

Si completaste todas las verificaciones y aún está restringida:

1. Ve a [Centro de Ayuda de PayPal](https://www.paypal.com/es/smarthelp/contact-us)
2. Selecciona **"Problemas con mi cuenta"**
3. Explica que recibes el error `PAYEE_ACCOUNT_RESTRICTED`
4. Proporciona el Debug ID: `56345f2322a7d` (del error que recibiste)

**Información útil para el soporte:**
- Debug ID: `56345f2322a7d`
- Error: `PAYEE_ACCOUNT_RESTRICTED`
- Fecha del error
- Tipo de negocio: Rifas/Lotterías
- País: Honduras

### Paso 5: Verificar Tipo de Negocio

Algunos tipos de negocio pueden tener restricciones:

- ⚠️ **Rifas/Lotterías**: Pueden requerir aprobación especial
- ⚠️ **Juegos de azar**: Pueden estar prohibidos
- ⚠️ **Actividades de alto riesgo**: Requieren documentación adicional

**Solución:**
- Describe tu negocio como "Venta de productos" o "Servicios"
- Evita usar términos como "rifa" o "lotería" en la descripción
- Si es necesario, contacta a PayPal para aprobación especial

## 🔧 Verificaciones Adicionales

### En PayPal Developer Dashboard

1. Ve a [developer.paypal.com](https://developer.paypal.com/dashboard)
2. Verifica que tu aplicación esté en estado **"Live"**
3. Revisa si hay notificaciones sobre la aplicación
4. Verifica que las credenciales sean correctas

### Verificar Límites de Cuenta

1. En PayPal, ve a **Límites**
2. Verifica si hay límites que impidan recibir pagos
3. Si hay límites, sigue las instrucciones para aumentarlos

## 📞 Contacto Directo con PayPal

**Teléfono (Honduras):**
- Llama al soporte de PayPal (busca el número en su sitio web)

**Chat en vivo:**
- Disponible en el Centro de Ayuda de PayPal

**Email:**
- A través del Centro de Ayuda

**Información a proporcionar:**
```
Error: PAYEE_ACCOUNT_RESTRICTED
Debug ID: 56345f2322a7d
Fecha: [fecha del error]
Descripción: No puedo recibir pagos porque mi cuenta está restringida
```

## ⚠️ Mientras Tanto

Si necesitas recibir pagos urgentemente:

1. **Usa el método de transferencia** (ya funciona en tu sistema)
2. **Completa todas las verificaciones de PayPal**
3. **Contacta a PayPal** para acelerar el proceso
4. **Una vez resuelto**, los pagos con PayPal funcionarán automáticamente

## ✅ Después de Resolver

Una vez que PayPal elimine las restricciones:

1. **No necesitas cambiar el código** - todo está listo
2. **Prueba con una orden pequeña** primero
3. **Verifica que los pagos funcionen** correctamente
4. **Monitorea los logs** para asegurar que todo esté bien

## 📋 Checklist de Resolución

- [ ] Inicié sesión en PayPal
- [ ] Revisé el estado de mi cuenta
- [ ] Completé todas las verificaciones pendientes
- [ ] Revisé las notificaciones
- [ ] Contacté al soporte de PayPal (si es necesario)
- [ ] Esperé la confirmación de PayPal
- [ ] Probé con una orden pequeña
- [ ] Verifiqué que los pagos funcionen

## 🔗 Enlaces Útiles

- [Centro de Ayuda PayPal](https://www.paypal.com/es/smarthelp/home)
- [Estado de Cuenta PayPal](https://www.paypal.com/myaccount/settings)
- [PayPal Developer Dashboard](https://developer.paypal.com/dashboard)
- [Documentación del Error](https://developer.paypal.com/api/rest/reference/orders/v2/errors/#PAYEE_ACCOUNT_RESTRICTED)

