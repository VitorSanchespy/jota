import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { apiRequest } from "@/api/apiRequest";
import { auxTablesService, processService } from "../../api/services";

export default function ProcessEditPage() {
  const { id } = useParams();
  const { token } = useAuthContext();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [materias, setMaterias] = useState([]);
  const [fases, setFases] = useState([]);
  const [diligencias, setDiligencias] = useState([]);
  const [localTramitacoes, setLocalTramitacoes] = useState([]);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const proc = await apiRequest(`/api/processos/${id}/detalhes`, { token });
        setFormData({
          numero_processo: proc.numero_processo || '',
          num_processo_sei: proc.num_processo_sei || '',
          assistido: proc.assistido || '',
          descricao: proc.descricao || '',
          status: proc.status || '',
          materia_assunto_id: proc.materiaAssunto?.id || '',
          local_tramitacao_id: proc.localTramitacao?.id || '',
          sistema: proc.sistema || '',
          fase_id: proc.fase?.id || '',
          diligencia_id: proc.diligencia?.id || '',
          contato_assistido: proc.contato_assistido || '',
        });
        const [materiasRes, fasesRes, diligenciasRes, localTramitacoesRes] = await Promise.all([
          auxTablesService.getMateriaAssunto(token),
          auxTablesService.getFase(token),
          auxTablesService.getDiligencia(token),
          auxTablesService.getLocalTramitacao(token),
        ]);
        setMaterias(Array.isArray(materiasRes) ? materiasRes : []);
        setFases(Array.isArray(fasesRes) ? fasesRes : []);
        setDiligencias(Array.isArray(diligenciasRes) ? diligenciasRes : []);
        setLocalTramitacoes(Array.isArray(localTramitacoesRes) ? localTramitacoesRes : []);
      } catch (e) {
        setFormData(null);
      }
      setLoading(false);
    }
    fetchAll();
  }, [id, token]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await processService.updateProcess(token, id, formData);
      alert('Processo atualizado com sucesso!');
      navigate(`/processos/${id}`);
    } catch (err) {
      alert('Erro ao atualizar processo: ' + (err?.response?.data?.erro || err.message));
    }
  };

  if (loading || !formData) return <div>Carregando dados do processo...</div>;
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', background: '#f3f4f6', padding: 24, borderRadius: 8 }}>
      <h2>Editar Processo</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label>Número do Processo
          <input name="numero_processo" value={formData.numero_processo} onChange={handleChange} required />
        </label>
        <label>Num/Processo/Sei
          <input name="num_processo_sei" value={formData.num_processo_sei} onChange={handleChange} />
        </label>
        <label>Assistido/a
          <input name="assistido" value={formData.assistido} onChange={handleChange} />
        </label>
        <label>Contato/Assistido
          <input name="contato_assistido" value={formData.contato_assistido} onChange={handleChange} />
        </label>
        <label>Descrição
          <textarea name="descricao" value={formData.descricao} onChange={handleChange} required />
        </label>
        <label>Status
          <select name="status" value={formData.status} onChange={handleChange} required>
            <option value="">Selecione o status</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Concluído">Concluído</option>
            <option value="Suspenso">Suspenso</option>
          </select>
        </label>
        <label>Matéria/Assunto
          <select name="materia_assunto_id" value={formData.materia_assunto_id} onChange={handleChange} required>
            <option value="">Selecione a matéria/assunto</option>
            {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </label>
        <label>Fase
          <select name="fase_id" value={formData.fase_id} onChange={handleChange} required>
            <option value="">Selecione a fase</option>
            {fases.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
        </label>
        <label>Diligência
          <select name="diligencia_id" value={formData.diligencia_id} onChange={handleChange} required>
            <option value="">Selecione a diligência</option>
            {diligencias.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
          </select>
        </label>
        <label>Local de Tramitação
          <select name="local_tramitacao_id" value={formData.local_tramitacao_id} onChange={handleChange} required>
            <option value="">Selecione o local</option>
            {localTramitacoes.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>
        </label>
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button type="submit" style={{ background: '#2563eb', color: 'white', padding: '8px 16px', borderRadius: 6, border: 0, cursor: 'pointer' }}>Salvar</button>
          <button type="button" onClick={() => navigate(`/processos/${id}`)} style={{ background: '#6b7280', color: 'white', padding: '8px 16px', borderRadius: 6, border: 0, cursor: 'pointer' }}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}
