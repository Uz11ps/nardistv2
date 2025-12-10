import { Link } from 'react-router-dom';
import { Card, Button } from '../components/ui';
import { mockUser, mockRatings, mockQuests } from '../mock';
import './Home.css';

export const Home = () => {
  const shortRating = mockRatings.find((r) => r.mode === 'SHORT');
  const longRating = mockRatings.find((r) => r.mode === 'LONG');
  const activeQuests = mockQuests.filter((q) => !q.progress?.completed);

  return (
    <div className="home">
      <div className="home__header">
        <div className="home__greeting">
          <h1>Привет, {mockUser.nickname || mockUser.firstName}!</h1>
          <p className="home__level">Уровень {mockUser.level}</p>
        </div>
        <div className="home__avatar">
          <img src={mockUser.avatar || mockUser.photoUrl || 'https://via.placeholder.com/80'} alt="Avatar" />
        </div>
      </div>

      <div className="home__stats">
        <Card className="home__stat-card">
          <div className="home__stat-icon">💰</div>
          <div className="home__stat-info">
            <div className="home__stat-value">{mockUser.narCoin.toLocaleString()}</div>
            <div className="home__stat-label">NAR-coin</div>
          </div>
        </Card>
        <Card className="home__stat-card">
          <div className="home__stat-icon">⚡</div>
          <div className="home__stat-info">
            <div className="home__stat-value">{mockUser.energy}/{mockUser.energyMax}</div>
            <div className="home__stat-label">Энергия</div>
            <div className="home__stat-bar">
              <div
                className="home__stat-bar-fill"
                style={{ width: `${(mockUser.energy / mockUser.energyMax) * 100}%` }}
              />
            </div>
          </div>
        </Card>
        <Card className="home__stat-card">
          <div className="home__stat-icon">❤️</div>
          <div className="home__stat-info">
            <div className="home__stat-value">{mockUser.lives}/{mockUser.livesMax}</div>
            <div className="home__stat-label">Жизни</div>
            <div className="home__stat-bar">
              <div
                className="home__stat-bar-fill home__stat-bar-fill--lives"
                style={{ width: `${(mockUser.lives / mockUser.livesMax) * 100}%` }}
              />
            </div>
          </div>
        </Card>
        <Card className="home__stat-card">
          <div className="home__stat-icon">💪</div>
          <div className="home__stat-info">
            <div className="home__stat-value">{mockUser.power}/{mockUser.powerMax}</div>
            <div className="home__stat-label">Сила</div>
            <div className="home__stat-bar">
              <div
                className="home__stat-bar-fill home__stat-bar-fill--power"
                style={{ width: `${(mockUser.power / mockUser.powerMax) * 100}%` }}
              />
            </div>
          </div>
        </Card>
      </div>

      <div className="home__ratings">
        <h2 className="home__section-title">Рейтинги</h2>
        <div className="home__ratings-grid">
          <Card className="home__rating-card">
            <div className="home__rating-mode">Короткие нарды</div>
            <div className="home__rating-value">{shortRating?.rating || 1500}</div>
            <div className="home__rating-record">
              {shortRating?.wins || 0}W / {shortRating?.losses || 0}L
            </div>
          </Card>
          <Card className="home__rating-card">
            <div className="home__rating-mode">Длинные нарды</div>
            <div className="home__rating-value">{longRating?.rating || 1500}</div>
            <div className="home__rating-record">
              {longRating?.wins || 0}W / {longRating?.losses || 0}L
            </div>
          </Card>
        </div>
      </div>

      {activeQuests.length > 0 && (
        <div className="home__quests">
          <h2 className="home__section-title">Активные квесты</h2>
          <div className="home__quests-list">
            {activeQuests.slice(0, 2).map((quest) => (
              <Card key={quest.id} className="home__quest-card">
                <div className="home__quest-info">
                  <div className="home__quest-title">{quest.title}</div>
                  <div className="home__quest-progress">
                    <div className="home__quest-progress-bar">
                      <div
                        className="home__quest-progress-fill"
                        style={{
                          width: `${((quest.progress?.progress || 0) / quest.target) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="home__quest-progress-text">
                      {quest.progress?.progress || 0}/{quest.target}
                    </span>
                  </div>
                </div>
                <div className="home__quest-reward">
                  <span>💰 {quest.rewardCoin}</span>
                  <span>⭐ {quest.rewardXp} XP</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="home__actions">
        <Link to="/game">
          <Button variant="primary" size="lg" fullWidth>
            🎲 Начать игру
          </Button>
        </Link>
        <div className="home__quick-actions">
          <Link to="/tournaments">
            <Button variant="outline" fullWidth>
              🏆 Турниры
            </Button>
          </Link>
          <Link to="/leaderboard">
            <Button variant="outline" fullWidth>
              📊 Рейтинг
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
