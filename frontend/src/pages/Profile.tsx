import { useAuth } from '../hooks/useAuth';
import './Profile.css';

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="profile">
      <h1>Профиль</h1>
      {user && (
        <div className="profile-info">
          <p>Уровень: {user.level}</p>
          <p>XP: {user.xp}</p>
          <p>NAR Coins: {user.narCoins}</p>
          <p>Энергия: {user.energy}/{user.maxEnergy}</p>
        </div>
      )}
    </div>
  );
}
