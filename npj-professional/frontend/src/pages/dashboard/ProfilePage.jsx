import React from "react";
import ProfileView from "@/components/profile/ProfileView";

export default function ProfilePage() {
  return (
    <>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '24px', 
          fontWeight: '600',
          color: '#343a40'
        }}>
          👤 Meu Perfil
        </h1>
        <p style={{ 
          margin: '8px 0 0 0', 
          fontSize: '14px', 
          color: '#6c757d' 
        }}>
          Gerencie suas informações pessoais e configurações de conta
        </p>
      </div>
      
      <ProfileView />
    </>
  );
}