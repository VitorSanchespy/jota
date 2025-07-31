import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { processService } from "../../api/services";
import { useAuthContext } from "../../contexts/AuthContext";
import UpdateList from "../atualizacoes/UpdateList";
import FileList from "../arquivos/FileList";
import FileUploadForm from "../arquivos/FileUploadForm";

export default function ProcessDetail() {
  const { id } = useParams();
  const { token, user } = useAuthContext();
  const [proc, setProc] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchProc() {
      try {
        const data = await processService.getProcessById(id, token);
        setProc(data);
      } catch {
        setProc(null);
      }
      setLoading(false);
    }
    fetchProc();
  }, [id, token]);

  if (loading) return <div>Carregando processo...</div>;
  if (!proc) return <div>Processo não encontrado.</div>;

  return (
    <div>
      <h2>Processo {proc.numero}</h2>
      <div><b>Nome:</b> {proc.nome}</div>
      <div><b>Status:</b> {proc.status}</div>
      <div><b>Aluno:</b> {proc.aluno_nome || "Não atribuído"}</div>
      <div><b>Descrição:</b> {proc.descricao}</div>
      <div style={{ margin: "20px 0" }}>
      <FileUploadForm processoId={proc.id} onUpload={() => {/* opcional: recarregar lista */}} />
      <FileList processoId={proc.id} />
        {(user.role_id === 1 || user.role_id === 3) && (
          <>
            <Link to={`/processos/${proc.id}/editar`}><button>Editar</button></Link>
            <Link to={`/processos/${proc.id}/atribuir`}><button>Atribuir Aluno</button></Link>
          </>
        )}
      </div>
      <hr />
      <h3>Atualizações</h3>
      <UpdateList processoId={proc.id} />
      {/* Pode adicionar outros componentes, como arquivos, aqui */}
      <button onClick={() => navigate("/processos")}>Voltar</button>
    </div>
  );
}