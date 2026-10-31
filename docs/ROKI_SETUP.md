# ROKI Connect — Pago con tarjeta (checkout alojado)

Guía de configuración y operación de la pasarela ROKI en Lucky Snap: variables de entorno, URL del webhook, pasos para producción controlada y para sandbox, endpoints, reglas de negocio y resultados de las pruebas.

> **Estado al 2026-10-30.** El sandbox del comercio en ROKI está **inactivo** ("Terminal de pago no asignado"), así que no hay llaves `sk_test_`. Se decidió validar **directo en producción** con la opción de tarjeta **oculta** para los clientes y un cobro real pequeño. Esta guía describe ese camino primero.

---

## 1. Qué hace la integración

1. El backend crea el pago en ROKI (`POST /payments` con `Idempotency-Key`) con el **importe recalculado en el servidor** a partir del precio del sorteo, nunca con el total que envía el navegador.
2. El comprador paga en la página de ROKI. Puede llegar por la opción "Tarjeta" de la tienda (rediseño, cuando `ROKI_PUBLIC_CHECKOUT=true`) o por un **enlace de pago por folio** que se le envía por WhatsApp.
3. Al terminar, ROKI lo devuelve a nuestro backend (`/return`), que **consulta el cobro al instante** y lo manda al comprobante o le muestra el estado.
4. ROKI avisa también por **webhook** firmado (HMAC sobre el cuerpo crudo). El backend guarda el evento, responde 200 y vuelve a consultar `GET /payments/{id}` antes de marcar el pedido como PAID, una sola vez y con bloqueo de fila.
5. Si el webhook y el regreso fallan, la **conciliación** (cada 2 min, con espera exponencial) recupera la confirmación.
6. Pagos tardíos, importes distintos, pedidos editados o boletos ya revendidos nunca asignan boletos: generan una **incidencia** para revisión humana. No hay reembolsos automáticos.

Proveedor: `https://aura.roki.systems/api/connect/v1` · Portal: `https://aura.roki.systems/merchant/connect/api-integration` (llaves) y `/merchant/connect/webhooks` (webhooks).

---

## 2. Variables de entorno (solo backend, en Railway)

**Nunca** en el frontend (`VITE_*`), ni en Git, ni en logs.

| Variable | Producción controlada | Descripción |
|---|---|---|
| `ROKI_ENABLED` | `true` | Activa la API: enlaces por folio, regreso, webhooks y conciliación. |
| `ROKI_ENVIRONMENT` | `live` | `sandbox` o `live`. La llave debe coincidir (`sk_test_*` ↔ sandbox, `sk_live_*` ↔ live); si no, la integración queda inactiva. |
| `ROKI_SECRET_KEY` | `sk_live_…` | Llave secreta del portal (Integración API → Credenciales → Producción). |
| `ROKI_WEBHOOK_SECRET` | `whsec_…` | Secreto de firma del webhook de producción. Se muestra una sola vez al crearlo. |
| `ROKI_PUBLIC_CHECKOUT` | `false` | `true` muestra la opción "Tarjeta" en la tienda. Con `false` solo funcionan los enlaces por folio: ideal para probar sin exponerla. Por defecto `false`. |
| `ROKI_RETURN_PAGE` | `receipt` | A dónde vuelve el comprador. `receipt`: al comprobante si quedó pagado y, si no, a una página del backend (funciona con la tienda actual). `result`: a `/#/pago/:id` (requiere el rediseño). Por defecto `result`. |
| `ROKI_CURRENCY_CODE` | `340` | ISO 4217 numérico. `340` = Lempira (HNL). Debe coincidir con la terminal. |
| `PUBLIC_APP_URL` | `https://luckysnaphn.com` | Origen de la tienda (comprobante y botones de volver). |
| `PUBLIC_API_URL` | `https://luckysnapv6-production.up.railway.app` | Origen público del backend. Necesario para el regreso con verificación inmediata y para los enlaces por folio. |
| `ROKI_WEBHOOK_TOLERANCE_SECONDS` | (300) | Tolerancia del timestamp de la firma. |
| `ROKI_RECONCILE_INTERVAL_SECONDS` | (120) | Frecuencia de la conciliación. |
| `ROKI_MIN_MINUTES_BEFORE_EXPIRY` | (5) | No se crean enlaces si el apartado o el sorteo cierran antes de este margen. |
| `ROKI_API_BASE_URL` | — | Solo para pruebas con un simulador. |

`backend/env.example` incluye estas variables comentadas.

---

## 3. URLs públicas

