import React, { useState, useEffect } from "react";
import { processUpdatesService, fileService } from "../../api/services";
import { useAuthContext } from "../../contexts/AuthContext";
import { getFileUrl } from '../../utils/fileUrl';

function UpdateForm({ processoId, onSuccess }) {
  const { token, user } = useAuthContext();
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState("");
  const [anexoId, setAnexoId] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [tipos, setTipos] = useState([
    "Despacho",
    "Petição",
    "Audiência",
    "Observação"
  ]);
  const [novoTipo, setNovoTipo] = useState("");
  const [meusArquivos, setMeusArquivos] = useState([]);

  useEffect(() => {
    async function fetchArquivos() {
      try {
        const data = await fileService.getFilesByUser(user.id, token);
        setMeusArquivos(data);
      } catch {
        setMeusArquivos([]);
      }
    }
    if (user?.id) fetchArquivos();
  }, [user, token]);

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg("");
    if (!tipo) {
      setMsg("Selecione ou adicione um tipo de atualização.");
      return;
    }
    if (!descricao.trim()) {
      setMsg("Descrição é obrigatória.");
      return;
    }
    if (!anexoId) {
      setMsg("Selecione um anexo já enviado.");
      return;
    }
    setLoading(true);
    try {
      const arquivoSelecionado = meusArquivos.find(a => a.id === anexoId);
      if (!arquivoSelecionado) {
        setMsg("Arquivo selecionado não encontrado.");
        setLoading(false);
        return;
      }
      await processUpdatesService.createProcessUpdate(processoId, {
        descricao, 
        tipo, 
        anexo: arquivoSelecionado.caminho 
      }, token);
      setMsg("Atualização cadastrada!");
      setDescricao("");
      setTipo("");
      setAnexoId("");
      if (onSuccess) onSuccess();
    } catch (err) {
      setMsg(err.message || "Erro ao cadastrar atualização.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h4>Nova Atualização</h4>
      {msg && <div>{msg}</div>}
      <div>
        <label>Tipo:</label>
        <select value={tipo} onChange={e => setTipo(e.target.value)} required>
          <option value="">Selecione</option>
          {tipos.map((t, i) => (
            <option key={i} value={t}>{t}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Novo tipo"
          value={novoTipo}
          onChange={e => setNovoTipo(e.target.value)}
          style={{ marginLeft: 8 }}
        />
        <button type="button" onClick={() => {
          if (novoTipo && !tipos.includes(novoTipo)) {
            setTipos([...tipos, novoTipo]);
            setTipo(novoTipo);
            setNovoTipo("");
          }
        }}>Adicionar tipo</button>
      </div>
      <div>
        <label>Descrição:</label>
        <textarea
          value={descricao}
          onChange={e => setDescricao(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Anexo:</label>
        <select value={anexoId} onChange={e => setAnexoId(e.target.value)} required>
          <option value="">Selecione um arquivo já enviado</option>
          {meusArquivos.map(a => (
            <option key={a.id} value={a.id}>{a.nome}</option>
          ))}
        </select>
        {anexoId && (
          (() => {
            const arquivo = meusArquivos.find(a => a.id === anexoId);
            if (!arquivo) return null;
            const url = getFileUrl(arquivo.caminho);
            return (
              <a href={url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8 }}>
                Visualizar anexo selecionado
              </a>
            );
          })()
        )}
        <a href="/arquivos" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8 }}>Enviar novo arquivo</a>
      </div>
      <button type="submit" disabled={loading}>
        {loading ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}

export default UpdateForm;
