import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';

const items = [
  { to: '/',        key: 'nav.dashboard' },
  { to: '/clients', key: 'nav.clients'   },
  { to: '/scans',   key: 'nav.scans'     },
  { to: '/reports', key: 'nav.reports'   },
  { to: '/alerts',  key: 'nav.alerts'    },
  { to: '/settings',key: 'nav.settings'  },
] as const;

export function Sidebar() {
  const { t } = useTranslation();
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__logo">⚖︎</span>
        <div>
          <div className="sidebar__brand-name">{t('app.name')}</div>
          <div className="sidebar__brand-tag">{t('app.tagline')}</div>
        </div>
      </div>
      <nav className="sidebar__nav">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === '/'}
            className={({ isActive }) => `sidebar__link${isActive ? ' is-active' : ''}`}
          >
            {t(it.key)}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
