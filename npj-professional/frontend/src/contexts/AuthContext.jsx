import React, { createContext, useState, useEffect, useContext } from "react";
import { authService } from "../api/services";
import Loader from "../components/common/Loader"; 

const AuthContext = createContext();


export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const local = localStorage.getItem("user");
    const userData = local ? JSON.parse(local) : null;
    
    // Debug: mostrar dados do usuário carregado apenas uma vez
    if (userData && !window.userLoggedOnce) {
      console.log('👤 Usuário carregado do localStorage:', {
        nome: userData.nome,
        role: userData.role,
        roleId: userData.role_id,
        id: userData.id
      });
      window.userLoggedOnce = true;
    }
    
    return userData;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem("refreshToken") || "");
  const [loading, setLoading] = useState(false);

  // Persistência simples
  useEffect(() => {
    if (user && token) {
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
    }
  }, [user, token, refreshToken]);

  // Verificar token válido na inicialização
  useEffect(() => {
    const verifyToken = async () => {
      if (token && !user) {
        try {
          setLoading(true);
          const profileData = await authService.getProfile(token);
          setUser(profileData);
        } catch (error) {
          console.error('Token inválido:', error);
          logout();
        } finally {
          setLoading(false);
        }
      } else if (!token && !user) {
        setLoading(false);
      }
    };
    verifyToken();
  }, [token]);

  const login = async (email, senha) => {
    setLoading(true);
    try {
      const data = await authService.login(email, senha);
      if (data.success) {
        setUser(data.usuario);
        setToken(data.token);
        setRefreshToken(data.refreshToken);
        setLoading(false);
        return { success: true };
      } else {
        setLoading(false);
        return { success: false, message: data.message || "Erro ao fazer login" };
      }
    } catch (err) {
      setLoading(false);
      return { success: false, message: err.message || "Erro ao fazer login" };
    }
  };

  // Função para tentar renovar o token automaticamente
  const tryRefreshToken = async () => {
    if (!refreshToken) return false;
    try {
      const data = await authService.refreshToken(refreshToken);
      if (data.token) {
        setToken(data.token);
        localStorage.setItem("token", data.token);
        return true;
      }
      return false;
    } catch (err) {
      logout();
      return false;
    }
  };

  const register = async (nome, email, senha, role_id = 2) => {
    setLoading(true);
    try {
      await authService.register(nome, email, senha, role_id);
      setLoading(false);
      return { success: true };
    } catch (err) {
      setLoading(false);
      return { success: false, message: err.message || "Erro ao registrar" };
    }
  };

  const forgotPassword = async (email) => {
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setLoading(false);
      return { success: true };
    } catch (err) {
      setLoading(false);
      return { success: false, message: err.message || "Erro ao solicitar recuperação" };
    }
  };

  const logout = () => {
    setUser(null);
    setToken("");
    setRefreshToken("");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
  };

  if (loading) return <Loader text="Verificando autenticação..." />;
  
  // Função utilitária para requisições autenticadas com auto-refresh
  const fetchWithAuth = async (fn, ...args) => {
    try {
      return await fn(token, ...args);
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('401')) {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
          return await fn(localStorage.getItem("token"), ...args);
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser, 
      token, 
      refreshToken,
      login, 
      register, 
      forgotPassword, 
      logout, 
      loading, 
      isAuthenticated: !!user,
      fetchWithAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}