| Uso | URL |
|---|---|
| Webhook (registrar en el portal, eventos `payment.*`) | `https://luckysnapv6-production.up.railway.app/api/payments/roki/webhook` |
| Enlace de pago por folio (enviar al cliente) | `https://luckysnapv6-production.up.railway.app/api/public/payments/roki/pay/LKSNP-XXXXX` |
| Diagnóstico (abrir en el navegador) | `https://luckysnapv6-production.up.railway.app/api/admin/payments/roki/diagnostics` |
| Incidencias (JSON) | `https://luckysnapv6-production.up.railway.app/api/admin/payments/roki/incidents` |
| Intentos de pago (JSON) | `https://luckysnapv6-production.up.railway.app/api/admin/payments/roki/payments` |

- Eventos del webhook: `payment.approved`, `payment.failed`, `payment.expired`, `payment.voided`, `payment.refunded`, `payment.partially_refunded`. Los demás y el `webhook.test` se aceptan con 200 y se ignoran.
- Firma: `ROKI-Signature: t=<timestamp>,v1=<hex>` → `HMAC-SHA256(timestamp + "." + cuerpo_crudo, ROKI_WEBHOOK_SECRET)` en tiempo constante. Firma inválida → 400.
- Sandbox y producción necesitan webhooks y secretos distintos.

---

## 4. Pasos

### A. Despliegue del código (una vez)

El código vive en `main` **solo con el backend** (el rediseño de la tienda no se publica). Las tablas `payments` y `payment_events` las crea el propio servidor al arrancar (`backend/src/roki/roki.schema.ts`: SQL idempotente con candado, solo agrega). No se usa una migración de Prisma porque la tabla `_prisma_migrations` de producción no tiene la estructura estándar y `prisma migrate deploy` falla al registrar cualquier migración nueva (build del 2026-10-30). Sin las variables de ROKI todo queda **inactivo** y la tienda no cambia.

### B. Producción controlada (prueba con cobro real)

1. Portal ROKI → pestaña **Producción** → Integración API → copiar la llave `sk_live_…`.
2. Portal → Webhooks → Producción → crear endpoint con la URL del webhook (sección 3) y los eventos `payment.*`. Copiar el `whsec_…`.
3. Railway → variables del backend:
   ```
   ROKI_ENABLED=true
   ROKI_ENVIRONMENT=live
   ROKI_SECRET_KEY=sk_live_…
   ROKI_WEBHOOK_SECRET=whsec_…
   ROKI_PUBLIC_CHECKOUT=false
   ROKI_RETURN_PAGE=receipt
   ROKI_CURRENCY_CODE=340
   PUBLIC_APP_URL=https://luckysnaphn.com
   PUBLIC_API_URL=https://luckysnapv6-production.up.railway.app
   ```
4. Esperar el redespliegue y abrir el diagnóstico: `enabled: true`, `environment: "live"`, `environmentMatches: true`, `publicCheckout: false`, `problems: []`, comercio en `merchant`.
5. Admin → Rifas → crear un sorteo **"Prueba ROKI"** en estado **borrador**, precio bajo (p. ej. L 10), pocos boletos y fecha de sorteo futura. En borrador no aparece en la portada, pero se abre por su enlace `https://luckysnaphn.com/#/sorteo/<slug>`.
6. Abrir ese enlace, elegir 1 boleto y apartarlo por **transferencia**. Anotar el folio.
7. Abrir `https://luckysnapv6-production.up.railway.app/api/public/payments/roki/pay/<FOLIO>`. Debe llevar a la página de pago de ROKI con el importe exacto.
8. Pagar con una tarjeta real (los datos los escribe el dueño de la tarjeta).
9. Al terminar, debe abrir el **comprobante** con el QR. En el diagnóstico: `lastWebhook` = `payment.approved · processed` y sin webhooks pendientes ni fallidos en `counters`.
10. Probar también "cancelar" en la página de ROKI con otro apartado: debe mostrar "No se completó el pago" con el botón para reintentar.
11. Después: reembolsar desde el portal de ROKI si se desea (aparecerá una incidencia `refunded_after_confirmation`; liberar ese pedido a mano) y pasar el sorteo de prueba a finalizado o borrarlo.
12. Cuando todo esté bien, la tarjeta se ofrece a clientes de dos formas: enviando el enlace por folio a quien aparta por transferencia, o con `ROKI_PUBLIC_CHECKOUT=true` cuando se publique el rediseño (que ya trae la opción en la compra, la página de resultado y el panel `Admin → Pagos tarjeta`).

Para apagar todo sin desplegar código: `ROKI_ENABLED=false`.

### C. Sandbox (cuando ROKI lo active)

Igual que B con `ROKI_ENVIRONMENT=sandbox`, llave `sk_test_…` y un webhook de la pestaña Pruebas. Conviene un servicio de Railway separado con otra base de datos, para no mezclar pedidos de prueba con los reales. Tarjetas en la sección 8. Si ROKI responde `422 "El entorno sandbox no esta configurado para enlaces de pago"`, pedir que lo habiliten.

