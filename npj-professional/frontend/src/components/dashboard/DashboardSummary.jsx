import React from "react";
import useApi from '../../hooks/useApi.jsx';
const { getUserRole } = useApi();

// Componentes auxiliares para o dashboard
function StatItem({ label, value, color = "#333", icon = "" }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 24, fontWeight: "bold", color }}>
        {icon && <span style={{ marginRight: 8 }}>{icon}</span>}
        {value}
      </div>
      <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>{label}</div>
    </div>
  );
}

function StatusProgressBar({ label, value, total, color = "#007bff" }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ fontWeight: "bold" }}>{value}</span>
      </div>
      <div style={{ 
        backgroundColor: "#e9ecef", 
        borderRadius: 12, 
        height: 8, 
        overflow: "hidden"
      }}>
        <div style={{
          backgroundColor: color,
          height: "100%",
          width: `${percentage}%`,
          transition: "width 0.5s ease",
          borderRadius: 12
        }}></div>
      </div>
      {total > 0 && (
        <div style={{ fontSize: 10, color: "#666", marginTop: 2, textAlign: "right" }}>
          {percentage.toFixed(1)}%
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "em_andamento": return "#ffc107";
      case "aguardando": return "#fd7e14";
      case "finalizado": return "#28a745";
      case "arquivado": return "#6c757d";
      default: return "#007bff";
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case "em_andamento": return "Em Andamento";
      case "aguardando": return "Aguardando";
      case "finalizado": return "Finalizado";
      case "arquivado": return "Arquivado";
      default: return status || "Não Definido";
    }
  };

  return (
    <span style={{
      backgroundColor: getStatusColor(status),
      color: "white",
      padding: "4px 8px",
      borderRadius: 12,
      fontSize: 11,
      fontWeight: "bold",
      textTransform: "uppercase"
    }}>
      {getStatusLabel(status)}
    </span>
  );
}

