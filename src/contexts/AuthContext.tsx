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
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
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

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      console.log('🔐 Iniciando registro com email/senha...');
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            display_name: fullName
          }
        }
      });

      if (error) {
        console.error('❌ Erro no registro:', error);
        
        // Tratamento específico de erros de registro
        if (error.message.includes('User already registered')) {
          toast({
            title: "Email já cadastrado",
            description: "Este email já possui uma conta. Tente fazer login ou use a recuperação de senha.",
            variant: "destructive"
          });
        } else if (error.message.includes('Invalid email')) {
          toast({
            title: "Email inválido",
            description: "Por favor, verifique o formato do email informado.",
            variant: "destructive"
          });
        } else if (error.message.includes('Password')) {
          toast({
            title: "Senha inválida",
            description: "A senha deve ter pelo menos 6 caracteres.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Erro no cadastro",
            description: error.message || 'Falha ao criar conta',
            variant: "destructive"
          });
        }
        return;
      }

      console.log('✅ Registro realizado com sucesso:', data.user?.email);
      
      // Verificar se o usuário precisa confirmar email
      if (data.user && !data.session) {
        toast({
          title: "Confirme seu email",
          description: "Um link de confirmação foi enviado para seu email. Verifique sua caixa de entrada.",
          variant: "default"
        });
      } else {
        toast({
          title: "Conta criada com sucesso!",
          description: "Bem-vindo ao Jardim das Patinhas!",
          variant: "default"
        });
      }
    } catch (error: unknown) {
      console.error('💥 Erro inesperado no registro:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro inesperado",
        description: `Falha ao criar conta: ${errorMessage}`,
        variant: "destructive"
      });
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Iniciando login com email/senha...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ Erro no login:', error);
        
        // Tratamento específico de erros de login
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: "Credenciais inválidas",
            description: "Email ou senha incorretos. Verifique suas informações e tente novamente.",
            variant: "destructive"
          });
        } else if (error.message.includes('Email not confirmed')) {
          toast({
            title: "Email não confirmado",
            description: "Verifique sua caixa de entrada e clique no link de confirmação antes de fazer login.",
            variant: "destructive"
          });
        } else if (error.message.includes('Too many requests')) {
          toast({
            title: "Muitas tentativas",
            description: "Aguarde alguns minutos antes de tentar novamente.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Erro no login",
            description: error.message || 'Falha na autenticação',
            variant: "destructive"
          });
        }
        return;
      }

      console.log('✅ Login realizado com sucesso:', data.user?.email);
      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta!",
        variant: "default"
      });
    } catch (error: unknown) {
      console.error('💥 Erro inesperado no login:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro inesperado",
        description: `Falha na autenticação: ${errorMessage}`,
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
      signInWithGoogle,
      signUp,
      signIn
    }}>
      {children}
    </AuthContext.Provider>
  );
};