---

## 5. Endpoints añadidos

| Método y ruta | Uso |
|---|---|
| `GET /api/public/payments/roki/config` | `{ enabled, environment, currencyIso }`. `enabled` es `ROKI_ENABLED && ROKI_PUBLIC_CHECKOUT`: decide si la tienda muestra la opción. |
| `GET /api/public/payments/roki/pay/:folio` | Enlace compartible: crea o reutiliza el cobro y redirige a ROKI. Pedido pagado → comprobante. Error → página explicativa. |
| `GET /api/public/payments/roki/return/:orderId?folio=&result=` | `success_url`/`cancel_url`: verifica con ROKI y redirige (comprobante o `/#/pago`) o muestra la página de estado. |
| `POST /api/public/payments/roki/orders/:orderId/checkout` body `{ folio }` | Lo usa la tienda rediseñada. Errores: `409 already_paid / order_not_pending / order_expiring / payment_received / raffle_closed / amount_unverified`, `502 provider_error / provider_inconsistent`, `503` si está desactivado. |
| `GET /api/public/payments/roki/orders/:orderId/status?folio=` | Estado para `/#/pago` (consulta a ROKI como máximo cada 10 s). |
| `POST /api/payments/roki/webhook` | Webhook firmado. |
| `GET /api/admin/payments/roki/diagnostics` | Configuración sin secretos, `/me`, contadores, último webhook, URLs. |
| `GET /api/admin/payments/roki/payments?status=&folio=&limit=` · `GET …/payments/:id` | Intentos de pago (con eventos en el detalle). |
| `GET /api/admin/payments/roki/incidents` | Incidencias abiertas. |
| `POST /api/admin/payments/roki/reconcile` · `POST …/payments/:id/sync` | Conciliación manual. |
| `POST /api/admin/payments/roki/payments/:id/resolve` body `{ action: 'confirm' \| 'dismiss', note? }` | Resolver incidencias. |
| `POST /api/admin/payments/roki/webhook-test` | Ping `webhook.test`. |

El folio (aleatorio, solo lo conoce el comprador) autoriza las rutas públicas, igual que `/public/orders/folio/:folio`. Las rutas `admin/*` siguen el mismo esquema sin autenticación que el resto del backend actual.

---

## 6. Modelo de datos

- **`payments`**: un intento por enlace. `orderId`, `environment`, `merchantId`, `status` (`pending | paid | failed | expired | voided | refunded | partially_refunded | disabled`), `providerPaymentId` (único por proveedor+entorno), `transactionId`, `externalReference` (= folio), `idempotencyKey` (única), `amountExpected`, `currencyCode/Iso`, `amountConfirmed`, `checkoutUrl`, `requestSnapshot`/`providerSnapshot`, `expiresAt`, `paidAt`, `confirmedAt`, campos de conciliación e incidencias.
- **`payment_events`**: bandeja de webhooks, única por `provider + environment + eventId`.
- Al confirmar: `orders.status = PAID`, `orders.paymentMethod = 'roki'` y se **anexa** a `orders.notes` la línea `[ROKI <env>] Pago #<id> confirmado … · HNL <importe> · tx <uuid>`.

---

## 7. Reglas de negocio

- **Importe verificado en el servidor**: el total que manda el navegador se compara con los totales válidos del sorteo (boletos comprados × precio, un paquete exacto, o paquete × cantidad; los boletos de regalo no se cobran). Si no coincide → `409 amount_unverified` y no se crea cobro. Un pedido con descuento manual se paga por transferencia.
- **Sorteo abierto**: no se cobra si el sorteo está finalizado o su fecha cae dentro del margen. El enlace vence con el apartado o con el sorteo, lo que ocurra primero (máximo 30 días).
- **Confirmación única** con bloqueo de fila; exige `paid` y que coincidan id, folio, moneda e importe (`amount` y `total`), y que el pedido no haya cambiado de importe (`order_changed`).
- **Idempotencia**: la llave incluye pedido, importe, moneda, boletos e intento; dos clics o reenviar el enlace reutilizan el mismo cobro.
- **Liberación automática**: no libera apartados con enlace vigente (+10 min de gracia para el 3DS), cobro pagado sin confirmar o incidencia abierta. Si la tabla `payments` no existiera, sigue liberando como antes.
- **Pagos tardíos**: incidencia `late_payment`. Solo un administrador puede confirmar y reactivar, y solo si ningún boleto pertenece ya a otro pedido; si no, reembolsar desde el portal.
- **Doble cobro**: pedido ya pagado por otra vía → `order_paid_other_method`. **Reembolso** tras confirmar → `refunded_after_confirmation`.
- **Webhooks** duplicados o fuera de orden son inocuos; los atascados se reprocesan desde la conciliación.
- Abrir un enlace **no cambia** el método de pago del apartado; pasa a `roki` solo al confirmar.

