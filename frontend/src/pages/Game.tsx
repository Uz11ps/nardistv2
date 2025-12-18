import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import GameBoard from '../components/GameBoard';
import './Game.css';

export default function Game() {
  const { id } = useParams();
  const [game, setGame] = useState<any>(null);

  useEffect(() => {
    // TODO: Load game data
    setGame({ id, status: 'waiting' });
  }, [id]);

  if (!game) {
    return <div>Загрузка игры...</div>;
  }

  return (
    <div className="game">
      <GameBoard gameId={id!} />
    </div>
  );
}
