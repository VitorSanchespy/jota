import React from "react";
import DashboardSummary from "@/components/dashboard/DashboardSummary";
import { useDashboardData } from "@/hooks/useApi.jsx";
import { useAuthContext } from "@/contexts/AuthContext";
import Loader from "@/components/layout/Loader";

export default function DashboardPage() {
  const { user } = useAuthContext();
  const { data: dashboardData, isLoading, error } = useDashboardData();

  if (isLoading) {
    return <Loader message="Carregando Dashboard" />;
  }

  if (error) {
    return <Loader error={error} />;
  }

  return (
    <>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e9ecef',
        marginBottom: '24px'
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '24px', 
          fontWeight: '600',
          color: '#212529'
        }}>
          🏠 Dashboard
        </h1>
        <p style={{ 
          margin: '8px 0 0 0', 
          fontSize: '14px', 
          color: '#6c757d' 
        }}>
          Visão geral do sistema NPJ
        </p>
      </div>
      
      <DashboardSummary dashboardData={dashboardData} user={user} />
    </>
  );
}