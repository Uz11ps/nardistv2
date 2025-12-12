import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button } from '../components/ui';
import { clanService } from '../services';
import { useAuthStore } from '../store/auth.store';
import './Clans.css';

export const Clans = () => {
  const [clans, setClans] = useState<any[]>([]);
  const [userClan, setUserClan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    Promise.all([
      clanService.getAll().catch(() => []),
      clanService.getMyClan().catch(() => null),
    ])
      .then(([allClans, myClan]) => {
        setClans(allClans);
        setUserClan(myClan);
      })
      .catch((error) => {
        console.warn('Failed to load clans data:', error);
        setClans([]);
        setUserClan(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="clans-page">Загрузка...</div>;
  }

  return (
    <div className="clans-page">
      <div className="clans-page__header">
        <h1 className="clans-page__title">👥 Кланы</h1>
        <Button 
          variant="primary"
          onClick={async () => {
            try {
              const name = window.prompt('Введите название клана:');
              if (!name || name.trim() === '') {
                return;
              }
              const description = window.prompt('Введите описание клана (необязательно):') || '';
              await clanService.create({ name: name.trim(), description: description.trim() });
              alert('Клан создан!');
              window.location.reload();
            } catch (error: any) {
              alert(error.response?.data?.message || 'Ошибка при создании клана');
              console.error('Error creating clan:', error);
            }
          }}
        >
          ➕ Создать клан
        </Button>
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
          {clans.map((clan) => (
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
                      {(clan.treasury || 0).toLocaleString()} NAR
                    </span>
                  </div>
                  <div className="clans-page__clan-card-stat">
                    <span className="clans-page__clan-card-stat-icon">👥</span>
                    <span className="clans-page__clan-card-stat-value">{clan.members?.length || 0}</span>
                  </div>
                  <div className="clans-page__clan-card-stat">
                    <span className="clans-page__clan-card-stat-icon">🏙️</span>
                    <span className="clans-page__clan-card-stat-value">{clan.districts?.length || 0}</span>
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

