
import React, { useEffect, useState } from "react";
import { processUpdatesService, auxTablesService } from "../../api/services";
import { useAuthContext } from "../../contexts/AuthContext";
import UpdateForm from "./UpdateForm";
import { getFileUrl } from '../../utils/fileUrl';
import { FIELD_LABELS, getFieldDisplayValue } from './fieldNameMaps';


function formatDescricao(descricao, auxData) {
  // Exemplo: "fase_id: '53' → '59'" ou "materia_assunto_id: '2' → '3'"
  if (!descricao) { return ""; }
  // Regex para encontrar padrões tipo campo: 'id1' → 'id2'
  return descricao.replace(/([a-zA-Z_]+): '?([\d]+)'? *→ *'?([\d]+)'?/g, function(match, field, from, to) {
    const label = FIELD_LABELS[field] || field;
    const fromName = getFieldDisplayValue(field, from, auxData);
    const toName = getFieldDisplayValue(field, to, auxData);
    return `${label}: '${fromName}' → '${toName}'`;
  });
}

export default function UpdateList({ processoId }) {
  const { token, user } = useAuthContext();
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [auxData, setAuxData] = useState({ materias: [], fases: [], diligencias: [], localTramitacoes: [] });

  useEffect(() => {
    async function fetchUpdates() {
      try {
        const data = await processUpdatesService.getProcessUpdates(processoId, token);
        setUpdates(data);
      } catch {
        setUpdates([]);
      }
      setLoading(false);
    }
    fetchUpdates();
  }, [processoId, token, showForm]);

  // Carregar dados auxiliares para mapear ids para nomes
  useEffect(() => {
    async function fetchAux() {
      try {
        const [materias, fases, diligencias, localTramitacoes] = await Promise.all([
          auxTablesService.getMateriaAssunto(token),
          auxTablesService.getFase(token),
          auxTablesService.getDiligencia(token),
          auxTablesService.getLocalTramitacao(token),
        ]);
        setAuxData({ materias, fases, diligencias, localTramitacoes });
      } catch {
        setAuxData({ materias: [], fases: [], diligencias: [], localTramitacoes: [] });
      }
    }
    fetchAux();
  }, [token]);

  if (loading) return <div>Carregando atualizações...</div>;
  return (
    <div>
      {["admin", "professor", "aluno"].includes((user.role || "").toLowerCase()) && (
        <button onClick={() => setShowForm(v => !v)}>
          {showForm ? "Fechar" : "Nova Atualização"}
        </button>
      )}
      {showForm && (
        <UpdateForm
          processoId={processoId}
          onSuccess={() => setShowForm(false)}
        />
      )}
      <ul>
        {updates.length === 0 && <li>Nenhuma atualização encontrada.</li>}
        {updates.map(upd => (
          <li key={upd.id}>
            {upd.tipo && <b>[{upd.tipo}] </b>}
            {formatDescricao(upd.descricao, auxData)}
            {upd.anexo && (
              <>
                <br />
                <a href={getFileUrl(upd.anexo)} target="_blank" rel="noopener noreferrer">Ver anexo</a>
              </>
            )}
            <br />
            <small>Por: {upd.usuario_nome} em {new Date(upd.data_atualizacao).toLocaleString()}</small>
            {user.role && ['professor', 'admin'].includes(user.role.toLowerCase()) && (
              <button
                style={{ marginLeft: 12, color: '#fff', background: '#d32f2f', border: 'none', borderRadius: 4, padding: '2px 10px', fontWeight: 500, cursor: 'pointer' }}
                onClick={async () => {
                  if(window.confirm('Tem certeza que deseja excluir esta atualização?')) {
                    await processUpdatesService.deleteProcessUpdate(upd.processo_id, upd.id, token);
                    setUpdates(updates.filter(u => u.id !== upd.id));
                  }
                }}
              >Excluir</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}