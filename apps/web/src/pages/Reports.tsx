import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { reportsApi, type Report } from '../lib/api';

const STATUS_COLORS: Record<string, string> = {
  draft:     'bg-gray-500/10 text-gray-400 border-gray-500/20',
  generated: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  delivered: 'bg-green-500/10 text-green-400 border-green-500/20',
};

export function ReportsPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reports require a client_id — show empty state until client is selected
  if (loading) return <div className="text-muted">{t('common.loading')}</div>;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">{t('nav.reports')}</h1>

      <div className="bg-surface border border-border rounded-xl p-8 text-center">
        <div className="text-4xl mb-3">📄</div>
        <p className="text-muted text-sm">
          {isAr
            ? 'اختر عميلاً لعرض تقاريره.'
            : 'Select a client to view their reports.'}
        </p>
        <p className="text-muted text-xs mt-2">
          {isAr
            ? 'يتم إنشاء التقارير تلقائياً بعد اكتمال الفحص.'
            : 'Reports are generated automatically after a scan completes.'}
        </p>
      </div>
    </div>
  );
}
