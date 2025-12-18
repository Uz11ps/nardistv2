import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Home.css';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="home">
      <h1>Nardist</h1>
      <p>Добро пожаловать, {user?.firstName || 'Игрок'}!</p>
      
      <div className="menu">
        <Link to="/game/new" className="menu-item">
          <h2>Быстрая игра</h2>
          <p>Найти соперника</p>
        </Link>
        
        <Link to="/game/bot" className="menu-item">
          <h2>Игра с ботом</h2>
          <p>Тренировка</p>
        </Link>
        
        <Link to="/tournaments" className="menu-item">
          <h2>Турниры</h2>
          <p>Соревнования</p>
        </Link>
        
        <Link to="/profile" className="menu-item">
          <h2>Профиль</h2>
          <p>Статистика и настройки</p>
        </Link>
      </div>
    </div>
  );
}
