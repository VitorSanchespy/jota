# 🏛️ NPJ UFMT - Sistema de Gerenciamento de Processos Jurídicos

## Dois Protótipos Funcionais

Este repositório contém dois protótipos funcionais para o sistema de gerenciamento de processos jurídicos do Núcleo de Prática Jurídica da UFMT:

### 📋 Protótipo 1 - Estado Atual (npj-current)
Sistema baseado no estado atual, mantendo todas as funcionalidades essenciais:

**Funcionalidades:**
- ✅ Autenticação JWT com refresh tokens
- ✅ CRUD completo de usuários com roles (Admin, Professor, Aluno)
- ✅ CRUD completo de processos jurídicos
- ✅ Sistema de agendamentos
- ✅ Upload e gerenciamento de arquivos
- ✅ Dashboard com estatísticas básicas
- ✅ Interface responsiva (React 18 + TailwindCSS + Mantine)
- ✅ Sistema de notificações básicas
- ✅ WebSocket para atualizações em tempo real

**Tecnologias:**
- **Backend**: Node.js + Express + Sequelize + Socket.io
- **Frontend**: React 18 + Vite + TailwindCSS + Mantine
- **Banco**: MySQL 8.0
- **Containerização**: Docker + Docker Compose

### 🚀 Protótipo 2 - Versão Profissional (npj-professional)
Sistema completo com funcionalidades profissionais avançadas:

**Funcionalidades Avançadas:**
- 🔔 **Sistema de Notificações Avançado**
  - Notificações em tempo real via WebSocket
  - Notificações por email (SMTP)
  - Centro de notificações no sistema
  - Configurações personalizáveis por usuário

- 📅 **Agendamento Avançado**
  - Integração com Google Calendar/Outlook
  - Lembretes automáticos
  - Agendamento recorrente
  - Detecção de conflitos de horário
  - Sugestões de horários alternativos

- 📊 **Dashboard Analytics**
  - Gráficos e métricas avançadas
  - Relatórios exportáveis (PDF/Excel/CSV)
  - KPIs e indicadores de performance
  - Filtros temporais e por usuário
  - Comparação entre períodos

- 🔐 **Sistema de Permissões Granular**
  - Permissões por módulo
  - Grupos de usuários customizáveis
  - Auditoria completa de ações
  - Controle de acesso por processo
  - Hierarquia de papéis avançada

- 📚 **Histórico e Auditoria**
  - Log estruturado de todas as ações (Winston)
  - Versionamento de documentos
  - Timeline detalhada de processos
  - Sistema de backup automático

- 💬 **Chat Interno**
  - Chat em tempo real entre usuários
  - Salas de chat por processo
  - Chat privado entre usuários
  - Histórico de mensagens
  - Indicadores de usuários online

- ⚡ **Performance e Cache**
  - Cache Redis para performance otimizada
  - Rate limiting inteligente
  - Compressão de responses
  - Connection pooling

**Tecnologias Avançadas:**
- **Backend**: Node.js + Express + Sequelize + Socket.io + Redis + Winston
- **Frontend**: React 18 + TypeScript + Material-UI + React Query + Charts.js
- **Banco**: MySQL 8.0 com migrations completas
- **Cache**: Redis 7
- **API**: Swagger/OpenAPI 3.0 completo
- **Testes**: Jest (backend) + Cypress (E2E)
- **Logging**: Winston com logs estruturados
- **Integração**: Google Calendar, Microsoft Outlook

## 🚀 Execução Rápida

### NPJ Current (Estado Atual)
```bash
cd npj-current
docker compose up -d
```
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001
- **MySQL**: localhost:3306

### NPJ Professional (Versão Profissional)
```bash
cd npj-professional
docker compose up -d
```
- **Frontend**: http://localhost:5174
- **Backend**: http://localhost:3002
- **API Docs**: http://localhost:3002/api-docs
- **MySQL**: localhost:3307
- **Redis**: localhost:6379

## 📁 Estrutura do Projeto

