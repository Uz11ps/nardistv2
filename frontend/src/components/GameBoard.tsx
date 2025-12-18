import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import './GameBoard.css';

interface GameBoardProps {
  gameId: string;
}

export default function GameBoard({ gameId }: GameBoardProps) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000', {
      auth: { token },
    });

    newSocket.emit('join_game', { gameId });

    newSocket.on('move_made', (data) => {
      // TODO: Update board state
      console.log('Move made:', data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [gameId]);

  const rollDice = () => {
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    
    if (socket) {
      socket.emit('make_move', {
        gameId,
        dice1,
        dice2,
        moves: [],
      });
    }
  };

  return (
    <div className="game-board">
      <div className="board-container">
        <div className="board">
          {/* TODO: Render backgammon board */}
          <p>Игровая доска (в разработке)</p>
        </div>
      </div>
      <div className="controls">
        <button onClick={rollDice}>Бросить кости</button>
      </div>
    </div>
  );
}
