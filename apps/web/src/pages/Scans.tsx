import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { scansApi, type Scan } from '../lib/api';

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-500/10 text-green-400 border-green-500/20',
  running:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  failed:    'bg-red-500/10 text-red-400 border-red-500/20',
  pending:   'bg-gray-500/10 text-gray-400 border-gray-500/20',
  cancelled: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

export function ScansPage() {
  const { t } = useTranslation();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    scansApi.list()
      .then(setScans)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-muted">{t('common.loading')}</div>;
  if (error) return <div className="text-critical">{t('common.error')}: {error}</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('nav.scans')}</h1>
        <span className="text-muted text-sm">{scans.length} total</span>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted border-b border-border bg-surface-2">
              <th className="text-start px-4 py-3 font-medium">Scan ID</th>
              <th className="text-start px-4 py-3 font-medium">Stage</th>
              <th className="text-start px-4 py-3 font-medium">Status</th>
              <th className="text-start px-4 py-3 font-medium">Started</th>
              <th className="text-start px-4 py-3 font-medium">Completed</th>
            </tr>
          </thead>
          <tbody>
            {scans.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-muted">No scans found.</td></tr>
            ) : scans.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0 hover:bg-surface-2 transition-colors">
                <td className="px-4 py-3 font-mono text-xs">{s.id.slice(0, 16)}…</td>
                <td className="px-4 py-3 text-muted">{t(`stage.${s.stage}`)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[s.status] ?? ''}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted text-xs">
                  {s.started_at ? new Date(s.started_at).toLocaleString() : '—'}
                </td>
                <td className="px-4 py-3 text-muted text-xs">
                  {s.completed_at ? new Date(s.completed_at).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
