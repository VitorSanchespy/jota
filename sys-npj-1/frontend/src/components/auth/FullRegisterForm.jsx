

import React, { useState } from "react";
import { useAuthContext } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function FullRegisterForm() {
  const { register } = useAuthContext();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    telefone: "",
  });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    const res = await register(form.nome, form.email, form.senha, 2); // Default to student role
    if (res.success) {
      setMsg("Usuário cadastrado com sucesso! Redirecionando...");
      setTimeout(() => navigate("/login"), 1500);
    } else {
      setMsg(res.message || "Erro ao cadastrar usuário.");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '18px'
    }}>
      {msg && <div style={{
        backgroundColor: msg.includes('sucesso') ? '#d4edda' : '#f8d7da',
        color: msg.includes('sucesso') ? '#155724' : '#721c24',
        border: `1px solid ${msg.includes('sucesso') ? '#c3e6cb' : '#f5c6cb'}`,
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '10px',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '1rem'
      }}>{msg}</div>}

      {/* ...campos do formulário e botões... */}
      <div style={{ marginBottom: '10px' }}>
        <label style={{
          display: 'block',
          fontSize: '0.95rem',
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '8px'
        }}>👤 Nome Completo:</label>
        <input
          name="nome"
          value={form.nome}
          onChange={handleChange}
          required
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '2px solid #e9ecef',
            borderRadius: '8px',
            fontSize: '1rem',
            transition: 'border-color 0.3s ease',
            outline: 'none',
            boxSizing: 'border-box'
          }}
          onFocus={e => e.target.style.borderColor = '#28a745'}
          onBlur={e => e.target.style.borderColor = '#e9ecef'}
          placeholder="Seu nome completo"
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{
          display: 'block',
          fontSize: '0.95rem',
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '8px'
        }}>📧 E-mail:</label>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '2px solid #e9ecef',
            borderRadius: '8px',
            fontSize: '1rem',
            transition: 'border-color 0.3s ease',
            outline: 'none',
            boxSizing: 'border-box'
          }}
          onFocus={e => e.target.style.borderColor = '#28a745'}
          onBlur={e => e.target.style.borderColor = '#e9ecef'}
          placeholder="seu.email@exemplo.com"
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{
          display: 'block',
          fontSize: '0.95rem',
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '8px'
        }}>🔒 Senha:</label>
        <input
          name="senha"
          type="password"
          value={form.senha}
          onChange={handleChange}
          required
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '2px solid #e9ecef',
            borderRadius: '8px',
            fontSize: '1rem',
            transition: 'border-color 0.3s ease',
            outline: 'none',
            boxSizing: 'border-box'
          }}
          onFocus={e => e.target.style.borderColor = '#28a745'}
          onBlur={e => e.target.style.borderColor = '#e9ecef'}
          placeholder="Mínimo 6 caracteres"
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{
          display: 'block',
          fontSize: '0.95rem',
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '8px'
        }}>📞 Telefone:</label>
        <input
          name="telefone"
          value={form.telefone}
          onChange={handleChange}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '2px solid #e9ecef',
            borderRadius: '8px',
            fontSize: '1rem',
            transition: 'border-color 0.3s ease',
            outline: 'none',
            boxSizing: 'border-box'
          }}
          onFocus={e => e.target.style.borderColor = '#28a745'}
          onBlur={e => e.target.style.borderColor = '#e9ecef'}
          placeholder="(xx) xxxxx-xxxx"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          padding: '15px',
          backgroundColor: loading ? '#ccc' : '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          marginBottom: '10px'
        }}
        onMouseEnter={e => {
          if (!loading) {
            e.target.style.backgroundColor = '#218838';
            e.target.style.transform = 'translateY(-2px)';
          }
        }}
        onMouseLeave={e => {
          if (!loading) {
            e.target.style.backgroundColor = '#28a745';
            e.target.style.transform = 'translateY(0)';
          }
        }}
      >
        {loading ? "🔄 Cadastrando..." : "🚀 Criar Conta"}
      </button>
      <button
        type="button"
        onClick={() => navigate('/login')}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          marginBottom: '5px'
        }}
        onMouseEnter={e => e.target.style.backgroundColor = '#0056b3'}
        onMouseLeave={e => e.target.style.backgroundColor = '#007bff'}
      >
        ← Voltar para Login
      </button>
    </form>
  );
}
