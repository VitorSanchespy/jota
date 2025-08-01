import React from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function QueryStatus() {
  const queryClient = useQueryClient();
  const queryCache = queryClient.getQueryCache();
  const queries = queryCache.getAll();
  
  // Contar queries por status
  const stats = queries.reduce((acc, query) => {
    const state = query.state;
    if (state.status === 'loading') acc.loading++;
    else if (state.status === 'error') acc.error++;
    else if (state.status === 'success') acc.success++;
    
    if (state.isFetching) acc.fetching++;
    return acc;
  }, { loading: 0, error: 0, success: 0, fetching: 0 });

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      backgroundColor: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '12px 16px',
      borderRadius: 8,
      fontSize: 12,
      fontFamily: 'monospace',
      zIndex: 9999,
      minWidth: 200
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#4CAF50' }}>
        📊 TanStack Query Status
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Total Queries:</span>
          <span style={{ fontWeight: 'bold' }}>{queries.length}</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>✅ Success:</span>
          <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>{stats.success}</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>⏳ Loading:</span>
          <span style={{ color: '#FF9800', fontWeight: 'bold' }}>{stats.loading}</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>🔄 Fetching:</span>
          <span style={{ color: '#2196F3', fontWeight: 'bold' }}>{stats.fetching}</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>❌ Error:</span>
          <span style={{ color: '#F44336', fontWeight: 'bold' }}>{stats.error}</span>
        </div>
      </div>
      
      {stats.fetching > 0 && (
        <div style={{ 
          marginTop: 8, 
          padding: 4, 
          backgroundColor: 'rgba(33, 150, 243, 0.2)', 
          borderRadius: 4,
          textAlign: 'center',
          color: '#2196F3',
          fontWeight: 'bold'
        }}>
          🔄 Sincronizando dados...
        </div>
      )}
      
      <div style={{ 
        marginTop: 8, 
        fontSize: 10, 
        color: '#999',
        textAlign: 'center'
      }}>
        Pressione F12 → React Query DevTools
      </div>
    </div>
  );
}
