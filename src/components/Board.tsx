import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import './Board.css';

interface BoardProps {
  game: any;
  onExit: () => void;
  currentUserId?: number;
}

export default function Board({ game, onExit, currentUserId }: BoardProps) {
  const [currentGame, setCurrentGame] = useState(game);
  const [dice, setDice] = useState<number[] | null>(game.dice || null);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      loadGameState();
    }, 2000);

    return () => clearInterval(interval);
  }, [game.id]);

  const loadGameState = async () => {
    try {
      const response = await apiClient.get(`/games/${game.id}`);
      const updatedGame = response.data;
      setCurrentGame(updatedGame);
      if (updatedGame.dice) {
        setDice(updatedGame.dice);
      }
    } catch (error) {
      console.error('Error loading game state:', error);
    }
  };

  const rollDice = async () => {
    try {
      const response = await apiClient.post(`/games/${game.id}/roll-dice`);
      setDice(response.data.dice);
      setCurrentGame(response.data.game);
    } catch (error) {
      console.error('Error rolling dice:', error);
    }
  };

  const makeMove = async (from: number, to: number) => {
    try {
      const response = await apiClient.post(`/games/${game.id}/move`, {
        move: { from, to },
      });
      setCurrentGame(response.data);
      setSelectedPoint(null);
      setDice(null);
    } catch (error) {
      console.error('Error making move:', error);
      setSelectedPoint(null);
    }
  };

  const handlePointClick = (pointIndex: number) => {
    if (!dice || dice.length === 0) {
      return;
    }

    if (selectedPoint === null) {
      setSelectedPoint(pointIndex);
    } else {
      makeMove(selectedPoint, pointIndex);
    }
  };

  const renderBoard = () => {
    const boardState = currentGame?.board_state || { points: [] };
    const points = boardState.points || [];

    return (
      <div className="board-container">
        <div className="board">
          {Array.from({ length: 24 }, (_, i) => {
            const pointValue = points[i] || 0;
            const isWhite = pointValue > 0;
            const isBlack = pointValue < 0;
            const count = Math.abs(pointValue);

            return (
              <div
                key={i}
                className={`point ${selectedPoint === i ? 'selected' : ''}`}
                onClick={() => handlePointClick(i)}
              >
                {count > 0 && (
                  <div className={`checkers ${isWhite ? 'white' : 'black'}`}>
                    {count > 0 && <span className="checker-count">{count}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const isMyTurn = currentUserId && currentGame?.current_turn_user_id === currentUserId;

  return (
    <div className="board-screen">
      <div className="board-header">
        <button onClick={onExit} className="btn-exit">
          ← Назад
        </button>
        <div className="game-info">
          <div>Игра #{currentGame?.id}</div>
          <div>{currentGame?.type === 'short' ? 'Короткие' : 'Длинные'} нарды</div>
        </div>
      </div>

      {renderBoard()}

      <div className="board-controls">
        {dice && dice.length > 0 && (
          <div className="dice">
            {dice.map((die, idx) => (
              <div key={idx} className="die">
                {die}
              </div>
            ))}
          </div>
        )}

        {isMyTurn && !dice && (
          <button onClick={rollDice} className="btn-roll">
            Бросить кости
          </button>
        )}

        {!isMyTurn && (
          <div className="waiting">Ожидание хода соперника...</div>
        )}
      </div>
    </div>
  );
}

