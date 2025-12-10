import { Link, useLocation, Outlet } from 'react-router-dom';
import './Layout.css';

const navItems = [
  { path: '/', icon: '🏠', label: 'Главная' },
  { path: '/game', icon: '🎲', label: 'Игра' },
  { path: '/tournaments', icon: '🏆', label: 'Турниры' },
  { path: '/leaderboard', icon: '📊', label: 'Рейтинг' },
  { path: '/profile', icon: '👤', label: 'Профиль' },
];

export const Layout = () => {
  const location = useLocation();

  return (
    <div className="layout">
      <header className="layout__header">
        <h1 className="layout__logo">🎲 Нарды</h1>
      </header>
      <main className="layout__main">
        <Outlet />
      </main>
      <nav className="layout__nav">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`layout__nav-item ${location.pathname === item.path ? 'layout__nav-item--active' : ''}`}
          >
            <span className="layout__nav-icon">{item.icon}</span>
            <span className="layout__nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};
