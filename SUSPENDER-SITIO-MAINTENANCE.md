# Suspender el sitio (modo mantenimiento)

Documento de uso del componente `MaintenanceOverlay` para suspender el acceso a Lucky Snap (por ejemplo, cuando un cliente no ha pagado la renovacion).

## Resumen

- Cuando esta activo, una pantalla de "Sistema suspendido" tapa **toda la aplicacion**, incluido el panel `/admin` y `/admin/login`.
- Mientras esta activo el resto de la app **no se monta**: no carga rutas, contextos ni hace peticiones al backend.
- Se desbloquea con un atajo de teclado + clave secreta. El desbloqueo queda guardado en `localStorage` por navegador.
- No se borra ni se modifica nada en la base de datos. Solo es una capa visual y de bloqueo en el frontend.

## Archivos involucrados

- [frontend/components/MaintenanceOverlay.tsx](frontend/components/MaintenanceOverlay.tsx) — componente que pinta la capa y maneja el desbloqueo.
- [frontend/App.tsx](frontend/App.tsx) — envuelve toda la app con `<MaintenanceOverlay>`.

## Como ACTIVAR la suspension

El componente ya esta envolviendo toda la app en `App.tsx`. Por defecto, **al desplegar el sitio queda suspendido** para todos los visitantes (excepto navegadores que ya hayan ingresado la clave previamente).

Pasos:

1. Asegurate de que `App.tsx` tenga el wrapper `<MaintenanceOverlay>...</MaintenanceOverlay>` alrededor de `<ErrorBoundary>`.
2. (Opcional pero recomendado) cambia la clave en [frontend/components/MaintenanceOverlay.tsx](frontend/components/MaintenanceOverlay.tsx) linea 6:
   ```ts
   const SECRET = 'LUCKYSNAP-2026';
   ```
   Pon una clave que solo tu conozcas.
3. Compila y despliega:
   ```bash
   npm run build:frontend
   ```
   Sube `frontend/dist` a tu hosting (Netlify, Vercel, etc.).

## Como DESBLOQUEAR el sitio (verlo normal)

Cuando aparezca la pantalla "Sistema suspendido":

1. Presiona **`Ctrl + Shift + U`**.
2. Aparecera un `prompt` pidiendo "Clave de acceso:".
3. Escribe la clave configurada en `MaintenanceOverlay.tsx` (`LUCKYSNAP-2026` por defecto).
4. Si es correcta, la capa desaparece y el sitio carga normalmente. El desbloqueo queda guardado en `localStorage` con la llave `ls_maintenance_unlock_v1`.

> El desbloqueo es **por navegador**. Si el cliente borra cache, usa modo incognito o entra desde otro dispositivo, vuelve a ver la pantalla de suspension.

## Como volver a suspender mi propio navegador (probar)

Para verificar que la suspension se ve bien desde tu equipo:

1. Abre DevTools (F12).
2. Pestana **Application** -> **Local Storage** -> selecciona el dominio.
3. Borra la entrada `ls_maintenance_unlock_v1`.
4. Recarga la pagina. Ya veras la pantalla de "Sistema suspendido".

## Como REACTIVAR el sitio para todos (cliente pago)

Cuando el cliente regularice el pago y quieras restaurar el servicio para todo el mundo:

**Opcion A — Quitar el wrapper (recomendado):**

En [frontend/App.tsx](frontend/App.tsx) elimina las dos lineas que envuelven la app:

```tsx
// Quitar esta linea (alrededor de la 40):
<MaintenanceOverlay>

// y esta (al final del JSX):
</MaintenanceOverlay>
```

Tambien podes quitar el import:
```tsx
import MaintenanceOverlay from './components/MaintenanceOverlay';
```

Compila y despliega.

**Opcion B — Comentar el wrapper:**

Igual que la opcion A pero comentando las lineas, para reactivar facil cuando vuelva a vencer la renovacion.

## Como cambiar el mensaje

Edita [frontend/components/MaintenanceOverlay.tsx](frontend/components/MaintenanceOverlay.tsx). El titulo y el subtitulo estan al final del archivo, dentro del JSX:

```tsx
<h1>Sistema suspendido</h1>
<p>Comunícate con el administrador para más detalles.</p>
```

## Como cambiar el atajo de teclado

En [frontend/components/MaintenanceOverlay.tsx](frontend/components/MaintenanceOverlay.tsx), dentro del `useEffect`, modifica la condicion del `if`:

```ts
if (e.ctrlKey && e.shiftKey && (e.key === 'U' || e.key === 'u')) {
```

Por ejemplo, para usar `Ctrl + Alt + M`:
```ts
if (e.ctrlKey && e.altKey && (e.key === 'M' || e.key === 'm')) {
```

## Limitaciones / consideraciones de seguridad

- La clave queda **en el bundle JS** del cliente (es frontend). Un usuario muy tecnico podria encontrarla inspeccionando el codigo. Para el caso de presionar a un cliente que no pago, es suficiente.
- Si en el futuro queres algo mas robusto: validar la clave contra un endpoint del backend, o mover la suspension a un middleware del servidor que devuelva 503 antes de servir el HTML.
- El desbloqueo se guarda en `localStorage`, asi que no cuesta volver a "tapar" un navegador concreto si hace falta.

## Resumen rapido

| Accion | Como |
|---|---|
| Activar suspension | El wrapper ya esta en `App.tsx`. Despliega y queda activo. |
| Ver el sitio (yo) | `Ctrl + Shift + U` -> escribir clave |
| Re-bloquear mi navegador | Borrar `ls_maintenance_unlock_v1` en LocalStorage |
| Reactivar para todos | Quitar `<MaintenanceOverlay>` de `App.tsx` y redeploy |
| Cambiar clave | Editar `SECRET` en `MaintenanceOverlay.tsx` |
