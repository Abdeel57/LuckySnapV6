// Sistema de monitoreo y logging
class Monitoring {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000;
    this.errors = [];
    this.maxErrors = 100;
  }

  log(level, message, data = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data: data ? JSON.stringify(data) : null
    };
    
    this.logs.push(logEntry);
    
    // Mantener solo los últimos logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    // Log en consola también
    console.log(`[${level.toUpperCase()}] ${message}`, data || '');
    
    // Si es error, guardarlo por separado
    if (level === 'error') {
      this.errors.push(logEntry);
      if (this.errors.length > this.maxErrors) {
        this.errors = this.errors.slice(-this.maxErrors);
      }
    }
  }

  info(message, data = null) {
    this.log('info', message, data);
  }

  warn(message, data = null) {
    this.log('warn', message, data);
  }

  error(message, data = null) {
    this.log('error', message, data);
  }

  getLogs(level = null, limit = 50) {
    let filteredLogs = this.logs;
    
    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level);
    }
    
    return filteredLogs.slice(-limit);
  }

  getErrors(limit = 20) {
    return this.errors.slice(-limit);
  }

  getStats() {
    const now = new Date();
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentLogs = this.logs.filter(log => 
      new Date(log.timestamp) > lastHour
    );
    
    const recentErrors = this.errors.filter(error => 
      new Date(error.timestamp) > lastHour
    );
    
    return {
      totalLogs: this.logs.length,
      totalErrors: this.errors.length,
      recentLogs: recentLogs.length,
      recentErrors: recentErrors.length,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: now.toISOString()
    };
  }

  // Middleware para logging de requests
  requestLogger(req, res, next) {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logData = {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress
      };
      
      if (res.statusCode >= 400) {
        this.error(`HTTP ${res.statusCode}`, logData);
      } else {
        this.info(`HTTP ${res.statusCode}`, logData);
      }
    });
    
    next();
  }
}

module.exports = Monitoring;
