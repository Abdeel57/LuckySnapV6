# 💬 MEJORAS AL MENSAJE DE WHATSAPP

## 📋 SITUACIÓN ACTUAL

**Mensaje actual:**
```
Hola! Quiero enviar mi comprobante para el folio ${createdOrder.folio}
```

**Problema:** Muy básico, no incluye información útil para identificar rápidamente al cliente, boletos y rifa.

---

## ✨ PROPUESTAS DE MENSAJES

### Opción 1: Mensaje Completo y Profesional (RECOMENDADA)

```
Hola! 👋

Acabo de realizar mi pago y quiero enviarte mi comprobante para confirmar mi apartado.

📋 *Mis datos:*
• Nombre: [NOMBRE_CLIENTE]
• Teléfono: [TELEFONO_CLIENTE]
• Folio: *[FOLIO]*

🎫 *Información del apartado:*
• Rifa: [TITULO_RIFA]
• Boletos: [LISTA_BOLETOS]
• Total pagado: L. [TOTAL]

Adjunto el comprobante de pago. Gracias! 🙏
```

**Formato URL:**
```
Hola!%20👋%0A%0AAcabo%20de%20realizar%20mi%20pago%20y%20quiero%20enviarte%20mi%20comprobante%20para%20confirmar%20mi%20apartado.%0A%0A📋%20*Mis%20datos:*%0A•%20Nombre:%20${nombre}%0A•%20Teléfono:%20${telefono}%0A•%20Folio:%20*${folio}*%0A%0A🎫%20*Información%20del%20apartado:*%0A•%20Rifa:%20${tituloRifa}%0A•%20Boletos:%20${boletos}%0A•%20Total%20pagado:%20L.%20${total}%0A%0AAdjunto%20el%20comprobante%20de%20pago.%20Gracias!%20🙏
```

**✅ Ventajas:**
- Incluye toda la información necesaria
- Fácil de identificar al cliente
- Formato claro y organizado
- Profesional pero amigable

---

### Opción 2: Mensaje Conciso y Directo

```
Hola! Acabo de realizar mi pago.

*Datos del apartado:*
• Nombre: [NOMBRE]
• Folio: [FOLIO]
• Rifa: [RIFA]
• Boletos: [BOLETOS]
• Total: L. [TOTAL]

Adjunto mi comprobante. Gracias!
```

**✅ Ventajas:**
- Más corto
- Información esencial
- Fácil de leer rápidamente

---

### Opción 3: Mensaje Super Breve (Para cuando hay pocos boletos)

```
Hola! 👋

Pago realizado - Folio: *[FOLIO]*
Rifa: [RIFA]
Boletos: [BOLETOS]
Total: L. [TOTAL]

Cliente: [NOMBRE] - [TELEFONO]

Adjunto comprobante. Gracias!
```

**✅ Ventajas:**
- Ultra breve
- Información crítica al inicio
- Fácil de escanear visualmente

---

### Opción 4: Mensaje Estructurado con Separadores

```
━━━━━━━━━━━━━━━━━━━━
   COMPROBANTE DE PAGO
━━━━━━━━━━━━━━━━━━━━

👤 Cliente: [NOMBRE]
📞 Teléfono: [TELEFONO]
🔢 Folio: *[FOLIO]*

🎫 Rifa: [RIFA]
🎟️ Boletos: [BOLETOS]
💰 Total: L. [TOTAL]

Adjunto comprobante adjunto.
Gracias por tu atención!
```

**✅ Ventajas:**
- Muy visual
- Fácil de identificar información específica
- Formato tipo "ticket"

---

### Opción 5: Mensaje Conversacional (Más Natural)

```
Hola! Espero te encuentres bien.

Acabo de realizar el pago por mi apartado y te comparto los detalles:

Mi nombre es [NOMBRE], teléfono [TELEFONO].

El folio de mi apartado es el *[FOLIO]* para la rifa "[RIFA]".

Compré [CANTIDAD] boleto(s): [BOLETOS] por un total de L. [TOTAL].

Adjunto el comprobante. ¡Quedo atento a tu confirmación! Gracias 😊
```

**✅ Ventajas:**
- Muy natural y conversacional
- Informativo
- Profesional pero cercano

---

## 🎯 RECOMENDACIÓN FINAL

**Opción 1 (Mensaje Completo y Profesional)** es la mejor porque:

