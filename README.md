# 🐾 Jardim das Patinhas - Produtos 3D Personalizados

[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4.19-646CFF.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-2.53.0-3ECF8E.svg)](https://supabase.com/)
[![Three.js](https://img.shields.io/badge/Three.js-0.161.0-000000.svg)](https://threejs.org/)

Uma plataforma e-commerce moderna para produtos 3D personalizados voltados para pets, casa e jardim. Oferecemos uma experiência única de visualização 3D e personalização de produtos para tornar o seu espaço e o de seus pets ainda mais especiais.

## ✨ Funcionalidades

- 🎨 **Visualização 3D Interativa**: Visualize produtos em tempo real com Three.js
- 🐕 **Produtos para Pets**: Linha especializada em acessórios e decorações para animais
- 🏡 **Casa & Jardim**: Decorações personalizadas para ambientes internos e externos
- 🛒 **E-commerce Completo**: Sistema de carrinho, checkout e pagamentos
- 📱 **Design Responsivo**: Interface otimizada para desktop, tablet e mobile
- 🔐 **Autenticação Flexível**: Sistema de login e registro com Google OAuth + registro manual
- 🎯 **Personalização**: Customize cores, tamanhos e detalhes dos produtos
- 📦 **Gestão de Pedidos**: Acompanhe seus pedidos em tempo real

## 🚀 Tecnologias Utilizadas

### Frontend
- **React 18.3.1** - Biblioteca principal para interface do usuário
- **TypeScript 5.8.3** - Tipagem estática para JavaScript
- **Vite 5.4.19** - Bundler e servidor de desenvolvimento
- **Tailwind CSS 3.4.17** - Framework CSS utilitário
- **shadcn/ui** - Componentes UI modernos e acessíveis

### 3D & Visualização
- **Three.js 0.161.0** - Renderização 3D no navegador
- **three-stdlib** - Utilitários e extensões para Three.js

### Backend & Dados
- **Supabase 2.53.0** - Backend as a Service (BaaS)
- **Supabase Auth** - Autenticação com Google OAuth + registro manual email/senha
- **React Query** - Gerenciamento de estado servidor
- **React Hook Form** - Formulários performáticos
- **Zod** - Validação de esquemas TypeScript

### Roteamento & UI
- **React Router DOM** - Roteamento do lado cliente
- **Radix UI** - Primitivos de UI acessíveis
- **Lucide React** - Ícones modernos
- **Embla Carousel** - Componente de carrossel

## 🤖 Sistema Autônomo de Detecção de Erros

### Visão Geral

O Jardim das Patinhas possui um sistema avançado de detecção automática de erros que monitora o frontend em tempo real, detecta problemas e cria automaticamente issues no GitHub com descrições detalhadas geradas por IA.

### 🔧 Funcionalidades

- **Crawler Headless**: Navega automaticamente por todas as rotas do site
- **Detecção Inteligente**: Identifica páginas 404, redirecionamentos inválidos, dead clicks, erros JS/API
- **IA Integrada**: Usa Google Gemini para gerar descrições detalhadas dos erros
- **GitHub Automation**: Cria issues automaticamente evitando duplicatas
- **Screenshots**: Captura evidências visuais dos problemas encontrados
- **Relatórios Completos**: Gera relatórios detalhados de cada execução

### 📋 Tipos de Erros Detectados

1. **Páginas 404** (`page_not_found`) - Links quebrados ou rotas inexistentes
2. **Redirecionamentos Inválidos** (`invalid_redirect`) - Loops ou redirecionamentos problemáticos
3. **Dead Clicks** (`dead_click`) - Botões/links que não respondem
4. **Erros JavaScript** (`js_error`) - Erros de código não tratados
5. **Falhas de API** (`api_error`) - Problemas de conectividade ou timeouts
6. **Erros de Renderização** (`rendering_error`) - Problemas de layout ou carregamento
7. **Erros de Console** (`console_error`) - Warnings e erros no console

### ⚙️ Configuração

1. **Clone e instale dependências:**
```bash
git clone https://github.com/loureng/patinhas-3d-crafts.git
cd patinhas-3d-crafts
npm install
```

2. **Configure variáveis de ambiente:**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:
```env
# GitHub API
GITHUB_TOKEN=your_github_personal_access_token_here
GITHUB_OWNER=loureng
GITHUB_REPO=patinhas-3d-crafts

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Application URLs
BASE_URL=http://localhost:5173
PRODUCTION_URL=https://your-production-domain.com
```

3. **Instale os browsers do Playwright:**
```bash
npx playwright install chromium
```

### 🚀 Como Usar

#### Execução Completa (Recomendado)
```bash
# Execução completa: detecta erros → analisa com IA → cria issues
npm run auto-issue
```

#### Modo de Teste (Dry Run)
```bash
# Testa sem criar issues reais no GitHub
npm run auto-issue:dry
```

#### Modo Debug
```bash
# Execução com logs detalhados
npm run auto-issue:debug
```

#### Scripts Individuais

**Apenas detecção de erros:**
```bash
npm run error-crawler
```

**Teste conexão Gemini:**
```bash
npm run test-gemini
```

**Teste conexão GitHub:**
```bash
npm run test-github
```

#### Opções Avançadas
```bash
# Executar com parâmetros customizados
npx tsx scripts/auto-issue.ts --url http://localhost:3000 --max-pages 20 --dry-run

# Ver todas as opções
npx tsx scripts/auto-issue.ts --help
```

### 📊 Relatórios

O sistema gera automaticamente relatórios em `./reports/`:
- **JSON completo**: Dados estruturados de toda a execução
- **Resumo em texto**: Summary legível em português
- **Screenshots**: Evidências visuais (se habilitado)

### 🔄 Integração com CI/CD

**GitHub Actions (recomendado):**
```yaml
name: Error Detection
on:
  schedule:
    - cron: '0 2 * * *'  # Diariamente às 2h
  workflow_dispatch:

jobs:
  detect-errors:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npx playwright install chromium
      - run: npm run auto-issue
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
```

### 🛡️ Segurança e Boas Práticas

- **Tokens**: Nunca commite tokens no código
- **Rate Limiting**: O sistema respeita limits das APIs
- **Duplicatas**: Evita automaticamente issues duplicadas
- **Sandbox**: Executa em ambiente isolado
- **Logs**: Não loga informações sensíveis

### 🔍 Troubleshooting

**Playwright não instala:**
```bash
# Instalar manualmente
npx playwright install-deps
npx playwright install chromium
```

**Erro de permissões do GitHub:**
- Verifique se o token tem permissões: `repo`, `issues:write`
- Confirme que o repositório está correto no `.env`

**Gemini API falha:**
- Verifique a chave API em https://makersuite.google.com/app/apikey
- Confirme que a API está habilitada no Google Cloud

**Site não acessível:**
- Para localhost: inicie o servidor antes (`npm run dev`)
- Para produção: verifique URL e certificados SSL

### 📈 Monitoramento Contínuo

O sistema é ideal para:
- **Testes de Regressão**: Detecta quando updates quebram funcionalidades
- **Monitoramento 24/7**: Execução programada para capturar problemas
- **Quality Gates**: Impede deploys com erros críticos
- **DevOps Integration**: Integra com pipelines de CI/CD

---

## 🛠️ Configuração do Ambiente

### Pré-requisitos

- Node.js 18+ ([Download](https://nodejs.org/))
- npm ou yarn
- Conta no Supabase (para configuração do backend)

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/loureng/patinhas-3d-crafts.git
cd patinhas-3d-crafts
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` com suas credenciais do Supabase:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

4. **Execute o servidor de desenvolvimento**
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes base do shadcn/ui
│   ├── 3d/             # Componentes de visualização 3D
│   └── layout/         # Componentes de layout
├── pages/              # Páginas da aplicação
├── hooks/              # Hooks customizados
├── contexts/           # Contextos React
├── integrations/       # Integrações externas (Supabase)
├── lib/                # Utilitários e configurações
└── styles/             # Arquivos de estilo
```

## 🗄️ Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com/)
2. Configure as tabelas necessárias (produtos, usuários, pedidos)
3. Adicione as credenciais ao arquivo `.env.local`
4. Execute as migrações do banco de dados

## 🔐 Sistema de Autenticação

O projeto oferece múltiplas opções de autenticação para maior flexibilidade:

### Registro Manual
- **Email e senha**: Usuários podem criar contas fornecendo nome, email e senha
- **Validações**: Email válido, senha mínima de 6 caracteres, nome obrigatório
- **Feedback**: Mensagens específicas para diferentes cenários (email já existe, senha fraca, etc.)

### Login Google OAuth
- **Integração Google**: Login rápido com conta Google existente
- **Configuração**: Requer setup no Google Console e Supabase Auth

### Recursos de Segurança
- **Validação frontend**: Utilizando Zod + React Hook Form
- **Tratamento de erros**: Feedback específico via toast notifications
- **Coexistência**: Ambos os métodos funcionam independentemente
- **Responsividade**: Interface adaptada para todos os dispositivos

### Interface de Autenticação
- **Tabs intuitivas**: Alternância fácil entre Login e Registro
- **UX moderna**: Loading states, toggle de senha, validações em tempo real
- **Acessibilidade**: Componentes compatíveis com leitores de tela

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Constrói a aplicação para produção
- `npm run build:dev` - Constrói em modo desenvolvimento
- `npm run preview` - Visualiza a build de produção
- `npm run lint` - Executa o linter ESLint

## 🎨 Personalização de Temas

O projeto utiliza CSS variables e Tailwind CSS para facilitar a personalização:

- Cores: Configuradas em `tailwind.config.ts`
- Temas: Gerenciados com `next-themes`
- Componentes: Estilizados com `class-variance-authority`

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📝 Padrões de Commit

Utilizamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Alterações na documentação
- `style:` - Formatação, ponto e vírgula, etc
- `refactor:` - Refatoração de código
- `test:` - Adição ou correção de testes
- `chore:` - Alterações em ferramentas, configurações, etc

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para dúvidas, sugestões ou problemas:

- 📧 Email: contato@jardimdaspatinhas.com
- 🐛 Issues: [GitHub Issues](https://github.com/loureng/patinhas-3d-crafts/issues)

---

Feito com ❤️ para nossos amigos de quatro patas 🐾
