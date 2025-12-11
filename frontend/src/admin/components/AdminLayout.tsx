import { ReactNode, useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import './AdminLayout.css';

interface AdminLayoutProps {
  children?: ReactNode;
}

const menuItems = [
  { path: '/admin', icon: '📊', label: 'Дашборд' },
  { path: '/admin/games', icon: '🎲', label: 'Игры' },
  { path: '/admin/tournaments', icon: '🏆', label: 'Турниры' },
  { path: '/admin/quests', icon: '📜', label: 'Квесты' },
  { path: '/admin/city', icon: '🏙️', label: 'Город' },
  { path: '/admin/users', icon: '👥', label: 'Пользователи' },
  { path: '/admin/settings', icon: '⚙️', label: 'Настройки' },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : ''}`}>
        <div className="admin-sidebar__header">
          <h2 className="admin-sidebar__logo">🎲 Админ-панель</h2>
          <button
            className="admin-sidebar__toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>
        <nav className="admin-sidebar__nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`admin-sidebar__item ${
                location.pathname === item.path ? 'admin-sidebar__item--active' : ''
              }`}
            >
              <span className="admin-sidebar__icon">{item.icon}</span>
              {sidebarOpen && <span className="admin-sidebar__label">{item.label}</span>}
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar__footer">
          <Link to="/" className="admin-sidebar__back">
            ← Вернуться в приложение
          </Link>
        </div>
      </aside>
      <main className="admin-main">
        {children || <Outlet />}
      </main>
    </div>
  );
};

