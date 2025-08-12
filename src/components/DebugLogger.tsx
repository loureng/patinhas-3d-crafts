import React, { useEffect, useState } from 'react';
import { useClickTracker } from '@/hooks/useClickTracker';
import { useLogger } from '@/utils/logger';
import { useApiLogger } from '@/hooks/useApiLogger';

interface DebugLoggerProps {
  enabled?: boolean;
  showConsole?: boolean;
}

const DebugLogger: React.FC<DebugLoggerProps> = ({ 
  enabled = true, 
  showConsole = false 
}) => {
  const logger = useLogger();
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [logs, setLogs] = useState(logger.getLogs());

  // Ativar rastreamento completo de cliques
  const { trackCustomClick } = useClickTracker({
    trackAllClicks: true,
    includeFormSubmits: true,
    includeKeyboardEvents: true,
    logLevel: 'info'
  });

  // Ativar rastreamento de API
  const { logApiEvent } = useApiLogger();

  // Atualizar logs a cada segundo
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      setLogs(logger.getLogs());
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled, logger]);

  // Interceptar console.error para capturar erros
  useEffect(() => {
    if (!enabled) return;

    const originalError = console.error;
    console.error = (...args) => {
      // IMPORTANTE: Capturar TODOS os erros reais, filtrar apenas recursão do logger
      const isLoggerRecursion = args.some(arg => 
        typeof arg === 'string' && (
          arg.includes('🔴 [') || // Logs formatados do nosso sistema
          arg.includes('Console Error') // Mensagem específica de recursão
        )
      );
      
      // SEMPRE capturar erros funcionais importantes
      const isFunctionalError = args.some(arg => 
        typeof arg === 'string' && (
          arg.includes('ERRO:') ||
          arg.includes('❌') ||
          arg.includes('não encontrado') ||
          arg.includes('falhou') ||
          arg.includes('Error:') ||
          arg.includes('TypeError') ||
          arg.includes('ReferenceError')
        )
      );
      
      if (!isLoggerRecursion || isFunctionalError) {
        const errorInfo = {
          arguments: args,
          source: 'console.error',
          timestamp: new Date().toISOString(),
          isFunctional: isFunctionalError
        };
        
        logger.error('Console Error', errorInfo);
      }
      
      originalError.apply(console, args);
    };

    const originalWarn = console.warn;
    console.warn = (...args) => {
      // IMPORTANTE: Filtro mais rigoroso para evitar qualquer recursão
      const isFromLogger = args.some(arg => 
        typeof arg === 'string' && (
          arg.includes('[WARN]') || 
          arg.includes('Console Warning') ||
          arg.includes('🟡') ||
          arg.includes('Logger') ||
          arg.includes('Debug')
        )
      );
      
      // Também verificar se vem do próprio logger pela stack trace
      const stack = new Error().stack || '';
      const isFromLoggerStack = stack.includes('Logger') || stack.includes('DebugLogger');
      
      if (!isFromLogger && !isFromLoggerStack) {
        const warnInfo = {
          arguments: args,
          source: 'console.warn',
          timestamp: new Date().toISOString()
        };
        
        logger.warn('Console Warning', warnInfo);
      }
      
      originalWarn.apply(console, args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, [enabled, logger]);

  // Log de montagem do componente + teste de logs
  useEffect(() => {
    if (enabled) {
      logger.info('🚀 Debug Logger ATIVADO - Sistema de logging completo iniciado', {
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        isDevelopment: import.meta.env.DEV,
        features: {
          clickTracking: true,
          apiInterception: true,
          errorCapture: true,
          terminalLogging: true
        }
      });

      // Log de ativação no terminal do desenvolvedor
      console.log(`
🐾 ═══════════════════════════════════════════════════════════════════════════════
🐾 JARDIM DAS PATINHAS - SISTEMA DE LOGGING ATIVADO
🐾 ═══════════════════════════════════════════════════════════════════════════════
🐾 ✅ Click Tracking: ATIVO (todos os cliques serão logados)
🐾 ✅ API Interception: ATIVO (todas as requisições serão logadas)
🐾 ✅ Error Capture: ATIVO (erros JS e promises rejeitadas)
🐾 ✅ Terminal Logging: ATIVO (logs aparecem aqui no terminal)
🐾 ✅ Debug Panel: Ctrl+Shift+L ou clique no botão flutuante
🐾 ═══════════════════════════════════════════════════════════════════════════════
      `);
    }
  }, [enabled, logger]);

  // Keyboard shortcut para mostrar/esconder painel
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'L') {
        setShowDebugPanel(prev => !prev);
        trackCustomClick('debug-panel-toggle', { 
          method: 'keyboard',
          visible: !showDebugPanel 
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDebugPanel, trackCustomClick]);

  if (!enabled) return null;

  const stats = logger.getLogStats();
  const recentLogs = logs.slice(-50); // Últimos 50 logs

  return (
    <>
      {/* Botão flutuante para abrir/fechar painel */}
      <div 
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
          backgroundColor: stats.error > 0 ? '#ef4444' : '#22c55e',
          color: 'white',
          padding: '12px',
          borderRadius: '50%',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          fontSize: '14px',
          fontWeight: 'bold',
          minWidth: '48px',
          textAlign: 'center'
        }}
        onClick={() => {
          setShowDebugPanel(prev => !prev);
          trackCustomClick('debug-panel-toggle', { 
            method: 'click',
            visible: !showDebugPanel 
          });
        }}
        title="Ctrl+Shift+L para abrir/fechar"
      >
        {stats.error > 0 ? `❌ ${stats.error}` : `✅ ${stats.total}`}
      </div>

      {/* Painel de debug */}
      {showDebugPanel && (
        <div
          style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            width: '400px',
            height: '500px',
            backgroundColor: 'rgba(0,0,0,0.95)',
            color: '#00ff00',
            fontFamily: 'monospace',
            fontSize: '11px',
            padding: '15px',
            borderRadius: '8px',
            zIndex: 10000,
            overflow: 'hidden',
            border: '2px solid #333'
          }}
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '10px',
            borderBottom: '1px solid #333',
            paddingBottom: '10px'
          }}>
            <div style={{ fontWeight: 'bold', color: '#fff' }}>
              Debug Logger - Total: {stats.total}
            </div>
            <button
              onClick={() => setShowDebugPanel(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ff0000',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ✕
            </button>
          </div>

          {/* Estatísticas */}
          <div style={{ marginBottom: '15px', fontSize: '10px' }}>
            <div style={{ color: '#ff0000' }}>❌ Errors: {stats.error}</div>
            <div style={{ color: '#ffaa00' }}>⚠️ Warnings: {stats.warn}</div>
            <div style={{ color: '#00aaff' }}>ℹ️ Info: {stats.info}</div>
            <div style={{ color: '#888' }}>🐛 Debug: {stats.debug}</div>
          </div>

          {/* Controles */}
          <div style={{ marginBottom: '15px' }}>
            <button
              onClick={() => {
                logger.clearLogs();
                setLogs([]);
                trackCustomClick('clear-logs');
              }}
              style={{
                backgroundColor: '#444',
                color: 'white',
                border: '1px solid #666',
                padding: '5px 10px',
                marginRight: '10px',
                cursor: 'pointer',
                fontSize: '10px'
              }}
            >
              Clear Logs
            </button>
            <button
              onClick={() => {
                const logsData = logger.exportLogs();
                const blob = new Blob([logsData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `logs-${new Date().toISOString()}.json`;
                a.click();
                trackCustomClick('export-logs');
              }}
              style={{
                backgroundColor: '#444',
                color: 'white',
                border: '1px solid #666',
                padding: '5px 10px',
                cursor: 'pointer',
                fontSize: '10px'
              }}
            >
              Export
            </button>
          </div>

          {/* Lista de logs */}
          <div 
            style={{ 
              height: '350px', 
              overflowY: 'auto',
              border: '1px solid #333',
              padding: '5px'
            }}
          >
            {recentLogs.map((log, index) => (
              <div 
                key={index} 
                style={{ 
                  marginBottom: '8px',
                  padding: '4px',
                  backgroundColor: log.level === 'error' ? 'rgba(255,0,0,0.1)' :
                                 log.level === 'warn' ? 'rgba(255,170,0,0.1)' :
                                 log.level === 'info' ? 'rgba(0,170,255,0.1)' : 
                                 'rgba(136,136,136,0.1)',
                  borderLeft: `3px solid ${
                    log.level === 'error' ? '#ff0000' :
                    log.level === 'warn' ? '#ffaa00' :
                    log.level === 'info' ? '#00aaff' : '#888'
                  }`
                }}
              >
                <div style={{ 
                  color: '#aaa', 
                  fontSize: '9px' 
                }}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
                <div style={{ 
                  color: log.level === 'error' ? '#ff4444' :
                        log.level === 'warn' ? '#ffaa00' :
                        log.level === 'info' ? '#00aaff' : '#888',
                  fontWeight: 'bold'
                }}>
                  [{log.level.toUpperCase()}] {log.message}
                </div>
                {log.data && (
                  <div style={{ 
                    color: '#ccc', 
                    fontSize: '9px',
                    marginTop: '2px',
                    maxHeight: '100px',
                    overflow: 'auto'
                  }}>
                    {JSON.stringify(log.data, null, 2)}
                  </div>
                )}
                {log.error && (
                  <div style={{ 
                    color: '#ff6666', 
                    fontSize: '9px',
                    marginTop: '2px'
                  }}>
                    {log.error.message}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Console logging em desenvolvimento */}
      {showConsole && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          zIndex: 9998
        }}>
          Logs sendo enviados para console
        </div>
      )}
    </>
  );
};

export default DebugLogger;
