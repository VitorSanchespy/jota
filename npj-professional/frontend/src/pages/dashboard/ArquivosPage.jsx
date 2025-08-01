import React, { useEffect, useState } from "react";
import { fileService } from "../../api/services";
import { useAuthContext } from "../../contexts/AuthContext";
import FileUploadForm from "../../components/arquivos/FileUploadForm";
import { getFileUrl } from '../../utils/fileUrl';

export default function ArquivosPage() {
  const { token, user } = useAuthContext();
  const [arquivos, setArquivos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArquivos() {
      setLoading(true);
      try {
        // Busca apenas arquivos do usuário logado
        const data = await fileService.getUserFiles(token, user.id);
        setArquivos(data);
      } catch {
        setArquivos([]);
      }
      setLoading(false);
    }
    if (user?.id) fetchArquivos();
  }, [token, user]);

  return (
    <>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '24px', 
          fontWeight: '600',
          color: '#343a40'
        }}>
          📁 Meus Arquivos
        </h1>
        <p style={{ 
          margin: '8px 0 0 0', 
          fontSize: '14px', 
          color: '#6c757d' 
        }}>
          Gerencie seus arquivos e documentos
        </p>
      </div>
      
      <FileUploadForm onUpload={() => window.location.reload()} />
        {loading ? (
          <div>Carregando arquivos...</div>
        ) : arquivos.length === 0 ? (
          <div>Nenhum arquivo encontrado.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Data</th>
                <th>Tamanho</th>
                <th>Abrir</th>
                <th>Excluir</th>
              </tr>
            </thead>
            <tbody>
              {arquivos.map(arquivo => {
                const nomeCurto = arquivo.nome && arquivo.nome.length > 30
                  ? arquivo.nome.slice(0, 15) + '...' + arquivo.nome.slice(-10)
                  : arquivo.nome;
                return (
                  <tr key={arquivo.id}>
                    <td title={arquivo.nome}>{nomeCurto}</td>
                    <td>{arquivo.criado_em ? new Date(arquivo.criado_em).toLocaleString() : "-"}</td>
                    <td>{arquivo.tamanho ? `${Math.round(arquivo.tamanho / 1024)} KB` : "-"}</td>
                    <td>
                      <button onClick={() => window.open(getFileUrl(arquivo.caminho), "_blank")}>Abrir</button>
                    </td>
                    <td>
                      <button
                        style={{ background: '#d32f2f', color: 'white', border: 0, borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}
                        onClick={async () => {
                          if (window.confirm('Tem certeza que deseja excluir este arquivo?')) {
                            try {
                              await fileService.deleteFile(arquivo.id, token);
                              setArquivos(arquivos.filter(a => a.id !== arquivo.id));
                            } catch (err) {
                              alert('Erro ao excluir arquivo: ' + (err.message || 'Erro desconhecido'));
                            }
                          }
                        }}
                      >Excluir</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
    </>
  );
}