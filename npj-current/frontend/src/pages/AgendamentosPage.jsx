import React from 'react';
import AgendamentoManager from '../components/AgendamentoManager';
import MainLayout from '../components/layout/MainLayout';
import PageContent from '../components/layout/PageContent';

const AgendamentosPage = () => {
  return (
    <MainLayout>
        title="Agendamentos" 
        icon="📅"
      
      <PageContent>
        <AgendamentoManager />
      </PageContent>
    </MainLayout>
  );
};

export default AgendamentosPage;
