import { Card, Button } from '../components/ui';
import { mockTournaments } from '../mock';
import './Tournaments.css';

export const Tournaments = () => {
  return (
    <div className="tournaments-page">
      <h1 className="tournaments-page__title">🏆 Турниры</h1>
      <div className="tournaments-list">
        {mockTournaments.map((tournament) => (
          <Card key={tournament.id} className="tournament-card">
            <div className="tournament-card__header">
              <h3 className="tournament-card__title">{tournament.name}</h3>
              <span className={`tournament-card__status tournament-card__status--${tournament.status.toLowerCase()}`}>
                {tournament.status === 'UPCOMING' && 'Предстоящий'}
                {tournament.status === 'IN_PROGRESS' && 'В процессе'}
                {tournament.status === 'FINISHED' && 'Завершен'}
              </span>
            </div>
            <p className="tournament-card__description">{tournament.description}</p>
            <div className="tournament-card__info">
              <span>🎲 {tournament.mode === 'SHORT' ? 'Короткие' : 'Длинные'} нарды</span>
              <span>👥 {tournament.participants?.length || 0}/{tournament.maxParticipants || '∞'}</span>
            </div>
            <Button variant="primary" fullWidth>
              {tournament.status === 'UPCOMING' ? 'Зарегистрироваться' : 'Подробнее'}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

