import { Card, Button, Tabs } from '../components/ui';
import { mockQuests } from '../mock';
import './Quests.css';

export const Quests = () => {
  const dailyQuests = mockQuests.filter((q) => q.type === 'DAILY');
  const weeklyQuests = mockQuests.filter((q) => q.type === 'WEEKLY');

  const tabs = [
    {
      id: 'daily',
      label: 'Ежедневные',
      content: <QuestsList quests={dailyQuests} />,
    },
    {
      id: 'weekly',
      label: 'Недельные',
      content: <QuestsList quests={weeklyQuests} />,
    },
  ];

  return (
    <div className="quests-page">
      <h1 className="quests-page__title">📋 Квесты</h1>
      <Tabs tabs={tabs} />
    </div>
  );
};

const QuestsList = ({ quests }: { quests: typeof mockQuests }) => {
  return (
    <div className="quests-list">
      {quests.map((quest) => (
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
            <span>💰 {quest.rewardCoin} NAR</span>
            <span>⭐ {quest.rewardXp} XP</span>
            {quest.rewardSkin && <span>🎨 Скин</span>}
          </div>
        </Card>
      ))}
    </div>
  );
};

