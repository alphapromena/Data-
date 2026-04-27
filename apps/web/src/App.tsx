import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { applyDirection } from './lib/i18n';
import { DashboardPage } from './pages/Dashboard';
import { PlaceholderPage } from './pages/Placeholder';

export default function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    applyDirection(i18n.language);
  }, [i18n.language]);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/"         element={<DashboardPage />} />
          <Route path="/clients"  element={<PlaceholderPage titleKey="nav.clients"  />} />
          <Route path="/scans"    element={<PlaceholderPage titleKey="nav.scans"    />} />
          <Route path="/reports"  element={<PlaceholderPage titleKey="nav.reports"  />} />
          <Route path="/alerts"   element={<PlaceholderPage titleKey="nav.alerts"   />} />
          <Route path="/settings" element={<PlaceholderPage titleKey="nav.settings" />} />
        </Routes>
      </Layout>
    </Router>
  );
}
