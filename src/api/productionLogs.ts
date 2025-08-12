/**
 * 📊 ENDPOINT PARA RECEBER LOGS DE PRODUÇÃO
 * Processa e armazena logs do sistema de monitoramento
 */

import express from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

interface ProductionLog {
  id: string;
  timestamp: string;
  type: 'error' | 'dead_click' | 'function_fail' | 'api_fail' | 'ui_fail';
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

// POST /api/logs/production - Receber logs do frontend
router.post('/production', async (req, res) => {
  try {
    const { logs, sessionId, timestamp } = req.body;
    
    if (!Array.isArray(logs)) {
      return res.status(400).json({ error: 'Logs deve ser um array' });
    }

    console.log(`🚨 RECEBIDOS ${logs.length} LOGS DE PRODUÇÃO:`, {
      sessionId,
      timestamp,
      types: logs.map((log: ProductionLog) => log.type),
      severities: logs.map((log: ProductionLog) => log.severity)
    });

    // Processar cada log
    for (const log of logs) {
      await processProductionLog(log);
    }

    // Salvar em arquivo para histórico
    await saveLogsToFile(logs, sessionId);

    // Verificar logs críticos
    const criticalLogs = logs.filter((log: ProductionLog) => log.severity === 'critical');
    if (criticalLogs.length > 0) {
      console.error('🔥 LOGS CRÍTICOS DETECTADOS:', criticalLogs);
      // Aqui você pode enviar alertas, emails, Slack, etc.
      await handleCriticalLogs(criticalLogs);
    }

    res.json({ 
      success: true, 
      processed: logs.length,
      critical: criticalLogs.length 
    });

  } catch (error) {
    console.error('❌ ERRO ao processar logs de produção:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/logs/production - Visualizar logs recentes
router.get('/production', async (req, res) => {
  try {
    const { type, severity, limit = '50' } = req.query;
    
    // Ler logs do arquivo
    const logsPath = path.join(process.cwd(), 'logs', 'production');
    const files = await fs.readdir(logsPath).catch(() => []);
    
    const recentFiles = files
      .filter(f => f.endsWith('.json'))
      .sort()
      .slice(-5); // Últimos 5 arquivos

    const allLogs: ProductionLog[] = [];
    
    for (const file of recentFiles) {
      try {
        const filePath = path.join(logsPath, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const logs = JSON.parse(content);
        allLogs.push(...logs);
      } catch (e) {
        console.error(`Erro ao ler ${file}:`, e);
      }
    }

    // Filtrar por tipo e severidade
    let filteredLogs = allLogs;
    if (type) {
      filteredLogs = filteredLogs.filter(log => log.type === type);
    }
    if (severity) {
      filteredLogs = filteredLogs.filter(log => log.severity === severity);
    }

    // Ordenar por timestamp (mais recentes primeiro)
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Limitar resultados
    filteredLogs = filteredLogs.slice(0, parseInt(limit.toString()));

    res.json({
      logs: filteredLogs,
      total: filteredLogs.length,
      summary: {
        byType: aggregateByField(filteredLogs, 'type'),
        bySeverity: aggregateByField(filteredLogs, 'severity'),
        recentCritical: filteredLogs.filter(log => log.severity === 'critical').length
      }
    });

  } catch (error) {
    console.error('❌ ERRO ao buscar logs:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Processar um log individual
async function processProductionLog(log: ProductionLog) {
  console.log(`📝 PROCESSANDO LOG ${log.type.toUpperCase()}:`, {
    message: log.message,
    severity: log.severity,
    url: log.context.url,
    details: Object.keys(log.details)
  });

  // Análise específica por tipo
  switch (log.type) {
    case 'dead_click':
      await analyzeDeadClick(log);
      break;
    case 'function_fail':
      await analyzeFunctionFail(log);
      break;
    case 'api_fail':
      await analyzeAPIFail(log);
      break;
    case 'error':
      await analyzeError(log);
      break;
    case 'ui_fail':
      await analyzeUIFail(log);
      break;
  }
}

// Análises específicas
async function analyzeDeadClick(log: ProductionLog) {
  console.log('👆 DEAD CLICK ANALISADO:', {
    element: log.details.element,
    expectedAction: log.details.expectedAction,
    page: log.context.url
  });

  // Incrementar contador de dead clicks para este elemento
  // Você pode implementar um banco de dados aqui
}

async function analyzeFunctionFail(log: ProductionLog) {
  console.log('⚙️ FALHA DE FUNÇÃO ANALISADA:', {
    function: log.details.functionName,
    error: log.details.error,
    context: log.details.context
  });
}

async function analyzeAPIFail(log: ProductionLog) {
  console.log('🌐 FALHA DE API ANALISADA:', {
    url: log.details.url,
    method: log.details.method,
    status: log.details.status,
    error: log.details.error
  });
}

async function analyzeError(log: ProductionLog) {
  console.log('🚨 ERRO JAVASCRIPT ANALISADO:', {
    message: log.message,
    filename: log.details.filename,
    line: log.details.lineno,
    stack: log.stackTrace?.split('\n')[0]
  });
}

async function analyzeUIFail(log: ProductionLog) {
  console.log('🎨 FALHA DE UI ANALISADA:', {
    action: log.details.action,
    element: log.details.element,
    expected: log.details.expectedResult
  });
}

// Salvar logs em arquivo
async function saveLogsToFile(logs: ProductionLog[], sessionId: string) {
  const logsDir = path.join(process.cwd(), 'logs', 'production');
  await fs.mkdir(logsDir, { recursive: true });
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `production-logs-${timestamp}-${sessionId}.json`;
  const filepath = path.join(logsDir, filename);
  
  await fs.writeFile(filepath, JSON.stringify(logs, null, 2));
  console.log(`💾 LOGS SALVOS: ${filepath}`);
}

// Lidar com logs críticos
async function handleCriticalLogs(criticalLogs: ProductionLog[]) {
  console.error('🔥 ALERTAS CRÍTICOS:');
  
  for (const log of criticalLogs) {
    console.error(`\n🚨 CRÍTICO: ${log.message}`);
    console.error(`📍 URL: ${log.context.url}`);
    console.error(`🕐 Tempo: ${log.timestamp}`);
    console.error(`🔍 Detalhes:`, log.details);
    
    if (log.reproduction) {
      console.error(`🎯 REPRODUÇÃO:`);
      console.error(`   Passos: ${log.reproduction.steps.join(' → ')}`);
      console.error(`   Esperado: ${log.reproduction.expectedBehavior}`);
      console.error(`   Atual: ${log.reproduction.actualBehavior}`);
    }
  }

  // Aqui você pode implementar alertas externos:
  // - Slack webhook
  // - Email
  // - SMS
  // - PagerDuty
  // - Sentry
}

// Utilitário para agregação
function aggregateByField(logs: ProductionLog[], field: keyof ProductionLog): Record<string, number> {
  return logs.reduce((acc, log) => {
    const value = log[field] as string;
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

export default router;
