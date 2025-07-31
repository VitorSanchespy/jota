# Esquematização do Projeto

## **Fluxograma Atual**

### **Backend**
1. **Rotas**
   - `/api/auth`
   - `/api/aux`
   - `/api/processos`
   - `/api/usuarios`
2. **Controllers**
   - `authController.js`: Gerencia autenticação e autorização.
   - `auxTablesController.js`: Manipula tabelas auxiliares.
   - `processesController.js`: Gerencia processos.
   - `usersControllers.js`: Gerencia usuários.
3. **Modelos**
   - `Usuario.js`: Representa usuários.
   - `Processo.js`: Representa processos.
   - `Atualizacao.js`: Representa atualizações de processos.
4. **Middleware**
   - `authMiddleware.js`: Valida autenticação.
   - `roleMiddleware.js`: Valida permissões.
5. **Banco de Dados**
   - Migrations e Seeders para popular tabelas.

### **Frontend**
1. **Páginas**
   - `ProcessListPage.jsx`: Lista processos.
   - `ProcessFormPage.jsx`: Formulário para criar/editar processos.
2. **Componentes**
   - `ProcessCreateModal.jsx`: Modal para criar processos.
   - `FileList.jsx`: Lista de arquivos.
3. **API**
   - Comunicação com o backend via `apiRequest.js`.

---

## **Fluxograma Refinado**

### **Backend**
1. **Rotas**
   - Organizadas por módulos (ex.: `/api/auth`, `/api/aux`, `/api/processos`).
   - Melhor tratamento de erros e validação.
2. **Controllers**
   - Refatorados para maior legibilidade e modularidade.
   - Adição de logs detalhados e centralização de lógica repetitiva.
3. **Modelos**
   - Revisados para garantir consistência com o banco de dados.
   - Adição de métodos utilitários (ex.: `findById`, `updateStatus`).
4. **Middleware**
   - Centralização de autenticação e validação.
   - Melhor organização e reutilização.
5. **Banco de Dados**
   - Migrations e Seeders revisados e otimizados.

### **Frontend**
1. **Páginas**
   - Melhor responsividade e design.
   - Adição de feedback visual para ações do usuário.
2. **Componentes**
   - Modularizados e reutilizáveis.
   - Melhor integração com o backend.
3. **API**
   - Centralização de chamadas em um serviço único.
   - Melhor tratamento de erros e loading.

---

## **Objetivo Final**

- **Backend**: Código limpo, modular e eficiente.
- **Frontend**: Interface responsiva, intuitiva e com melhor experiência do usuário.
- **Banco de Dados**: Estrutura consistente e otimizada.
## Intens Faltantes


- implementar um home para usuarios não logados serem direcionados
- about para explicar o sistema
- Testar notificação()
- Testar agendamento()
- Testar Envio de e-mail()
- Implementar o dashboard funcional
Este documento serve como guia para entender a estrutura atual e o objetivo final do projeto após o refinamento.
