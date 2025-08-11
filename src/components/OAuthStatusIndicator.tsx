import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStatus } from '@/hooks/useAuthStatus';

export const OAuthStatusIndicator = () => {
  const { isLoading, googleEnabled, error } = useAuthStatus();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        Verificando configuração OAuth...
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      {googleEnabled ? (
        <>
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-green-700">Google OAuth configurado</span>
        </>
      ) : (
        <>
          <XCircle className="h-4 w-4 text-red-600" />
          <span className="text-red-700">Google OAuth não configurado</span>
        </>
      )}
    </div>
  );
};
