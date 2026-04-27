import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const SEVERITY_COLORS: Record<string, string> = {
  info:     'bg-blue-500/10 text-blue-400 border-blue-500/20',
  warning:  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export function AlertsPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">{t('nav.alerts')}</h1>

      <div className="bg-surface border border-border rounded-xl p-8 text-center">
        <div className="text-4xl mb-3">🔔</div>
        <p className="text-muted text-sm">
          {isAr
            ? 'لا توجد تنبيهات نشطة.'
            : 'No active alerts.'}
        </p>
        <p className="text-muted text-xs mt-2">
          {isAr
            ? 'يتم إنشاء التنبيهات تلقائياً عند انخفاض جودة البيانات عن الحد المحدد.'
            : 'Alerts are triggered automatically when data quality drops below defined thresholds.'}
        </p>
      </div>
    </div>
  );
}
