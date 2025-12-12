import { Outlet } from 'react-router-dom';
import './Layout.css';

export const Layout = () => {
  return (
    <div className="layout">
      <main className="layout__main">
        <Outlet />
      </main>
    </div>
  );
};
