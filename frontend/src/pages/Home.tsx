import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button } from '../components/ui';
import { useAuthStore } from '../store/auth.store';
import { userService } from '../services';
import './Home.css';

export const Home = () => {
  const { user: authUser } = useAuthStore();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authUser) {
      Promise.all([
        userService.getProfile(),
        userService.getStats(),
      ])
        .then(([profile, userStats]) => {
          setUser(profile);
          setStats(userStats);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [authUser]);

  if (loading || !user) {
    return <div className="home">Загрузка...</div>;
  }

  const shortRating = stats?.ratings?.find((r: any) => r.mode === 'SHORT');
  const longRating = stats?.ratings?.find((r: any) => r.mode === 'LONG');

  return (
    <div className="home">
      <div className="home__header">
        <div className="home__greeting">
          <h1>Привет, {user.nickname || user.firstName}!</h1>
          <p className="home__level">Уровень {user.level || 1}</p>
        </div>
        <div className="home__avatar">
          <img src={user.avatar || user.photoUrl || 'https://via.placeholder.com/80'} alt="Avatar" />
        </div>
      </div>

      <div className="home__stats">
        <Card className="home__stat-card">
          <div className="home__stat-icon">💰</div>
          <div className="home__stat-info">
            <div className="home__stat-value">{(user.narCoin || 0).toLocaleString()}</div>
            <div className="home__stat-label">NAR-coin</div>
          </div>
        </Card>
        <Card className="home__stat-card">
          <div className="home__stat-icon">⚡</div>
          <div className="home__stat-info">
            <div className="home__stat-value">{user.energy || 0}/{user.energyMax || 100}</div>
            <div className="home__stat-label">Энергия</div>
            <div className="home__stat-bar">
              <div
                className="home__stat-bar-fill"
                style={{ width: `${((user.energy || 0) / (user.energyMax || 100)) * 100}%` }}
              />
            </div>
          </div>
        </Card>
        <Card className="home__stat-card">
          <div className="home__stat-icon">❤️</div>
          <div className="home__stat-info">
            <div className="home__stat-value">{user.lives || 0}/{user.livesMax || 3}</div>
            <div className="home__stat-label">Жизни</div>
            <div className="home__stat-bar">
              <div
                className="home__stat-bar-fill home__stat-bar-fill--lives"
                style={{ width: `${((user.lives || 0) / (user.livesMax || 3)) * 100}%` }}
              />
            </div>
          </div>
        </Card>
        <Card className="home__stat-card">
          <div className="home__stat-icon">💪</div>
          <div className="home__stat-info">
            <div className="home__stat-value">{user.power || 0}/{user.powerMax || 10}</div>
            <div className="home__stat-label">Сила</div>
            <div className="home__stat-bar">
              <div
                className="home__stat-bar-fill home__stat-bar-fill--power"
                style={{ width: `${((user.power || 0) / (user.powerMax || 10)) * 100}%` }}
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