function Card({ title, children, color = "#007bff" }) {
  return (
    <div style={{
      backgroundColor: "white",
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
      boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
      border: `3px solid ${color}20`,
      transition: "transform 0.2s ease, box-shadow 0.2s ease",
    }}
    onMouseEnter={(e) => {
      e.target.style.transform = "translateY(-2px)";
      e.target.style.boxShadow = "0 4px 20px rgba(0,0,0,0.12)";
    }}
    onMouseLeave={(e) => {
      e.target.style.transform = "translateY(0)";
      e.target.style.boxShadow = "0 2px 10px rgba(0,0,0,0.08)";
    }}>
      {title && (
        <h3 style={{
          color: color,
          marginBottom: 16,
          fontSize: 16,
          fontWeight: "bold",
          borderBottom: `2px solid ${color}20`,
          paddingBottom: 8
        }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

function PieChart({ data, title }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 20, color: "#666" }}>
        <p>Sem dados para exibir</p>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;

  const colors = ["#007bff", "#28a745", "#ffc107", "#dc3545", "#6c757d", "#17a2b8"];

  return (
    <div style={{ textAlign: "center" }}>
      {title && <h4 style={{ marginBottom: 16, color: "#333" }}>{title}</h4>}
      
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Chart */}
        <div style={{ position: "relative" }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="#e9ecef"
              strokeWidth="12"
            />
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const angle = (item.value / total) * 360;
              const largeArcFlag = angle > 180 ? 1 : 0;
              
              const startX = 60 + 54 * Math.cos((currentAngle - 90) * Math.PI / 180);
              const startY = 60 + 54 * Math.sin((currentAngle - 90) * Math.PI / 180);
              
              currentAngle += angle;
              
              const endX = 60 + 54 * Math.cos((currentAngle - 90) * Math.PI / 180);
              const endY = 60 + 54 * Math.sin((currentAngle - 90) * Math.PI / 180);
              
              if (item.value === 0) return null;
              
              return (
                <path
                  key={index}
                  d={`M 60 60 L ${startX} ${startY} A 54 54 0 ${largeArcFlag} 1 ${endX} ${endY} Z`}
                  fill={colors[index % colors.length]}
                  opacity="0.8"
                />
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div style={{ flex: 1, marginLeft: 20 }}>
          {data.map((item, index) => (
            <div key={index} style={{ 
              display: "flex", 
              alignItems: "center", 
              marginBottom: 8,
              fontSize: 12
            }}>
              <div style={{
                width: 12,
                height: 12,
                backgroundColor: colors[index % colors.length],
                borderRadius: "50%",
                marginRight: 8,
                opacity: 0.8
              }}></div>
              <span style={{ flex: 1 }}>{item.label}</span>
              <span style={{ fontWeight: "bold", marginLeft: 8 }}>
                {item.value} ({total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Dashboard específico para Alunos
function AlunosDashboard({ dashboardData, user }) {
  const meusProcessos = dashboardData?.processos || [];
  const processosAtivos = meusProcessos.filter(p => p.status !== 'arquivado').length;
  const processosFinalizados = meusProcessos.filter(p => p.status === 'finalizado').length;
  
  // Dados para o gráfico de status
  const statusData = [
    { label: "Em Andamento", value: meusProcessos.filter(p => p.status === 'em_andamento').length },
    { label: "Aguardando", value: meusProcessos.filter(p => p.status === 'aguardando').length },
    { label: "Finalizados", value: processosFinalizados },
    { label: "Arquivados", value: meusProcessos.filter(p => p.status === 'arquivado').length }
  ];

  const processosRecentes = meusProcessos.slice(0, 3);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
      {/* Resumo dos Processos */}
      <Card title="📋 Meus Processos" color="#007bff">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 15, marginBottom: 20 }}>
          <StatItem 
            label="Total" 
            value={meusProcessos.length} 
            color="#007bff"
            icon="📊"
          />
          <StatItem 
            label="Ativos" 
            value={processosAtivos} 
            color="#28a745"
            icon="⚡"
          />
          <StatItem 
            label="Finalizados" 
            value={processosFinalizados} 
            color="#6c757d"
            icon="✅"
          />
        </div>
        
        <div style={{ marginTop: 15 }}>
          <StatusProgressBar 
            label="Progresso Geral"
            value={processosFinalizados}
            total={meusProcessos.length}
            color="#28a745"
          />
        </div>
      </Card>

      {/* Gráfico de Status */}
      <Card title="📈 Status dos Processos" color="#17a2b8">
        <PieChart data={statusData} />
      </Card>

      {/* Processos Recentes */}
      <Card title="🕒 Últimos Processos" color="#ffc107">
        {processosRecentes.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {processosRecentes.map((processo, index) => (
              <div key={index} style={{
                padding: 12,
                backgroundColor: "#f8f9fa",
                borderRadius: 8,
                borderLeft: `4px solid #ffc107`
              }}>
                <div style={{ fontWeight: "bold", marginBottom: 4 }}>
                  {processo.numero || `Processo ${index + 1}`}
                </div>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
                  {processo.descricao || "Sem descrição"}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <StatusBadge status={processo.status} />
                  <span style={{ fontSize: 11, color: "#999" }}>
                    {processo.created_at ? new Date(processo.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", color: "#666", padding: 20 }}>
            <p>🔍 Nenhum processo encontrado</p>
            <p style={{ fontSize: 12, marginTop: 8 }}>
              Seus processos aparecerão aqui quando forem criados.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

// Dashboard específico para Professores
function ProfessoresDashboard({ dashboardData, user }) {
  const processosSupervisionados = dashboardData?.processos || [];
  const alunosOrientados = dashboardData?.alunos || [];
  const processosAtivos = processosSupervisionados.filter(p => p.status !== 'arquivado').length;
  
  // Dados estatísticos
  const statusData = [
    { label: "Em Andamento", value: processosSupervisionados.filter(p => p.status === 'em_andamento').length },
    { label: "Aguardando", value: processosSupervisionados.filter(p => p.status === 'aguardando').length },
    { label: "Finalizados", value: processosSupervisionados.filter(p => p.status === 'finalizado').length },
    { label: "Arquivados", value: processosSupervisionados.filter(p => p.status === 'arquivado').length }
  ];

  const processosRecentes = processosSupervisionados.slice(0, 3);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
      {/* Supervisão Geral */}
      <Card title="🎓 Supervisão Acadêmica" color="#28a745">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 15, marginBottom: 20 }}>
          <StatItem 
            label="Processos" 
            value={processosSupervisionados.length} 
            color="#28a745"
            icon="📚"
          />
          <StatItem 
            label="Ativos" 
            value={processosAtivos} 
            color="#17a2b8"
            icon="⚡"
          />
          <StatItem 
            label="Alunos" 
            value={alunosOrientados.length} 
            color="#ffc107"
            icon="👥"
          />
        </div>
        
        <div style={{ marginTop: 15 }}>
          <StatusProgressBar 
            label="Processos Finalizados"
            value={processosSupervisionados.filter(p => p.status === 'finalizado').length}
            total={processosSupervisionados.length}
            color="#28a745"
          />
        </div>
      </Card>

      {/* Distribuição de Status */}
      <Card title="📊 Distribuição de Status" color="#6f42c1">
        <PieChart data={statusData} />
      </Card>

      {/* Processos Supervisionados Recentes */}
      <Card title="🔍 Processos Supervisionados" color="#dc3545">
        {processosRecentes.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {processosRecentes.map((processo, index) => (
              <div key={index} style={{
                padding: 12,
                backgroundColor: "#f8f9fa",
                borderRadius: 8,
                borderLeft: `4px solid #dc3545`
              }}>
                <div style={{ fontWeight: "bold", marginBottom: 4 }}>
                  {processo.numero || `Processo ${index + 1}`}
                </div>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
                  Aluno: {processo.aluno_nome || "N/A"}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <StatusBadge status={processo.status} />
                  <span style={{ fontSize: 11, color: "#999" }}>
                    {processo.updated_at ? new Date(processo.updated_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", color: "#666", padding: 20 }}>
            <p>📋 Nenhum processo sob supervisão</p>
            <p style={{ fontSize: 12, marginTop: 8 }}>
              Processos supervisionados aparecerão aqui.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

// Dashboard específico para Administradores
function AdminsDashboard({ dashboardData }) {
  const totalProcessos = dashboardData?.totalProcessos || 0;
  const totalUsuarios = dashboardData?.totalUsuarios || 0;
  const processosAtivos = dashboardData?.processosAtivos || 0;
  const usuariosAtivos = dashboardData?.usuariosAtivos || 0;
  
  // Dados para gráficos
  const statusData = [
    { label: "Em Andamento", value: dashboardData?.processosPorStatus?.em_andamento || 0 },
    { label: "Aguardando", value: dashboardData?.processosPorStatus?.aguardando || 0 },
    { label: "Finalizados", value: dashboardData?.processosPorStatus?.finalizado || 0 },
    { label: "Arquivados", value: dashboardData?.processosPorStatus?.arquivado || 0 }
  ];

  const usuariosPorTipo = [
    { label: "Alunos", value: dashboardData?.usuariosPorTipo?.aluno || 0 },
    { label: "Professores", value: dashboardData?.usuariosPorTipo?.professor || 0 },
    { label: "Admins", value: dashboardData?.usuariosPorTipo?.admin || 0 }
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
      {/* Estatísticas Gerais do Sistema */}
      <Card title="🏛️ Visão Geral do Sistema" color="#6f42c1">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 15, marginBottom: 20 }}>
          <StatItem 
            label="Total Processos" 
            value={totalProcessos} 
            color="#6f42c1"
            icon="📋"
          />
          <StatItem 
            label="Processos Ativos" 
            value={processosAtivos} 
            color="#28a745"
            icon="⚡"
          />
          <StatItem 
            label="Total Usuários" 
            value={totalUsuarios} 
            color="#17a2b8"
            icon="👥"
          />
          <StatItem 
            label="Usuários Ativos" 
            value={usuariosAtivos} 
            color="#ffc107"
            icon="✅"
          />
        </div>
        
        <div style={{ marginTop: 15 }}>
          <StatusProgressBar 
            label="Taxa de Processos Ativos"
            value={processosAtivos}
            total={totalProcessos}
            color="#28a745"
          />
          <StatusProgressBar 
            label="Taxa de Usuários Ativos"
            value={usuariosAtivos}
            total={totalUsuarios}
            color="#17a2b8"
          />
        </div>
      </Card>

      {/* Distribuição de Status dos Processos */}
      <Card title="📊 Status dos Processos" color="#dc3545">
        <PieChart data={statusData} />
      </Card>

      {/* Distribuição de Usuários */}
      <Card title="👥 Tipos de Usuários" color="#fd7e14">
        <PieChart data={usuariosPorTipo} />
      </Card>

      {/* Ações Administrativas */}
      <Card title="⚙️ Ações Administrativas" color="#20c997">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button style={{
            padding: 12,
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: "bold"
          }}>
            📊 Relatório Completo
          </button>
          <button style={{
            padding: 12,
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: "bold"
          }}>
            👤 Gerenciar Usuários
          </button>
          <button style={{
            padding: 12,
            backgroundColor: "#ffc107",
            color: "#212529",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: "bold"
          }}>
            📋 Gerenciar Processos
          </button>
        </div>
      </Card>
    </div>
  );
}

// Componente principal do Dashboard
export default function DashboardSummary({ dashboardData, user }) {
  if (!dashboardData || !user) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: 200,
        backgroundColor: "#f8f9fa",
        borderRadius: 12,
        color: "#666"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
          <div>Carregando dashboard...</div>
        </div>
      </div>
    );
  }

  const userRole = getUserRole(user);
  
  return (
    <div>
      {/* Dashboard baseado no papel do usuário */}
      {userRole === "Aluno" && (
        <AlunosDashboard dashboardData={dashboardData} user={user} />
      )}
      
      {userRole === "Professor" && (
        <ProfessoresDashboard dashboardData={dashboardData} user={user} />
      )}
      
      {userRole === "Admin" && (
        <AdminsDashboard dashboardData={dashboardData} user={user} />
      )}
      
      {!["Aluno", "Professor", "Admin"].includes(userRole) && (
        <Card title="⚠️ Acesso Restrito" color="#dc3545">
          <div style={{ textAlign: "center", color: "#666", padding: 20 }}>
            <p>Papel de usuário não reconhecido: {userRole}</p>
            <p style={{ fontSize: 12, marginTop: 8 }}>
              Entre em contato com o administrador do sistema.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
