import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";

export default function RegisterForm() {
  const { user, register } = useAuthContext();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [roleId, setRoleId] = useState(2); // 2 = Aluno, ajuste conforme backend
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);
    
    try {
      let finalRoleId = 2; // Aluno
      if (user && user.role_id === 1) finalRoleId = roleId;
      else if (user && user.role === "Professor" && (roleId === 2 || roleId === 3)) finalRoleId = roleId;
      // Professor não pode criar Admin
      else if (user && user.role === "Professor" && roleId === 1) {
        setError("Professores não podem criar Admins.");
        setLoading(false);
        return;
      }
      // Aluno ou não logado só pode criar Aluno
      const res = await register(nome, email, senha, finalRoleId);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(res.message || "Erro ao registrar");
      }
    } catch (err) {
      setError(err.message || "Erro ao registrar");
    }
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      {error && (
        <div style={{
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          color: '#c33',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '0.9rem',
          textAlign: 'center'
        }}>
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div style={{
          backgroundColor: '#efe',
          border: '1px solid #cfc',
          color: '#363',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '0.9rem',
          textAlign: 'center'
        }}>
          ✅ Cadastro realizado! Redirecionando para login...
        </div>
      )}
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'block',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '8px'
        }}>
          👤 Nome Completo:
        </label>
        <input
          value={nome}
          onChange={e => setNome(e.target.value)}
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
          onFocus={(e) => e.target.style.borderColor = '#28a745'}
          onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
          placeholder="Seu nome completo"
        />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'block',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '8px'
        }}>
          📧 E-mail:
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
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
          onFocus={(e) => e.target.style.borderColor = '#28a745'}
          onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
          placeholder="seu.email@exemplo.com"
        />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'block',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '8px'
        }}>
          🔒 Senha:
        </label>
        <input
          type="password"
          value={senha}
          onChange={e => setSenha(e.target.value)}
          required
          minLength={6}
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
          onFocus={(e) => e.target.style.borderColor = '#28a745'}
          onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
          placeholder="Mínimo 6 caracteres"
        />
      </div>

      {(user && (user.role_id === 1 || user.role_id === 3)) && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '8px'
          }}>
            🎓 Tipo de Usuário:
          </label>
          <select
            value={roleId}
            onChange={e => setRoleId(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e9ecef',
              borderRadius: '8px',
              fontSize: '1rem',
              transition: 'border-color 0.3s ease',
              outline: 'none',
              boxSizing: 'border-box',
              backgroundColor: 'white'
            }}
            onFocus={(e) => e.target.style.borderColor = '#28a745'}
            onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
          >
            <option value={2}>👨‍🎓 Aluno</option>
            <option value={3}>👨‍🏫 Professor</option>
            {user.role_id === 1 && <option value={1}>👑 Admin</option>}
          </select>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || success}
        style={{
          width: '100%',
          padding: '15px',
          backgroundColor: loading || success ? '#ccc' : '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          cursor: loading || success ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          marginBottom: '15px'
        }}
        onMouseEnter={(e) => {
          if (!loading && !success) {
            e.target.style.backgroundColor = '#218838';
            e.target.style.transform = 'translateY(-2px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!loading && !success) {
            e.target.style.backgroundColor = '#28a745';
            e.target.style.transform = 'translateY(0)';
          }
        }}
      >
        {loading ? "🔄 Criando Conta..." : success ? "✅ Conta Criada!" : "🚀 Criar Conta"}
      </button>

      <div style={{ textAlign: 'center' }}>
        <p style={{ 
          color: '#666', 
          fontSize: '0.9rem',
          margin: '0 0 10px 0'
        }}>
          Já possui uma conta?
        </p>
        <button
          type="button"
          onClick={() => navigate('/login')}
          style={{
            backgroundColor: 'transparent',
            color: '#007bff',
            border: '2px solid #007bff',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#007bff';
            e.target.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = '#007bff';
          }}
        >
          🔐 Fazer Login
        </button>
      </div>
    </form>
  );
}