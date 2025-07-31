import React, { useState, useEffect } from "react";
import { apiRequest } from "@/api/apiRequest";
import { useAuthContext } from "@/contexts/AuthContext";

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

export default function CreateProcessModal({ onCreated, onClose }) {
  const { token, user } = useAuthContext();
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState({
    numero_processo: "",
    descricao: "",
    status: "Aberto",
    tipo_processo: "",
    idusuario_responsavel: "",
    data_encerramento: "",
    observacoes: ""
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    // Busca usuários conforme o papel
    let url = "/api/usuarios";
    if (getUserRole(user) === "Professor") url = "/api/usuarios/alunos";
    apiRequest(url, { token })
      .then(data => setUsuarios(data))
      .catch(() => setUsuarios([]));
  }, [token, user]);

  function handleClose() {
    if (onClose) onClose();
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErro("");
    try {
      // Envia para o backend
      await apiRequest("/api/processos", {
        token,
        method: "POST",
        body: form
      });
      setForm({
        numero_processo: "",
        descricao: "",
        status: "Aberto",
        tipo_processo: "",
        idusuario_responsavel: "",
        data_encerramento: "",
        observacoes: ""
      });
      if (onCreated) onCreated();
      handleClose();
    } catch (err) {
      setErro(err?.message || "Erro ao criar processo");
    }
    setLoading(false);
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          padding: 30,
          borderRadius: 8,
          maxWidth: 500,
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2>Novo Processo</h2>
          <button 
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              padding: 5
            }}
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
              Número do Processo*:
            </label>
            <input
              type="text"
              name="numero_processo"
              value={form.numero_processo}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
              Descrição*:
            </label>
            <textarea
              name="descricao"
              value={form.descricao}
              onChange={handleChange}
              required
              rows={3}
              style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4, resize: 'vertical' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
              Status:
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
            >
              <option value="Aberto">Aberto</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Finalizado">Finalizado</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
              Tipo do Processo:
            </label>
            <input
              type="text"
              name="tipo_processo"
              value={form.tipo_processo}
              onChange={handleChange}
              style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
              Responsável:
            </label>
            <select
              name="idusuario_responsavel"
              value={form.idusuario_responsavel}
              onChange={handleChange}
              style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
            >
              <option value="">Selecione um responsável</option>
              {usuarios.map(usuario => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.nome}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
              Data de Encerramento:
            </label>
            <input
              type="datetime-local"
              name="data_encerramento"
              value={form.data_encerramento}
              onChange={handleChange}
              style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
              Observações:
            </label>
            <textarea
              name="observacoes"
              value={form.observacoes}
              onChange={handleChange}
              rows={3}
              style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4, resize: 'vertical' }}
            />
          </div>
          
          {erro && (
            <div style={{ color: 'red', marginBottom: 10, padding: 10, backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: 4 }}>
              {erro}
            </div>
          )}
          
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button 
              type="button" 
              onClick={handleClose} 
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? "Criando..." : "Criar Processo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}