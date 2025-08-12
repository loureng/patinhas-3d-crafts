import { useEffect } from 'react';
import { useLogger } from '@/utils/logger';

// Intercepta e monitora todas as requisições fetch
export const useApiLogger = () => {
  const logger = useLogger();

  useEffect(() => {
    // Interceptar fetch global
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const [url, options = {}] = args;
      const startTime = Date.now();
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Log da requisição
      logger.info(`🌐 API REQUEST: ${options.method || 'GET'} ${url}`, {
        type: 'api_request',
        requestId,
        url: url.toString(),
        method: options.method || 'GET',
        headers: options.headers,
        timestamp: startTime,
        body: options.body ? JSON.stringify(options.body) : undefined
      });

      try {
        const response = await originalFetch(...args);
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Log da resposta
        const logLevel = response.ok ? 'info' : 'error';
        const statusEmoji = response.ok ? '✅' : '❌';
        logger[logLevel](`${statusEmoji} API RESPONSE: ${options.method || 'GET'} ${url} [${response.status}] (${duration}ms)`, {
          type: 'api_response',
          requestId,
          url: url.toString(),
          method: options.method || 'GET',
          status: response.status,
          statusText: response.statusText,
          duration,
          timestamp: endTime,
          ok: response.ok
        });

        // Para respostas com erro, tenta capturar o body
        if (!response.ok) {
          try {
            const responseText = await response.clone().text();
            logger.error(`API Error Response Body`, {
              type: 'api_error_body',
              requestId,
              url: url.toString(),
              status: response.status,
              responseBody: responseText
            });
          } catch (bodyError) {
            logger.error(`Erro ao ler body da resposta de erro`, {
              type: 'api_error_body_read_error',
              requestId,
              error: bodyError
            });
          }
        }

        return response;
      } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Log de erro de rede/conexão
        logger.error(`🔥 API NETWORK ERROR: ${options.method || 'GET'} ${url} (${duration}ms)`, {
          type: 'api_network_error',
          requestId,
          url: url.toString(),
          method: options.method || 'GET',
          duration,
          timestamp: endTime,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });

        throw error;
      }
    };

    // Cleanup - restaurar fetch original
    return () => {
      window.fetch = originalFetch;
    };
  }, [logger]);

  // Função para log manual de eventos de API
  const logApiEvent = (event: string, data?: Record<string, unknown>) => {
    logger.info(`📡 API EVENT: ${event}`, {
      type: 'api_event',
      event,
      ...data,
      timestamp: Date.now()
    });
  };

  return {
    logApiEvent
  };
};
