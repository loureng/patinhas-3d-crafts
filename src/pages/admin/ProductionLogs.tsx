/**
 * 📊 DASHBOARD DE LOGS DE PRODUÇÃO
 * Visualiza erros, dead clicks e problemas em tempo real
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Bug, MousePointer, Wifi, Eye, RefreshCw } from 'lucide-react';

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

interface LogSummary {
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  recentCritical: number;
}

const ProductionLogsDashboard = () => {
  const [logs, setLogs] = useState<ProductionLog[]>([]);
  const [summary, setSummary] = useState<LogSummary | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedType) params.append('type', selectedType);
      if (selectedSeverity) params.append('severity', selectedSeverity);
      params.append('limit', '100');

      const response = await fetch(`/api/logs/production?${params}`);
      const data = await response.json();
      
      setLogs(data.logs || []);
      setSummary(data.summary);
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedType, selectedSeverity]);

  useEffect(() => {
    fetchLogs();
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, [selectedType, selectedSeverity, fetchLogs]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'dead_click': return <MousePointer className="h-4 w-4" />;
      case 'function_fail': return <Bug className="h-4 w-4" />;
      case 'api_fail': return <Wifi className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      case 'ui_fail': return <Eye className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'dead_click': return 'Dead Click';
      case 'function_fail': return 'Função Falhou';
      case 'api_fail': return 'API Falhou';
      case 'error': return 'Erro JS';
      case 'ui_fail': return 'UI Falhou';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">📊 Logs de Produção</h1>
            <p className="text-muted-foreground">
              Monitoramento em tempo real de erros e problemas
            </p>
          </div>
          <Button onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <MousePointer className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Dead Clicks</p>
                    <p className="text-2xl font-bold">{summary.byType.dead_click || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Bug className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Funções</p>
                    <p className="text-2xl font-bold">{summary.byType.function_fail || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Wifi className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">APIs</p>
                    <p className="text-2xl font-bold">{summary.byType.api_fail || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Erros JS</p>
                    <p className="text-2xl font-bold">{summary.byType.error || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Críticos</p>
                    <p className="text-2xl font-bold text-red-600">{summary.recentCritical}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedType === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType('')}
              >
                Todos os Tipos
              </Button>
              {['dead_click', 'function_fail', 'api_fail', 'error', 'ui_fail'].map(type => (
                <Button
                  key={type}
                  variant={selectedType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                >
                  {getTypeIcon(type)}
                  <span className="ml-1">{getTypeLabel(type)}</span>
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Button
                variant={selectedSeverity === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedSeverity('')}
              >
                Todas Severidades
              </Button>
              {['low', 'medium', 'high', 'critical'].map(severity => (
                <Button
                  key={severity}
                  variant={selectedSeverity === severity ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSeverity(severity)}
                >
                  {severity.toUpperCase()}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Logs List */}
        <div className="space-y-4">
          {logs.map(log => (
            <Card key={log.id} className={log.severity === 'critical' ? 'border-red-500' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(log.type)}
                    <CardTitle className="text-lg">{log.message}</CardTitle>
                    <Badge variant={getSeverityColor(log.severity)}>
                      {log.severity.toUpperCase()}
                    </Badge>
                    <Badge variant="outline">
                      {getTypeLabel(log.type)}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>URL:</strong> {log.context.url}</p>
                  <p><strong>Sessão:</strong> {log.context.sessionId}</p>
                  
                  {log.details && Object.keys(log.details).length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer font-medium">Detalhes</summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  )}

                  {log.reproduction && (
                    <details className="mt-2">
                      <summary className="cursor-pointer font-medium">🎯 Como Reproduzir</summary>
                      <div className="mt-2 space-y-1">
                        <p><strong>Passos:</strong></p>
                        <ol className="list-decimal list-inside ml-4">
                          {log.reproduction.steps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                        <p><strong>Esperado:</strong> {log.reproduction.expectedBehavior}</p>
                        <p><strong>Atual:</strong> {log.reproduction.actualBehavior}</p>
                      </div>
                    </details>
                  )}

                  {log.stackTrace && (
                    <details className="mt-2">
                      <summary className="cursor-pointer font-medium">Stack Trace</summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                        {log.stackTrace}
                      </pre>
                    </details>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {logs.length === 0 && !loading && (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Nenhum log encontrado</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductionLogsDashboard;
