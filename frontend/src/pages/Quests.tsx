import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Tabs, Icon } from '../components/ui';
import { questsService } from '../services';
import './Quests.css';

export const Quests = () => {
  const [quests, setQuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    questsService.getActive()
      .then((data) => {
        // Гарантируем что это массив
        setQuests(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error('Failed to load quests:', error);
        setQuests([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const dailyQuests = Array.isArray(quests) ? quests.filter((q) => q.type === 'DAILY') : [];
  const weeklyQuests = Array.isArray(quests) ? quests.filter((q) => q.type === 'WEEKLY') : [];

  const tabs = [
    {
      id: 'daily',
      label: 'Дневные',
      content: <QuestsList quests={dailyQuests} loading={loading} />,
    },
    {
      id: 'weekly',
      label: 'Недельные',
      content: <QuestsList quests={weeklyQuests} loading={loading} />,
    },
  ];

  return (
    <div className="quests-page">
      <Link to="/" className="quests-page__back">←</Link>
      <h1 className="quests-page__title">
        <Icon name="book" size={28} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
        Квесты
      </h1>
      <Tabs tabs={tabs} />
    </div>
  );
};

const QuestsList = ({ quests, loading }: { quests: any[]; loading: boolean }) => {
  if (loading) {
    return <div className="quests-list">Загрузка...</div>;
  }

  if (quests.length === 0) {
    return <div className="quests-list">Нет доступных квестов</div>;
  }

  return (
    <div className="quests-list">
      {Array.isArray(quests) ? quests.map((quest) => (
        <Card key={quest.id} className="quest-card">
          <div className="quest-card__header">
            <h3 className="quest-card__title">{quest.title}</h3>
            {quest.progress?.completed && <span className="quest-card__badge">✓</span>}
          </div>
          <p className="quest-card__description">{quest.description}</p>
          <div className="quest-card__progress">
            <div className="quest-card__progress-bar">
              <div
                className="quest-card__progress-fill"
                style={{
                  width: `${((quest.progress?.progress || 0) / quest.target) * 100}%`,
                }}
              />
            </div>
            <span className="quest-card__progress-text">
              {quest.progress?.progress || 0}/{quest.target}
            </span>
          </div>
          <div className="quest-card__rewards">
            <span>
              <Icon name="coin" size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              {quest.rewardCoin} NAR
            </span>
            <span>
              <Icon name="star" size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              {quest.rewardXp} XP
            </span>
            {quest.rewardSkin && (
              <span>
                <Icon name="skins" size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                Скин
              </span>
            )}
          </div>
        </Card>
      )) : (
        <div className="quests-list">Нет доступных квестов</div>
      )}
    </div>
  );
};

