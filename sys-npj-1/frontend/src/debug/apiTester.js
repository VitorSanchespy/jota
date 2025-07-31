import { apiRequest } from '../api/apiRequest.js';
import { useAuthContext } from '../contexts/AuthContext';

// Script para testar as APIs diretamente
export async function testApiEndpoints() {
  console.log('🧪 Iniciando testes de API...');
  
  // Obter token do localStorage diretamente
  const token = localStorage.getItem('token');
  console.log('Token disponível:', !!token);
  
  const tests = [
    {
      name: 'Processos Gerais',
      endpoint: '/api/processos',
      description: 'Lista todos os processos'
    },
    {
      name: 'Meus Processos',
      endpoint: '/api/processos/meus-processos', 
      description: 'Processos do usuário logado'
    },
    {
      name: 'Usuários (Página)',
      endpoint: '/api/usuarios/pagina',
      description: 'Lista usuários paginada'
    },
    {
      name: 'Usuários',
      endpoint: '/api/usuarios',
      description: 'Lista todos os usuários'
    },
    {
      name: 'Alunos',
      endpoint: '/api/usuarios/alunos',
      description: 'Lista apenas alunos'
    },
    {
      name: 'Atualizações',
      endpoint: '/api/atualizacoes?limite=5',
      description: 'Últimas 5 atualizações'
    }
  ];

  const results = [];

  for (const test of tests) {
    try {
      console.log(`\n🔄 Testando: ${test.name}`);
      console.log(`📡 Endpoint: ${test.endpoint}`);
      
      const startTime = Date.now();
      const data = await apiRequest(test.endpoint, { token });
      const endTime = Date.now();
      
      results.push({
        ...test,
        status: 'success',
        responseTime: endTime - startTime,
        dataLength: Array.isArray(data) ? data.length : (data ? Object.keys(data).length : 0),
        data: data
      });
      
      console.log(`✅ ${test.name}: OK (${endTime - startTime}ms)`);
      console.log(`📊 Dados retornados:`, Array.isArray(data) ? `${data.length} itens` : typeof data);
      
    } catch (error) {
      results.push({
        ...test,
        status: 'error',
        error: error.message
      });
      
      console.error(`❌ ${test.name}: ERRO`);
      console.error(`🐛 Detalhes:`, error.message);
    }
  }

  console.log('\n📊 RESUMO DOS TESTES:');
  console.table(results.map(r => ({
    Endpoint: r.name,
    Status: r.status,
    'Tempo (ms)': r.responseTime || 'N/A',
    'Dados': r.dataLength || 'N/A',
    Erro: r.error || 'N/A'
  })));

  return results;
}

// Função para chamar no console do navegador
window.testApis = testApiEndpoints;
