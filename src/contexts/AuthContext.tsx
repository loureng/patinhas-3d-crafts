import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.email || 'No user');
        
        if (event === 'SIGNED_IN') {
          console.log('✅ Usuário logado:', session?.user?.email);
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 Usuário deslogado');
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token renovado');
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('❌ Erro ao recuperar sessão:', error);
      } else {
        console.log('🔍 Sessão recuperada:', session?.user?.email || 'Nenhuma sessão');
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      console.log('🔐 Iniciando login com Google...');
      const redirectUrl = `${window.location.origin}/`;
      console.log('🔗 URL de redirecionamento:', redirectUrl);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });

      if (error) {
        console.error('❌ Erro no login com Google:', error);
        
        // Verificar tipos específicos de erro
        if (error.message.includes('provider not enabled')) {
          toast({
            title: "Google OAuth não configurado",
            description: "O login com Google não foi configurado no projeto Supabase. Entre em contato com o administrador.",
            variant: "destructive"
          });
        } else if (error.message.includes('invalid_request')) {
          toast({
            title: "Configuração inválida",
            description: "Há um problema na configuração do Google OAuth. Verifique as credenciais no painel do Supabase.",
            variant: "destructive"
          });
        } else if (error.message.includes('redirect_uri')) {
          toast({
            title: "URL de redirecionamento inválida",
            description: "A URL de redirecionamento não está configurada corretamente no Google Console.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Erro no login com Google",
            description: `${error.message || 'Erro desconhecido'}. Código: ${error.status || 'N/A'}`,
            variant: "destructive"
          });
        }
        
        // Log detalhado para debugging
        console.error('Detalhes completos do erro:', {
          message: error.message,
          status: error.status,
          code: error.code,
          details: error
        });
      } else {
        console.log('✅ Redirecionamento para Google OAuth iniciado com sucesso');
      }
    } catch (error: unknown) {
      console.error('💥 Erro inesperado no login com Google:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro inesperado",
        description: `Falha na comunicação com o servidor de autenticação: ${errorMessage}`,
        variant: "destructive"
      });
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Iniciando logout...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Erro no logout:', error);
        toast({
          title: "Erro no logout",
          description: error.message || 'Falha ao desconectar',
          variant: "destructive"
        });
      } else {
        console.log('✅ Logout realizado com sucesso');
      }
    } catch (error: unknown) {
      console.error('💥 Erro inesperado no logout:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro inesperado no logout",
        description: `Falha ao desconectar: ${errorMessage}`,
        variant: "destructive"
      });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signOut,
      signInWithGoogle
    }}>
      {children}
    </AuthContext.Provider>
  );
};