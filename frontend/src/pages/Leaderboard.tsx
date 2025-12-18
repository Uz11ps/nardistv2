import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Tabs, Skeleton, Icon } from '../components/ui';
import { ratingsService } from '../services';
import { placeholders } from '../utils/placeholders';
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
      <h1 className="leaderboard-page__title">
        <Icon name="trophy" size={28} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
        Таблица лидеров
      </h1>
      <Tabs tabs={tabs} onChange={(id) => setMode(id as 'SHORT' | 'LONG')} />
    </div>
  );
};

const LeaderboardTable = ({ mode }: { mode: 'SHORT' | 'LONG' }) => {
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ratingsService.getLeaderboard(mode)
      .then((data) => {
        setRatings(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error('Failed to load ratings:', error);
        setRatings([]);
      })
      .finally(() => setLoading(false));
  }, [mode]);

  if (loading) {
    return (
      <div className="leaderboard-table">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <Skeleton key={i} height={60} style={{ marginBottom: '8px', borderRadius: '6px' }} />
        ))}
      </div>
    );
  }

  if (ratings.length === 0) {
    return <div className="leaderboard-table">Нет данных</div>;
  }

  return (
    <div className="leaderboard-table">
      {Array.isArray(ratings) ? ratings.map((rating, index) => (
        <Card key={rating.id} className="leaderboard-item">
          <div className="leaderboard-item__rank">#{index + 1}</div>
          <div className="leaderboard-item__avatar">
            <img
              src={rating.user?.avatar || rating.user?.photoUrl || placeholders.avatarSmall}
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
      )) : (
        <div className="leaderboard-table">Нет данных</div>
      )}
    </div>
  );
};

