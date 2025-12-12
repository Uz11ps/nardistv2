import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Tabs } from '../components/ui';
import { ratingsService } from '../services';
import './Leaderboard.css';

export const Leaderboard = () => {
  const [mode, setMode] = useState<'SHORT' | 'LONG'>('SHORT');

  const tabs = [
    {
      id: 'SHORT',
      label: 'Короткие нарды',
      content: <LeaderboardTable mode="SHORT" />,
    },
    {
      id: 'LONG',
      label: 'Длинные нарды',
      content: <LeaderboardTable mode="LONG" />,
    },
  ];

  return (
    <div className="leaderboard-page">
      <Link to="/" className="leaderboard-page__back">←</Link>
      <h1 className="leaderboard-page__title">🏆 Таблица лидеров</h1>
      <Tabs tabs={tabs} onChange={(id) => setMode(id as 'SHORT' | 'LONG')} />
    </div>
  );
};

const LeaderboardTable = ({ mode }: { mode: 'SHORT' | 'LONG' }) => {
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ratingsService.getLeaderboard(mode)
      .then(setRatings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [mode]);

  if (loading) {
    return <div className="leaderboard-table">Загрузка...</div>;
  }

  if (ratings.length === 0) {
    return <div className="leaderboard-table">Нет данных</div>;
  }

  return (
    <div className="leaderboard-table">
      {ratings.map((rating, index) => (
        <Card key={rating.id} className="leaderboard-item">
          <div className="leaderboard-item__rank">#{index + 1}</div>
          <div className="leaderboard-item__avatar">
            <img
              src={rating.user?.avatar || rating.user?.photoUrl || 'https://via.placeholder.com/50'}
              alt={rating.user?.nickname || rating.user?.firstName}
            />
          </div>
          <div className="leaderboard-item__info">
            <div className="leaderboard-item__name">{rating.user?.nickname || rating.user?.firstName || 'Игрок'}</div>
            <div className="leaderboard-item__stats">
              {rating.wins}W / {rating.losses}L
            </div>
          </div>
          <div className="leaderboard-item__rating">{rating.rating}</div>
        </Card>
      ))}
    </div>
  );
};

