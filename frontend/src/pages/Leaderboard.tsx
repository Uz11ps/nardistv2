import { useState } from 'react';
import { Card, Tabs } from '../components/ui';
import { mockLeaderboard } from '../mock';
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
      <h1 className="leaderboard-page__title">🏆 Таблица лидеров</h1>
      <Tabs tabs={tabs} onChange={(id) => setMode(id as 'SHORT' | 'LONG')} />
    </div>
  );
};

const LeaderboardTable = ({ mode }: { mode: 'SHORT' | 'LONG' }) => {
  const filtered = mockLeaderboard.filter((r) => r.mode === mode);

  return (
    <div className="leaderboard-table">
      {filtered.map((rating, index) => (
        <Card key={rating.id} className="leaderboard-item">
          <div className="leaderboard-item__rank">#{index + 1}</div>
          <div className="leaderboard-item__avatar">
            <img
              src={rating.user?.avatar || 'https://via.placeholder.com/50'}
              alt={rating.user?.nickname}
            />
          </div>
          <div className="leaderboard-item__info">
            <div className="leaderboard-item__name">{rating.user?.nickname || 'Игрок'}</div>
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

