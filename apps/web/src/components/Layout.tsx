import type { ReactNode } from 'react';
import { LanguageToggle } from './LanguageToggle';
import { Sidebar } from './Sidebar';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="layout">
      <Sidebar />
      <div className="layout__main">
        <header className="topbar">
          <LanguageToggle />
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
