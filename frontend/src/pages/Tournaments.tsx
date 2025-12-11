import { useState, useEffect } from 'react';
import { Card, Button } from '../components/ui';
import { tournamentsService } from '../services';
import './Tournaments.css';

export const Tournaments = () => {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tournamentsService.getAll()
      .then(setTournaments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="tournaments-page">Загрузка...</div>;
  }

  return (
    <div className="tournaments-page">
      <h1 className="tournaments-page__title">🏆 Турниры</h1>
      <div className="tournaments-list">
        {tournaments.length === 0 ? (
          <Card>Нет доступных турниров</Card>
        ) : (
          tournaments.map((tournament) => (
            <Card key={tournament.id} className="tournament-card">
              <div className="tournament-card__header">
                <h3 className="tournament-card__title">{tournament.name}</h3>
                <span className={`tournament-card__status tournament-card__status--${tournament.status.toLowerCase()}`}>
                  {tournament.status === 'UPCOMING' && 'Предстоящий'}
                  {tournament.status === 'IN_PROGRESS' && 'В процессе'}
                  {tournament.status === 'FINISHED' && 'Завершен'}
                </span>
              </div>
              {tournament.description && <p className="tournament-card__description">{tournament.description}</p>}
              <div className="tournament-card__info">
                <span>🎲 {tournament.mode === 'SHORT' ? 'Короткие' : 'Длинные'} нарды</span>
                <span>👥 {tournament.participants?.length || 0}/{tournament.maxParticipants || '∞'}</span>
              </div>
              <Button
                variant="primary"
                fullWidth
                onClick={async () => {
                  if (tournament.status === 'UPCOMING') {
                    try {
                      await tournamentsService.join(tournament.id);
                      alert('Вы успешно зарегистрированы на турнир!');
                      window.location.reload();
                    } catch (error: any) {
                      alert(error.response?.data?.message || 'Ошибка при регистрации');
                    }
                  }
                }}
              >
                {tournament.status === 'UPCOMING' ? 'Зарегистрироваться' : 'Подробнее'}
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

