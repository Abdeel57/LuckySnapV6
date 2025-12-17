# 📋 Pasos Manuales Pendientes

## ✅ RESUMEN DE LO COMPLETADO

- ✅ Código actualizado y compilado
- ✅ Mejoras en sección de ganadores
- ✅ Funcionalidad de sorteos aleatorios
- ✅ Manejo de errores mejorado en rifas
- ✅ Todo pusheado a GitHub

## 🎯 PASOS MANUALES QUE DEBES REALIZAR

### PASO 1: Arreglar la Tabla Winners en Railway (pgAdmin)

**Este es el PASO MÁS IMPORTANTE**

#### 1.1. Abre pgAdmin y conéctate a Railway

1. Abre pgAdmin
2. Conecta con tu base de datos Railway (si ya lo tienes configurado)
3. Si no lo tienes configurado, usa estos datos:
   - **Host:** `nozomi.proxy.rlwy.net` (o el que aparece en Railway)
   - **Port:** `50670` (o el puerto de Railway)
   - **Database:** `railway`
   - **Username:** `postgres`
   - **Password:** La contraseña de Railway

#### 1.2. Ejecuta el SQL para arreglar la tabla

1. En pgAdmin, haz clic derecho en la base de datos `railway`
2. Selecciona "Query Tool"
3. Copia y pega este SQL completo:

```sql
-- Eliminar la tabla winners si existe
DROP TABLE IF EXISTS "winners" CASCADE;

-- Crear la tabla winners con los campos correctos
CREATE TABLE "winners" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prize" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "raffleTitle" TEXT NOT NULL,
    "drawDate" TIMESTAMP(3) NOT NULL,
    "ticketNumber" INTEGER,
    "testimonial" TEXT,
    "phone" TEXT,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "winners_pkey" PRIMARY KEY ("id")
);
```

4. Haz clic en el botón "Execute" (⚡) o presiona F5
5. Deberías ver un mensaje de éxito

#### 1.3. Verifica que funcionó

Ejecuta este query para ver los campos de la tabla:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'winners';
```

Deberías ver estos campos:
- `id`
- `name`
- `prize`
- `imageUrl`
- `raffleTitle`
- `drawDate`
- `ticketNumber`
- `testimonial`
- `phone`
- `city`
- `createdAt`
- `updatedAt`

### PASO 2: Verificar que el Deploy Funciona

#### 2.1. Entra a Railway/Render Dashboard

1. Ve a https://railway.app/ o https://render.com/
2. Inicia sesión en tu cuenta
3. Entra a tu proyecto

#### 2.2. Verifica el deploy

1. Busca tu servicio de backend
2. Verifica que esté en estado "Live" o "Running"
3. Revisa los logs recientes para asegurarte de que no haya errores

### PASO 3: Probar la Aplicación

#### 3.1. Probar Sección de Rifas

1. Inicia sesión en tu aplicación
2. Ve a la sección "Sorteos" (o "Rifas")
3. Prueba **crear una rifa nueva**:
   - Haz clic en "Nueva Rifa"
   - Llena los campos requeridos (título, precio, boletos, fecha)
   - Guarda
   - Verifica que se creó correctamente

4. Prueba **editar una rifa existente**:
   - Haz clic en el ícono de editar de cualquier rifa
   - Cambia algún campo
   - Guarda
   - Verifica que se actualizó

5. Prueba **eliminar una rifa** (si no tiene boletos vendidos):
   - Haz clic en eliminar
   - Confirma
   - Verifica que se eliminó

#### 3.2. Probar Sección de Ganadores

1. Ve a la sección "Ganadores"
2. Prueba **agregar un ganador manual**:
   - Haz clic en "Agregar Ganador Manual"
   - Llena el formulario
   - Sube una foto (opcional)
   - Guarda
   - Verifica que aparezca en la lista

3. Prueba **realizar un sorteo aleatorio**:
   - Selecciona una rifa de la lista desplegable
   - Haz clic en "Realizar Sorteo"
   - Verifica que aparezca la animación
   - Verifica que después muestre el ganador
   - Haz clic en "Guardar y Publicar Ganador"
   - Verifica que el ganador se guarde

## ✅ CHECKLIST DE VERIFICACIÓN

Marca cada paso cuando lo completes:

### Base de Datos
- [ ] Conectado a Railway con pgAdmin
- [ ] Ejecutado el SQL de fix en la tabla winners
- [ ] Verificado que los campos se crearon correctamente

### Deploy
- [ ] Backend está activo en Railway/Render
- [ ] No hay errores en los logs
- [ ] Frontend está desplegado

### Pruebas - Rifas
- [ ] Puedo crear una rifa nueva
- [ ] Puedo editar una rifa existente
- [ ] Puedo eliminar una rifa (sin ventas)
- [ ] Los mensajes de error son claros

### Pruebas - Ganadores
- [ ] Puedo agregar un ganador manual
- [ ] Puedo realizar un sorteo aleatorio
- [ ] La animación funciona correctamente
- [ ] Los ganadores se guardan correctamente

## ❓ PROBLEMAS COMUNES

### Problema 1: "Error al conectar con pgAdmin"
**Solución:** Verifica que tengas la URL de conexión correcta de Railway

### Problema 2: "Error 500 en la aplicación"
**Solución:** 
- Revisa los logs en Railway
- Asegúrate de que ejecutaste el SQL de fix en la tabla winners
- Verifica que el backend esté activo

### Problema 3: "No puedo crear rifas"
**Solución:**
- Abre la consola del navegador (F12)
- Ve a la pestaña "Console"
- Busca mensajes de error en rojo
- Comparte esos errores para que pueda ayudarte

## 📞 SI NECESITAS AYUDA

Si encuentras algún problema:
1. Anota el mensaje de error exacto
2. Toma una captura de pantalla
3. Revisa los logs en Railway/Render
4. Comparte esa información para que pueda ayudarte

## 🎉 CUANDO TODO FUNCIONE

Después de completar todos los pasos:
- ✅ La aplicación debería funcionar completamente
- ✅ Podrás crear, editar y eliminar rifas
- ✅ Podrás agregar ganadores manualmente
- ✅ Podrás realizar sorteos aleatorios
- ✅ Todo debería estar funcionando correctamente
