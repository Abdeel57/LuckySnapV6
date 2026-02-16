# 💳 Guía Completa: Activar Pagos Reales con PayPal

## 📋 Resumen

Esta guía te llevará paso a paso para activar los pagos reales con tarjeta de débito/crédito usando PayPal. Actualmente estás en **Sandbox (pruebas)**, y necesitas cambiar a **Producción (pagos reales)**.

---

## ✅ Estado Actual

- ✅ Integración de PayPal implementada
- ✅ Flujo de pago funcionando en Sandbox
- ✅ Redirección automática al comprobante
- ✅ Separación de flujos (PayPal vs Transferencia)
- ⚠️ **Falta**: Cambiar a modo Producción

---

## 🎯 Pasos para Activar Pagos Reales

### **PASO 1: Crear Aplicación en PayPal Producción**

1. **Accede a PayPal Developer Dashboard**
   - Ve a: https://developer.paypal.com/
   - Inicia sesión con tu cuenta PayPal **de negocio** (no personal)

2. **Cambiar a Producción**
   - En la parte superior, cambia de "Sandbox" a **"Live"** (Producción)
   - Si no tienes cuenta de negocio, necesitarás crearla primero

3. **Crear Nueva Aplicación**
   - Ve a "My Apps & Credentials"
   - Click en "Create App"
   - **Nombre**: `Lucky Snap Production`
   - **Merchant**: Selecciona tu cuenta de negocio
   - **Features**: Selecciona:
     - ✅ Accept Payments
     - ✅ Advanced Card Payments (opcional, para campos embebidos)
   - Click en "Create App"

4. **Obtener Credenciales de Producción**
   - Una vez creada, verás:
     - **Client ID** (público)
     - **Client Secret** (privado - guárdalo seguro)
   - ⚠️ **IMPORTANTE**: Estas son diferentes a las de Sandbox

---

### **PASO 2: Configurar Variables de Entorno en Backend**

#### **2.1. En Railway (Producción)**

1. Ve a tu proyecto en Railway: https://railway.app
2. Selecciona el servicio del backend
3. Ve a la pestaña "Variables"
4. Actualiza las siguientes variables:

```env
# Cambiar estas variables de PayPal
PAYPAL_CLIENT_ID=tu_client_id_de_produccion_aqui
PAYPAL_CLIENT_SECRET=tu_client_secret_de_produccion_aqui
PAYPAL_MODE=production
PAYPAL_EXCHANGE_RATE=24.7
FRONTEND_URL=https://tu-dominio-frontend.com
```

