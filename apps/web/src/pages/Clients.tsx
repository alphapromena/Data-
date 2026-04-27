import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clientsApi, type Client } from '../lib/api';

const STAGE_COLORS: Record<string, string> = {
  scan: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  monitor: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  govern: 'bg-green-500/10 text-green-400 border-green-500/20',
};

export function ClientsPage() {
  const { t } = useTranslation();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    clientsApi.list()
      .then(setClients)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-muted">{t('common.loading')}</div>;
  if (error) return <div className="text-critical">{t('common.error')}: {error}</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('nav.clients')}</h1>
        <span className="text-muted text-sm">{clients.length} total</span>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted border-b border-border bg-surface-2">
              <th className="text-start px-4 py-3 font-medium">Name (EN)</th>
              <th className="text-start px-4 py-3 font-medium">الاسم</th>
              <th className="text-start px-4 py-3 font-medium">Industry</th>
              <th className="text-start px-4 py-3 font-medium">Stage</th>
              <th className="text-start px-4 py-3 font-medium">Country</th>
              <th className="text-start px-4 py-3 font-medium">Email</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted">No clients found.</td></tr>
            ) : clients.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface-2 transition-colors">
                <td className="px-4 py-3 font-medium">{c.name_en}</td>
                <td className="px-4 py-3 font-arabic">{c.name_ar}</td>
                <td className="px-4 py-3 text-muted">{c.industry ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${STAGE_COLORS[c.stage] ?? ''}`}>
                    {t(`stage.${c.stage}`)}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">{c.country_code}</td>
                <td className="px-4 py-3 text-muted">{c.contact_email ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
