import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import FullRegisterPage from "@/pages/auth/FullRegisterPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import HomePage from "@/pages/HomePage";
import ProfilePage from "@/pages/dashboard/ProfilePage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import ProcessListPage from "@/pages/dashboard/ProcessListPage";
import ProcessDetailPage from "../pages/dashboard/ProcessDetailPage";
import ProcessFormPage from "@/pages/dashboard/ProcessFormPage";
import ProcessEditPage from "../pages/dashboard/ProcessEditPage";
import ProcessAssignStudentPage from "@/pages/dashboard/ProcessAssignStudentPage";
import ProcessUpdatesPage from "@/pages/dashboard/ProcessUpdatePage";
import UserListPage from "@/pages/dashboard/UserListPage";
import UserDetailPage from "@/pages/dashboard/UserDetailPage";
import UserEditPage from "@/pages/dashboard/UserEditPage";
import ArquivosPage from "@/pages/dashboard/ArquivosPage";
import AgendamentosPage from "@/pages/AgendamentosPage";
import { hasRole } from "@/utils/permissions";

function PrivateRoute({ children, roles }) {
  const { isAuthenticated, user, loading } = useAuthContext();
  if (loading) return <div>Carregando...</div>;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (roles && !hasRole(user, roles)) return <Navigate to="/" replace />;
  return <MainLayout>{children}</MainLayout>;
}

function frontendToBackendUrl(url) {
  return url.replace('localhost:5173', process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace(/https?:\/\//, '') : 'localhost:3001');
}

export default function AppRouter() {
  return (
    <Router>
      <Routes>
          <Route path="/" element={<HomePage />} />
          {/* Público */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/registrar" element={<RegisterPage />} />
          <Route path="/registrar-completo" element={<FullRegisterPage />} />
          <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
          <Route path="/resetar-senha" element={<ResetPasswordPage />} />
          
          {/* Protegido: Todos autenticados */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            }
          />
          <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} /> 
          <Route path="/arquivos" element={<PrivateRoute><ArquivosPage /></PrivateRoute>} /> 
          <Route path="/agendamentos" element={<PrivateRoute><AgendamentosPage /></PrivateRoute>} /> 
          {/* Protegido: Admin */}
          {/* Usuários (admin/professor) */}
          <Route path="/usuarios" element={<PrivateRoute roles={["Professor", "Admin"]}><UserListPage /></PrivateRoute>} />
          <Route path="/usuarios/:id" element={<PrivateRoute roles={["Professor", "Admin"]}><UserDetailPage /></PrivateRoute>} />
          <Route path="/usuarios/:id/editar" element={<PrivateRoute roles={["Professor", "Admin"]}><UserEditPage /></PrivateRoute>} /> 
         

          {/* Processos */}
          <Route path="/processos" element={<PrivateRoute><ProcessListPage /></PrivateRoute>} />
          <Route path="/processos/:id" element={<PrivateRoute><ProcessDetailPage /></PrivateRoute>} />
          <Route path="/processos/:id/atualizacoes" element={<PrivateRoute><ProcessUpdatesPage /></PrivateRoute>} />
          <Route path="/processos/:id/editar" element={<PrivateRoute><ProcessEditPage /></PrivateRoute>} />
          {/* Rotas restritas para Professor/Admin */}
          <Route path="/processos/novo" element={<PrivateRoute roles={["Professor", "admin"]}><ProcessFormPage /></PrivateRoute>} />
          <Route path="/processos/:id/atribuir" element={<PrivateRoute roles={["Professor", "Admin"]}><ProcessAssignStudentPage /></PrivateRoute>} />
          {/* 404 */}
        <Route path="*" element={<div>Página não encontrada</div>} />
      </Routes>
    </Router>
  );
}