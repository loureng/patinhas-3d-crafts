import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle } from 'lucide-react';
import { OAuthStatusIndicator } from '@/components/OAuthStatusIndicator';
import AuthForm from '@/components/AuthForm';
import Header from '@/components/Header';

const Auth = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
        
        {/* Indicador de status OAuth */}
        <div className="mb-4">
          <OAuthStatusIndicator />
        </div>

        {/* Componente principal de autenticação */}
        <AuthForm defaultTab="login" />
        
        {/* Aviso sobre problemas de configuração OAuth */}
        <div className="mt-6 max-w-md">
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <p className="font-medium mb-2">Problemas com login?</p>
              <div className="space-y-1 text-sm">
                <p>• Se o Google OAuth não funcionar, use o registro manual</p>
                <p>• Para suporte técnico, consulte a documentação</p>
                <p>• Administradores podem verificar as configurações no Supabase</p>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
};

export default Auth;