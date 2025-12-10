import { Link } from 'react-router-dom';
import { Card, Button, Tabs } from '../components/ui';
import { mockUser, mockRatings, mockGameHistory } from '../mock';
import './Profile.css';

export const Profile = () => {
  const tabs = [
    {
      id: 'info',
      label: 'Информация',
      content: <ProfileInfo />,
    },
    {
      id: 'stats',
      label: 'Статистика',
      content: <ProfileStats />,
    },
    {
      id: 'history',
      label: 'История',
      content: <ProfileHistory />,
    },
  ];

  return (
    <div className="profile-page">
      <div className="profile-page__header">
        <div className="profile-page__avatar">
          <img src={mockUser.avatar || mockUser.photoUrl || 'https://via.placeholder.com/100'} alt="Avatar" />
        </div>
        <div className="profile-page__info">
          <h1 className="profile-page__name">{mockUser.nickname || mockUser.firstName}</h1>
          <p className="profile-page__level">Уровень {mockUser.level}</p>
          <div className="profile-page__xp">
            <div className="profile-page__xp-bar">
              <div className="profile-page__xp-fill" style={{ width: '65%' }} />
            </div>
            <span>{mockUser.xp} XP</span>
          </div>
        </div>
      </div>
      <Tabs tabs={tabs} />
    </div>
  );
};

const ProfileInfo = () => {
  return (
    <div className="profile-info">
      <Card>
        <div className="profile-info__item">
          <span className="profile-info__label">Имя:</span>
          <span className="profile-info__value">{mockUser.firstName} {mockUser.lastName}</span>
        </div>
        <div className="profile-info__item">
          <span className="profile-info__label">Никнейм:</span>
          <span className="profile-info__value">{mockUser.nickname || 'Не установлен'}</span>
        </div>
        <div className="profile-info__item">
          <span className="profile-info__label">Страна:</span>
          <span className="profile-info__value">{mockUser.country || 'Не указана'}</span>
        </div>
        <div className="profile-info__item">
          <span className="profile-info__label">Реферальный код:</span>
          <span className="profile-info__value">{mockUser.referralCode}</span>
        </div>
        <Button variant="outline" fullWidth>
          Редактировать профиль
        </Button>
      </Card>
      <div className="profile-info__links">
        <Link to="/city">
          <Button variant="ghost" fullWidth>🏙️ Город</Button>
        </Link>
        <Link to="/quests">
          <Button variant="ghost" fullWidth>📋 Квесты</Button>
        </Link>
        <Link to="/subscription">
          <Button variant="ghost" fullWidth>⭐ Подписка</Button>
        </Link>
        <Link to="/skins">
          <Button variant="ghost" fullWidth>🎨 Скины</Button>
        </Link>
      </div>
    </div>
  );
};

const ProfileStats = () => {
  const shortRating = mockRatings.find((r) => r.mode === 'SHORT');
  const longRating = mockRatings.find((r) => r.mode === 'LONG');

  return (
    <div className="profile-stats">
      <Card>
        <h3>Короткие нарды</h3>
        <div className="profile-stats__rating">{shortRating?.rating || 1500}</div>
        <div className="profile-stats__record">
          Побед: {shortRating?.wins || 0} | Поражений: {shortRating?.losses || 0}
        </div>
      </Card>
      <Card>
        <h3>Длинные нарды</h3>
        <div className="profile-stats__rating">{longRating?.rating || 1500}</div>
        <div className="profile-stats__record">
          Побед: {longRating?.wins || 0} | Поражений: {longRating?.losses || 0}
        </div>
      </Card>
      <Card>
        <h3>Ресурсы</h3>
        <div className="profile-stats__resources">
          <div>💰 {mockUser.narCoin} NAR-coin</div>
          <div>⚡ {mockUser.energy}/{mockUser.energyMax} Энергия</div>
          <div>❤️ {mockUser.lives}/{mockUser.livesMax} Жизни</div>
        </div>
      </Card>
    </div>
  );
};

const ProfileHistory = () => {
  return (
    <div className="profile-history">
      {mockGameHistory.map((game) => (
        <Card key={game.id} className="profile-history__item">
          <div className="profile-history__header">
            <span>{game.mode === 'SHORT' ? 'Короткие' : 'Длинные'} нарды</span>
            <span className={game.winnerId === mockUser.id ? 'profile-history__win' : 'profile-history__loss'}>
              {game.winnerId === mockUser.id ? 'Победа' : 'Поражение'}
            </span>
          </div>
          <div className="profile-history__opponent">
            Против: {game.whitePlayerId === mockUser.id ? game.blackPlayer?.nickname : game.whitePlayer?.nickname}
          </div>
          <div className="profile-history__meta">
            <span>⏱️ {Math.floor(game.duration! / 60)}:{(game.duration! % 60).toString().padStart(2, '0')}</span>
            <span>{new Date(game.createdAt).toLocaleDateString('ru-RU')}</span>
          </div>
        </Card>
      ))}
    </div>
  );
};
