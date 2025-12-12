import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, NotificationModal, ConfirmModal } from '../components/ui';
import { tournamentsService, userService } from '../services';
import { useAuthStore } from '../store/auth.store';
import './Tournaments.css';

export const Tournaments = () => {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [olympiad, setOlympiad] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userBalance, setUserBalance] = useState(0);
  const [notification, setNotification] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmPass, setConfirmPass] = useState<{ tournament: any } | null>(null);
  const [tournamentPasses, setTournamentPasses] = useState<Record<number, any>>({});
  const { user } = useAuthStore();

  useEffect(() => {
    Promise.all([
      tournamentsService.getAll(),
      tournamentsService.getCurrentOlympiad().catch(() => null),
      userService.getProfile().catch(() => ({ narCoin: 0 })),
      tournamentsService.getUserTournamentPasses().catch(() => []),
    ])
      .then(([tournamentsData, olympiadData, userData, passesData]) => {
        setTournaments(tournamentsData);
        setOlympiad(olympiadData);
        setUserBalance(userData.narCoin || 0);
        
        // Создаем мапу пассов по tournamentId
        const passesMap: Record<number, any> = {};
        passesData.forEach((pass: any) => {
          passesMap[pass.tournamentId] = pass;
        });
        setTournamentPasses(passesMap);

        // Загружаем пассы для каждого турнира
        tournamentsData.forEach(async (tournament: any) => {
          try {
            const pass = await tournamentsService.getTournamentPass(tournament.id);
            if (pass) {
              setTournamentPasses(prev => ({ ...prev, [tournament.id]: pass }));
            }
          } catch (error) {
            // Игнорируем ошибки
          }
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="tournaments-page">Загрузка...</div>;
  }

  const handleJoinTournament = async (tournament: any) => {
    try {
      await tournamentsService.join(tournament.id);
      setNotification({
        title: 'Успех',
        message: 'Вы успешно зарегистрированы на турнир!',
        type: 'success',
      });
      window.location.reload();
    } catch (error: any) {
      setNotification({
        title: 'Ошибка',
        message: error.response?.data?.message || 'Ошибка при регистрации',
        type: 'error',
      });
    }
  };

  const handlePurchasePass = async (tournament: any) => {
    try {
      await tournamentsService.purchaseTournamentPass(tournament.id);
      setNotification({
        title: 'Успех',
        message: 'Tournament Pass успешно куплен! Теперь вы получите дополнительные награды.',
        type: 'success',
      });
      const pass = await tournamentsService.getTournamentPass(tournament.id);
      setTournamentPasses(prev => ({ ...prev, [tournament.id]: pass }));
      const userData = await userService.getProfile();
      setUserBalance(userData.narCoin || 0);
      setConfirmPass(null);
    } catch (error: any) {
      setNotification({
        title: 'Ошибка',
        message: error.response?.data?.message || 'Ошибка при покупке пасса',
        type: 'error',
      });
    }
  };

  const isOlympiad = (tournament: any) => tournament.name?.includes('Олимпиада Нардиста');
  const isSponsored = (tournament: any) => tournament.name?.includes('Спонсорский');

  return (
    <div className="tournaments-page">
      <Link to="/" className="tournaments-page__back">←</Link>
      <h1 className="tournaments-page__title">🏆 Турниры</h1>

      {olympiad && (
        <Card className="tournament-card tournament-card--olympiad" style={{ marginBottom: '1.5rem', border: '2px solid #ffd700', backgroundColor: '#1a1a1a' }}>
          <div className="tournament-card__header">
            <h3 className="tournament-card__title">🏅 {olympiad.name}</h3>
            <span className="tournament-card__badge" style={{ backgroundColor: '#ffd700', color: '#000', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>
              ОЛИМПИАДА
            </span>
          </div>
          {olympiad.description && <p className="tournament-card__description">{olympiad.description}</p>}
          <div className="tournament-card__info">
            <span>🎲 {olympiad.mode === 'SHORT' ? 'Короткие' : 'Длинные'} нарды</span>
            <span>👥 {olympiad.participants?.length || 0}/{olympiad.maxParticipants || '∞'}</span>
            <span style={{ color: '#ffd700', fontWeight: 'bold' }}>🏆 Награда: Mythic-скины 1/1</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <Button
              variant="primary"
              fullWidth
              onClick={() => handleJoinTournament(olympiad)}
              disabled={olympiad.status !== 'UPCOMING'}
            >
              {olympiad.status === 'UPCOMING' ? 'Зарегистрироваться' : 'Подробнее'}
            </Button>
          </div>
        </Card>
      )}

      <div className="tournaments-list">
        {tournaments.length === 0 ? (
          <Card>Нет доступных турниров</Card>
        ) : (
          tournaments
            .filter(t => !isOlympiad(t)) // Олимпиада показывается отдельно
            .map((tournament) => {
              const hasPass = tournamentPasses[tournament.id];
              return (
                <Card key={tournament.id} className={`tournament-card ${isSponsored(tournament) ? 'tournament-card--sponsored' : ''}`}>
                  <div className="tournament-card__header">
                    <h3 className="tournament-card__title">{tournament.name}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {isSponsored(tournament) && (
                        <span className="tournament-card__badge" style={{ backgroundColor: '#2196f3', color: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>
                          📢 СПОНСОРСКИЙ
                        </span>
                      )}
                      {hasPass && (
                        <span className="tournament-card__badge" style={{ backgroundColor: '#9c27b0', color: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>
                          🎫 PASS
                        </span>
                      )}
                      <span className={`tournament-card__status tournament-card__status--${tournament.status.toLowerCase()}`}>
                        {tournament.status === 'UPCOMING' && 'Предстоящий'}
                        {tournament.status === 'IN_PROGRESS' && 'В процессе'}
                        {tournament.status === 'FINISHED' && 'Завершен'}
                      </span>
                    </div>
                  </div>
                  {tournament.description && <p className="tournament-card__description">{tournament.description}</p>}
                  <div className="tournament-card__info">
                    <span>🎲 {tournament.mode === 'SHORT' ? 'Короткие' : 'Длинные'} нарды</span>
                    <span>👥 {tournament.participants?.length || 0}/{tournament.maxParticipants || '∞'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => handleJoinTournament(tournament)}
                      disabled={tournament.status !== 'UPCOMING'}
                    >
                      {tournament.status === 'UPCOMING' ? 'Зарегистрироваться' : 'Подробнее'}
                    </Button>
                    {tournament.status === 'UPCOMING' && tournament.hasTournamentPass && !hasPass && (
                      <Button
                        variant="outline"
                        onClick={() => setConfirmPass({ tournament })}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        🎫 Купить Pass
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })
        )}
      </div>

      {confirmPass && (
        <ConfirmModal
          isOpen={!!confirmPass}
          onClose={() => setConfirmPass(null)}
          onConfirm={() => handlePurchasePass(confirmPass.tournament)}
          title="Покупка Tournament Pass"
          message={`Купить Tournament Pass для турнира "${confirmPass.tournament.name}"? Вы получите дополнительные награды и призы.`}
          confirmText="Купить (500 NAR)"
          cancelText="Отмена"
          cost={500}
          balance={userBalance}
        />
      )}

      {notification && (
        <NotificationModal
          isOpen={!!notification}
          onClose={() => setNotification(null)}
          title={notification.title}
          message={notification.message}
          type={notification.type}
        />
      )}
    </div>
  );
};

