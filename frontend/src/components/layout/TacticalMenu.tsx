import { useNavigate, useLocation } from 'react-router-dom';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import './TacticalMenu.css';

interface MenuItem {
  id: string;
  label: string;
  path: string;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'home', label: 'Inicio', path: '/' },
  { id: 'daily', label: 'Nivel del día', path: '/play/daily' },
  { id: 'archive', label: 'Niveles anteriores', path: '/levels' },
];

interface TacticalMenuProps {
  extraItems?: MenuItem[];
}

export function TacticalMenu({ extraItems = [] }: TacticalMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { playHover, playClick } = useSoundEffects();

  const items = [...MENU_ITEMS, ...extraItems];

  return (
    <nav className="tactical-menu" aria-label="Navegación principal">
      {items.map((item) => {
        const isActive =
          item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);

        return (
          <button
            key={item.id}
            className={`tactical-menu__item${isActive ? ' tactical-menu__item--active' : ''}`}
            onClick={() => {
              playClick();
              navigate(item.path);
            }}
            onMouseEnter={playHover}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