---

## 8. Tarjetas de prueba (solo sandbox, PowerTranz)

| Caso | Tarjeta | Notas |
|---|---|---|
| Aprobada sin 3DS | `4012 0000 0002 0071` | Cualquier fecha futura y CVV. |
| Reto 3DS | `4012 0000 0002 0006` | Contraseña `3ds2`. |
| Autenticación rechazada | `5100 2700 0000 0072` | |
| Rechazo del banco (05) | `4666 6666 6666 2222` | |
| Sin 3DS | `4333 3333 3333 2222` | |

---

## 9. Pruebas

### Comandos

```bash
cd backend
npm install
npx tsc --noEmit
npm test          # 43 pruebas unitarias
# Base Postgres de PRUEBAS (nunca la de Railway), con las tablas creadas (arrancar el servidor una vez o `npx prisma db push`):
TEST_DATABASE_URL=<url> TEST_DATABASE_URL_NO_PAYMENTS=<url con esquema anterior> npm run test:roki-db
```

### Resultados (2026-10-30)

| Comprobación | Resultado |
|---|---|
| `tsc --noEmit` y `nest build` sobre `main` + ROKI | ✅ |
| `npm test` | ✅ 43/43: firma HMAC, idempotencia, zona horaria, decisión de confirmación, precio legítimo, configuración, página HTML, endpoints de enlace y regreso |
| `npm run test:roki-db` (Postgres 17 local) | ✅ 3/3: 6 confirmaciones simultáneas → 1 PAID; webhook duplicado; pago tardío con boletos revendidos; importe distinto; liberador automático respeta pagos en curso; sigue liberando sin la tabla nueva |
| Tablas creadas al arrancar, sobre un esquema y un historial de migraciones iguales a los de `main` | ✅ `prisma migrate deploy` sin pendientes (como en Railway), tablas creadas en el primer arranque, segundo arranque sin cambios, la base resultante coincide exactamente con `schema.prisma` |
| Punta a punta: servidor real + Postgres + ROKI simulado, configuración de producción (`live`, oculto, `receipt`) | ✅ 20/20 en base nueva y 20/20 en un segundo arranque (lista abajo) |
| Frontend del rediseño (tsc, build, navegador con backend simulado) | ✅ sin errores nuevos; 8 estados de `/#/pago`; panel admin |
| Cobro real en producción | ⏳ pendiente de las credenciales live (sección 4B) |

Escenarios punta a punta: tablas creadas al arrancar · opción oculta en la tienda · diagnóstico sin secretos · enlace por folio con importe real y `https` · doble clic sin duplicar · total manipulado rechazado · paquete legítimo aceptado · regreso cancelado · pago + webhook firmado (duplicado incluido) → PAID una vez y `sold` recalculado · regreso → comprobante · enlace de pedido pagado → comprobante · firma inválida → 400 · webhook perdido → confirma el regreso · webhook perdido sin regreso → confirma la conciliación · rechazo del banco → sigue apartado · pago tardío → incidencia y confirmación del admin · pedido editado → `order_changed` · ping `webhook.test` · folio inexistente → 404 · ningún secreto en los registros.

---

## 10. Operación diaria

- Enviar a un cliente su enlace: `…/api/public/payments/roki/pay/<FOLIO>`.
- Revisar incidencias en `…/api/admin/payments/roki/incidents` (y en `Admin → Pagos tarjeta` cuando se publique el rediseño).
- Logs del backend con prefijo `[ROKI]`.

---

## 11. Pendientes y datos necesarios

1. Llave `sk_live_…` y `whsec_…` del webhook de producción (sección 4B).
2. Confirmar la moneda de la terminal (HNL = 340).
3. Pedir a ROKI que asigne el terminal sandbox para pruebas futuras.
4. **Despliegues (preexistente):** la tabla `_prisma_migrations` de producción no es estándar (tiene una columna de más y alguna obligatoria sin valor por defecto). Cualquier migración de Prisma futura romperá el build de Railway igual que el 2026-10-30. Se corrige con un `ALTER TABLE` puntual tras revisar su definición.
5. **Seguridad (preexistente):** `backend/.env` con `DATABASE_URL` y `JWT_SECRET` está versionado en Git. Conviene sacarlo del repositorio y rotar la contraseña de la base de datos en Railway.
6. **Seguridad (preexistente):** el backend acepta el `total` que envía el navegador al crear un pedido. Con tarjeta ya se valida; con transferencia sigue dependiendo de la revisión humana.