**Variables importantes:**
- `PAYPAL_MODE=production` ← **Cambiar de "sandbox" a "production"**
- `PAYPAL_CLIENT_ID` ← Usar el Client ID de producción
- `PAYPAL_CLIENT_SECRET` ← Usar el Client Secret de producción
- `FRONTEND_URL` ← URL real de tu frontend (ej: https://luckysnap.com)

#### **2.2. Verificar Otras Variables**

Asegúrate de que también tengas configuradas:
```env
NODE_ENV=production
DATABASE_URL=tu_url_de_base_de_datos
CORS_ORIGINS=https://tu-dominio-frontend.com
```

---

### **PASO 3: Configurar Variables en Frontend**

#### **3.1. En Netlify/Vercel (o tu hosting)**

1. Ve a tu proyecto en Netlify/Vercel
2. Ve a "Site settings" → "Environment variables"
3. Agrega/Actualiza:

```env
VITE_PAYPAL_CLIENT_ID=tu_client_id_de_produccion_aqui
VITE_API_URL=https://tu-backend-url.com/api
```

**⚠️ IMPORTANTE**: 
- El `VITE_PAYPAL_CLIENT_ID` debe ser el mismo que en el backend
- No incluyas el Client Secret en el frontend (solo va en el backend)

---

### **PASO 4: Verificar Configuración de PayPal**

1. **Verificar que tu cuenta PayPal esté verificada**
   - Ve a tu cuenta PayPal de negocio
   - Asegúrate de que esté completamente verificada
   - Completa cualquier verificación pendiente

2. **Configurar Webhooks (Opcional pero Recomendado)**
   - En PayPal Developer Dashboard → "My Apps & Credentials"
   - Selecciona tu app de producción
   - Ve a "Webhooks"
   - Agrega webhook URL: `https://tu-backend-url.com/api/payment/paypal/webhook`
   - Eventos a escuchar:
     - `PAYMENT.CAPTURE.COMPLETED`
     - `PAYMENT.CAPTURE.DENIED`

---

### **PASO 5: Probar en Producción (Con Cuidado)**

⚠️ **ADVERTENCIA**: En producción, los pagos son REALES. Prueba con montos pequeños primero.

1. **Hacer una Prueba Real**
   - Usa una tarjeta de prueba real (tu propia tarjeta)
   - Realiza una compra pequeña (ej: L. 50)
   - Verifica que:
     - ✅ El pago se procesa correctamente
     - ✅ La orden se marca como PAID automáticamente
     - ✅ Aparece en "Clientes" (no en "Apartados")
     - ✅ El comprobante se genera correctamente

2. **Verificar en PayPal**
   - Ve a tu cuenta PayPal
   - Verifica que el pago aparezca en "Actividad"
   - Confirma que el dinero llegó a tu cuenta

---

### **PASO 6: Monitoreo y Seguridad**

1. **Revisar Logs**
   - Monitorea los logs del backend en Railway
   - Busca errores relacionados con PayPal
   - Verifica que los pagos se capturen correctamente

2. **Configurar Alertas (Recomendado)**
   - Configura alertas en PayPal para pagos recibidos
   - Revisa regularmente los pagos en tu cuenta PayPal

3. **Mantener Seguridad**
   - ⚠️ **NUNCA** compartas tu Client Secret
   - ⚠️ **NUNCA** subas el Client Secret a GitHub
   - ⚠️ Solo usa variables de entorno para credenciales

---

## 🔍 Verificación Final

### Checklist de Activación

- [ ] Cuenta PayPal de negocio verificada
- [ ] Aplicación creada en PayPal Producción
- [ ] Credenciales de producción obtenidas
- [ ] Variables de entorno actualizadas en backend (Railway)
- [ ] `PAYPAL_MODE=production` configurado
- [ ] Variables de entorno actualizadas en frontend (Netlify/Vercel)
- [ ] `VITE_PAYPAL_CLIENT_ID` configurado en frontend
- [ ] `FRONTEND_URL` apunta a tu dominio real
- [ ] Webhooks configurados (opcional)
- [ ] Prueba realizada con pago real pequeño
- [ ] Verificado que el pago aparece en PayPal
- [ ] Verificado que la orden se marca como PAID automáticamente

---

## 🆘 Solución de Problemas

### Error: "PayPal no está configurado"
- Verifica que las variables de entorno estén configuradas
- Asegúrate de que `PAYPAL_CLIENT_ID` y `PAYPAL_CLIENT_SECRET` no estén vacíos
- Reinicia el servicio del backend después de cambiar variables

### Error: "Authentication failed"
- Verifica que estés usando las credenciales de **Producción** (no Sandbox)
- Confirma que `PAYPAL_MODE=production`
- Verifica que tu cuenta PayPal esté verificada

### Los pagos no se procesan
- Revisa los logs del backend
- Verifica que el webhook esté configurado correctamente
- Confirma que `FRONTEND_URL` esté correcto

### El pago se procesa pero no aparece como PAID
- Verifica que el webhook esté funcionando
- Revisa los logs del backend para errores
- Confirma que la captura de pago se complete correctamente

---

## 📊 Monitoreo Post-Activación

### Métricas a Revisar Regularmente

1. **En PayPal Dashboard:**
   - Pagos recibidos
   - Tasa de éxito/fallo
   - Reembolsos

2. **En tu Panel de Administración:**
   - Órdenes pagadas con tarjeta
   - Órdenes pagadas con transferencia
   - Total recaudado por método

3. **En Logs del Backend:**
   - Errores de PayPal
   - Webhooks recibidos
   - Capturas exitosas

---

## 💡 Consejos Adicionales

1. **Mantén Sandbox Activo**
   - No elimines las credenciales de Sandbox
   - Úsalas para probar nuevas funcionalidades antes de producción

2. **Tasa de Cambio**
   - Actualiza `PAYPAL_EXCHANGE_RATE` regularmente
   - Revisa la tasa actual en: https://www.xe.com/

3. **Backup de Credenciales**
   - Guarda tus credenciales de producción en un lugar seguro
   - Usa un gestor de contraseñas

4. **Documentación**
   - Mantén esta guía actualizada
   - Documenta cualquier cambio en la configuración

---

## ✅ Listo para Producción

Una vez completados todos los pasos, tu sistema estará listo para recibir pagos reales con tarjeta. Los clientes podrán:

1. Seleccionar boletos
2. Elegir "Pago con tarjeta"
3. Completar el pago en PayPal
4. Ver su comprobante automáticamente
5. Aparecer en "Clientes" sin intervención manual

**¡Éxito con tu plataforma! 🎉**

