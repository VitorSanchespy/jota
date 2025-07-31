import React, { useState } from "react";
import { useAuthContext } from "../../contexts/AuthContext";
import { apiRequest } from "../../api/apiRequest";

export default function ChangePasswordForm() {
  const { user, token, logout } = useAuthContext();
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg("");
    if (newPass !== confirm) {
      setMsg("A nova senha e a confirmação não coincidem.");
      return;
    }
    setLoading(true);
    try {
      await apiRequest(`/api/usuarios/${user.id}/senha`, {
        method: "PUT",
        token,
        body: { senha_atual: current, nova_senha: newPass }
      });
      setMsg("Senha alterada com sucesso! Faça login novamente.");
      setTimeout(() => {
        logout();
      }, 1500);
    } catch (err) {
      setMsg(err.message || "Erro ao alterar senha.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Alterar senha</h3>
      {msg && <div style={{ color: msg.includes("sucesso") ? "green" : "red" }}>{msg}</div>}
      <div>
        <label>Senha atual:</label>
        <input
          type="password"
          value={current}
          onChange={e => setCurrent(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Nova senha:</label>
        <input
          type="password"
          value={newPass}
          onChange={e => setNewPass(e.target.value)}
          minLength={6}
          required
        />
      </div>
      <div>
        <label>Confirmar nova senha:</label>
        <input
          type="password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          minLength={6}
          required
        />
      </div>
      <button type="submit" disabled={loading}>
        {loading ? "Alterando..." : "Alterar senha"}
      </button>
    </form>
  );
}