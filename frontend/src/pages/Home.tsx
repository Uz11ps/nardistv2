import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Skeleton, Icon } from '../components/ui';
import { useAuthStore } from '../store/auth.store';
import { userService } from '../services';
import { placeholders } from '../utils/placeholders';
import './Home.css';

export const Home = () => {
  const { user: authUser } = useAuthStore();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authUser) {
      // Используем данные из authStore как fallback
      setUser(authUser);
      
      Promise.all([
        userService.getProfile().catch(() => authUser),
        userService.getStats().catch(() => ({
          totalGames: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          ratings: [],
        })),
      ])
        .then(([profile, userStats]) => {
          setUser(profile);
          setStats(userStats);
        })
        .catch((error) => {
          console.warn('Failed to load data, using cached:', error);
          // Используем данные из authStore
          setStats({
            totalGames: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            ratings: [],
          });
        })
        .finally(() => setLoading(false));
    }
  }, [authUser]);

  if (loading || !user) {
    return (
      <div className="home">
        <div className="home__profile">
          <Skeleton variant="circular" width={80} height={80} className="home__avatar-large" />
          <Skeleton width={120} height={24} style={{ marginBottom: '8px' }} />
          <Skeleton width={80} height={16} />
          <div className="home__top-stats">
            <Skeleton width={60} height={20} />
            <Skeleton width={60} height={20} />
          </div>
        </div>
        <div className="home__menu">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} height={56} style={{ borderRadius: '6px', marginBottom: '12px' }} />
          ))}
        </div>
      </div>
    );
  }

  const shortRating = stats?.ratings?.find((r: any) => r.mode === 'SHORT');
  const longRating = stats?.ratings?.find((r: any) => r.mode === 'LONG');

  const xpPercent = user.xp ? Math.min((user.xp % 1000) / 10, 100) : 0;
  const currentXp = user.xp ? (user.xp % 1000) : 0;
  const xpForNextLevel = 100;

  const menuItems = [
    { path: '/game', icon: 'dice', label: 'Играть', iconColor: 'red' },
    { path: '/profile', icon: 'user', label: 'Профиль', iconColor: 'grey' },
    { path: '/city', icon: 'city', label: 'Город', iconColor: 'gold' },
    { path: '/tournaments', icon: 'trophy', label: 'Турниры', iconColor: 'gold' },
    { path: '/clans', icon: 'sword', label: 'Кланы', iconColor: 'gold' },
    { path: '/trainer', icon: 'book', label: 'Обучение', iconColor: 'white' },
  ];

  return (
    <div className="home">
      {/* Профиль вверху */}
      <div className="home__profile">
        <div className="home__avatar-large">
          <img src={user.avatar || user.photoUrl || placeholders.avatarLarge} alt="Avatar" />
        </div>
        <h1 className="home__name">{user.nickname || user.firstName}</h1>
        <p className="home__level">Уровень {user.level || 1}</p>
        
        {/* Валюта и Энергия справа вверху */}
        <div className="home__top-stats">
          <div className="home__top-stat">
            <Icon name="coin" size={20} className="home__top-stat-icon" />
            <span className="home__top-stat-value">{(user.narCoin || 0).toLocaleString()}</span>
          </div>
          <div className="home__top-stat">
            <span className="home__top-stat-value">{user.energy || 0}/{user.energyMax || 100}</span>
            <div className="home__top-stat-bar">
              <div 
                className="home__top-stat-bar-fill" 
                style={{ width: `${((user.energy || 0) / (user.energyMax || 100)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Вертикальное меню */}
      <div className="home__menu">
        {menuItems.map((item) => (
          <Link key={item.path} to={item.path} className="home__menu-item">
            <span className={`home__menu-icon home__menu-icon--${item.iconColor}`}>
              <Icon name={item.icon as any} size={24} />
            </span>
            <span className="home__menu-label">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};
