import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Button, Tabs, NotificationModal, ConfirmModal } from '../components/ui';
import { GameBoard } from '../components/game/GameBoard';
import { BotGame } from '../game/components/BotGame';
import { wsService } from '../services/websocket.service';
import { useAuthStore } from '../store/auth.store';
import { userService } from '../services';
import type { PlayerColor } from '../game/logic/gameLogic';
import './Game.css';

interface GameState {
  mode: 'SHORT' | 'LONG';
  status: 'WAITING' | 'IN_PROGRESS' | 'FINISHED' | 'ABANDONED';
  currentPlayer: 'WHITE' | 'BLACK';
  board: number[];
  bar: { white: number; black: number };
  home: { white: number; black: number };
  dice: { die1: number; die2: number; timestamp: number } | null;
  moves: Array<{ from: number; to: number; timestamp: number }>;
  players: { white: number | null; black: number | null };
}

export const Game = () => {
  const [gameMode, setGameMode] = useState<'SHORT' | 'LONG'>('LONG'); // По умолчанию длинные нарды
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameType, setGameType] = useState<'bot' | 'quick' | 'search' | null>(null);
  const [notification, setNotification] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmSurrender, setConfirmSurrender] = useState(false);
  const [usedDice, setUsedDice] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (token) {
      wsService.connect(token);
    }

    return () => {
      wsService.disconnect();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [token]);

  useEffect(() => {
    if (!wsService.getSocket()) return;

    const socket = wsService.getSocket()!;

    // Обработчики событий
    socket.on('dice-rolled', (data: { dice: any; currentPlayer: string }) => {
      setGameState(prev => prev ? { ...prev, dice: data.dice } : null);
      setUsedDice([]);
    });

    socket.on('game-state-updated', (data: { state: GameState; move: any }) => {
      setGameState(data.state);
      setUsedDice([]);
    });

    socket.on('turn-switched', (data: { currentPlayer: string; state: GameState }) => {
      setGameState(data.state);
      setUsedDice([]);
      setTimeLeft(60);
    });

    socket.on('game-ended', (data: { winner: string; state: GameState }) => {
      setGameState(data.state);
      setIsPlaying(false);
      setNotification({
        title: 'Игра окончена',
        message: data.winner === (gameState?.players.white === user?.id ? 'WHITE' : 'BLACK')
          ? 'Вы победили!'
          : 'Вы проиграли',
        type: data.winner === (gameState?.players.white === user?.id ? 'WHITE' : 'BLACK') ? 'success' : 'error',
      });
      
      setTimeout(() => {
        navigate('/');
      }, 3000);
    });

    socket.on('game-found', (data: { roomId: string; state: GameState }) => {
      setRoomId(data.roomId);
      setGameState(data.state);
      setIsPlaying(true);
      setIsSearching(false);
      wsService.joinRoom(data.roomId);
    });

    return () => {
      socket.off('dice-rolled');
      socket.off('game-state-updated');
      socket.off('turn-switched');
      socket.off('game-ended');
      socket.off('game-found');
    };
  }, [user, gameState, navigate]);

  // Таймер хода
  useEffect(() => {
    if (isPlaying && gameState && gameState.status === 'IN_PROGRESS') {
      const isMyTurn = (gameState.currentPlayer === 'WHITE' && gameState.players.white === user?.id) ||
                       (gameState.currentPlayer === 'BLACK' && gameState.players.black === user?.id);

      if (isMyTurn) {
        timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              // Время вышло, передаем ход
              handleEndTurn();
              return 60;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setTimeLeft(60);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, gameState, user]);

  const handleStartBotGame = () => {
    // Запускаем локальную игру с ботом (без WebSocket)
    setIsPlaying(true);
    setGameType('bot');
  };

  const handleBotGameEnd = (winner: PlayerColor) => {
    setNotification({
      title: 'Игра окончена',
      message: winner === 'WHITE' 
        ? 'Вы победили! 🎉'
        : 'Бот победил! 🤖',
      type: winner === 'WHITE' ? 'success' : 'error',
    });
    
    setTimeout(() => {
      setIsPlaying(false);
      setGameType(null);
      navigate('/');
    }, 3000);
  };

  const handleExitBotGame = () => {
    if (window.confirm('Вы уверены, что хотите выйти из игры?')) {
      setIsPlaying(false);
      setGameType(null);
    }
  };

  const handleStartQuickGame = async () => {
    if (!wsService.getSocket()) {
      setNotification({
        title: 'Ошибка',
        message: 'WebSocket не подключен',
        type: 'error',
      });
      return;
    }

    try {
      const socket = wsService.getSocket()!;
      setIsSearching(true);
      setGameType('quick');
      
      socket.emit('start-quick-game', { mode: gameMode }, (response: any) => {
        if (response.error) {
          setNotification({
            title: 'Ошибка',
            message: response.error,
            type: 'error',
          });
          setIsSearching(false);
          return;
        }

        if (response.searching) {
          // Ожидаем соперника
          return;
        }

        setRoomId(response.roomId);
        setGameState(response.state);
        setIsPlaying(true);
        setIsSearching(false);
        wsService.joinRoom(response.roomId);
      });
    } catch (error) {
      console.error('Error starting quick game:', error);
      setNotification({
        title: 'Ошибка',
        message: 'Не удалось начать быструю игру',
        type: 'error',
      });
      setIsSearching(false);
    }
  };

  const handleLeaveQueue = () => {
    if (wsService.getSocket()) {
      wsService.getSocket()!.emit('leave-queue');
      setIsSearching(false);
      setGameType(null);
    }
  };

  const handleRollDice = () => {
    if (!roomId || !gameState) return;

    const isMyTurn = (gameState.currentPlayer === 'WHITE' && gameState.players.white === user?.id) ||
                     (gameState.currentPlayer === 'BLACK' && gameState.players.black === user?.id);

    if (!isMyTurn) {
      setNotification({
        title: 'Не ваш ход',
        message: 'Дождитесь своего хода',
        type: 'info',
      });
      return;
    }

    wsService.sendGameAction(roomId, 'roll-dice', {});
  };

  const handleMakeMove = (from: number, to: number) => {
    if (!roomId || !gameState || !gameState.dice) return;

    const isMyTurn = (gameState.currentPlayer === 'WHITE' && gameState.players.white === user?.id) ||
                     (gameState.currentPlayer === 'BLACK' && gameState.players.black === user?.id);

    if (!isMyTurn) {
      return;
    }

    // Определяем, какой кубик использовать
    const { die1, die2 } = gameState.dice;
    const distance = Math.abs(to - from);
    
    let dieValue: number | null = null;
    if (distance === die1 && !usedDice.includes(die1)) {
      dieValue = die1;
    } else if (distance === die2 && !usedDice.includes(die2)) {
      dieValue = die2;
    }

    if (!dieValue) {
      setNotification({
        title: 'Неверный ход',
        message: 'Выберите правильное расстояние для хода',
        type: 'error',
      });
      return;
    }

    wsService.sendGameAction(roomId, 'make-move', {
      from,
      to,
      dieValue,
    });

    setUsedDice([...usedDice, dieValue]);
  };

  const handleEndTurn = () => {
    if (!roomId) return;
    wsService.sendGameAction(roomId, 'end-turn', {});
  };

  const handleSurrender = () => {
    if (!roomId) return;
    setConfirmSurrender(true);
  };

  const tabs = [
    {
      id: 'SHORT',
      label: 'Короткие нарды',
      content: <GameContent mode="SHORT" />,
    },
    {
      id: 'LONG',
      label: 'Длинные нарды',
      content: <GameContent mode="LONG" />,
    },
  ];

  return (
    <div className="game-page">
      <Link to="/" className="game-page__back">←</Link>
      <h1 className="game-page__title">🎲 Игра</h1>
      <Tabs tabs={tabs} onChange={(id) => setGameMode(id as 'SHORT' | 'LONG')} />
    </div>
  );

  function GameContent({ mode }: { mode: 'SHORT' | 'LONG' }) {
    // Локальная игра с ботом
    if (isPlaying && gameType === 'bot') {
      return <BotGame mode={mode} onGameEnd={handleBotGameEnd} onExit={handleExitBotGame} />;
    }

    if (isSearching) {
      return (
        <div className="game-content">
          <Card className="game-menu__card">
            <h2>Поиск соперника...</h2>
            <div className="game-search-animation">🔍</div>
            <Button variant="danger" fullWidth onClick={handleLeaveQueue}>
              Отменить поиск
            </Button>
          </Card>
        </div>
      );
    }

    if (isPlaying && gameState) {
      const isMyTurn = (gameState.currentPlayer === 'WHITE' && gameState.players.white === user?.id) ||
                       (gameState.currentPlayer === 'BLACK' && gameState.players.black === user?.id);
      const isWhite = gameState.players.white === user?.id;
      const isBot = (isWhite ? gameState.players.black : gameState.players.white) === -1;

      return (
        <div className="game-play">
          <div className="game-info">
            <Card>
              <div className="game-info__player">
                <span>Вы: {isWhite ? 'Белые' : 'Черные'}</span>
                {isBot && <span>Соперник: Бот</span>}
              </div>
              <div className="game-info__status">
                {gameState.status === 'IN_PROGRESS' && (
                  <span>Ход: {gameState.currentPlayer === 'WHITE' ? 'Белые' : 'Черные'}</span>
                )}
              </div>
            </Card>
          </div>

          <div className="game-board-container">
            <GameBoard 
              mode={mode} 
              gameState={gameState}
              isMyTurn={isMyTurn}
              onMove={handleMakeMove}
            />
          </div>

          <div className="game-controls">
            <Card className="game-controls__card">
              {gameState.dice ? (
                <div className="game-dice">
                  <div className="game-dice__result">
                    <span className="game-dice__die">{gameState.dice.die1}</span>
                    <span className="game-dice__die">{gameState.dice.die2}</span>
                  </div>
                  {isMyTurn && (
                    <div className="game-dice__used">
                      Использовано: {usedDice.join(', ') || 'нет'}
                    </div>
                  )}
                </div>
              ) : (
                <div className="game-dice">
                  {isMyTurn ? (
                    <Button onClick={handleRollDice} variant="primary" fullWidth>
                      🎲 Бросить кубики
                    </Button>
                  ) : (
                    <div>Ожидание хода соперника...</div>
                  )}
                </div>
              )}

              {isMyTurn && gameState.dice && (
                <Button onClick={handleEndTurn} variant="outline" fullWidth>
                  Завершить ход
                </Button>
              )}

              <div className="game-timer">⏱️ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>
              
              <Button variant="danger" onClick={handleSurrender}>
                Сдаться
              </Button>
            </Card>
          </div>
        </div>
      );
    }

    return (
      <div className="game-content">
        <div className="game-menu">
          <Card className="game-menu__card">
            <h2>Выберите режим игры</h2>
            <div className="game-menu__options">
              <Button variant="primary" size="lg" fullWidth onClick={handleStartBotGame}>
                🎮 Играть с ботом
              </Button>
              <Button variant="outline" size="lg" fullWidth onClick={handleStartQuickGame}>
                👥 Быстрая игра
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      {notification && (
        <NotificationModal
          isOpen={!!notification}
          onClose={() => setNotification(null)}
          title={notification.title}
          message={notification.message}
          type={notification.type}
        />
      )}
      {confirmSurrender && (
        <ConfirmModal
          isOpen={confirmSurrender}
          onClose={() => setConfirmSurrender(false)}
          onConfirm={() => {
            setIsPlaying(false);
            navigate('/');
          }}
          title="Сдаться?"
          message="Вы уверены, что хотите сдаться?"
          confirmText="Сдаться"
          cancelText="Отмена"
        />
      )}
    </>
  );
};
