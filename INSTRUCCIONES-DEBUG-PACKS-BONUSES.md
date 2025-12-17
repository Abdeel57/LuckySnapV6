# 🔍 Instrucciones para Debug de Packs y Bonuses

## Problema
Los packs y bonuses no se guardan ni se muestran después de editar una rifa.

## Pasos para Debug

### 1. Abrir la Consola del Navegador
- Presiona F12 en tu navegador
- Ve a la pestaña "Console"

### 2. Editar una Rifa
- Ve al panel de administración
- Edita una rifa existente
- Agrega bonos en "Bonos y Premios Adicionales"
- Agrega paquetes en "Precios y Paquetes"
- Guarda los cambios

### 3. Revisar los Logs del Frontend

Busca estos logs en la consola del navegador:

**Al enviar el formulario:**
- `📝 Form submit data:` - Datos originales del formulario
- `💾 Saving data:` - Datos procesados antes de enviar
- `🧹 Cleaning raffle data:` - Datos limpiados en AdminRafflesPage
- `📤 Sending to backend:` - Datos finales enviados al backend

**Después de guardar:**
- `✅ Raffle saved successfully:` - Rifa guardada
- `📦 Saved raffle packs:` - Packs guardados
- `🎁 Saved raffle bonuses:` - Bonuses guardados
- `✅ Parsed raffle packs:` - Packs parseados
- `✅ Parsed raffle bonuses:` - Bonuses parseados

### 4. Revisar los Logs del Backend

En la consola del backend (terminal donde corre el servidor), busca:

**Al recibir la petición:**
- `📥 Controller received update request:` - Datos recibidos en el controller
- `📦 Processing packs:` - Procesamiento de packs
- `🎁 Processing bonuses:` - Procesamiento de bonuses
- `✅ Final packs value:` - Valor final de packs
- `✅ Final bonuses value:` - Valor final de bonuses
- `📝 Final update data:` - Datos finales para actualizar
- `✅ Raffle updated successfully` - Confirmación de guardado
- `📦 Updated raffle packs:` - Packs después de guardar
- `🎁 Updated raffle bonuses:` - Bonuses después de guardar

### 5. Verificar en la Base de Datos

En pgAdmin, ejecuta esta consulta:

```sql
SELECT id, title, packs, bonuses 
FROM raffles 
WHERE id = 'TU_ID_DE_RIFA';
```

Revisa:
- ¿Los campos `packs` y `bonuses` tienen valores?
- ¿`packs` es un JSON válido?
- ¿`bonuses` es un array de strings?

## Posibles Problemas y Soluciones

### Problema 1: Los datos no llegan al backend
**Síntoma:** No ves logs del controller en el backend
**Solución:** Verifica que el backend esté corriendo y la URL sea correcta

### Problema 2: Los datos llegan pero no se guardan
**Síntoma:** Ves logs del controller pero no se guardan en la BD
**Solución:** Verifica los logs de "Final update data" y asegúrate de que packs y bonuses estén presentes

### Problema 3: Se guardan pero no se muestran
**Síntoma:** Se guardan en la BD pero no aparecen en la página
**Solución:** Verifica el parseo en `parseRaffleDates` y asegúrate de que se estén recuperando correctamente

## Qué Información Necesito

Cuando pruebes, copia y pega aquí:

1. **Logs del Frontend (consola del navegador):**
   - Todos los logs que empiecen con 📝, 💾, 🧹, 📤, ✅, 📦, 🎁

2. **Logs del Backend (terminal del servidor):**
   - Todos los logs relacionados con packs y bonuses

3. **Resultado de la consulta SQL:**
   - Los valores de packs y bonuses en la base de datos

Con esta información podré identificar exactamente dónde está el problema.

