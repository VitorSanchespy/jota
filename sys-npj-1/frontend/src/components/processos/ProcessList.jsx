import React, { useEffect, useState, useCallback, useRef } from "react";
import { processService } from "../../api/services";
import { useAuthContext } from "../../contexts/AuthContext";
import { Link } from "react-router-dom";
import CreateProcessModal from "@/components/processos/ProcessCreateModal";

// Helper para verificar role
const getUserRole = (user) => {
  if (!user) return null;
  
  if (typeof user.role === 'string') {
    return user.role;
  }
  
  if (user.role && typeof user.role === 'object') {
    return user.role.nome || user.role.name || null;
  }
  
  if (user.role_id === 1) return 'Admin';
  if (user.role_id === 2) return 'Aluno';
  if (user.role_id === 3) return 'Professor';
  
  return null;
};

export function ProcessList() {
  const { token, user } = useAuthContext();
  const [processos, setProcessos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceTimeout = useRef();
  const [showMyProcesses, setShowMyProcesses] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchProcessos = useCallback(async (search = "", myProcesses = false) => {
    const userRole = getUserRole(user);
    if (!token || !userRole) {
      console.log("fetchProcessos: token ou user não disponível", { token: !!token, userRole });
      return;
    }
    
    console.log("fetchProcessos iniciado:", { search, myProcesses, userRole });
    setLoading(true);
    setError("");
    try {
      let data = [];
      
      if (userRole === "Aluno") {
        console.log("Buscando processos para Aluno");
        // Alunos sempre veem apenas seus processos (mesmo durante pesquisa)
        data = await processService.getMyProcesses(token);
      } else if (userRole === "Professor") {
        if (search.trim()) {
          console.log("Professor pesquisando - buscando todos os processos");
          // Professor pesquisando: buscar em TODOS os processos
          data = await processService.getAllProcesses(token);
        } else if (myProcesses) {
          console.log("Professor vendo meus processos");
          // Professor quer ver apenas seus processos vinculados
          data = await processService.getMyProcesses(token);
        } else {
          console.log("Professor vendo processos recentes");
          // Professor quer ver processos recentes (últimos 4)
          const allProcesses = await processService.getAllProcesses(token);
          // Ordenar por data de atualização mais recente e pegar os 4 primeiros
          data = allProcesses
            .sort((a, b) => new Date(b.updatedAt || b.criado_em) - new Date(a.updatedAt || a.criado_em))
            .slice(0, 4);
        }
      } else if (userRole === "Admin") {
        if (myProcesses) {
          data = await processService.getMyProcesses(token);
        } else {
          data = await processService.getAllProcesses(token);
        }
      }

      // Filtrar por termo de busca se fornecido (busca por número do processo)
      if (search.trim()) {
        console.log("Filtrando por termo de busca:", search);
        data = data.filter(proc => 
          proc.numero_processo && proc.numero_processo.toLowerCase().includes(search.toLowerCase())
        );
      }

      console.log("fetchProcessos concluído:", data);
      setProcessos(data);
    } catch (err) {
      console.error("Erro ao buscar processos:", err);
      setProcessos([]);
      setError("Erro ao carregar processos.");
    }
    setLoading(false);
  }, [token, user]);

  // Carregamento inicial quando user e token estão disponíveis
  useEffect(() => {
    const userRole = getUserRole(user);
    console.log("useEffect inicial:", { userRole, token: !!token });
    if (userRole && token) {
      // Para alunos, sempre mostrar apenas seus processos
      if (userRole === "Aluno") {
        setShowMyProcesses(true);
      }
      fetchProcessos("", showMyProcesses);
    }
  }, [user, token, fetchProcessos]);

  // Debounce para searchTerm
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400); // 400ms
    return () => clearTimeout(debounceTimeout.current);
  }, [searchTerm]);

  // Efeito para busca em tempo real (agora usando debouncedSearch)
  useEffect(() => {
    const userRole = getUserRole(user);
    if (userRole && token) {
      fetchProcessos(debouncedSearch, showMyProcesses);
    }
  }, [debouncedSearch, showMyProcesses, fetchProcessos, user, token]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const handleMyProcessesToggle = () => {
    if (getUserRole(user) !== "Aluno") { // Alunos não podem alternar
      const newValue = !showMyProcesses;
      setShowMyProcesses(newValue);
    }
  };

  if (!token || !user) {
    return <div style={{ padding: 20 }}>Carregando...</div>;
  }

  if (loading) return <div style={{ padding: 20 }}>Carregando processos...</div>;
  if (error) return <div style={{ color: "red", padding: 20 }}>{error}</div>;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Processos</h2>
        
        {/* Botão Criar Processo - apenas para Professor e Admin */}
        {(getUserRole(user) === "Professor" || getUserRole(user) === "Admin") && (
          <button 
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: 5,
              cursor: 'pointer'
            }}
          >
            Novo Processo
          </button>
        )}
      </div>

      {/* Campo de Pesquisa */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Pesquisar por número do processo..."
          value={searchTerm}
          onChange={handleSearch}
          style={{
            width: '100%',
            maxWidth: 400,
            padding: '10px 12px',
            border: '1px solid #ddd',
            borderRadius: 5,
            fontSize: 16
          }}
        />
      </div>

      {/* Botão Meus Processos - apenas para Professor e Admin */}
      {(getUserRole(user) === "Professor" || getUserRole(user) === "Admin") && (
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={handleMyProcessesToggle}
            style={{
              padding: '8px 16px',
              backgroundColor: showMyProcesses ? '#28a745' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: 5,
              cursor: 'pointer'
            }}
          >
            {showMyProcesses ? 'Mostrar Todos' : 'Meus Processos'}
          </button>
          
          {!showMyProcesses && getUserRole(user) === "Professor" && (
            <span style={{ marginLeft: 10, fontSize: 14, color: '#666' }}>
              (Mostrando últimos 4 processos atualizados)
            </span>
          )}
        </div>
      )}

      {/* Lista de Processos */}
      {!processos.length ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          {searchTerm ? 'Nenhum processo encontrado para a pesquisa.' : 'Nenhum processo encontrado.'}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: 12, border: '1px solid #ddd', textAlign: 'left' }}>Número</th>
                <th style={{ padding: 12, border: '1px solid #ddd', textAlign: 'left' }}>Descrição</th>
                <th style={{ padding: 12, border: '1px solid #ddd', textAlign: 'left' }}>Status</th>
                <th style={{ padding: 12, border: '1px solid #ddd', textAlign: 'left' }}>Assistido</th>
                <th style={{ padding: 12, border: '1px solid #ddd', textAlign: 'left' }}>Última Atualização</th>
                <th style={{ padding: 12, border: '1px solid #ddd', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {processos.map((proc) => (
                <tr key={proc.id} style={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                  <td style={{ padding: 12, border: '1px solid #ddd' }}>
                    <Link 
                      to={`/processos/${proc.id}`}
                      style={{ color: '#007bff', textDecoration: 'none' }}
                    >
                      {proc.numero_processo || proc.numero || "-"}
                    </Link>
                  </td>
                  <td style={{ padding: 12, border: '1px solid #ddd' }}>
                    {proc.descricao || "-"}
                  </td>
                  <td style={{ padding: 12, border: '1px solid #ddd' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      backgroundColor: proc.status === 'Aberto' ? '#d4edda' : 
                                     proc.status === 'Em andamento' ? '#fff3cd' : '#f8d7da',
                      color: proc.status === 'Aberto' ? '#155724' : 
                             proc.status === 'Em andamento' ? '#856404' : '#721c24'
                    }}>
                      {proc.status || "-"}
                    </span>
                  </td>
                  <td style={{ padding: 12, border: '1px solid #ddd' }}>
                    {proc.assistido || "-"}
                  </td>
                  <td style={{ padding: 12, border: '1px solid #ddd' }}>
                    {proc.updatedAt || proc.criado_em
                      ? new Date(proc.updatedAt || proc.criado_em).toLocaleDateString('pt-BR')
                      : "-"}
                  </td>
                  <td style={{ padding: 12, border: '1px solid #ddd', textAlign: 'center' }}>
                    <Link 
                      to={`/processos/${proc.id}`}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: 4,
                        fontSize: 12
                      }}
                    >
                      Ver Detalhes
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Criação */}
      {showCreateModal && (
        <CreateProcessModal 
          onCreated={() => {
            setShowCreateModal(false);
            fetchProcessos(searchTerm, showMyProcesses);
          }}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}

export default ProcessList;