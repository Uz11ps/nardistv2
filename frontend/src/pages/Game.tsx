import { useState, useEffect } from 'react';
import { wsService } from '../services/websocket.service';
import { GameBoard } from '../components/GameBoard';

export const Game = () => {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<'SHORT' | 'LONG'>('SHORT');

  useEffect(() => {
    const socket = wsService.getSocket();
    if (!socket) return;

    socket.on('game-action', (data: any) => {
      console.log('Game action:', data);
    });

    return () => {
      socket.off('game-action');
    };
  }, []);

  const handleJoinRoom = () => {
    const newRoomId = `room-${Date.now()}`;
    wsService.joinRoom(newRoomId);
    setRoomId(newRoomId);
  };

  const handleMove = (from: number, to: number) => {
    if (roomId) {
      wsService.sendGameAction(roomId, 'move', { from, to });
    }
  };

  return (
    <div className="game">
      <h2>Игра в нарды</h2>
      <div className="game-mode-selector">
        <button
          onClick={() => setGameMode('SHORT')}
          className={gameMode === 'SHORT' ? 'active' : ''}
        >
          Короткие нарды
        </button>
        <button
          onClick={() => setGameMode('LONG')}
          className={gameMode === 'LONG' ? 'active' : ''}
        >
          Длинные нарды
        </button>
      </div>
      {!roomId ? (
        <button onClick={handleJoinRoom}>Найти игру</button>
      ) : (
        <div>
          <p>Комната: {roomId}</p>
          <GameBoard mode={gameMode} onMove={handleMove} />
        </div>
      )}
    </div>
  );
};

