import React from "react";
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from "./contexts/AuthContext";
import AppRouter from "@/routes/AppRouter";
import { queryClient } from "./hooks/useQueryClient";

// Debug tools apenas em desenvolvimento
if (import.meta.env.DEV) {
  import('./debug/apiTester.js');
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRouter />
        {/* DevTools apenas em desenvolvimento */}
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;