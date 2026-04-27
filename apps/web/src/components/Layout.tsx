import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { LanguageToggle } from './LanguageToggle';

interface Props { children: ReactNode; }

export function Layout({ children }: Props) {
  return (
    <div className="flex min-h-screen bg-bg text-text">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        {/* Topbar */}
        <header className="flex items-center justify-end px-6 py-3 bg-surface border-b border-border">
          <LanguageToggle />
        </header>
        <main className="flex-1 overflow-auto p-7">
          {children}
        </main>
      </div>
    </div>
  );
}
