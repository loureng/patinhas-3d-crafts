/**
 * 🧪 TESTE PARA PRODUCTIONLOGGER
 * Componente para verificar se o sistema de dead clicks está funcionando
 */

import { useState } from 'react';
import { useProductionLogger } from '@/hooks/useProductionLogger';

const ProductionLoggerTest = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const { logError, logDeadClick, logAPIError } = useProductionLogger();

  // Botão que simula um dead click (não faz nada)
  const handleDeadClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    console.log('🧪 Dead click simulado - não deve fazer nada');
    // Simular que o clique não fez nada
    logDeadClick(event.currentTarget, 'Deveria abrir modal ou navegar');
    setLogs(prev => [...prev, '💀 Dead click detectado e logado']);
  };

  // Botão que simula erro de função
  const handleFunctionError = () => {
    try {
      // Simular erro
      throw new Error('Erro simulado para teste do ProductionLogger');
    } catch (error) {
      logError('Função de teste falhou', error, {
        component: 'ProductionLoggerTest',
        action: 'handleFunctionError'
      });
      setLogs(prev => [...prev, '❌ Erro de função logado']);
    }
  };

  // Botão que simula erro de API
  const handleApiError = async () => {
    try {
      const response = await fetch('https://api-inexistente.com/test');
      if (!response.ok) throw new Error('API failure');
    } catch (error) {
      logAPIError('/test', 'GET', error);
      setLogs(prev => [...prev, '🌐 Erro de API logado']);
    }
  };

  return (
    <div className="p-6 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg">
      <h3 className="text-lg font-bold mb-4">🧪 Teste ProductionLogger</h3>
      
      <div className="space-y-3">
        <button
          onClick={handleDeadClick}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          🔴 Dead Click (não responde)
        </button>

        <button
          onClick={handleFunctionError}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          ⚠️ Erro de Função
        </button>

        <button
          onClick={handleApiError}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          🌐 Erro de API
        </button>
      </div>

      {logs.length > 0 && (
        <div className="mt-4 p-3 bg-white border rounded">
          <h4 className="font-semibold mb-2">📋 Logs Recentes:</h4>
          {logs.map((log, index) => (
            <div key={index} className="text-sm">{log}</div>
          ))}
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        <p>• <strong>Dead Click:</strong> Clique que não produz resposta em 3s</p>
        <p>• <strong>Erro de Função:</strong> Erro capturado e logado</p>
        <p>• <strong>Erro de API:</strong> Falha de requisição logada</p>
        <p>• Abra o console para ver logs detalhados</p>
      </div>
    </div>
  );
};

export default ProductionLoggerTest;