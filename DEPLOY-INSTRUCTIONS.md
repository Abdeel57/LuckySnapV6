# 🚀 INSTRUCCIONES DE DEPLOY - Lucky Snap V6

## ✅ PREPARACIÓN COMPLETADA

### 📋 Estado Actual:
- ✅ **Backend compilado** correctamente
- ✅ **Frontend compilado** correctamente  
- ✅ **Cambios pusheados** a GitHub
- ✅ **Scripts de deploy** creados
- ✅ **Configuración de Git** optimizada

---

## 🔧 DEPLOY DEL BACKEND (Render)

### 📋 Pasos Manuales:

1. **Acceder a Render:**
   - Ve a: https://dashboard.render.com
   - Inicia sesión en tu cuenta

2. **Seleccionar el Servicio:**
   - Busca tu servicio backend: `lucky-snap-backend-complete`
   - Haz clic en el servicio

3. **Iniciar Deploy Manual:**
   - Haz clic en el botón **"Manual Deploy"**
   - Selecciona la rama: **`main`**
   - Haz clic en **"Deploy latest commit"**

4. **Monitorear el Deploy:**
   - Observa los logs en tiempo real
   - El deploy tomará 2-3 minutos
   - Verifica que termine con estado "Live"

### 🔗 URL del Backend:
```
https://lucky-snap-backend-complete.onrender.com
```

---

## 🌐 DEPLOY DEL FRONTEND (Netlify)

### 📋 Pasos Manuales:

1. **Acceder a Netlify:**
   - Ve a: https://app.netlify.com
   - Inicia sesión en tu cuenta

2. **Seleccionar el Sitio:**
   - Busca tu sitio: `lucky-snap-v6`
   - Haz clic en el sitio

3. **Iniciar Deploy:**
   - Ve a la pestaña **"Deploys"**
   - Haz clic en **"Trigger deploy"**
   - Selecciona **"Deploy site"**

4. **Monitorear el Deploy:**
   - Observa el progreso del deploy
   - El deploy tomará 1-2 minutos
   - Verifica que termine con estado "Published"

### 🔗 URL del Frontend:
```
https://lucky-snap-v6.netlify.app
```

---

## 🧪 FUNCIONALIDADES A PROBAR

### 🎨 **Configuración de Apariencia:**
1. Ve a: `/admin/ajustes`
2. Cambia los colores → Se aplican inmediatamente
3. Sube un logo → Se muestra en el header
4. Cambia el nombre del sitio → Se actualiza en header/footer

### 📞 **Información de Contacto:**
1. Agrega WhatsApp → Aparece en footer
2. Agrega email → Aparece en footer
3. Los enlaces funcionan correctamente

### 🌐 **Redes Sociales:**
1. Agrega URLs de Facebook, Instagram, Twitter
2. Los iconos aparecen en el footer
3. Los enlaces abren en nueva pestaña

### 💰 **Cuentas de Pago:**
1. Agrega/elimina cuentas bancarias
2. Los datos se guardan correctamente
3. Se muestran en la página de pagos

### ❓ **Preguntas Frecuentes:**
1. Agrega/elimina preguntas
2. Los datos se guardan correctamente
3. Se muestran en la página pública

---

## 🔍 VERIFICACIÓN POST-DEPLOY

### ✅ **Checklist de Verificación:**

**Backend:**
- [ ] Deploy completado sin errores
- [ ] Endpoint `/api/public/settings` responde
- [ ] Endpoint `/api/admin/settings` funciona
- [ ] Base de datos conectada correctamente

**Frontend:**
- [ ] Deploy completado sin errores
- [ ] Página pública carga correctamente
- [ ] Admin panel accesible
- [ ] Configuración se aplica en tiempo real

**Funcionalidad:**
- [ ] Cambios de configuración se guardan
- [ ] Apariencia se aplica inmediatamente
- [ ] Contacto y redes se muestran en footer
- [ ] Logo y nombre se actualizan en header

---

## 🚨 SOLUCIÓN DE PROBLEMAS

### **Si el Backend falla:**
1. Revisa los logs en Render
2. Verifica las variables de entorno
3. Asegúrate de que la base de datos esté conectada

### **Si el Frontend falla:**
1. Revisa los logs en Netlify
2. Verifica que `VITE_API_URL` esté configurado
3. Asegúrate de que el backend esté funcionando

### **Si la configuración no se aplica:**
1. Verifica que ambos servicios estén funcionando
2. Revisa la consola del navegador
3. Asegúrate de que los endpoints respondan

---

## 📞 **SOPORTE**

Si encuentras algún problema:
1. Revisa los logs de Render/Netlify
2. Verifica la consola del navegador
3. Confirma que las URLs estén correctas
4. Asegúrate de que la base de datos esté conectada

---

## 🎉 **¡DEPLOY LISTO!**

**Todos los cambios están preparados y listos para producción.**

**¿Procedo con el deploy manual o necesitas ayuda con algún paso específico?**
