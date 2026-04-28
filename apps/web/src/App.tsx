import { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AlertsPage } from './pages/Alerts';
import { ClientsPage } from './pages/Clients';
import { Dashboard } from './pages/Dashboard';
import { ReportsPage } from './pages/Reports';
import { ScansPage } from './pages/Scans';
import ScanDemo from './pages/ScanDemo';

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/scans" element={<ScansPage />} />
          <Route path="/demo" element={<ScanDemo />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
