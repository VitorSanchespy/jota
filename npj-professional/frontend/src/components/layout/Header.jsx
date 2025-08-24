import React from "react";
import { useAuthContext } from "../../contexts/AuthContext";

const Header = () => {
  const { user } = useAuthContext();
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      height: '100%'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <span style={{
          fontSize: '14px',
          color: '#6c757d'
        }}>
          Bem-vindo, {user?.nome || 'Usuário'}
        </span>
        <div style={{
          width: '32px',
          height: '32px',
          backgroundColor: '#0066cc',
          color: 'white',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          {user?.nome?.charAt(0)?.toUpperCase() || 'E'}
        </div>
      </div>
    </div>
  );
};

export default Header;