import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TacticalLayout } from '@/components/layout/TacticalLayout';
import { TacticalMenu } from '@/components/layout/TacticalMenu';
import { HomePage } from '@/pages/HomePage';
import { GamePage } from '@/pages/GamePage';
import { PreviousLevelsPage } from '@/pages/PreviousLevelsPage';
import { AdminPage } from '@/pages/AdminPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppLayout({ children, statusText }: { children: ReactNode; statusText?: string }) {
  return (
    <TacticalLayout menu={<TacticalMenu />} statusText={statusText}>
      {children}
    </TacticalLayout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="scanline" aria-hidden="true" />
        <Routes>
          <Route
            path="/"
            element={
              <AppLayout>
                <HomePage />
              </AppLayout>
            }
          />
          <Route
            path="/play/daily"
            element={
              <AppLayout statusText="Nivel del día">
                <GamePage />
              </AppLayout>
            }
          />
          <Route
            path="/play/:levelNumber"
            element={
              <AppLayout statusText="En juego">
                <GamePage />
              </AppLayout>
            }
          />
          <Route
            path="/levels"
            element={
              <AppLayout statusText="Archivo">
                <PreviousLevelsPage />
              </AppLayout>
            }
          />
          <Route
            path="/admin"
            element={
              <AppLayout statusText="Admin">
                <AdminPage />
              </AppLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
