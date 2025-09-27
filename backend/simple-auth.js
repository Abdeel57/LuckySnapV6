// Sistema de autenticación simple
const crypto = require('crypto');

class SimpleAuth {
  constructor() {
    this.sessions = new Map();
    this.adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  }

  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  login(password) {
    if (password === this.adminPassword) {
      const token = this.generateToken();
      this.sessions.set(token, {
        loggedIn: true,
        timestamp: Date.now()
      });
      return { success: true, token };
    }
    return { success: false, error: 'Contraseña incorrecta' };
  }

  verifyToken(token) {
    const session = this.sessions.get(token);
    if (!session) return false;
    
    // Token expira en 24 horas
    const isExpired = Date.now() - session.timestamp > 24 * 60 * 60 * 1000;
    if (isExpired) {
      this.sessions.delete(token);
      return false;
    }
    
    return true;
  }

  logout(token) {
    this.sessions.delete(token);
  }

  // Middleware para proteger rutas
  requireAuth(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token || !this.verifyToken(token)) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    
    next();
  }
}

module.exports = SimpleAuth;
