import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuthStatus {
  isLoading: boolean;
  googleEnabled: boolean;
  error: string | null;
}

export const useAuthStatus = () => {
  const [status, setStatus] = useState<AuthStatus>({
    isLoading: true,
    googleEnabled: false,
    error: null
  });

  useEffect(() => {
    const checkAuthProviders = async () => {
      try {
        // Verifica diretamente se o Google OAuth está configurado no Supabase
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('🔐 Erro ao verificar sessão:', error);
          setStatus({
            isLoading: false,
            googleEnabled: false,
            error: 'Não foi possível verificar o status da autenticação'
          });
          return;
        }

        // Tenta fazer login com Google para verificar se está configurado
        // Não executa o login, apenas verifica se o provider está disponível
        const response = await fetch(`https://znvctabjuloliuzxzwya.supabase.co/auth/v1/settings`, {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpudmN0YWJqdWxvbGl1enh6d3lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTI5OTksImV4cCI6MjA2OTk4ODk5OX0.EMnDBv-TOjkLgkRh5SqemwwjEH2LEOK6to32pTLp828',
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('🔍 Configurações de Auth:', data);
          
          // Verifica se o Google está habilitado
          const googleEnabled = data.external_providers?.google?.enabled === true;
          
          setStatus({
            isLoading: false,
            googleEnabled,
            error: null
          });
        } else {
          setStatus({
            isLoading: false,
            googleEnabled: false,
            error: 'Não foi possível verificar as configurações de autenticação'
          });
        }
      } catch (error) {
        console.error('🚫 Erro ao verificar status dos provedores:', error);
        setStatus({
          isLoading: false,
          googleEnabled: false,
          error: 'Erro de conexão ao verificar configurações de autenticação'
        });
      }
    };

    checkAuthProviders();
  }, []);

  return status;
};
