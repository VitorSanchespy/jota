import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useProcessos } from "@/hooks/useApi.jsx";
import { useDebounce } from "@/hooks/useDebounce";
import OptimizedTable from "@/components/common/OptimizedTable";
import Button from "@/components/common/Button";
import StatusBadge from "@/components/common/StatusBadge";
import Loader from "@/components/layout/Loader";
import { getUserRole, canCreateProcess, formatDate, renderValue } from "@/utils/commonUtils";

export default function ProcessListPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [showMyProcesses, setShowMyProcesses] = useState(() => getUserRole(user) === "Aluno");
  
  // Debounce da busca para evitar muitas requisições
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  // Hook com cache inteligente
  const { 
    data: processos = [], 
    isLoading, 
    error, 
    refetch 
  } = useProcessos(debouncedSearch, showMyProcesses);

  // Definir colunas da tabela otimizada
  const columns = useMemo(() => [
    {
      key: 'numero_processo',
      label: 'Número do Processo',
      render: (value, row) => (
        <Button
          variant="link"
          onClick={() => navigate(`/processos/${row.id}`)}
          style={{
            color: '#007bff',
            background: 'none',
            border: 'none',
            padding: 0,
            fontSize: '0.95rem',
            fontWeight: 'bold',
            textDecoration: 'underline',
            boxShadow: 'none'
          }}
        >
          {value || row.numero || "-"}
        </Button>
      )
    },
    {
      key: 'descricao',
      label: 'Descrição',
      render: (value) => renderValue(value)
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'assistido',
      label: 'Assistido',
      render: (value) => renderValue(value)
    },
    {
      key: 'updatedAt',
      label: 'Última Atualização',
      render: (value, row) => formatDate(value || row.criado_em)
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (_, row) => (
        <Button
          variant="success"
          onClick={() => navigate(`/processos/${row.id}`)}
          style={{
            padding: '8px 16px',
            fontSize: '0.85rem'
          }}
        >
          👁️ Ver Detalhes
        </Button>
      )
    }
  ], [navigate]);

  if (!user) {
    return <Loader message="Verificando autenticação" />;
  }
  
  if (error) return <Loader error={error} />;

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e9ecef',
      marginBottom: '24px'
    }}>
      <h1 style={{ 
        margin: 0, 
        fontSize: '24px', 
        fontWeight: '600',
        color: '#212529'
      }}>
        Lista de Processos
      </h1>
      <p style={{ 
        margin: '8px 0 0 0', 
        fontSize: '14px', 
        color: '#6c757d' 
      }}>
        Gerencie todos os processos do sistema
      </p>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', margin: '20px 0' }}>
        {/* Toggle meus processos */}
        {getUserRole(user) !== "Aluno" && (
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            fontSize: '14px',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={showMyProcesses}
              onChange={() => setShowMyProcesses(!showMyProcesses)}
              style={{ transform: 'scale(1.1)' }}
            />
            Apenas meus processos
          </label>
        )}
        {/* Botão novo processo */}
        {canCreateProcess(user) && (
          <Button
            variant="success"
            onClick={() => navigate('/processos/novo')}
            style={{
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            ➕ Novo Processo
          </Button>
        )}
      </div>
      {/* Tabela de processos */}
      <OptimizedTable
        data={processos}
        columns={columns}
        searchableColumns={['numero_processo', 'numero', 'descricao', 'assistido']}
        sortableColumns={['numero_processo', 'descricao', 'status', 'assistido', 'updatedAt']}
        onRowClick={(row) => navigate(`/processos/${row.id}`)}
        loading={isLoading}
        emptyMessage="Nenhum processo encontrado"
        itemsPerPage={10}
      />
    </div>
  );
}
