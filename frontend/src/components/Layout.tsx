import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();

  return (
    <div className="layout">
      <nav className="navbar">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
          Главная
        </Link>
        <Link to="/game" className={location.pathname === '/game' ? 'active' : ''}>
          Игра
        </Link>
        <Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''}>
          Профиль
        </Link>
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

