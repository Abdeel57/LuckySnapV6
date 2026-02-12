# 🚀 Guía de Configuración de PayPal para Lucky Snap

## 📋 Datos que necesitas de PayPal (Sandbox para pruebas)

### Paso 1: Crear cuenta en PayPal Developer
1. Ve a: **https://developer.paypal.com/**
2. Inicia sesión con tu cuenta PayPal (o créala si no tienes)
3. Ve a **Dashboard** → **My Apps & Credentials**

### Paso 2: Crear una App (Sandbox)
1. Click en **"Create App"**
2. Nombre: `Lucky Snap` (o el que prefieras)
3. Selecciona **"Sandbox"** (para pruebas)
4. Click en **"Create App"**

### Paso 3: Obtener credenciales
Después de crear la app, verás:

#### **Client ID** (público - va en frontend)
```
Ejemplo: AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz
```
- Este es el que va en `VITE_PAYPAL_CLIENT_ID`

#### **Secret** (privado - va en backend)
```
Ejemplo: EF1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ
```
- Este es el que va en `PAYPAL_CLIENT_SECRET`
- **⚠️ IMPORTANTE**: Click en "Show" para verlo (solo se muestra una vez)

### Paso 4: Configurar Webhook (después de deployar backend)
1. En PayPal Dashboard → **Webhooks**
2. Click en **"Add Webhook"**
3. URL del webhook: `https://tu-backend.railway.app/api/payment/paypal/webhook`
4. Eventos a escuchar:
   - ✅ `PAYMENT.CAPTURE.COMPLETED`
   - ✅ `PAYMENT.CAPTURE.DENIED`
   - ✅ `PAYMENT.CAPTURE.REFUNDED`
5. Click en **"Save"**
6. Copia el **Webhook ID** (lo necesitarás para verificar)

## 🔑 Variables de Entorno Necesarias

### Backend (.env)
```env
PAYPAL_CLIENT_ID=tu_client_id_sandbox
PAYPAL_CLIENT_SECRET=tu_secret_sandbox
PAYPAL_MODE=sandbox
PAYPAL_WEBHOOK_ID=tu_webhook_id
FRONTEND_URL=https://tu-frontend.netlify.app
```

### Frontend (.env)
```env
VITE_PAYPAL_CLIENT_ID=tu_client_id_sandbox
```

## 🧪 Cuentas de Prueba (Sandbox)

PayPal te da cuentas de prueba automáticamente:

### Cuenta Personal (comprador)
- Email: `sb-xxxxx@personal.example.com`
- Password: (lo genera PayPal)
- Puedes usarla para simular compras

### Cuenta Business (vendedor - tu cuenta)
- Email: `sb-xxxxx@business.example.com`
- Password: (lo genera PayPal)
- Recibe los pagos

## 📝 Pasos para Obtener los Datos

1. **Ve a**: https://developer.paypal.com/
2. **Login** con tu cuenta PayPal
3. **Dashboard** → **Sandbox** → **Accounts** (para ver cuentas de prueba)
4. **Dashboard** → **My Apps & Credentials** → **Sandbox** (para ver Client ID y Secret)
5. **Dashboard** → **Webhooks** (después de crear el webhook)

## ✅ Checklist Antes de Implementar

- [ ] Cuenta PayPal Developer creada
- [ ] App Sandbox creada
- [ ] Client ID copiado
- [ ] Secret copiado (y guardado de forma segura)
- [ ] Backend deployado (para configurar webhook después)
- [ ] Frontend URL definida (para redirects)

## 🔄 Para Producción (después de pruebas)

Cuando todo funcione en Sandbox:
1. Crea una nueva App en modo **"Live"** (producción)
2. Obtén nuevos Client ID y Secret de producción
3. Configura webhook con URL de producción
4. Actualiza variables de entorno en Railway/Netlify

---

**Nota**: Los datos de Sandbox son solo para pruebas. No procesan pagos reales.


