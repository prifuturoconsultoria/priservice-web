# Documentação do Sistema de Gestão de Fichas de Serviço (Priservice)

## Índice
1. [Visão Geral do Projeto](#visão-geral-do-projeto)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Tecnologias Utilizadas](#tecnologias-utilizadas)
4. [Estrutura do Projeto](#estrutura-do-projeto)
5. [Base de Dados](#base-de-dados)
6. [Autenticação e Autorização](#autenticação-e-autorização)
7. [Sistema de Email](#sistema-de-email)
8. [Fluxo de Aprovação](#fluxo-de-aprovação)
9. [Deploy e Hospedagem](#deploy-e-hospedagem)
10. [Configuração do Ambiente](#configuração-do-ambiente)
11. [Comandos de Desenvolvimento](#comandos-de-desenvolvimento)
12. [Soluções de Hospedagem Recomendadas](#soluções-de-hospedagem-recomendadas)

---

## Visão Geral do Projeto

O **Sistema de Gestão de Fichas de Serviço (Priservice)** é uma aplicação web moderna desenvolvida para gerir fichas de serviço técnico com fluxo de aprovação por Email. O sistema permite que técnicos criem fichas de serviço que posteriormente necessitam de aprovação dos clientes através de tokens de aprovação enviados por Email.

### Funcionalidades Principais:
- 📋 **Gestão de Fichas de Serviço**: Criação, edição, visualização e exclusão
- 🏢 **Gestão de Projectos**: Organização por projectos e empresas
- 👤 **Sistema de Autenticação**: Acesso seguro com diferentes níveis de permissão
- 📧 **Aprovação por Email**: Envio automático de mensagens para aprovação
- 📊 **Relatórios e Painel de Controlo**: Visualização de dados e métricas
- 🔐 **Controlo de Acesso**: Diferentes perfis (Administrador, Técnico, Observador)
- 📱 **Interface Responsiva**: Compatível com dispositivos móveis

---


## Arquitetura do Sistema

### Arquitetura Geral
```
┌─────────────────────────┐    ┌─────────────────────────┐    ┌─────────────────────────┐
│      Frontend           │    │       Backend           │    │      Database           │
│   (Next.js 15 + React) │◄──►│   (Server Actions)      │◄──►│     (Supabase)          │
│                         │    │                         │    │                         │
│  - App Router           │    │  - Server Components    │    │  - PostgreSQL           │
│  - shadcn/ui            │    │  - API Routes           │    │  - Row Level Security   │
│  - Tailwind CSS         │    │  - Edge Functions       │    │  - Real-time            │
└─────────────────────────┘    └─────────────────────────┘    └─────────────────────────┘
                                           │
                                           ▼
                               ┌─────────────────────────┐
                               │    Email Service        │
                               │     (Resend)            │
                               │                         │
                               │  - Templates HTML       │
                               │  - Envio Automático     │
                               │  - Notificações         │
                               └─────────────────────────┘
```

### Fluxo de Dados
1. **Criação**: Técnico cria ficha de serviço através da interface web
2. **Persistência**: Dados guardados na base de dados Supabase PostgreSQL
3. **Email**: Edge Function envia mensagem de aprovação através do Resend
4. **Aprovação**: Cliente acede ao link da mensagem e aprova/rejeita
5. **Notificação**: Sistema notifica técnico sobre a decisão
6. **Relatórios**: Painel de controlo apresenta métricas e estatísticas

---

## Tecnologias Utilizadas

### Frontend
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **Next.js** | 15.2.4 | Framework React com App Router |
| **React** | 19 | Biblioteca para interfaces de utilizador |
| **TypeScript** | 5.x | Tipagem estática |
| **Tailwind CSS** | 3.4.17 | Framework CSS utilitário |
| **shadcn/ui** | Latest | Componentes UI baseados em Radix UI |
| **React Hook Form** | 7.62.0 | Gestão de formulários |
| **Zod** | 3.25.76 | Validação e schema |
| **Lucide React** | 0.454.0 | Ícones |

### Backend e Infraestrutura
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **Supabase** | 2.x | Backend-as-a-Service |
| **PostgreSQL** | 15+ | Base de dados relacional |
| **Supabase Auth** | Latest | Sistema de autenticação |
| **Edge Functions** | Deno | Funções serverless |
| **Row Level Security** | - | Segurança a nível de linha |

### Serviços Externos
| Serviço | Propósito |
|---------|-----------|
| **Resend** | Envio de emails transacionais |
| **Vercel** | Hospedagem do frontend (recomendado) |
| **Supabase Cloud** | Hospedagem da base de dados |

### Ferramentas de Desenvolvimento
| Ferramenta | Propósito |
|------------|-----------|
| **ESLint** | Linting de código |
| **Prettier** | Formatação de código |
| **Turbopack** | Bundler rápido (dev) |
| **pnpm** | Gestor de pacotes |

---

## Estrutura do Projeto

```
service-sheet-system/
├── 📁 app/                          # App Router do Next.js
│   ├── 📁 admin/                    # Páginas administrativas
│   ├── 📁 approval/[token]/         # Páginas de aprovação pública
│   ├── 📁 login/                    # Autenticação
│   ├── 📁 projects/                 # CRUD de projectos
│   ├── 📁 reports/                  # Dashboard e relatórios
│   ├── 📁 service-sheets/           # CRUD de fichas de serviço
│   ├── layout.tsx                   # Layout principal
│   └── page.tsx                     # Página inicial
│
├── 📁 components/                   # Componentes React
│   ├── 📁 ui/                       # Componentes shadcn/ui
│   └── ...                          # Componentes customizados
│
├── 📁 lib/                          # Bibliotecas e utilitários
│   └── supabase.ts                  # Server Actions
│
├── 📁 utils/                        # Utilitários
│   └── 📁 supabase/                 # Clientes Supabase
│       ├── client.ts                # Cliente browser
│       └── server.ts                # Cliente servidor
│
├── 📁 supabase/                     # Configuração Supabase
│   ├── 📁 functions/                # Edge Functions
│   │   └── send-approval-email/     # Função de envio de email
│   └── 📁 migrations/               # Migrações da base de dados
│
├── 📁 scripts/                      # Scripts SQL
│   ├── 001-create-service-sheets-table.sql
│   ├── 002-create-profiles-table.sql
│   └── ...
│
├── 📁 styles/                       # Estilos CSS
│   └── globals.css                  # Estilos globais
│
├── 📄 package.json                  # Dependências do projeto
├── 📄 next.config.mjs               # Configuração do Next.js
├── 📄 tailwind.config.ts            # Configuração do Tailwind
├── 📄 middleware.ts                 # Middleware de autenticação
├── 📄 .env.local                    # Variáveis de ambiente
```

---

## Base de Dados

### Schema Principal

#### Tabela: `service_sheets`
```sql
CREATE TABLE service_sheets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  created_by UUID REFERENCES profiles(id),
  client_company TEXT NOT NULL,
  client_contact_name TEXT NOT NULL,
  client_contact_email TEXT NOT NULL,
  client_contact_phone TEXT,
  service_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  activity_description TEXT NOT NULL,
  subject TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approval_token UUID DEFAULT gen_random_uuid() UNIQUE,
  client_feedback TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Tabela: `profiles`
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'technician' CHECK (role IN ('admin', 'technician', 'observer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Tabela: `projects`
```sql
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  client_responsible TEXT,
  partner_responsible TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row Level Security (RLS)
- **Políticas de Segurança**: Implementadas em todas as tabelas
- **Controlo de Acesso**: Baseado em perfis e propriedade
- **Isolamento**: Técnicos apenas visualizam as suas próprias fichas
- **Acesso de Administrador**: Administradores têm acesso completo

---

## Autenticação e Autorização

### Sistema de Autenticação
- **Provedor**: Supabase Auth
- **Método**: Email/Password
- **Sessões**: Cookies HTTP-only seguros
- **Middleware**: Proteção automática de rotas
- **SSR**: Server-Side Rendering com autenticação

### Níveis de Acesso (Perfis)
1. **Administrador**: 
   - Acesso completo ao sistema
   - Gestão de utilizadores
   - Todas as fichas de serviço
   - Relatórios globais

2. **Técnico**:
   - Criação de fichas de serviço
   - Edição das próprias fichas
   - Acesso limitado a projectos

3. **Observador**:
   - Visualização apenas
   - Relatórios limitados
   - Sem permissões de edição

### Fluxo de Autenticação
```
1. Utilizador acede à rota protegida
2. Middleware verifica o token
3. Se não autenticado → redireccionamento para /login
4. Acesso bem-sucedido → redireccionamento para a rota original
5. Sessão mantida através de cookies seguros
```

---

## Sistema de Email

### Provedor de Email
- **Serviço**: Resend (https://resend.com)
- **Tipo**: Mensagens electrónicas transaccionais
- **Templates**: HTML responsivos
- **Fallback**: Modo simulação para desenvolvimento

### Funcionalidades de Email
1. **Mensagem de Aprovação**:
   - Enviada automaticamente na criação da ficha
   - Modelo profissional com detalhes do serviço
   - Link único de aprovação com token
   - Compatível com dispositivos móveis

2. **Mensagem de Notificação**:
   - Enviada após aprovação/rejeição
   - Comentários do cliente incluídos
   - Links para visualizar a ficha
   - Estado visual (aprovado/rejeitado)

### Modelos de Email
- **Design Responsivo**: Compatível com todos os clientes de Email
- **Identidade Visual**: Cores e estilo consistentes
- **Acessibilidade**: Texto alternativo e estrutura semântica
- **Texto Alternativo**: Versão texto para clientes que não suportam HTML

### Configuração
```env
RESEND_API_KEY=re_xxxxxxxxx
FROM_EMAIL=noreply@suaempresa.com
SITE_URL=https://seudominio.com
```

---

## Fluxo de Aprovação

### Processo Completo
```
1. 👨‍🔧 Técnico cria ficha de serviço
   ├── Preenche formulário
   ├── Seleciona projeto
   └── Submete dados

2. 💾 Sistema processa dados
   ├── Valida informações
   ├── Gera token único
   ├── Salva na base de dados
   └── Dispara email

3. 📧 Mensagem enviada ao cliente
   ├── Modelo HTML profissional
   ├── Detalhes do serviço
   ├── Link de aprovação único
   └── Instruções claras

4. 👤 Cliente recebe a mensagem
   ├── Clica no link
   ├── Visualiza a ficha de serviço
   ├── Aprova ou rejeita
   └── Adiciona comentários (opcional)

5. 🔄 Sistema processa a decisão
   ├── Actualiza o estado na BD
   ├── Regista o timestamp
   ├── Envia notificação ao técnico
   └── Actualiza o painel de controlo

6. 📊 Dados disponíveis
   ├── Relatórios actualizados
   ├── Métricas de aprovação
   ├── Histórico completo
   └── Exportação possível
```

### Estados da Ficha
- **Pending**: Aguardando aprovação do cliente
- **Approved**: Aprovada pelo cliente
- **Rejected**: Rejeitada pelo cliente

---

## Deploy e Hospedagem

### Pré-requisitos para Deploy
1. **Conta Vercel** (recomendado) ou similar
2. **Projeto Supabase** configurado
3. **Conta Resend** para Email
4. **Domínio** (opcional, mas recomendado)

### Variáveis de Ambiente Necessárias
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# URL do Site
NEXT_PUBLIC_SITE_URL=https://seudominio.com

# Email (para Edge Functions do Supabase)
RESEND_API_KEY=re_xxxxxxxxx
FROM_EMAIL=noreply@seudominio.com
SITE_URL=https://seudominio.com
```

### Passos para Deploy

#### 1. Configurar Base de Dados
```bash
# Executar scripts SQL na ordem:
# 001-create-service-sheets-table.sql
# 002-create-profiles-table.sql
# 003-create-projects-table.sql
# etc.
```

#### 2. Deploy Edge Functions
```bash
# Instalar Supabase CLI
npm install -g supabase

# Login no Supabase
supabase login

# Deploy da função de Email
supabase functions deploy send-approval-email
```

#### 3. Configurar Variáveis no Supabase
- Ir para Dashboard → Settings → Edge Functions
- Adicionar variáveis de ambiente:
  - `RESEND_API_KEY`
  - `FROM_EMAIL` 
  - `SITE_URL`

#### 4. Deploy da Aplicação
```bash
# Vercel (Recomendado)
npx vercel --prod

# Ou conectar repositório Git no dashboard Vercel
```

#### 5. Configurar Domínio (Opcional)
- Adicionar domínio personalizado no Vercel
- Configurar DNS para apontar para Vercel
- Atualizar `NEXT_PUBLIC_SITE_URL`

---

## Configuração do Ambiente

### Instalação Local
```bash
# Clonar repositório
git clone [url-do-repositorio]
cd service-sheet-system

# Instalar dependências
npm install
# ou
pnpm install

# Copiar e configurar variáveis de ambiente
cp .env.local.example .env.local
# Editar .env.local com suas credenciais

# Rodar em desenvolvimento
npm run dev
```

### Configuração da Base de Dados
1. **Criar projeto Supabase**:
   - Aceder a https://supabase.com
   - Criar novo projeto
   - Copiar URL e chaves

2. **Executar migrações**:
   - Executar scripts da pasta `/scripts/` em ordem
   - Configurar Row Level Security
   - Testar conexão

3. **Configurar autenticação**:
   - Activar Email/Password no Supabase
   - Configurar URLs de redirecionamento
   - Testar acesso/saída

### Configuração de Email
1. **Criar conta Resend**:
   - Registar em https://resend.com
   - Verificar domínio ou usar resend.dev
   - Obter chave da API

2. **Deploy Edge Function**:
   - Instalar Supabase CLI
   - Deploy da função `send-approval-email`
   - Configurar variáveis de ambiente

3. **Testar envio**:
   - Criar ficha de serviço de teste
   - Verificar registos no Supabase
   - Confirmar recepção da mensagem

---

## Comandos de Desenvolvimento

### Scripts NPM
```bash
# Desenvolvimento com Turbopack
npm run dev
pnpm dev

# Build de produção
npm run build

# Iniciar servidor de produção
npm run start

# Linting
npm run lint

# Verificação de tipos (se configurado)
npm run type-check
```

### Comandos Supabase
```bash
# Login
supabase login

# Inicializar projecto local
supabase init

# Iniciar serviços locais
supabase start

# Deploy de edge functions
supabase functions deploy [nome-da-funcao]

# Ver registos das funções
supabase functions logs [nome-da-funcao]

# Parar serviços locais
supabase stop
```

### Comandos Úteis
```bash
# Limpar cache Next.js
rm -rf .next

# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install

# Verificar vulnerabilidades
npm audit

# Actualizar dependências
npm update
```

---

## Soluções de Hospedagem Recomendadas

### 🥇 Opção 1: Vercel + Supabase (Recomendado)
**Frontend**: Vercel  
**Backend**: Supabase Cloud  
**Email**: Resend  

**Vantagens**:
- ✅ Deploy automático via Git
- ✅ CDN global
- ✅ SSL automático
- ✅ Escalabilidade automática
- ✅ Integração nativa com Next.js
- ✅ Ambiente gratuito generoso

**Preços**:
- Vercel: €0-20/mês (Hobby gratuito)
- Supabase: €0-25/mês (Free tier disponível)
- Resend: €0-20/mês (100 mensagens gratuitas)

### 🥈 Opção 2: Netlify + Supabase
**Frontend**: Netlify  
**Backend**: Supabase Cloud  
**Email**: Resend  

**Vantagens**:
- ✅ Deploy contínuo
- ✅ Forms handling
- ✅ Edge functions
- ✅ A/B testing

**Preços**:
- Netlify: €0-19/mês
- Supabase: €0-25/mês
- Resend: €0-20/mês

### 🥉 Opção 3: Digital Ocean + Railway
**Frontend + Backend**: Digital Ocean App Platform  
**Database**: Railway PostgreSQL  
**Email**: SendGrid ou Mailgun  

**Vantagens**:
- ✅ Controlo total
- ✅ Preços previsíveis
- ✅ Performance consistente

**Preços**:
- Digital Ocean: €12-25/mês
- Railway: €5-20/mês
- SendGrid: €0-15/mês

### 🏢 Opção 4: Soluções Enterprise
**AWS**: EC2 + RDS + SES  
**Azure**: App Service + SQL Database + Communication Services  
**Google Cloud**: Cloud Run + Cloud SQL + SendGrid  

**Recomendado para**:
- Grandes volumes de dados
- Requisitos específicos de compliance
- Integração com outros sistemas corporativos

---

## Considerações de Segurança

### Implementadas
- ✅ Row Level Security (RLS) no Supabase
- ✅ Autenticação segura com tokens JWT
- ✅ Middleware de proteção de rotas
- ✅ Validação de dados com Zod
- ✅ Cookies HTTP-only
- ✅ HTTPS obrigatório em produção
- ✅ Tokens UUID para aprovações

### Recomendações Adicionais
- 🔒 Implementar rate limiting
- 🔒 Monitorização de registos de segurança
- 🔒 Cópia de segurança automática da base de dados
- 🔒 Auditoria regular de dependências
- 🔒 Certificados SSL/TLS actualizados

---

## Suporte e Manutenção

### Monitorização
- **Logs**: Supabase Dashboard + Vercel Analytics
- **Performance**: Web Vitals + Lighthouse
- **Uptime**: Pingdom ou similar
- **Errors**: Sentry (recomendado)

### Cópias de Segurança
- **Base de Dados**: Cópia automática Supabase
- **Código**: Git + GitHub
- **Recursos**: CDN com controlo de versões

### Actualizações
- **Dependências**: Renovação mensal
- **Segurança**: Correções imediatas
- **Funcionalidades**: Versões quinzenais

---

## Conclusão

O Sistema de Gestão de Fichas de Serviço (Priservice) é uma solução moderna, segura e escalável construída com as melhores tecnologias disponíveis. A arquitectura baseada em Next.js 15 + Supabase oferece:

- **Performance**: Renderização optimizada e CDN global
- **Segurança**: Autenticação robusta e protecção de dados
- **Escalabilidade**: Crescimento automático conforme necessário
- **Manutenibilidade**: Código limpo e bem documentado
- **Experiência do Utilizador**: Interface moderna e responsiva

Com os custos iniciais baixos e possibilidade de escalar conforme necessário, esta solução é ideal tanto para pequenas empresas quanto para organizações maiores que necessitam de um sistema profissional de gestão de fichas de serviço.