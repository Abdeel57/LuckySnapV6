# 🔍 INSTRUCCIONES DE PRUEBA - Lucky Snap

## ✅ PROGRESO ACTUAL

```
✅ Rifas se crean correctamente
✅ Aparecen en sitio público
❌ Imágenes no aparecen (usar imagen por defecto)
❌ No se pueden apartar boletos (página no disponible)
❌ No aparecen apartados
```

---

## 🚨 **DIAGNÓSTICO NECESARIO**

### **Para Arreglar "Página No Disponible":**

Necesito que me digas:

**1. ¿Qué URL intenta abrir cuando das click en "Apartar" o "Proceder al Pago"?**

Mira en la barra de direcciones, debería ser algo como:
```
https://jocular-brioche-6fbeda.netlify.app/#/comprar/SLUG-DE-LA-RIFA?tickets=1,2,3
```

**2. En F12 → Console, ¿qué errores aparecen?**

Cuando intentas apartar, copia todos los errores rojos.

**3. ¿El slug de la rifa se generó correctamente?**

En el admin, cuando ves la rifa que creaste, ¿tiene un slug?
- Ve a Admin → Rifas
- Mira los detalles de la rifa
- ¿Tiene un valor en "slug"?

---

## 🔧 **SOLUCIONES SEGÚN EL PROBLEMA:**

### **CASO A: URL incorrecta (falta slug)**

Si la URL es:
```
/#/comprar/null
o
/#/comprar/undefined
```

**Problema:** El slug no se generó

**Solución:** El backend ya genera slug automático, necesita redeploy

---

### **CASO B: Página 404**

Si dice "Página no encontrada" o 404

**Problema:** La ruta no existe o React Router no la encuentra

**Verificar en App.tsx:**
```tsx
<Route path="comprar/:slug" element={<PurchasePage />} />
```

---

### **CASO C: Error de JavaScript**

Si hay error en consola tipo:
```
Cannot read properties of undefined
TypeError: ...
```

**Problema:** La página de compra intenta acceder a campos que no existen

---

## ⚡ **TEST RÁPIDO:**

### **Ejecuta esto en Console (F12):**

```javascript
// Ver la rifa con todos sus campos
fetch('https://lucky-snap-backend-complete.onrender.com/api/public/raffles/active')
  .then(res => res.json())
  .then(raffles => {
    console.log('📊 Total raffles:', raffles.length);
    if (raffles.length > 0) {
      const r = raffles[0];
      console.log('Primera rifa:', {
        id: r.id,
        title: r.title,
        slug: r.slug,
        imageUrl: r.imageUrl,
        price: r.price,
        tickets: r.tickets,
        status: r.status
      });
      
      // Probar la URL de compra
      const purchaseUrl = `/#/comprar/${r.slug}?tickets=1,2,3`;
      console.log('🔗 URL de compra:', purchaseUrl);
      console.log('👉 Click aquí para probar:', window.location.origin + purchaseUrl);
    }
  });
```

**Esto te dará:**
1. Los datos de la rifa
2. La URL correcta para apartar
3. Un link para probar

---

## 🎯 **MIENTRAS TANTO: DEPLOY BACKEND**

**Ya arreglé:**
- ✅ Slug se genera automáticamente
- ✅ Imagen por defecto si no hay imageUrl
- ✅ Normalización de caracteres especiales en slug

**Necesitas:**
1. **Redeploy en Render** (10 minutos)
2. **Redeploy en Netlify** (3 minutos)

Después del deploy:
- Las rifas nuevas tendrán slug automático
- Tendrán imagen por defecto
- Deberían ser accesibles

---

## 📋 **CHECKLIST DE PRUEBA:**

Después de los deploys:

1. **Crear Nueva Rifa:**
   ```
   Admin → Rifas → Nueva Rifa
   Título: Test Completo
   Precio: 50
   Boletos: 100
   Fecha: [futuro]
   Estado: active
   (No poner imagen)
   ```

2. **Verificar en Admin:**
   - ¿La rifa tiene un slug único?
   - ¿Tiene una imagen por defecto?

3. **Ver en Sitio Público:**
   - ¿Aparece la rifa?
   - ¿Tiene imagen?
   - Click en la rifa
   - ¿Abre la página de detalle?

4. **Intentar Apartar:**
   - Selecciona boletos
   - Click "Apartar"
   - ¿Qué URL abre?
   - ¿Hay errores?

---

## 📞 **DIME AHORA:**

**Ejecuta el script de Console de arriba y dime:**

1. ¿Cuántas rifas muestra?
2. ¿La primera rifa tiene slug?
3. ¿Cuál es la URL de compra que genera?
4. ¿Qué pasa cuando intentas abrir esa URL?

Con esa información sabré exactamente qué está fallando 🔍

