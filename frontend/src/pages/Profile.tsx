import { useAuthStore } from '../store/auth.store';

export const Profile = () => {
  const { user } = useAuthStore();

  return (
    <div className="profile">
      <h2>Профиль</h2>
      <div className="profile-info">
        <p>Имя: {user?.firstName} {user?.lastName}</p>
        <p>Никнейм: {user?.nickname || 'Не установлен'}</p>
        <p>Уровень: {user?.level}</p>
        <p>Опыт: {user?.xp}</p>
        <p>Монеты: {user?.narCoin}</p>
      </div>
    </div>
  );
};

