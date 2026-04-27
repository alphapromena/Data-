import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts';
import { clientsApi, scansApi, alertsApi, type Client, type Scan, type Alert } from '../lib/api';

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="text-muted text-sm mb-2">{label}</div>
      <div className="text-3xl font-bold text-text">{value}</div>
      {sub && <div className="text-muted text-xs mt-1">{sub}</div>}
    </div>
  );
}

function DmiGauge({ score, grade }: { score: number; grade: string }) {
  const { t } = useTranslation();
  const gradeColor: Record<string, string> = {
    A: '#22c55e', B: '#86efac', C: '#eab308', D: '#f97316', E: '#ef4444',
  };
  const data = [{ name: 'DMI', value: score, fill: gradeColor[grade] ?? '#4f8cff' }];

  return (
    <div className="bg-surface border border-border rounded-xl p-5 flex flex-col items-center">
      <div className="text-muted text-sm mb-3">{t('dashboard.dmi')}</div>
      <div className="relative w-40 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%" cy="50%" innerRadius="70%" outerRadius="100%"
            startAngle={180} endAngle={-180}
            data={[{ value: 100, fill: '#243056' }, ...data]}
          >
            <RadialBar dataKey="value" cornerRadius={6} background={false} />
            <Tooltip formatter={(v: number) => [`${v}`, 'Score']} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-text">{score}</span>
          <span className="text-sm font-semibold" style={{ color: gradeColor[grade] ?? '#4f8cff' }}>
            {grade}
          </span>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { t } = useTranslation();
  const [clients, setClients] = useState<Client[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([clientsApi.list(), scansApi.list()])
      .then(([c, s]) => { setClients(c); setScans(s); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const activeClients = clients.filter((c) => c.is_active).length;
  const activeScans = scans.filter((s) => s.status === 'running').length;
  const completedScans = scans.filter((s) => s.status === 'completed').length;

  // Mock DMI for display until real data is available
  const mockDmi = { score: 62, grade: 'C' };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label={t('dashboard.clients')} value={activeClients} sub={t('stage.scan') + ' / ' + t('stage.monitor')} />
        <KpiCard label={t('dashboard.active_scans')} value={activeScans} />
        <KpiCard label="Completed Scans" value={completedScans} />
        <KpiCard label={t('dashboard.open_alerts')} value={alerts.filter((a) => !a.is_acknowledged).length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DmiGauge score={mockDmi.score} grade={mockDmi.grade} />

        {/* Recent Scans */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-5">
          <div className="text-muted text-sm mb-3 font-medium">{t('nav.scans')}</div>
          {scans.length === 0 ? (
            <p className="text-muted text-sm">No scans yet.</p>
          ) : (
            <div className="space-y-2">
              {scans.slice(0, 5).map((scan) => {
                const statusColor: Record<string, string> = {
                  completed: 'text-optimized',
                  running: 'text-accent',
                  failed: 'text-critical',
                  pending: 'text-muted',
                };
                return (
                  <div key={scan.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <div className="text-sm font-medium">{scan.id.slice(0, 8)}…</div>
                      <div className="text-xs text-muted">{new Date(scan.created_at).toLocaleDateString()}</div>
                    </div>
                    <span className={`text-xs font-semibold ${statusColor[scan.status] ?? 'text-muted'}`}>
                      {scan.status.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Clients table */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="text-muted text-sm mb-3 font-medium">{t('nav.clients')}</div>
        {clients.length === 0 ? (
          <p className="text-muted text-sm">No clients yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted border-b border-border">
                  <th className="text-start pb-2 font-medium">Name (EN)</th>
                  <th className="text-start pb-2 font-medium">الاسم</th>
                  <th className="text-start pb-2 font-medium">Industry</th>
                  <th className="text-start pb-2 font-medium">Stage</th>
                  <th className="text-start pb-2 font-medium">Country</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface-2 transition-colors">
                    <td className="py-2.5">{c.name_en}</td>
                    <td className="py-2.5 font-arabic">{c.name_ar}</td>
                    <td className="py-2.5 text-muted">{c.industry ?? '—'}</td>
                    <td className="py-2.5">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent-soft text-accent border border-accent/20">
                        {c.stage}
                      </span>
                    </td>
                    <td className="py-2.5 text-muted">{c.country_code}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
