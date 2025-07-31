# sistema-npj
Sistema de gerenciamentos de processos do NPJ/CUA
Backend API para gerenciamento de processos, alunos e professores.

### Pré-requisitos
- Node.js (v18+)
- MySQL/PostgreSQL
- npm ou yarn

### 🔧 Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/seu-projeto.git

TODO:
-Colocar Caminho Absoluto com Path.
# Segurança
-JWT
-CORS mais Restritivo.
-Sanitização de Inputs.
-Headers de Segurança com Helmet.
-Aprimorar o Rate Limiting.
-Proteção contra DoS.
# att
CRUD completo: Processos, atendimentos, arquivos, usuários (algumas páginas existem, mas não há garantia de implementação dos formulários e integrações)
Detalhe de entidades: Por exemplo, página de detalhes do processo (/processos/:id) está comentada e pode não estar implementada
Upload de documentos: Não há referência clara a componentes ou fluxos de upload de arquivos
Controle avançado de permissões: Há roles definidas, mas não está explícito o uso prático no frontend (ex: menus, botões desabilitados conforme o papel do usuário)
Gestão de atendimentos: Não há rotas ou páginas explícitas para agendamento ou registro de atendimentos jurídicos
Relatórios e exportação de dados: Não há referência a telas ou componentes para geração de relatórios (PDF/CSV)
Notificações internas/avisos: Apenas notificações globais, mas não avisos relacionados a eventos de processos/atendimentos
Configuração de perfil avançada: Página de perfil existe, mas não se sabe se cobre todas as opções (troca de senha, foto, etc.)
Gestão de alunos/estagiários/professores: Existem rotas de usuários, mas não se sabe se há funções específicas para cada papel
Fluxos administrativos: Ex: liberação de novos usuários, redefinição de senha, aprovação de documentos, etc.
