import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiRequest } from "../../api/apiRequest";
import { useAuthContext } from "../../contexts/AuthContext";

export default function UserDetail() {
  const { id } = useParams();
  const { token } = useAuthContext();
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsuario() {
      try {
        const data = await apiRequest(`/api/usuarios/${id}`, { token });
        setUsuario(data);
      } catch {
        setUsuario(null);
      }
      setLoading(false);
    }
    fetchUsuario();
  }, [id, token]);

  if (loading) return <div>Carregando usuário...</div>;
  if (!usuario) return <div>Usuário não encontrado.</div>;

  return (
    <div>
      <h2>Detalhes do Usuário</h2>
      <div><b>Nome:</b> {usuario.nome}</div>
      <div><b>Email:</b> {usuario.email}</div>
      <div><b>Papel:</b> {usuario.role}</div>
      <div><b>Status:</b> {usuario.ativo ? "Ativo" : "Inativo"}</div>
      <div style={{ marginTop: 16 }}>
        <Link to="/usuarios">Voltar</Link>
        {" | "}
        <Link to={`/usuarios/${usuario.id}/editar`}>Editar</Link>
      </div>
    </div>
  );
}