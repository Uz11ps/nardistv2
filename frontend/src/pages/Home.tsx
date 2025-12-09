import { useAuthStore } from '../store/auth.store';

export const Home = () => {
  const { user } = useAuthStore();

  return (
    <div className="home">
      <h1>Добро пожаловать, {user?.firstName}!</h1>
      <div className="stats">
        <div className="stat">
          <span>Уровень: {user?.level}</span>
        </div>
        <div className="stat">
          <span>XP: {user?.xp}</span>
        </div>
        <div className="stat">
          <span>NAR-coin: {user?.narCoin}</span>
        </div>
      </div>
    </div>
  );
};

