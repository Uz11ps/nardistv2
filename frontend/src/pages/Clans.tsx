import { Link } from 'react-router-dom';
import { Card, Button } from '../components/ui';
import { mockClans, mockUser } from '../mock';
import './Clans.css';

export const Clans = () => {
  const userClan = mockClans.find((c) => c.members.some((m) => m.userId === mockUser.id));

  return (
    <div className="clans-page">
      <div className="clans-page__header">
        <h1 className="clans-page__title">👥 Кланы</h1>
        <Button variant="primary">➕ Создать клан</Button>
      </div>

      {userClan && (
        <Card className="clans-page__user-clan">
          <div className="clans-page__user-clan-header">
            <h2 className="clans-page__user-clan-title">Ваш клан</h2>
            <Link to={`/clans/${userClan.id}`}>
              <Button variant="outline" size="sm">
                Открыть →
              </Button>
            </Link>
          </div>
          <div className="clans-page__user-clan-info">
            <div className="clans-page__clan-name">👑 {userClan.name}</div>
            {userClan.description && (
              <p className="clans-page__clan-description">{userClan.description}</p>
            )}
            <div className="clans-page__clan-stats">
              <span>💰 Казна: {userClan.treasury.toLocaleString()} NAR</span>
              <span>👥 Участников: {userClan.members.length}</span>
              <span>🏙️ Районов: {userClan.districts.length}</span>
            </div>
          </div>
        </Card>
      )}

      <div className="clans-page__section">
        <h2 className="clans-page__section-title">Все кланы</h2>
        <div className="clans-page__list">
          {mockClans.map((clan) => (
            <Link key={clan.id} to={`/clans/${clan.id}`}>
              <Card className="clans-page__clan-card">
                <div className="clans-page__clan-card-header">
                  <div className="clans-page__clan-card-name">👑 {clan.name}</div>
                  {clan.id === userClan?.id && (
                    <span className="clans-page__clan-card-badge">Ваш клан</span>
                  )}
                </div>
                {clan.description && (
                  <p className="clans-page__clan-card-description">{clan.description}</p>
                )}
                <div className="clans-page__clan-card-stats">
                  <div className="clans-page__clan-card-stat">
                    <span className="clans-page__clan-card-stat-icon">💰</span>
                    <span className="clans-page__clan-card-stat-value">
                      {clan.treasury.toLocaleString()} NAR
                    </span>
                  </div>
                  <div className="clans-page__clan-card-stat">
                    <span className="clans-page__clan-card-stat-icon">👥</span>
                    <span className="clans-page__clan-card-stat-value">{clan.members.length}</span>
                  </div>
                  <div className="clans-page__clan-card-stat">
                    <span className="clans-page__clan-card-stat-icon">🏙️</span>
                    <span className="clans-page__clan-card-stat-value">{clan.districts.length}</span>
                  </div>
                </div>
                <div className="clans-page__clan-card-arrow">→</div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

