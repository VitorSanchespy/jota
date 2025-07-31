# Documentação dos Endpoints Backend - Sistema NPJ

> Todos os endpoints `/api/*` (exceto login/registro) requerem autenticação JWT via header:  
> `Authorization: Bearer <token>`

---

## 1. Autenticação

### Registrar novo usuário
`POST /auth/registrar`

**Body:**
```json
{
  "nome": "João Silva",
  "email": "joao@exemplo.com",
  "senha": "senha123",
  "role_id": 2
}
```

**Response:**
```json
{ "id": 1 }
```

---

### Login
`POST /auth/login`

**Body:**
```json
{
  "email": "joao@exemplo.com",
  "senha": "senha123"
}
```

**Response:**
```json
{
  "token": "JWT_TOKEN",
  "usuario": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@exemplo.com",
    "role": "Aluno"
  }
}
```

---

### Perfil do usuário logado
`GET /auth/perfil`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": 1,
  "nome": "João Silva",
  "email": "joao@exemplo.com",
  "role": "Aluno"
}
```

---

### Recuperação de senha (fluxo resumido)
- Solicitar: `POST /auth/solicitar-recuperacao` `{ "email": "user@email.com" }`
- Redefinir: `POST /auth/redefinir-senha` `{ "token": "...", "senha": "novaSenha" }`

---

## 2. Processos

> Todos os endpoints abaixo: `/api/processos` e sub-rotas.  
> **Necessário JWT.**

### Criar processo
`POST /api/processos`

**Body:**
```json
{
  "numero_processo": "PROC003",
  "descricao": "Novo processo de atendimento"
}
```

**Response:**
```json
{ "id": 3 }
```

---

### Listar processos
`GET /api/processos`

**Response:**
```json
[
  {
    "id": 1,
    "numero_processo": "PROC001",
    "descricao": "Processo sobre atendimento juridico civil",
    "total_alunos": 1,
    "ultima_atualizacao": "2025-07-14T11:00:00Z"
  },
  ...
]
```

---

### Buscar processos com filtros
`GET /api/processos/buscar?numero_processo=PROC001&pagina=1&porPagina=10`

---

### Buscar por ID
`GET /api/processos/:id`

**Response:**
```json
{
  "id": 1,
  "numero_processo": "PROC001",
  "descricao": "Processo sobre atendimento juridico civil",
  "total_alunos": 1
}
```

---

### Atualizar processo
`PUT /api/processos/:id`

**Body:**
```json
{
  "numero_processo": "PROC001",
  "descricao": "Descrição atualizada"
}
```
**Response:** 200 OK

---

### Deletar processo
`DELETE /api/processos/:id`
**Response:** 204 No Content

---

### Listar processos do usuário logado (aluno)
`GET /api/processos/meus-processos`

---

### Atribuir aluno a processo
`POST /api/processos/atribuir-aluno`

**Body:**
```json
{
  "processo_id": 1,
  "usuario_id": 2
}
```
**Response:** 200 OK

---

### Remover aluno de processo
`DELETE /api/processos/remover-aluno`

**Body:**
```json
{
  "processo_id": 1,
  "usuario_id": 2
}
```
**Response:** 200 OK

---

### Listar alunos vinculados a um processo
`GET /api/processos/:processo_id/alunos`

**Response:**
```json
[
  {
    "aluno_id": 2,
    "aluno_nome": "João Silva",
    "aluno_email": "joao@exemplo.com",
    "data_atribuicao": "2025-07-13T12:00:00Z"
  }
]
```

---

### Adicionar atualização ao processo
`POST /api/processos/:processo_id/atualizacoes`

**Body:**
```json
{
  "usuario_id": 2,
  "descricao": "Nova atualização do processo"
}
```
**Response:** `{ "id": 5 }`

---

### Listar atualizações de um processo
`GET /api/processos/:processo_id/atualizacoes`

**Response:**
```json
[
  {
    "id": 1,
    "descricao": "Contato inicial com o cliente",
    "usuario_nome": "João Silva",
    "data_atualizacao": "2025-07-12T10:00:00Z"
  }
]
```

---

## 3. Arquivos

> Prefixo: `/api/arquivos`

### Upload de arquivo
`POST /api/arquivos/upload`

**FormData:**  
- `nome`
- `file` (arquivo)
- `processo_id`
- `usuario_id`
- (os demais campos normalmente são preenchidos pelo backend)

**Response:**  
```json
{ "id": 1 }
```

---

### Listar arquivos de um processo
`GET /api/arquivos/processo/:processo_id`

**Response:**
```json
[
  {
    "id": 1,
    "nome": "documento.pdf",
    "caminho": "/uploads/documento.pdf",
    "tamanho": 123456,
    "tipo": "application/pdf",
    "processo_id": 1,
    "usuario_id": 2,
    "criado_em": "2025-07-14T10:50:00Z"
  }
]
```

---

## 4. Usuários

> Prefixo: `/api/usuarios`  
> **Necessário JWT e role adequada (ver abaixo).**

### Listar todos usuários (apenas Admin)
`GET /api/usuarios`

**Response:**
```json
[
  {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@exemplo.com",
    "criado_em": "2025-07-14T10:00:00Z",
    "role": "Aluno"
  }
]
```

---

### Listar todos alunos (Professor/Admin)
`GET /api/usuarios/alunos`

---

### Buscar usuário por ID
`GET /api/usuarios/:id`

---

### Atualizar usuário
`PUT /api/usuarios/:id`

**Body:**  
```json
{ "nome": "João Silva", "email": "joao@exemplo.com", "role_id": 2 }
```

---

### Atualizar senha
`PUT /api/usuarios/:id/senha`

**Body:**  
```json
{ "senha": "novaSenha" }
```

---

### Deletar usuário (soft delete, Professor/Admin)
`DELETE /api/usuarios/:id`

---

### Reativar usuário (Admin)
`PUT /api/usuarios/:id/reativar`

---

### Listar alunos para atribuição (Professor)
`GET /api/usuarios/alunos/para-atribuicao`

---

## 5. Observações Gerais

- **Autenticação:** JWT em todas as rotas protegidas.
- **Roles:**  
  - `Admin` pode tudo
  - `Professor` pode operar sobre alunos/processos
  - `Aluno` só vê/processa seus próprios processos
- **Soft delete** em usuários (campo `ativo`)
- **Uploads:** `POST /api/arquivos/upload` espera multipart/form-data

---

## 6. Status HTTP comuns

- 200 OK: sucesso
- 201 Created: recurso criado
- 204 No Content: deletado com sucesso
- 400/422: erro de validação
- 401: não autenticado
- 403: não autorizado
- 404: não encontrado

---
