// Script para enviar confirmación de pago automática
const nodemailer = require('nodemailer');

// Configuración de WhatsApp Business API (simulada)
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v17.0/YOUR_PHONE_NUMBER_ID/messages';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || 'YOUR_ACCESS_TOKEN';

// Configuración de email
const EMAIL_CONFIG = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'tu-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'tu-password'
  }
};

async function sendPaymentConfirmation(order) {
  try {
    console.log(`📧 Enviando confirmación de pago para orden ${order.folio}`);
    
    // Enviar por WhatsApp
    await sendWhatsAppMessage(order);
    
    // Enviar por Email
    await sendEmailMessage(order);
    
    console.log(`✅ Confirmación enviada para orden ${order.folio}`);
  } catch (error) {
    console.error(`❌ Error enviando confirmación para orden ${order.folio}:`, error);
  }
}

async function sendWhatsAppMessage(order) {
  try {
    const message = {
      messaging_product: "whatsapp",
      to: order.user.phone,
      type: "template",
      template: {
        name: "payment_confirmation",
        language: {
          code: "es"
        },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: order.folio
              },
              {
                type: "text", 
                text: order.raffle.title
              },
              {
                type: "text",
                text: order.tickets.join(", ")
              },
              {
                type: "text",
                text: `LPS ${order.totalAmount}`
              }
            ]
          }
        ]
      }
    };

    const response = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });

    if (response.ok) {
      console.log(`📱 WhatsApp enviado a ${order.user.phone} para orden ${order.folio}`);
    } else {
      console.error(`❌ Error enviando WhatsApp: ${response.statusText}`);
    }
  } catch (error) {
    console.error('❌ Error en WhatsApp:', error);
  }
}

async function sendEmailMessage(order) {
  try {
    const transporter = nodemailer.createTransporter(EMAIL_CONFIG);
    
    const mailOptions = {
      from: EMAIL_CONFIG.auth.user,
      to: order.user.email,
      subject: `✅ Pago Confirmado - Orden ${order.folio}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">¡Pago Confirmado!</h2>
          
          <p>Hola <strong>${order.user.name}</strong>,</p>
          
          <p>Tu pago ha sido confirmado exitosamente. Aquí están los detalles de tu compra:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Detalles de la Orden</h3>
            <p><strong>Folio:</strong> ${order.folio}</p>
            <p><strong>Rifa:</strong> ${order.raffle.title}</p>
            <p><strong>Boletos:</strong> ${order.tickets.join(", ")}</p>
            <p><strong>Total Pagado:</strong> LPS ${order.totalAmount}</p>
            <p><strong>Fecha de Pago:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
          </div>
          
          <p>¡Gracias por tu compra! Te notificaremos cuando se realice el sorteo.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
            <p>Lucky Snap - Sistema de Rifas</p>
            <p>Este es un mensaje automático, por favor no responder.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Email enviado a ${order.user.email} para orden ${order.folio}`);
  } catch (error) {
    console.error('❌ Error enviando email:', error);
  }
}

module.exports = { sendPaymentConfirmation };
