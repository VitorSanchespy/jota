import React from "react";
import FullProcessCreateForm from '@/components/FullProcessCreateForm';

export default function ProcessFormPage() {
  return (
    <>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '24px', 
          fontWeight: '600',
          color: '#343a40'
        }}>
          ➕ Cadastrar Novo Processo
        </h1>
        <p style={{ 
          margin: '8px 0 0 0', 
          fontSize: '14px', 
          color: '#6c757d' 
        }}>
          Preencha os dados para criar um novo processo
        </p>
      </div>
      
      <FullProcessCreateForm />
    </>
  );
}