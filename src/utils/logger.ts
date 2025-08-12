type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
  error?: Error;
  stack?: string;
  url?: string;
  userAgent?: string;
  userId?: string;
  sessionId?: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private sessionId: string;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalErrorHandlers() {
    // Captura erros JavaScript não tratados
    window.addEventListener('error', (event) => {
      this.error('Erro JavaScript não tratado', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    });

    // Captura promises rejeitadas não tratadas
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Promise rejeitada não tratada', {
        reason: event.reason
      });
    });
  }

  private createLogEntry(level: LogLevel, message: string, data?: Record<string, unknown>, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      url: window.location.href,
      userAgent: navigator.userAgent,
      sessionId: this.sessionId
    };

    if (data) entry.data = data;
    if (error) {
      entry.error = error;
      entry.stack = error.stack;
    }

    return entry;
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry);
    
    // Remove logs antigos se exceder o limite
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // FORÇA LOGS NO TERMINAL - Todos os logs aparecem no terminal do desenvolvedor
    // Exceto logs de recursão própria para evitar spam
    const isConsoleMessage = entry.message === 'Console Error' || entry.message === 'Console Warning';
    const hasLoggerInStack = entry.stack?.includes('Logger.addLog');
    
    if (!isConsoleMessage && !hasLoggerInStack) {
      const consoleMethod = entry.level === 'error' ? 'error' : 
                           entry.level === 'warn' ? 'warn' : 'log';
      
      // Formato detalhado para terminal com emojis visuais
      const emoji = entry.level === 'error' ? '🔴' : entry.level === 'warn' ? '🟡' : '🔵';
      const prefix = `${emoji} [${entry.timestamp}] [${entry.level.toUpperCase()}]`;
      const location = entry.url ? ` {${entry.url}}` : '';
      
      // SEMPRE logar no terminal para debugging ativo
      console[consoleMethod](`${prefix} ${entry.message}${location}`);
      
      if (entry.data) {
        console[consoleMethod]('📊 Data:', entry.data);
      }
      
      if (entry.error) {
        console.error('❌ Error:', entry.error);
        if (entry.stack) {
          console.error('📍 Stack:', entry.stack);
        }
      }
      
      // Linha separadora para erros críticos
      if (entry.level === 'error') {
        console.error('═'.repeat(60));
      }
    }

    // Enviar para serviço de logging em produção
    if (!this.isDevelopment && entry.level === 'error') {
      this.sendToRemoteLogger(entry);
    }
  }

  private async sendToRemoteLogger(entry: LogEntry) {
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry)
      });
    } catch (error) {
      console.error('Erro ao enviar log para servidor:', error);
    }
  }

  // Métodos públicos
  debug(message: string, data?: Record<string, unknown>) {
    const entry = this.createLogEntry('debug', message, data);
    this.addLog(entry);
  }

  info(message: string, data?: Record<string, unknown>) {
    const entry = this.createLogEntry('info', message, data);
    this.addLog(entry);
  }

  warn(message: string, data?: Record<string, unknown>) {
    const entry = this.createLogEntry('warn', message, data);
    this.addLog(entry);
  }

  error(message: string, data?: Record<string, unknown>, error?: Error) {
    const entry = this.createLogEntry('error', message, data, error);
    this.addLog(entry);
  }

  // Log específico para cliques
  click(element: string, data?: Record<string, unknown>) {
    this.info(`Click: ${element}`, {
      ...data,
      type: 'user_click',
      element,
      timestamp: Date.now()
    });
  }

  // Log específico para navegação
  navigate(from: string, to: string, data?: Record<string, unknown>) {
    this.info(`Navigation: ${from} → ${to}`, {
      ...data,
      type: 'navigation',
      from,
      to,
      timestamp: Date.now()
    });
  }

  // Log específico para API calls
  apiCall(method: string, url: string, data?: Record<string, unknown>) {
    this.info(`API Call: ${method} ${url}`, {
      ...data,
      type: 'api_call',
      method,
      url,
      timestamp: Date.now()
    });
  }

  // Log específico para API responses
  apiResponse(method: string, url: string, status: number, data?: Record<string, unknown>) {
    const level = status >= 400 ? 'error' : 'info';
    this[level](`API Response: ${method} ${url} [${status}]`, {
      ...data,
      type: 'api_response',
      method,
      url,
      status,
      timestamp: Date.now()
    });
  }

  // Obter todos os logs
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Obter logs por nível
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  // Limpar logs
  clearLogs() {
    this.logs = [];
  }

  // Exportar logs como JSON
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Obter estatísticas de logs
  getLogStats() {
    const stats = {
      total: this.logs.length,
      debug: 0,
      info: 0,
      warn: 0,
      error: 0
    };

    this.logs.forEach(log => {
      stats[log.level]++;
    });

    return stats;
  }
}

// Singleton instance
export const logger = new Logger();

// Hook para usar o logger
export const useLogger = () => {
  return logger;
};

export default logger;
