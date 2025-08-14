/**
 * 🚀 SISTEMA DE LOGGING DE PRODUÇÃO
 * Monitora erros reais, dead clicks e funcionalidades quebradas
 * Funciona tanto em DEV quanto PROD
 */

interface ProductionLogEvent {
  id: string;
  timestamp: string;
  type: 'error' | 'dead_click' | 'function_fail' | 'api_fail' | 'ui_fail' | 'javascript_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  context: {
    url: string;
    userAgent: string;
    sessionId: string;
    userId?: string;
  };
  details: Record<string, unknown>;
  stackTrace?: string;
  reproduction?: {
    steps: string[];
    expectedBehavior: string;
    actualBehavior: string;
  };
}

interface DeadClickEvent {
  element: HTMLElement;
  clickTime: number;
  expectedAction: string;
  timeoutMs: number;
}

class ProductionLogger {
  private sessionId: string;
  private deadClickTracking = new Map<HTMLElement, DeadClickEvent>();
  private apiCallTracking = new Map<string, { startTime: number; method: string; url: string }>();
  private lastInteraction: number = 0;
  private logQueue: ProductionLogEvent[] = [];
  private flushInterval: NodeJS.Timeout;
  
  // Configurações
  private config = {
    deadClickTimeout: 3000, // 3s sem resposta = dead click
    apiTimeout: 10000, // 10s sem resposta = API fail
    flushInterval: 5000, // Enviar logs a cada 5s
    maxQueueSize: 50,
    enableConsoleLogging: import.meta.env.DEV, // Vite usa import.meta.env.DEV
    productionEndpoint: '/api/logs/production'
  };

  constructor() {
    this.sessionId = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.initializeTracking();
    this.startLogFlushing();
    
    console.log('🚀 PRODUCTION LOGGER ATIVO:', {
      sessionId: this.sessionId,
      environment: import.meta.env.DEV ? 'development' : 'production',
      deadClickTimeout: this.config.deadClickTimeout,
      flushInterval: this.config.flushInterval
    });
  }

  private initializeTracking() {
    // 1. MONITORAR TODOS OS CLIQUES
    document.addEventListener('click', this.handleClick.bind(this), true);
    
    // 2. INTERCEPTAR ERROS JAVASCRIPT  
    window.addEventListener('error', this.handleJSError.bind(this));
    window.addEventListener('unhandledrejection', this.handlePromiseError.bind(this));
    
    // 3. INTERCEPTAR FETCH/XHR PARA APIs
    this.interceptNetworkCalls();
    
    // 4. MONITORAR MUDANÇAS DOM (detectar se UI respondeu)
    this.setupDOMObserver();
  }

  private handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const clickTime = Date.now();
    
    // Identificar o que DEVERIA acontecer com esse clique
    const expectedAction = this.identifyExpectedAction(target);
    
    if (expectedAction) {
      console.log('👆 CLIQUE DETECTADO:', {
        element: target.tagName,
        expectedAction,
        classList: Array.from(target.classList),
        text: target.textContent?.trim().substring(0, 50)
      });
      
      // Registrar para monitoramento de dead click
      this.deadClickTracking.set(target, {
        element: target,
        clickTime,
        expectedAction,
        timeoutMs: this.config.deadClickTimeout
      });
      
      // Verificar se houve resposta após timeout
      setTimeout(() => {
        this.checkForDeadClick(target, clickTime, expectedAction);
      }, this.config.deadClickTimeout);
    }
    