1. ✅ Incluye TODA la información necesaria
2. ✅ Está bien estructurado y organizado
3. ✅ Fácil de identificar cliente, boletos y rifa
4. ✅ Profesional pero amigable
5. ✅ Formato que WhatsApp muestra bien

---

## 📝 IMPLEMENTACIÓN

### Variables Disponibles

```typescript
// Del formulario
data.name          // Nombre del cliente
data.phone         // Teléfono del cliente
data.department    // Departamento

// De la orden
createdOrder.folio              // Folio único
createdOrder.tickets            // Array de números de boletos
createdOrder.total             // Total pagado
createdOrder.totalAmount       // Total pagado (alternativo)

// De la rifa
raffle.title       // Título de la rifa
raffle.slug        // Slug de la rifa
```

### Función Helper para Formatear Mensaje

```typescript
const formatWhatsAppMessage = (
  customerName: string,
  customerPhone: string,
  folio: string,
  raffleTitle: string,
  tickets: number[],
  total: number
): string => {
  // Formatear lista de boletos
  const ticketsList = tickets.length <= 10 
    ? tickets.join(', ')
    : `${tickets.slice(0, 10).join(', ')}... y ${tickets.length - 10} más`;

  return `Hola! 👋

Acabo de realizar mi pago y quiero enviarte mi comprobante para confirmar mi apartado.

📋 *Mis datos:*
• Nombre: ${customerName}
• Teléfono: ${customerPhone}
• Folio: *${folio}*

🎫 *Información del apartado:*
• Rifa: ${raffleTitle}
• Boletos: ${ticketsList}
• Total pagado: L. ${total.toFixed(2)}

Adjunto el comprobante de pago. Gracias! 🙏`;
};
```

---

## 🔧 CÓDIGO A IMPLEMENTAR

En `frontend/pages/PurchasePage.tsx`:

```typescript
// Función helper
const formatWhatsAppMessage = (
  customerName: string,
  customerPhone: string,
  folio: string,
  raffleTitle: string,
  tickets: number[],
  total: number
): string => {
  // Formatear boletos (mostrar máximo 10, luego "y X más")
  const formatTickets = (tickets: number[]): string => {
    if (tickets.length <= 10) {
      return tickets.join(', ');
    }
    return `${tickets.slice(0, 10).join(', ')} y ${tickets.length - 10} más`;
  };

  const ticketsText = formatTickets(tickets);
  const totalFormatted = total.toFixed(2);

  return `Hola! 👋

Acabo de realizar mi pago y quiero enviarte mi comprobante para confirmar mi apartado.

📋 *Mis datos:*
• Nombre: ${customerName}
• Teléfono: ${customerPhone}
• Folio: *${folio}*

🎫 *Información del apartado:*
• Rifa: ${raffleTitle}
• Boletos: ${ticketsText}
• Total pagado: L. ${totalFormatted}

Adjunto el comprobante de pago. Gracias! 🙏`;
};

// En el JSX, reemplazar el href actual con:
const whatsappMessage = createdOrder && raffle && initialTickets.length > 0
  ? formatWhatsAppMessage(
      data.name || createdOrder.customer?.name || 'Cliente',
      data.phone || createdOrder.customer?.phone || '',
      createdOrder.folio || '',
      raffle.title,
      createdOrder.tickets || initialTickets,
      createdOrder.total || createdOrder.totalAmount || total
    )
  : '';

const whatsappUrl = `https://wa.me/${contactWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;
```

---

## ✅ BENEFICIOS DE LA MEJORA

1. **Identificación rápida:**
   - Nombre y teléfono al inicio
   - Folio destacado

2. **Información completa:**
   - Rifa claramente identificada
   - Todos los boletos listados
   - Total pagado visible

3. **Profesionalismo:**
   - Mensaje estructurado
   - Fácil de leer
   - Imagen de marca mejorada

4. **Eficiencia:**
   - No necesitas pedir información adicional
   - Todo está en un solo mensaje
   - Fácil de copiar/pegar en otros sistemas

---

## 🎨 OTRAS IDEAS (Opcionales)

### Agregar Emojis Específicos
- 📋 Para datos del cliente
- 🎫 Para información de rifa
- 💰 Para monto
- ✅ Para confirmación

### Agregar Hashtags (para búsqueda)
```
#Folio[FOLIO] #Rifa[RIFA_SIN_ESPACIOS]
```

### Incluir Link a la Rifa (si deseas)
```
Ver rifa: https://tusitio.com/rifa/${raffle.slug}
```

