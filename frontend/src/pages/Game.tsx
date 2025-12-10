import { useState } from 'react';
import { Card, Button, Tabs } from '../components/ui';
import { GameBoard } from '../components/game/GameBoard';
import './Game.css';

export const Game = () => {
  const [gameMode, setGameMode] = useState<'SHORT' | 'LONG'>('SHORT');
  const [isPlaying, setIsPlaying] = useState(false);

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
      <Tabs tabs={tabs} onChange={(id) => setGameMode(id as 'SHORT' | 'LONG')} />
    </div>
  );
};

const GameContent = ({ mode }: { mode: 'SHORT' | 'LONG' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [dice, setDice] = useState<[number, number] | null>(null);

  const rollDice = () => {
    setDice([Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]);
  };

  return (
    <div className="game-content">
      {!isPlaying ? (
        <div className="game-menu">
          <Card className="game-menu__card">
            <h2>Выберите режим игры</h2>
            <div className="game-menu__options">
              <Button variant="primary" size="lg" fullWidth onClick={() => setIsPlaying(true)}>
                🎮 Играть с ботом
              </Button>
              <Button variant="outline" size="lg" fullWidth onClick={() => setIsPlaying(true)}>
                👥 Быстрая игра
              </Button>
              <Button variant="outline" size="lg" fullWidth onClick={() => setIsPlaying(true)}>
                🔍 Найти соперника
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <div className="game-play">
          <div className="game-board-container">
            <GameBoard mode={mode} />
          </div>
          <div className="game-controls">
            <Card className="game-controls__card">
              <div className="game-dice">
                {dice ? (
                  <div className="game-dice__result">
                    <span className="game-dice__die">{dice[0]}</span>
                    <span className="game-dice__die">{dice[1]}</span>
                  </div>
                ) : (
                  <Button onClick={rollDice}>🎲 Бросить кубики</Button>
                )}
              </div>
              <div className="game-timer">⏱️ 0:45</div>
              <Button variant="danger" onClick={() => setIsPlaying(false)}>
                Сдаться
              </Button>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
