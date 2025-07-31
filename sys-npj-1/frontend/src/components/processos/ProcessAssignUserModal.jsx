import React, { useEffect, useState } from "react";
import { userService, processService } from "../../api/services";
import { useAuthContext } from "../../contexts/AuthContext";

export default function ProcessAssignUserModal({ processoId, onClose, onAssigned }) {
  const { token } = useAuthContext();
  const [usuarios, setUsuarios] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      if (!search || search.length < 3) {
        setUsuarios([]);
        return;
      }
      try {
        const data = await userService.getUsersForAssignment(token, search);
        setUsuarios(data);
      } catch {
        setUsuarios([]);
      }
    }
    fetchUsers();
  }, [token, search]);

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    // Log para depuração
    console.log("[Vincular Usuário] processoId:", processoId, "selected:", selected);
    if (!selected) {
      setMsg("Selecione um usuário válido.");
      setLoading(false);
      return;
    }
    try {
      // Garante que o ID seja número
      const usuarioId = Number(selected);
      const usuarioObj = usuarios.find(u => u.id === usuarioId);
      console.log('[Vincular Usuário] Usuário selecionado:', usuarioObj);
      // Mapear role_id para nome da role aceito pelo backend
      const roleMap = { 2: 'Aluno', 3: 'Professor' };
      const role = roleMap[usuarioObj.role_id];
      
      if (!usuarioObj || !usuarioObj.role_id || !role) {
        setMsg("Usuário selecionado inválido ou role não permitida para vinculação.");
        setLoading(false);
        return;
      }
      await processService.assignUserToProcess(token, processoId, usuarioId, role);
      setMsg("Usuário vinculado com sucesso!");
      setSelected("");
      if (onAssigned) onAssigned();
      setTimeout(() => { setMsg(""); if (onClose) onClose(); }, 1000);
    } catch (err) {
      setMsg(err.message || "Erro ao vincular usuário.");
    }
    setLoading(false);
  };

  return (
    <div style={{ background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px #0002', maxWidth: 400 }}>
      <h3>Vincular Usuário ao Processo</h3>
      {msg && <div style={{ marginBottom: 8 }}>{msg}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Buscar usuário por nome (mín. 3 letras)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', marginBottom: 8, padding: 6, borderRadius: 4, border: '1px solid #ccc' }}
        />
        <select value={selected} onChange={e => setSelected(e.target.value)} required style={{ width: '100%', marginBottom: 8 }}>
          <option value="">Selecione um usuário</option>
          {usuarios.map(u => (
            <option key={u.id} value={u.id}>{u.nome} ({u.email})</option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={!selected || loading} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 16px', fontWeight: 500, fontSize: 15, cursor: 'pointer' }}>Vincular</button>
          <button type="button" onClick={onClose} style={{ background: '#aaa', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 16px', fontWeight: 500, fontSize: 15, cursor: 'pointer' }}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}