    this.lastInteraction = clickTime;
  }

  private identifyExpectedAction(element: HTMLElement): string {
    // Identificar o que DEVERIA acontecer baseado no elemento
    const tag = element.tagName.toLowerCase();
    const role = element.getAttribute('role');
    const type = element.getAttribute('type');
    // Usar getSafeClassName para evitar erros de "className.includes is not a function"
    const className = this.getSafeClassName(element);
    const text = element.textContent?.trim() || '';
    
    // BOTÕES
    if (tag === 'button' || role === 'button') {
      if (text.includes('excluir') || text.includes('deletar') || className.includes('trash')) {
        return 'delete_item';
      }
      if (text.includes('adicionar') || text.includes('carrinho') || className.includes('add')) {
        return 'add_to_cart';
      }
      if (text.includes('finalizar') || text.includes('checkout')) {
        return 'proceed_checkout';
      }
      if (text.includes('login') || text.includes('entrar')) {
        return 'user_login';
      }
      if (type === 'submit') {
        return 'form_submit';
      }
      return 'button_action';
    }
    
    // LINKS
    if (tag === 'a') {
      const href = element.getAttribute('href');
      if (href && href !== '#') {
        return `navigate_to_${href}`;
      }
      return 'navigation';
    }
    
    // INPUTS - Tratar file upload especificamente para evitar dead click falso
    if (tag === 'input' || tag === 'select' || tag === 'textarea') {
      if (type === 'file') {
        return 'file_upload'; // Considerado respondido automaticamente
      }
      return 'form_interaction';
    }
    
    // ELEMENTOS CLICÁVEIS - Usar getSafeClassName para robustez
    if (element.onclick || className.includes('click') || className.includes('button')) {
      return 'interactive_element';
    }
    
    return '';
  }

  private checkForDeadClick(element: HTMLElement, clickTime: number, expectedAction: string) {
    const tracked = this.deadClickTracking.get(element);
    if (!tracked) return;
    
    // Verificar se houve alguma resposta
    const hadResponse = this.checkIfResponseOccurred(element, clickTime, expectedAction);
    
    if (!hadResponse) {
      this.logEvent({
        type: 'dead_click',
        severity: 'medium',
        message: `Dead Click Detectado: ${expectedAction}`,
        details: {
          element: {
            tag: element.tagName,
            className: element.className,
            text: element.textContent?.trim().substring(0, 100),
            id: element.id,
            xpath: this.getXPath(element)
          },
          expectedAction,
          timeWaited: this.config.deadClickTimeout,
          clickTime: new Date(clickTime).toISOString()
        },
        reproduction: {
          steps: [
            'Navegar para a página',
            `Clicar no elemento: ${element.tagName}.${element.className}`,
            'Aguardar resposta'
          ],
          expectedBehavior: expectedAction,
          actualBehavior: 'Nenhuma resposta detectada'
        }
      });
    } else {
      console.log('✅ RESPOSTA DETECTADA:', {
        expectedAction,
        element: element.tagName,
        responseTime: Date.now() - clickTime
      });
    }
    
    this.deadClickTracking.delete(element);
  }

  private checkIfResponseOccurred(element: HTMLElement, clickTime: number, expectedAction: string): boolean {
    // Verificar diferentes tipos de resposta baseado na ação esperada
    
    switch (expectedAction) {
      case 'delete_item':
        // Verificar se item foi removido do DOM ou se houve toast
        return this.checkForItemRemoval() || this.checkForToast();
        
      case 'add_to_cart':
        // Verificar se contador do carrinho mudou ou toast apareceu
        return this.checkForCartUpdate() || this.checkForToast();
        
      case 'proceed_checkout':
      case 'user_login':
        // Verificar se URL mudou
        return this.checkForNavigation(clickTime);
        
      case 'form_submit':
        // Verificar se form foi processado
        return this.checkForFormResponse();
        
      case 'file_upload':
        // File uploads são considerados respondidos automaticamente (evita dead click falso)
        return true;
        
      default:
        // Verificações gerais
        return this.checkForGeneralResponse(clickTime);
    }
  }

  private checkForItemRemoval(): boolean {
    // Verificar se algum item foi removido recentemente
    const removedElements = document.querySelectorAll('.fade-out, .removing, [data-removing="true"]');
    return removedElements.length > 0;
  }

  private checkForToast(): boolean {
    // Verificar se toast/notification apareceu
    const toasts = document.querySelectorAll('[data-sonner-toast], .toast, .notification, [role="alert"]');
    return toasts.length > 0;
  }

  private checkForCartUpdate(): boolean {
    // Verificar se contador do carrinho mudou
    const cartCounters = document.querySelectorAll('[data-cart-count], .cart-count, .badge');
    return Array.from(cartCounters).some(counter => {
      const count = parseInt(counter.textContent || '0');
      return count > 0;
    });
  }

  private checkForNavigation(clickTime: number): boolean {
    // Verificar se URL mudou após o clique
    return this.lastInteraction > clickTime;
  }

  private checkForFormResponse(): boolean {
    // Verificar se form mostra loading, erro ou sucesso
    const indicators = document.querySelectorAll('.loading, .error, .success, [aria-busy="true"]');
    return indicators.length > 0;
  }

  private checkForGeneralResponse(clickTime: number): boolean {
    // Verificações gerais de resposta
    return (
      this.checkForToast() ||
      this.checkForNavigation(clickTime) ||
      this.checkForFormResponse() ||
      this.lastInteraction > clickTime + 100 // Alguma interação subsequente
    );
  }

  private handleJSError(event: ErrorEvent) {
    this.logEvent({
      type: 'javascript_error', // Diferenciando logs de erro JavaScript especificamente
      severity: 'high',
      message: `JavaScript Error: ${event.message}`,
      details: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.toString()
      },
      stackTrace: event.error?.stack
    });
  }

  private handlePromiseError(event: PromiseRejectionEvent) {
    this.logEvent({
      type: 'error',
      severity: 'high',
      message: `Unhandled Promise Rejection: ${event.reason}`,
      details: {
        reason: event.reason,
        promise: event.promise?.toString()
      }
    });
  }

  private interceptNetworkCalls() {
    // Interceptar fetch
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = Date.now();
      const url = args[0]?.toString() || 'unknown';
      const callId = `${startTime}_${url}`;
      
      this.apiCallTracking.set(callId, {
        startTime,
        method: args[1]?.method || 'GET',
        url
      });
      
      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;
        
        if (!response.ok) {
          this.logEvent({
            type: 'api_fail',
            severity: response.status >= 500 ? 'critical' : 'medium',
            message: `API Error: ${response.status} ${response.statusText}`,
            details: {
              url,
              method: args[1]?.method || 'GET',
              status: response.status,
              statusText: response.statusText,
              duration
            }
          });
        }
        
        this.apiCallTracking.delete(callId);
        return response;
      } catch (error) {
        this.logEvent({
          type: 'api_fail',
          severity: 'critical',
          message: `API Network Error: ${error}`,
          details: {
            url,
            method: args[1]?.method || 'GET',
            error: error?.toString(),
            duration: Date.now() - startTime
          }
        });
        
        this.apiCallTracking.delete(callId);
        throw error;
      }
    };
  }

  private setupDOMObserver() {
    // Observar mudanças DOM para detectar atualizações de UI
    const observer = new MutationObserver((mutations) => {
      const hasSignificantChanges = mutations.some(mutation => 
        mutation.type === 'childList' && mutation.addedNodes.length > 0
      );
      
      if (hasSignificantChanges) {
        this.lastInteraction = Date.now();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });
  }

  private logEvent(eventData: Partial<ProductionLogEvent>) {
    const event: ProductionLogEvent = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: eventData.type || 'error',
      severity: eventData.severity || 'medium',
      message: eventData.message || 'Unknown event',
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        sessionId: this.sessionId,
        userId: this.getCurrentUserId()
      },
      details: eventData.details || {},
      stackTrace: eventData.stackTrace,
      reproduction: eventData.reproduction,
      ...eventData
    };
    
    // Log no console em desenvolvimento
    if (this.config.enableConsoleLogging) {
      const emoji = event.type === 'dead_click' ? '💀' : 
                   event.type === 'api_fail' ? '🚨' : 
                   event.severity === 'critical' ? '🔥' : '⚠️';
      
      console.error(`${emoji} PRODUÇÃO LOG:`, {
        type: event.type,
        severity: event.severity,
        message: event.message,
        details: event.details
      });
    }
    
    // Adicionar à fila
    this.logQueue.push(event);
    
    // Flush imediato se crítico ou fila cheia
    if (event.severity === 'critical' || this.logQueue.length >= this.config.maxQueueSize) {
      this.flushLogs();
    }
  }

  /**
   * Método utilitário para garantir que className sempre seja tratado como string
   * Evita erros do tipo "className.includes is not a function" em elementos SVG ou outros tipos
   */
  private getSafeClassName(element: HTMLElement | Element): string {
    // Verificar se className existe e é uma string
    if (typeof element.className === 'string') {
      return element.className;
    }
    
    // Para elementos SVG, className pode ser um SVGAnimatedString
    if (element.className && typeof element.className === 'object' && 'baseVal' in element.className) {
      return (element.className as SVGAnimatedString).baseVal || '';
    }
    
    // Fallback: retornar string vazia se className não existir ou não for string
    return '';
  }

  private getCurrentUserId(): string | undefined {
    // Tentar obter ID do usuário do localStorage ou context
    try {
      const authData = localStorage.getItem('auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.user?.id;
      }
    } catch (e) {
      // Ignore
    }
    return undefined;
  }

  private getXPath(element: HTMLElement): string {
    if (element.id) {
      return `//*[@id="${element.id}"]`;
    }
    
    const path = [];
    while (element.nodeType === Node.ELEMENT_NODE) {
      let selector = element.nodeName.toLowerCase();
      // Usar getSafeClassName para evitar quebras em objetos SVG ou outros tipos
      const className = this.getSafeClassName(element);
      if (className) {
        selector += `.${className.split(' ').join('.')}`;
      }
      path.unshift(selector);
      element = element.parentNode as HTMLElement;
      if (!element || element.nodeType !== Node.ELEMENT_NODE) break;
    }
    
    return '/' + path.join('/');
  }

  private startLogFlushing() {
    this.flushInterval = setInterval(() => {
      if (this.logQueue.length > 0) {
        this.flushLogs();
      }
    }, this.config.flushInterval);
  }

  private async flushLogs() {
    if (this.logQueue.length === 0) return;
    
    const logsToSend = [...this.logQueue];
    this.logQueue = [];
    
    try {
      // Em desenvolvimento, apenas console.log
      if (import.meta.env.DEV) {
        console.log('📤 FLUSH LOGS TO PRODUCTION:', logsToSend);
        return;
      }
      
      // Em produção, enviar para endpoint
      await fetch(this.config.productionEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          logs: logsToSend,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString()
        })
      });
      
      console.log(`✅ ${logsToSend.length} logs enviados para produção`);
    } catch (error) {
      console.error('❌ Falha ao enviar logs:', error);
      // Re-adicionar à fila em caso de falha
      this.logQueue.unshift(...logsToSend);
    }
  }

  // Métodos públicos para logging manual
  public logFunctionFail(functionName: string, error: Error | string | unknown, context?: Record<string, unknown>) {
    this.logEvent({
      type: 'function_fail',
      severity: 'high',
      message: `Function Failed: ${functionName}`,
      details: {
        functionName,
        error: error?.toString(),
        context
      },
      stackTrace: error instanceof Error ? error.stack : undefined
    });
  }

  public logUIFail(action: string, element: HTMLElement, expectedResult: string) {
    this.logEvent({
      type: 'ui_fail',
      severity: 'medium',
      message: `UI Action Failed: ${action}`,
      details: {
        action,
        element: {
          tag: element.tagName,
          className: element.className,
          text: element.textContent?.trim()
        },
        expectedResult
      }
    });
  }

  public destroy() {
    clearInterval(this.flushInterval);
    this.flushLogs(); // Último flush
  }
}

// Singleton instance
const productionLogger = new ProductionLogger();

export default productionLogger;
export { ProductionLogger };
