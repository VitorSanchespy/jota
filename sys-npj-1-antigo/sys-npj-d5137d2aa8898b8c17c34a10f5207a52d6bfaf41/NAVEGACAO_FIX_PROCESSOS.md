# Fix: Problema de Navegação - Lista de Processos

## Problema Identificado

Quando o usuário fazia login pela primeira vez, o dashboard funcionava normalmente e todas as páginas carregavam corretamente. Porém, ao navegar pela sidebar (de cima para baixo até "Meu Perfil" e depois voltar de baixo para cima página por página), quando chegava na página de processos (`http://localhost:5173/processos`), a página não recebia o fetch novamente com os processos.

## Causa Raiz

O problema estava no gerenciamento de estado do React e na configuração dos `useEffect` no componente `ProcessListPage.jsx`:

1. **Cache do React Router**: O React Router mantém componentes em cache para otimizar performance
2. **Dependências do useEffect**: Os `useEffect` só executavam quando suas dependências mudavam (`user?.role`, `token`, `debouncedSearch`, `showMyProcesses`)
3. **Estado persistente**: Quando o usuário navegava de volta para a página, as dependências permaneciam iguais, então o `fetchProcessos` não era executado novamente

## Solução Implementada

### 1. Adicionada Ref para Rastreamento
```javascript
const hasLoadedOnce = useRef(false); // Ref para rastrear se já carregou uma vez
```

### 2. useEffect para Navegação de Volta
```javascript
// Força recarregamento sempre que o componente for remontado (navegação)
useEffect(() => {
  if (user?.role && token) {
    // Se já carregou uma vez, é uma navegação de volta - força refresh
    if (hasLoadedOnce.current) {
      console.log('ProcessListPage: Navegação de volta detectada - forçando refresh');
      fetchProcessos(searchTerm || "", showMyProcesses);
    }
    hasLoadedOnce.current = true;
  }

  // Listener para detectar quando a página ganha foco (volta de outra aba/página)
  const handleFocus = () => {
    if (user?.role && token && hasLoadedOnce.current) {
      console.log('ProcessListPage: Página ganhou foco - forçando refresh');
      fetchProcessos(searchTerm || "", showMyProcesses);
    }
  };

  window.addEventListener('focus', handleFocus);
  
  return () => {
    window.removeEventListener('focus', handleFocus);
  };
}, []); // Sem dependências - executa sempre que o componente é montado
```

### 3. Logs para Debug
Adicionados logs console para facilitar o debug e entender quando cada carregamento acontece:
- `ProcessListPage: Carregamento inicial`
- `ProcessListPage: Navegação de volta detectada - forçando refresh`
- `ProcessListPage: Página ganhou foco - forçando refresh`
- `ProcessListPage: Busca com debounce`

## Como Funciona Agora

1. **Primeiro acesso**: Carregamento normal via `useEffect` com dependências
2. **Navegação de volta**: Detecta que já carregou uma vez e força um novo `fetchProcessos`
3. **Foco da página**: Se o usuário trocar de aba e voltar, também força refresh
4. **Busca e filtros**: Continuam funcionando normalmente com debounce

## Benefícios

- ✅ Dados sempre atualizados ao navegar de volta para a página
- ✅ Mantém funcionalidade de busca e filtros
- ✅ Performance preservada (não carrega desnecessariamente)
- ✅ Compatível com cache do React Router
- ✅ Logs para debug e monitoramento

## Arquivos Modificados

- `frontend/src/pages/dashboard/ProcessListPage.jsx`

## Como Testar

1. Faça login no sistema
2. Navegue pelo dashboard e outras páginas
3. Vá para "Meu Perfil" (última da sidebar)
4. Volte navegando página por página até chegar em "Processos"
5. Verifique se os dados carregam corretamente
6. Abra o console do navegador para ver os logs de debug

## Próximos Passos

Se o mesmo problema ocorrer em outras páginas, a mesma solução pode ser aplicada:
- `DashboardSummary.jsx`
- `ArquivosPage.jsx`
- Outras páginas de listagem

A implementação é genérica e pode ser reutilizada em outros componentes que enfrentam problemas similares de navegação.
