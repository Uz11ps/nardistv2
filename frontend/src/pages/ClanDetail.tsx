import { useParams, Link } from 'react-router-dom';
import { Card, Button } from '../components/ui';
import { mockClans, mockDistricts, mockUser } from '../mock';
import './ClanDetail.css';

export const ClanDetail = () => {
  const { id } = useParams<{ id: string }>();
  const clanId = parseInt(id || '0');
  const clan = mockClans.find((c) => c.id === clanId);
  const isMember = clan?.members.some((m) => m.userId === mockUser.id);
  const isLeader = clan?.leaderId === mockUser.id;

  if (!clan) {
    return (
      <div className="clan-detail">
        <Card>
          <p>Клан не найден</p>
          <Link to="/clans">
            <Button variant="outline">Вернуться к кланам</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="clan-detail">
      <div className="clan-detail__header">
        <Link to="/clans" className="clan-detail__back">
          ← Назад к кланам
        </Link>
        <div className="clan-detail__title-section">
          <h1 className="clan-detail__title">👑 {clan.name}</h1>
          {clan.description && <p className="clan-detail__description">{clan.description}</p>}
        </div>
      </div>

      <div className="clan-detail__stats">
        <Card className="clan-detail__stat-card">
          <div className="clan-detail__stat-icon">💰</div>
          <div className="clan-detail__stat-info">
            <div className="clan-detail__stat-label">Казна</div>
            <div className="clan-detail__stat-value">{clan.treasury.toLocaleString()} NAR</div>
          </div>
        </Card>
        <Card className="clan-detail__stat-card">
          <div className="clan-detail__stat-icon">👥</div>
          <div className="clan-detail__stat-info">
            <div className="clan-detail__stat-label">Участников</div>
            <div className="clan-detail__stat-value">{clan.members.length}</div>
          </div>
        </Card>
        <Card className="clan-detail__stat-card">
          <div className="clan-detail__stat-icon">🏙️</div>
          <div className="clan-detail__stat-info">
            <div className="clan-detail__stat-label">Районов</div>
            <div className="clan-detail__stat-value">{clan.districts.length}</div>
          </div>
        </Card>
      </div>

      {clan.districts.length > 0 && (
        <Card className="clan-detail__section">
          <h3 className="clan-detail__section-title">Контролируемые районы</h3>
          <div className="clan-detail__districts">
            {clan.districts.map((district) => (
              <Link key={district.id} to={`/city/district/${district.id}`}>
                <Card className="clan-detail__district-card">
                  <div className="clan-detail__district-icon">{district.icon}</div>
                  <div className="clan-detail__district-info">
                    <div className="clan-detail__district-name">{district.name}</div>
                    <div className="clan-detail__district-description">{district.description}</div>
                  </div>
                  <div className="clan-detail__district-arrow">→</div>
                </Card>
              </Link>
            ))}
          </div>
        </Card>
      )}

      <Card className="clan-detail__section">
        <h3 className="clan-detail__section-title">Участники</h3>
        <div className="clan-detail__members">
          {clan.members.map((member) => (
            <div key={member.id} className="clan-detail__member">
              <div className="clan-detail__member-info">
                <div className="clan-detail__member-name">
                  {member.user?.nickname || member.user?.firstName || `Игрок #${member.userId}`}
                  {member.role === 'LEADER' && ' 👑'}
                  {member.role === 'OFFICER' && ' ⭐'}
                </div>
                <div className="clan-detail__member-role">
                  {member.role === 'LEADER'
                    ? 'Лидер'
                    : member.role === 'OFFICER'
                    ? 'Офицер'
                    : 'Участник'}
                </div>
              </div>
              {isLeader && member.role !== 'LEADER' && (
                <Button variant="outline" size="sm">
                  Действия
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {!isMember && (
        <Card className="clan-detail__join">
          <h3 className="clan-detail__section-title">Присоединиться к клану</h3>
          <p className="clan-detail__join-description">
            Станьте частью этого клана и получите доступ к клановым функциям
          </p>
          <Button variant="primary" fullWidth>
            Подать заявку
          </Button>
        </Card>
      )}

      {isLeader && (
        <Card className="clan-detail__management">
          <h3 className="clan-detail__section-title">Управление кланом</h3>
          <div className="clan-detail__management-actions">
            <Button variant="outline" fullWidth>
              💰 Управление казной
            </Button>
            <Button variant="outline" fullWidth>
              👥 Управление участниками
            </Button>
            <Button variant="outline" fullWidth>
              ⚙️ Настройки клана
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

