# Como executar o script popularComRoot.js

## ❌ Erro atual: Conexão com banco de dados recusada

O script está tentando conectar ao MySQL mas a conexão foi recusada. Aqui estão as soluções:

## Opção 1: Usar Docker (Recomendado)

1. **Iniciar Docker Desktop**
   - Abra o Docker Desktop manualmente
   - Aguarde até que esteja totalmente carregado (ícone na barra de tarefas fica azul)

2. **Iniciar o banco de dados**
   ```powershell
   docker-compose up -d sistema-npj-db-1
   ```

3. **Executar o script**
   ```powershell
   node backend\popularComRoot.js
   ```

## Opção 2: Usar XAMPP/WAMP

1. **Instalar XAMPP**
   - Baixar: https://www.apachefriends.org/download.html
   - Instalar e iniciar Apache + MySQL

2. **Criar banco de dados**
   - Acesse: http://localhost/phpmyadmin
   - Crie um banco chamado `npjdatabase`

3. **Executar com configuração XAMPP**
   ```powershell
   $env:DB_MODE="xampp"; node backend\popularComRootFixed.js
   ```

## Opção 3: Instalar MySQL manualmente

1. **Baixar MySQL**
   - Baixar: https://dev.mysql.com/downloads/installer/
   - Instalar com senha: `12345678@`

2. **Criar banco**
   ```sql
   CREATE DATABASE npjdatabase;
   ```

3. **Executar script**
   ```powershell
   node backend\popularComRoot.js
   ```

## ✅ Scripts disponíveis

- `popularComRoot.js` - Script original (corrigido)
- `popularComRootFixed.js` - Script com múltiplas configurações

## 🔧 Características corrigidas

- ✅ Encoding do ENUM 'Físico' corrigido
- ✅ Melhor tratamento de erros
- ✅ Suporte a múltiplas configurações de banco
- ✅ Sincronização automática de tabelas
- ✅ Mensagens de erro mais claras

## 🔑 Credenciais após execução

- **Admin**: admin@teste.com / admin123
- **Professor**: joao@teste.com / joao123  
- **Aluno**: maria@teste.com / maria123
