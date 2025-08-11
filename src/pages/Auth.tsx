import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { Chrome, AlertCircle, ExternalLink, FileText } from 'lucide-react';
import { OAuthStatusIndicator } from '@/components/OAuthStatusIndicator';
import Header from '@/components/Header';

const Auth = () => {
  const { user, signInWithGoogle, loading } = useAuth();
  const navigate = useNavigate();
  const [showConfigHelp, setShowConfigHelp] = useState(false);

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
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Bem-vindo</CardTitle>
          <CardDescription>
            Entre na sua conta para acessar todas as funcionalidades
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Indicador de status OAuth */}
          <div className="mb-4">
            <OAuthStatusIndicator />
          </div>

          <Button 
            onClick={signInWithGoogle}
            className="w-full"
            size="lg"
          >
            <Chrome className="mr-2 h-4 w-4" />
            Entrar com Google
          </Button>

          {/* Fallback para quando Google OAuth não está configurado */}
          <div className="text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfigHelp(!showConfigHelp)}
              className="text-xs"
            >
              <AlertCircle className="mr-1 h-3 w-3" />
              Problemas com o login?
            </Button>
          </div>

          {showConfigHelp && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="space-y-2">
                <p className="font-medium">Se o login com Google não funciona:</p>
                <div className="space-y-1 text-sm">
                  <p>• Verifique se o Google OAuth está configurado no Supabase</p>
                  <p>• Consulte a documentação de configuração</p>
                  <p>• Entre em contato com o administrador do sistema</p>
                </div>
                <div className="flex flex-col gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('/GOOGLE_OAUTH_SETUP.md', '_blank')}
                    className="w-full"
                  >
                    <FileText className="mr-1 h-3 w-3" />
                    Ver Documentação de Setup
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://supabase.com/dashboard/project/znvctabjuloliuzxzwya/auth/providers', '_blank')}
                    className="w-full"
                  >
                    <ExternalLink className="mr-1 h-3 w-3" />
                    Painel Supabase Auth
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="text-center text-sm text-muted-foreground">
            <p>Ao entrar, você concorda com nossos</p>
            <p>
              <a href="#" className="underline hover:text-primary">Termos de Serviço</a>
              {' e '}
              <a href="#" className="underline hover:text-primary">Política de Privacidade</a>
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default Auth;