import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import './Lobby.css';

interface LobbyProps {
  user: any;
  onGameStart: (game: any) => void;
}

export default function Lobby({ user, onGameStart }: LobbyProps) {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      const response = await apiClient.get('/games?status=waiting');
      setGames(response.data);
    } catch (error) {
      console.error('Error loading games:', error);
    }
  };

  const createGame = async (type: 'short' | 'long' = 'short') => {
    setLoading(true);
    try {
      const response = await apiClient.post('/games', { type });
      onGameStart(response.data);
    } catch (error) {
      console.error('Error creating game:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinGame = async (gameId: number) => {
    setLoading(true);
    try {
      const response = await apiClient.post(`/games/${gameId}/join`);
      onGameStart(response.data);
    } catch (error) {
      console.error('Error joining game:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lobby">
      <div className="lobby-header">
        <h1>Нарды</h1>
        <div className="user-info">
          <div>Рейтинг: {user.rating}</div>
          <div>Баланс: {user.balance} NAR</div>
        </div>
      </div>

      <div className="lobby-actions">
        <button
          onClick={() => createGame('short')}
          disabled={loading}
          className="btn btn-primary"
        >
          Создать игру (Короткие)
        </button>
        <button
          onClick={() => createGame('long')}
          disabled={loading}
          className="btn btn-primary"
        >
          Создать игру (Длинные)
        </button>
        <button onClick={loadGames} className="btn btn-secondary">
          Обновить
        </button>
      </div>

      <div className="games-list">
        <h2>Доступные игры</h2>
        {games.length === 0 ? (
          <p>Нет доступных игр</p>
        ) : (
          <ul>
            {games.map((game) => (
              <li key={game.id} className="game-item">
                <div>
                  <strong>Игра #{game.id}</strong> - {game.type === 'short' ? 'Короткие' : 'Длинные'}
                </div>
                <button
                  onClick={() => joinGame(game.id)}
                  disabled={loading}
                  className="btn btn-small"
                >
                  Присоединиться
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

