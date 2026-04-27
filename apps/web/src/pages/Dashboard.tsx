import { useTranslation } from 'react-i18next';

export function DashboardPage() {
  const { t } = useTranslation();
  return (
    <section>
      <h1>{t('dashboard.title')}</h1>
      <div className="kpi-grid">
        <article className="kpi-card">
          <div className="kpi-card__label">{t('dashboard.dmi')}</div>
          <div className="kpi-card__value">—</div>
        </article>
        <article className="kpi-card">
          <div className="kpi-card__label">{t('dashboard.active_scans')}</div>
          <div className="kpi-card__value">0</div>
        </article>
        <article className="kpi-card">
          <div className="kpi-card__label">{t('dashboard.open_alerts')}</div>
          <div className="kpi-card__value">0</div>
        </article>
        <article className="kpi-card">
          <div className="kpi-card__label">{t('dashboard.clients')}</div>
          <div className="kpi-card__value">0</div>
        </article>
      </div>
    </section>
  );
}
