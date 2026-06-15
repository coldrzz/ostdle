import type { ReactNode } from 'react';
import './TacticalLayout.css';

interface TacticalLayoutProps {
  children: ReactNode;
  menu?: ReactNode;
  statusText?: string;
}

export function TacticalLayout({ children, menu, statusText }: TacticalLayoutProps) {
  return (
    <div className="tactical-layout">
      <header className="top-bar">
        <span className="top-bar__title">Game OST Guesser</span>
        {statusText && <span className="top-bar__status">{statusText}</span>}
      </header>

      <div className="central-panel">
        <div className="panel-content">
          <div className="panel-inner">
            {menu}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {children}
            </main>
          </div>
        </div>
      </div>

      <footer className="bottom-bar">
        <span className="bottom-bar__text">Classified — Audio Intelligence Division</span>
      </footer>
    </div>
  );
}
