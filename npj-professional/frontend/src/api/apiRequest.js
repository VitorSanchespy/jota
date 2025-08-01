const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

export async function apiRequest(endpoint, { method = "GET", token, body } = {}) {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  console.log(`🌐 API Request: ${method} ${url}`, {
    hasToken: !!token,
    tokenLength: token?.length,
    body: body ? (body instanceof FormData ? 'FormData' : JSON.stringify(body)) : 'none'
  });

  const headers = {};
  if (!(body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const options = { method, headers };
  if (body instanceof FormData) {
    options.body = body;
  } else if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    
    console.log(`📡 API Response: ${response.status} ${response.statusText}`, {
      url,
      status: response.status,
      ok: response.ok
    });

    if (!response.ok) {
      let message = `Erro ${response.status}: ${response.statusText}`;
      try {
        const data = await response.json();
        message = data.message || data.error || message;
        console.error('❌ API Error Details:', data);
      } catch (err) {
        console.error('❌ Erro ao interpretar resposta de erro:', err);
      }
      throw new Error(message);
    }
    
    if (response.status === 204) return null;
    
    const data = await response.json();
    console.log(`✅ API Success:`, { url, dataLength: JSON.stringify(data).length });
    return data;
    
  } catch (error) {
    console.error('❌ API Request Failed:', { url, error: error.message });
    throw error;
  }
}

export async function uploadFile(formData, token) {
  // Remove qualquer campo 'token' do FormData (caso exista)
  if (formData.has && formData.has('token')) {
    formData.delete('token');
  }
  
  const endpoint = '/api/arquivos/upload';
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${token}` // token JWT aqui!
      // NÃO coloque Content-Type, o browser define para multipart/form-data
    }
  });
  if (!response.ok) {
    let message = `Erro ${response.status}: ${response.statusText}`;
    try {
      const data = await response.json();
      message = data.message || data.error || message;
    } catch (err) {
      console.error('Erro ao interpretar resposta:', err);
    }
    throw new Error(message);
  }
  return await response.json();
}