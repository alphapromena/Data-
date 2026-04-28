import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NAV_ITEMS = [
  { key: 'dashboard',  path: '/',         icon: '⊞' },
  { key: 'clients',    path: '/clients',  icon: '🏢' },
  { key: 'scans',      path: '/scans',    icon: '🔍' },
  { key: 'reports',    path: '/reports',  icon: '📄' },
  { key: 'alerts',     path: '/alerts',   icon: '🔔' },
  { key: 'demo',        path: '/demo',     icon: '▶' },
] as const;

export function Sidebar() {
  const { t } = useTranslation();

  return (
    <aside className="w-64 shrink-0 bg-surface border-e border-border flex flex-col gap-6 px-3 py-5">
      {/* Brand */}
      <div className="flex items-center gap-3 px-2">
        <div className="w-9 h-9 rounded-xl bg-accent-soft text-accent text-xl grid place-items-center font-bold select-none">
          م
        </div>
        <div>
          <div className="font-bold text-lg leading-tight">{t('app.name')}</div>
          <div className="text-muted text-xs">{t('app.tagline')}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ key, path, icon }) => (
          <NavLink
            key={key}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors text-sm ` +
              (isActive
                ? 'bg-accent-soft text-accent'
                : 'text-muted hover:bg-surface-2 hover:text-text')
            }
          >
            <span className="text-base">{icon}</span>
            {t(`nav.${key}`)}
          </NavLink>
        ))}
      </nav>

      {/* Stage badge */}
      <div className="mt-auto px-2">
        <div className="text-xs text-muted mb-2 font-medium uppercase tracking-wider">
          AlphaPro Consulting
        </div>
        <div className="flex gap-1">
          {(['scan', 'monitor', 'govern'] as const).map((s) => (
            <span
              key={s}
              className="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-muted border border-border"
            >
              {t(`stage.${s}`)}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}
