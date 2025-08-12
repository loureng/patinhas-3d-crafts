/**
 * 🎯 HOOK PARA PRODUCTION LOGGER
 * Facilita o uso do sistema de logging de produção
 */

import { useCallback } from 'react';
import productionLogger from '@/utils/productionLogger';

export const useProductionLogger = () => {
  // Log de erro funcional
  const logError = useCallback((message: string, error: Error | string | unknown, context?: Record<string, unknown>) => {
    productionLogger.logFunctionFail(message, error, context);
  }, []);

  // Log de clique que não funcionou
  const logDeadClick = useCallback((element: HTMLElement, expectedAction: string) => {
    productionLogger.logUIFail('dead_click', element, expectedAction);
  }, []);

  // Log de funcionalidade quebrada
  const logBrokenFeature = useCallback((feature: string, details: Record<string, unknown>) => {
    productionLogger.logFunctionFail(`broken_feature_${feature}`, new Error(`Feature ${feature} não está funcionando`), details);
  }, []);

  // Log de API que falhou
  const logAPIError = useCallback((endpoint: string, method: string, error: Error | string | unknown) => {
    productionLogger.logFunctionFail(`api_${method.toLowerCase()}_${endpoint}`, error, {
      endpoint,
      method,
      timestamp: new Date().toISOString()
    });
  }, []);

  return {
    logError,
    logDeadClick,
    logBrokenFeature,
    logAPIError
  };
};

export default useProductionLogger;
