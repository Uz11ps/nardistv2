import { PageHeader, StatCard } from '../components';
import { adminStats } from '../mock/adminData';
import './AdminDashboard.css';

export const AdminDashboard = () => {
  return (
    <div className="admin-dashboard">
      <PageHeader
        title="Дашборд"
        description="Общая статистика и аналитика приложения"
      />
      
      <div className="admin-dashboard__stats">
        <StatCard
          title="Всего пользователей"
          value={adminStats.totalUsers.toLocaleString()}
          icon="👥"
          trend={{ value: 12, isPositive: true }}
          subtitle={`Активных: ${adminStats.activeUsers}`}
        />
        <StatCard
          title="Всего игр"
          value={adminStats.totalGames.toLocaleString()}
          icon="🎲"
          trend={{ value: 8, isPositive: true }}
          subtitle={`Сегодня: ${adminStats.gamesToday}`}
        />
        <StatCard
          title="Турниры"
          value={adminStats.totalTournaments}
          icon="🏆"
          subtitle={`Активных: ${adminStats.activeTournaments}`}
        />
        <StatCard
          title="Доход"
          value={`${adminStats.totalRevenue.toLocaleString()} ₽`}
          icon="💰"
          trend={{ value: 15, isPositive: true }}
          subtitle={`Сегодня: ${adminStats.revenueToday.toLocaleString()} ₽`}
        />
      </div>

      <div className="admin-dashboard__charts">
        <div className="admin-dashboard__chart-card">
          <h3 className="admin-dashboard__chart-title">Активность пользователей</h3>
          <div className="admin-dashboard__chart-placeholder">
            <p>График активности (за последние 7 дней)</p>
            <div className="admin-dashboard__chart-bars">
              {[65, 80, 45, 90, 70, 85, 95].map((height, index) => (
                <div
                  key={index}
                  className="admin-dashboard__chart-bar"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="admin-dashboard__chart-card">
          <h3 className="admin-dashboard__chart-title">Игры по режимам</h3>
          <div className="admin-dashboard__chart-placeholder">
            <div className="admin-dashboard__pie-chart">
              <div className="admin-dashboard__pie-segment" style={{ '--percentage': '65%' } as any}>
                <span>Короткие: 65%</span>
              </div>
              <div className="admin-dashboard__pie-segment" style={{ '--percentage': '35%' } as any}>
                <span>Длинные: 35%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-dashboard__recent">
        <div className="admin-dashboard__recent-card">
          <h3 className="admin-dashboard__recent-title">Последние игры</h3>
          <div className="admin-dashboard__recent-list">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="admin-dashboard__recent-item">
                <div className="admin-dashboard__recent-info">
                  <span className="admin-dashboard__recent-players">Игрок #{i} vs Игрок #{i + 1}</span>
                  <span className="admin-dashboard__recent-time">2 минуты назад</span>
                </div>
                <span className="admin-dashboard__recent-mode">Короткие нарды</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

