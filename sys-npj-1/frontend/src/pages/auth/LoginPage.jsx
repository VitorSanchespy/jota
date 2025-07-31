import React from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../../components/auth/LoginForm";
import { useAuthContext } from "../../contexts/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard"); // Redireciona para dashboard
    }
  }, [isAuthenticated, navigate]);

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #001F3F 0%, #003366 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      {/* Header fixo */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#001F3F',
        padding: '15px 0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            backgroundColor: 'white',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            color: '#001F3F'
          }}>
            NPJ
          </div>
          <h1 style={{
            color: 'white',
            margin: 0,
            fontSize: '1.3rem',
            fontWeight: 'bold'
          }}>
            Sistema NPJ - UFMT
          </h1>
        </div>
      </div>

      {/* Container principal */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: '450px',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        {/* Ícone e título */}
        <div style={{
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '20px'
          }}>
            🔐
          </div>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#001F3F',
            marginBottom: '10px',
            margin: 0
          }}>
            Acesso ao Sistema
          </h2>
          <p style={{
            color: '#666',
            fontSize: '1rem',
            margin: 0
          }}>
            Entre com suas credenciais para continuar
          </p>
        </div>

        {/* Formulário de login */}
        <LoginForm onSuccess={() => navigate("/dashboard")} />

        {/* Links úteis */}
        <div style={{
          marginTop: '30px',
          textAlign: 'center',
          paddingTop: '20px',
          borderTop: '1px solid #e9ecef'
        }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              color: '#007bff',
              cursor: 'pointer',
              fontSize: '0.9rem',
              textDecoration: 'underline',
              marginRight: '20px'
            }}
          >
            ← Voltar ao Início
          </button>
          <button
            onClick={() => navigate('/register')}
            style={{
              background: 'none',
              border: 'none',
              color: '#007bff',
              cursor: 'pointer',
              fontSize: '0.9rem',
              textDecoration: 'underline'
            }}
          >
            Criar Conta
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        textAlign: 'center',
        padding: '20px',
        color: 'rgba(255,255,255,0.7)',
        fontSize: '0.9rem'
      }}>
        © {new Date().getFullYear()} Universidade Federal de Mato Grosso - NPJ
      </div>
    </div>
  );
}