```
jota/
├── sys-npj-1/              # Sistema original
├── npj-current/            # Protótipo 1 - Estado Atual
│   ├── backend/            # API Node.js + Express
│   ├── frontend/           # React 18 + Vite
│   ├── db/                 # Scripts SQL
│   └── docker-compose.yml
├── npj-professional/       # Protótipo 2 - Versão Profissional
│   ├── backend/            # API avançada com Redis
│   │   ├── services/       # Serviços avançados
│   │   ├── routes/         # Rotas da API
│   │   ├── middleware/     # Middlewares
│   │   └── config/         # Configurações
│   ├── frontend/           # React 18 + TypeScript + Material-UI
│   ├── db/                 # Scripts SQL
│   └── docker-compose.yml
└── README.md               # Este arquivo
```

## 🛠️ Desenvolvimento

### Pré-requisitos
- Docker e Docker Compose
- Node.js 20+ (para desenvolvimento local)
- MySQL 8.0 (se executar localmente)
- Redis 7+ (apenas para npj-professional)

### Desenvolvimento Local

#### NPJ Current
```bash
cd npj-current

# Backend
cd backend
npm install
npm run dev    # Porta 3001

# Frontend
cd frontend
npm install
npm run dev    # Porta 5173
```

#### NPJ Professional
```bash
cd npj-professional

# Backend
cd backend
npm install
npm run dev    # Porta 3002

# Frontend
cd frontend
npm install
npm run dev    # Porta 5174
```

### Configuração de Ambiente

Copie os arquivos `.env.example` para `.env` e configure:

```bash
# NPJ Current
cp npj-current/.env.example npj-current/.env

# NPJ Professional
cp npj-professional/.env.example npj-professional/.env
```

## 🧪 Testes

### NPJ Current
```bash
cd npj-current
docker exec npj-current-backend npm test
```

### NPJ Professional
```bash
cd npj-professional

# Testes unitários
docker exec npj-professional-backend npm test

# Testes de integração
docker exec npj-professional-backend npm run test:integration

# Coverage
docker exec npj-professional-backend npm run test:coverage

# E2E com Cypress
npm run test:e2e
```

## 📖 Documentação da API

### NPJ Current
- Swagger básico disponível em: http://localhost:3001/api-docs

### NPJ Professional
- **Swagger UI**: http://localhost:3002/api-docs
- **OpenAPI Spec**: http://localhost:3002/api-docs.json
- Documentação completa com exemplos e schemas

## 🔧 Funcionalidades por Protótipo

| Funcionalidade | NPJ Current | NPJ Professional |
|---------------|-------------|------------------|
| Autenticação JWT | ✅ | ✅ |
| CRUD Usuários | ✅ | ✅ |
| CRUD Processos | ✅ | ✅ |
| Agendamentos | ✅ Básico | ✅ Avançado |
| Upload Arquivos | ✅ | ✅ + Versionamento |
| Dashboard | ✅ Básico | ✅ Analytics |
| Notificações | ✅ Básicas | ✅ Avançadas |
| WebSocket | ✅ | ✅ + Chat |
| Rate Limiting | ✅ | ✅ Inteligente |
| Cache | ❌ | ✅ Redis |
| Logs | ✅ Básico | ✅ Estruturado |
| API Docs | ✅ Básico | ✅ Completo |
| Testes | ✅ Básico | ✅ Completo |
| Permissões | ✅ Roles | ✅ Granular |
| Auditoria | ✅ Básica | ✅ Completa |
| Chat Interno | ❌ | ✅ |
| Integração Calendário | ❌ | ✅ |
| Relatórios | ❌ | ✅ Exportáveis |
| Performance | ✅ Básica | ✅ Otimizada |

## 🚀 Produção

### Deployment
Ambos os protótipos estão prontos para produção com Docker:

```bash
# NPJ Current
cd npj-current
docker compose up -d --build

# NPJ Professional
cd npj-professional
docker compose up -d --build
```

### Backup
NPJ Professional inclui sistema de backup automático configurável.

### Monitoring
NPJ Professional inclui logs estruturados e métricas de performance.

## 🤝 Contribuição

1. Clone o repositório
2. Escolha o protótipo para trabalhar
3. Faça suas alterações
4. Teste localmente
5. Submeta um Pull Request

## 📄 Licença

MIT License - Núcleo de Prática Jurídica UFMT

## 📞 Suporte

Para dúvidas e suporte:
- NPJ UFMT: npj@ufmt.br
- Documentação: Consulte os README.md específicos de cada protótipo

---

**Nota**: Este sistema foi desenvolvido especificamente para o Núcleo de Prática Jurídica da UFMT, mas pode ser adaptado para outras instituições educacionais ou escritórios jurídicos.