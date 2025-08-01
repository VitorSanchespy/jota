import React from "react";
import Header from "./Header";
import Footer from "./Footer";

const Loader = ({ message = "Carregando...", error = null }) => (
  <div style={{ 
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  }}>
    <Header />
    <div style={{
      backgroundColor: 'white',
      borderRadius: '20px',
      padding: '40px',
      boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
      textAlign: 'center',
      maxWidth: '400px',
      width: '100%',
      border: '1px solid rgba(255,255,255,0.1)',
      backdropFilter: 'blur(10px)',
      marginTop: '100px'
    }}>
      <div style={{ 
        fontSize: '4rem', 
        marginBottom: '20px',
        animation: error ? 'none' : 'spin 2s linear infinite'
      }}>
        {error ? '⚠️' : '⏳'}
      </div>
      <h2 style={{ 
        fontSize: '1.5rem', 
        fontWeight: 'bold',
        color: error ? '#dc3545' : '#001F3F',
        marginBottom: '10px',
        margin: '0 0 10px 0'
      }}>
        {error ? 'Erro' : message}
      </h2>
      <p style={{ 
        fontSize: '1rem', 
        color: '#666',
        marginBottom: error ? '20px' : '0',
        margin: error ? '0 0 20px 0' : '0'
      }}>
        {error ? (error.message || "Ocorreu um erro inesperado") : "Aguarde um momento..."}
      </p>
      {error && (
        <button 
          onClick={() => window.location.reload()} 
          style={{
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
        >
          🔄 Tentar Novamente
        </button>
      )}
    </div>
    <Footer />
  </div>
);

export default Loader;