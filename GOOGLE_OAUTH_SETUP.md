# Configuração do Google OAuth - Jardim das Patinhas 3D

Este documento fornece instruções passo a passo para configurar o login com Google no projeto Jardim das Patinhas 3D.

## 📋 Informações do Projeto

- **Projeto Supabase ID:** `znvctabjuloliuzxzwya`
- **URL do Projeto:** `https://znvctabjuloliuzxzwya.supabase.co`
- **Dashboard:** [https://supabase.com/dashboard/project/znvctabjuloliuzxzwya](https://supabase.com/dashboard/project/znvctabjuloliuzxzwya)

## 🚀 Configuração Rápida

### Passo 1: Acessar o Google Cloud Console

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Faça login com sua conta Google
3. Selecione ou crie um projeto

### Passo 2: Habilitar a API do Google+

1. No menu lateral, vá em **"APIs & Services"** → **"Library"**
2. Procure por **"Google+ API"** ou **"Google Identity"**
3. Clique em **"Enable"** para habilitar a API

### Passo 3: Criar Credenciais OAuth 2.0

1. Vá em **"APIs & Services"** → **"Credentials"**
2. Clique em **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Se solicitado, configure a tela de consentimento OAuth primeiro:
   - **Application type:** External
   - **App name:** Jardim das Patinhas 3D
   - **User support email:** seu-email@dominio.com
   - **Developer contact information:** seu-email@dominio.com

### Passo 4: Configurar o OAuth Client ID

1. **Application type:** Web application
2. **Name:** Jardim das Patinhas 3D - Auth
3. **Authorized JavaScript origins:**
   ```
   https://znvctabjuloliuzxzwya.supabase.co
   http://localhost:5173
   http://localhost:3000
   ```

4. **Authorized redirect URIs:**
   ```
   https://znvctabjuloliuzxzwya.supabase.co/auth/v1/callback
   http://localhost:5173/auth/callback
   http://localhost:3000/auth/callback
   ```

5. Clique em **"Create"**
6. **IMPORTANTE:** Copie e salve o **Client ID** e **Client Secret**

### Passo 5: Configurar no Supabase

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard/project/znvctabjuloliuzxzwya)
2. Vá em **"Authentication"** → **"Providers"**
3. Encontre **"Google"** na lista de provedores
4. Configure:
   - **Enable Google provider:** ✅ Habilitado
   - **Client ID:** `1088590455220-2qag32mfkbr1asaqbh7bhvieq8g20419.apps.googleusercontent.com`
   - **Client Secret:** `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`
5. Clique em **"Save"**

## ✅ Verificação

Após a configuração, teste o login:

1. Acesse seu site local: `http://localhost:5173/auth`
2. Clique no botão **"Entrar com Google"**
3. Deve redirecionar para o Google para autenticação
4. Após autorizar, deve retornar para sua aplicação logado

## 🔧 URLs Importantes

### Para Desenvolvimento Local:
- **Site URL:** `http://localhost:5173`
- **Redirect URL:** `http://localhost:5173/auth/callback`

### Para Produção:
- **Site URL:** `https://znvctabjuloliuzxzwya.supabase.co`
- **Redirect URL:** `https://znvctabjuloliuzxzwya.supabase.co/auth/v1/callback`

## 🐛 Troubleshooting

### Erro: "provider not enabled"
- ✅ Verifique se o Google OAuth está habilitado no Supabase
- ✅ Confirme se Client ID e Secret estão corretos

### Erro: "redirect_uri_mismatch"
- ✅ Verifique se as URLs de redirecionamento estão corretas no Google Console
- ✅ Certifique-se de que a URL exata está na lista autorizada

### Erro: "invalid_client"
- ✅ Verifique se o Client ID está correto
- ✅ Certifique-se de que o projeto do Google Cloud está ativo

### Console Logs para Debug

Com a nova implementação, você verá logs detalhados no console:

```
🔐 Iniciando login com Google...
🔗 URL de redirecionamento: http://localhost:5173/
✅ Redirecionamento para Google OAuth iniciado com sucesso
```

Em caso de erro:
```
❌ Erro no login com Google: [detalhes do erro]
```

## 📝 Notas Importantes

1. **Segurança:** Nunca compartilhe o Client Secret publicamente
2. **Ambiente:** Configure URLs diferentes para desenvolvimento e produção
3. **Teste:** Sempre teste em ambiente local antes de publicar
4. **Backup:** Mantenha backup das credenciais em local seguro

## 🔗 Links Úteis

- [Documentação Supabase Auth](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Supabase Dashboard](https://supabase.com/dashboard/project/znvctabjuloliuzxzwya)

---

**Última atualização:** Agosto 2025  
**Responsável:** Equipe de Desenvolvimento Jardim das Patinhas 3D
