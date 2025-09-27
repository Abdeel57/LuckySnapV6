// Sistema de validación y límites
class Validation {
  static validateRaffle(data) {
    const errors = [];
    
    if (!data.title || data.title.length < 3) {
      errors.push('El título debe tener al menos 3 caracteres');
    }
    
    if (!data.tickets || data.tickets < 1 || data.tickets > 10000) {
      errors.push('El número de tickets debe estar entre 1 y 10,000');
    }
    
    if (!data.drawDate || new Date(data.drawDate) <= new Date()) {
      errors.push('La fecha de sorteo debe ser futura');
    }
    
    if (data.gallery && data.gallery.length > 10) {
      errors.push('Máximo 10 imágenes en la galería');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateSettings(data) {
    const errors = [];
    
    if (data.siteName && data.siteName.length < 2) {
      errors.push('El nombre del sitio debe tener al menos 2 caracteres');
    }
    
    if (data.appearance?.colors) {
      const colors = data.appearance.colors;
      for (const [key, value] of Object.entries(colors)) {
        if (!/^#[0-9A-F]{6}$/i.test(value)) {
          errors.push(`El color ${key} debe ser un código hexadecimal válido`);
        }
      }
    }
    
    if (data.paymentAccounts && data.paymentAccounts.length > 20) {
      errors.push('Máximo 20 cuentas de pago');
    }
    
    if (data.faqs && data.faqs.length > 50) {
      errors.push('Máximo 50 preguntas frecuentes');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateImage(base64String) {
    if (!base64String) return { isValid: true };
    
    // Verificar que sea base64 válido
    if (!/^data:image\/(jpeg|jpg|png|gif);base64,/.test(base64String)) {
      return { isValid: false, error: 'Formato de imagen no válido' };
    }
    
    // Verificar tamaño (máximo 2MB en base64)
    const sizeInBytes = (base64String.length * 3) / 4;
    if (sizeInBytes > 2 * 1024 * 1024) {
      return { isValid: false, error: 'Imagen demasiado grande (máximo 2MB)' };
    }
    
    return { isValid: true };
  }

  static sanitizeInput(input) {
    if (typeof input === 'string') {
      return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    return input;
  }
}

module.exports = Validation;
