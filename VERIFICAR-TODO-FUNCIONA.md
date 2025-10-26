# 🧪 VERIFICAR QUE TODO FUNCIONA CORRECTAMENTE

## ✅ PASO 1: Esperar Reinicio de Render

Espera 2-3 minutos para que Render reinicie completamente.

## ✅ PASO 2: Verificar Backend

Prueba estos endpoints:

### 1. Health Check
```
https://lucky-snap-backend-complete.onrender.com/api/health
```
**Deberías ver:** `{"status":"OK","message":"Lucky Snap Backend funcionando"...}`

### 2. Verificar Rifas
```
https://lucky-snap-backend-complete.onrender.com/api/public/raffles/active
```
**Deberías ver:** Array de rifas activas (puede estar vacío)

## ✅ PASO 3: Verificar en pgAdmin

1. Abre pgAdmin
2. Conéctate a "railway"
3. Ve a la tabla "raffles"
4. Click derecho → "View/Edit Data" → "All Rows"
5. Verifica que veas las columnas:
   - `boletosConOportunidades`
   - `numeroOportunidades`

---

## 🧪 PROBAR FUNCIONALIDADES

### Crear Sorteo con Oportunidades
1. Ve al admin panel
2. Click en "Nueva Rifa"
3. Ve a pestaña "Configuración Avanzada"
4. Deberías ver:
   - ✅ Checkbox "Boletos con Múltiples Oportunidades"
   - ✅ Input para número de oportunidades (1-10)
5. Activa el checkbox
6. Ingresa un número (ej: 3)
7. Guarda la rifa

### Verificar que se Guardó
1. En la página pública, busca tu rifa
2. Debería mostrar: "🎯 Xx Oportunidades"
3. En el admin, edita la rifa
4. Verifica que las opciones estén configuradas

---

## 🎉 TODO LISTO

Si todos los tests pasan, tu sistema está 100% funcional:
- ✅ Crear sorteos
- ✅ Editar sorteos
- ✅ Descargar boletos
- ✅ Verificador de boletos
- ✅ Múltiples oportunidades

---

## 🆘 SI ALGO FALLA

### Backend no responde:
- Espera 5 minutos más
- Verifica logs en Render
- Verifica que DATABASE_URL esté correcta

### No aparece opción de oportunidades:
- Verifica que las columnas existan en pgAdmin
- Verifica que hayas hecho pull del código más reciente
