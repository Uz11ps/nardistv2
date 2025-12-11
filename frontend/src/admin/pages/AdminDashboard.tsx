import { useState, useEffect } from 'react';
import { PageHeader, StatCard } from '../components';
import { adminService } from '../../services';
import './AdminDashboard.css';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalGames: number;
  gamesToday: number;
  totalTournaments: number;
  activeTournaments: number;
  totalRevenue: number;
  revenueToday: number;
  userTrend?: number;
  gameTrend?: number;
  revenueTrend?: number;
  gamesByMode?: {
    short: number;
    long: number;
    shortPercentage: number;
    longPercentage: number;
  };
  userActivity?: number[];
}

interface RecentGame {
  id: number;
  mode: string;
  whitePlayer: {
    id: number;
    nickname?: string;
    firstName: string;
    photoUrl?: string;
  };
  blackPlayer: {
    id: number;
    nickname?: string;
    firstName: string;
    photoUrl?: string;
  };
  winnerId?: number;
  district?: {
    id: number;
    name: string;
    icon: string;
  };
  createdAt: string;
}

export const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminService.getStats(),
      adminService.getRecentGames(10),
    ])
      .then(([statsData, gamesData]) => {
        setStats(statsData);
        setRecentGames(gamesData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return <div className="admin-dashboard">Загрузка...</div>;
  }

  // Нормализация данных активности для графика (максимальная высота 100%)
  const maxActivity = Math.max(...(stats.userActivity || [1]), 1);
  const normalizedActivity = (stats.userActivity || []).map(count => 
    Math.round((count / maxActivity) * 100)
  );

  return (
    <div className="admin-dashboard">
      <PageHeader
        title="Дашборд"
        description="Общая статистика и аналитика приложения"
      />
      
      <div className="admin-dashboard__stats">
        <StatCard
          title="Всего пользователей"
          value={stats.totalUsers.toLocaleString()}
          icon="👥"
          trend={stats.userTrend !== undefined ? { value: Math.abs(stats.userTrend), isPositive: stats.userTrend >= 0 } : undefined}
          subtitle={`Активных: ${stats.activeUsers}`}
        />
        <StatCard
          title="Всего игр"
          value={stats.totalGames.toLocaleString()}
          icon="🎲"
          trend={stats.gameTrend !== undefined ? { value: Math.abs(stats.gameTrend), isPositive: stats.gameTrend >= 0 } : undefined}
          subtitle={`Сегодня: ${stats.gamesToday}`}
        />
        <StatCard
          title="Турниры"
          value={stats.totalTournaments.toString()}
          icon="🏆"
          subtitle={`Активных: ${stats.activeTournaments}`}
        />
        <StatCard
          title="Доход"
          value={`${stats.totalRevenue.toLocaleString()} NAR`}
          icon="💰"
          trend={stats.revenueTrend !== undefined ? { value: Math.abs(stats.revenueTrend), isPositive: stats.revenueTrend >= 0 } : undefined}
          subtitle={`Сегодня: ${stats.revenueToday.toLocaleString()} NAR`}
        />
      </div>

      <div className="admin-dashboard__charts">
        <div className="admin-dashboard__chart-card">
          <h3 className="admin-dashboard__chart-title">Активность пользователей</h3>
          <div className="admin-dashboard__chart-placeholder">
            <p>График активности (за последние 7 дней)</p>
            <div className="admin-dashboard__chart-bars">
              {normalizedActivity.map((height, index) => (
                <div
                  key={index}
                  className="admin-dashboard__chart-bar"
                  style={{ height: `${height}%` }}
                  title={`День ${index + 1}: ${stats.userActivity?.[index] || 0} пользователей`}
                />
              ))}
            </div>
            <div className="admin-dashboard__chart-labels">
              {Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (6 - i));
                return (
                  <span key={i} className="admin-dashboard__chart-label">
                    {date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div className="admin-dashboard__chart-card">
          <h3 className="admin-dashboard__chart-title">Игры по режимам</h3>
          <div className="admin-dashboard__chart-placeholder">
            <div className="admin-dashboard__mode-stats">
              <div className="admin-dashboard__mode-item">
                <div className="admin-dashboard__mode-bar-wrapper">
                  <div 
                    className="admin-dashboard__mode-bar admin-dashboard__mode-bar--short"
                    style={{ width: `${stats.gamesByMode?.shortPercentage || 0}%` }}
                  />
                </div>
                <span className="admin-dashboard__mode-label">
                  Короткие: {stats.gamesByMode?.shortPercentage || 0}% ({stats.gamesByMode?.short || 0})
                </span>
              </div>
              <div className="admin-dashboard__mode-item">
                <div className="admin-dashboard__mode-bar-wrapper">
                  <div 
                    className="admin-dashboard__mode-bar admin-dashboard__mode-bar--long"
                    style={{ width: `${stats.gamesByMode?.longPercentage || 0}%` }}
                  />
                </div>
                <span className="admin-dashboard__mode-label">
                  Длинные: {stats.gamesByMode?.longPercentage || 0}% ({stats.gamesByMode?.long || 0})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-dashboard__recent">
        <div className="admin-dashboard__recent-card">
          <h3 className="admin-dashboard__recent-title">Последние игры</h3>
          <div className="admin-dashboard__recent-list">
            {recentGames.length > 0 ? (
              <table className="admin-dashboard__games-table">
                <thead>
                  <tr>
                    <th>Игроки</th>
                    <th>Режим</th>
                    <th>Район</th>
                    <th>Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {recentGames.map((game) => {
                    const whitePlayerName = game.whitePlayer.nickname || game.whitePlayer.firstName;
                    const blackPlayerName = game.blackPlayer.nickname || game.blackPlayer.firstName;
                    const winner = game.winnerId === game.whitePlayer.id ? whitePlayerName : blackPlayerName;
                    
                    return (
                      <tr key={game.id}>
                        <td>
                          <div className="admin-dashboard__game-players">
                            <span className={game.winnerId === game.whitePlayer.id ? 'admin-dashboard__game-winner' : ''}>
                              {whitePlayerName}
                            </span>
                            <span> vs </span>
                            <span className={game.winnerId === game.blackPlayer.id ? 'admin-dashboard__game-winner' : ''}>
                              {blackPlayerName}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="admin-dashboard__game-mode">
                            {game.mode === 'SHORT' ? 'Короткие' : 'Длинные'}
                          </span>
                        </td>
                        <td>
                          {game.district ? (
                            <span className="admin-dashboard__game-district">
                              {game.district.icon} {game.district.name}
                            </span>
                          ) : (
                            <span className="admin-dashboard__game-district">—</span>
                          )}
                        </td>
                        <td>
                          <span className="admin-dashboard__game-date">
                            {new Date(game.createdAt).toLocaleString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                Пока нет игр
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
