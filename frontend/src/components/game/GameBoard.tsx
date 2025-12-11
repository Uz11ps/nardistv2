import { useEffect, useRef, useState } from 'react';
import './GameBoard.css';

interface GameState {
  board: number[];
  bar: { white: number; black: number };
  home: { white: number; black: number };
  currentPlayer: 'WHITE' | 'BLACK';
}

interface GameBoardProps {
  mode: 'SHORT' | 'LONG';
  gameState?: GameState;
  isMyTurn?: boolean;
  onMove?: (from: number, to: number) => void;
}

export const GameBoard = ({ mode, gameState, isMyTurn, onMove }: GameBoardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    drawBoard(ctx, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio, mode, gameState, selectedPoint);
  }, [mode, selectedPoint, gameState]);

  const drawBoard = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    gameMode: 'SHORT' | 'LONG',
    state?: GameState,
    selected?: number | null,
  ) => {
    ctx.clearRect(0, 0, width, height);

    // Фон доски
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 0, width, height);

    // Центральная линия (бар)
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();

    // Рисуем бар (центр доски)
    if (state) {
      const barY = height / 2;
      if (state.bar.white > 0) {
        ctx.fillStyle = '#fff';
        for (let i = 0; i < Math.min(state.bar.white, 5); i++) {
          ctx.beginPath();
          ctx.arc(width / 2 - 15, barY - 20 + i * 8, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
      if (state.bar.black > 0) {
        ctx.fillStyle = '#000';
        for (let i = 0; i < Math.min(state.bar.black, 5); i++) {
          ctx.beginPath();
          ctx.arc(width / 2 + 15, barY - 20 + i * 8, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    const pointWidth = width / 12;
    const pointHeight = height / 2;

    // Рисуем 24 точки (12 сверху, 12 снизу)
    for (let i = 0; i < 24; i++) {
      const pointIndex = i < 12 ? i : 23 - (i - 12);
      const isTop = i < 12;
      const x = (i % 12) * pointWidth;
      const y = isTop ? 0 : height;

      // Треугольник точки
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + pointWidth / 2, isTop ? pointHeight : pointHeight);
      ctx.lineTo(x + pointWidth, y);
      ctx.closePath();
      ctx.fillStyle = (i % 2 === 0) ? '#DEB887' : '#8B4513';
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Рисуем фишки
      if (state && state.board[pointIndex]) {
        const count = Math.abs(state.board[pointIndex]);
        const isWhite = state.board[pointIndex] < 0;
        const maxVisible = 5;

        for (let j = 0; j < Math.min(count, maxVisible); j++) {
          const offsetY = isTop 
            ? pointHeight - 20 - j * 16
            : pointHeight + 20 + j * 16;
          
          ctx.fillStyle = isWhite ? '#fff' : '#000';
          ctx.beginPath();
          ctx.arc(x + pointWidth / 2, offsetY, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = isWhite ? '#000' : '#fff';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        if (count > maxVisible) {
          ctx.fillStyle = '#fff';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`+${count - maxVisible}`, x + pointWidth / 2, isTop ? pointHeight - 20 - maxVisible * 16 : pointHeight + 20 + maxVisible * 16);
        }
      }

      // Подсветка выбранной точки
      if (selected === pointIndex && isMyTurn) {
        ctx.fillStyle = 'rgba(25, 118, 210, 0.3)';
        ctx.fill();
      }
    }

    // Дом (выведенные фишки)
    if (state) {
      // Белые (слева)
      if (state.home.white > 0) {
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Дом: ${state.home.white}`, 10, height - 10);
      }
      // Черные (справа)
      if (state.home.black > 0) {
        ctx.fillStyle = '#000';
        ctx.font = '14px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`Дом: ${state.home.black}`, width - 10, height - 10);
      }
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMyTurn || !gameState) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pointWidth = rect.width / 12;
    const pointHeight = rect.height / 2;

    // Определяем, на какую точку кликнули
    const pointX = Math.floor(x / pointWidth);
    const isTop = y < pointHeight;
    const pointIndex = isTop ? pointX : 23 - pointX;

    if (selectedPoint === null) {
      // Проверяем, есть ли фишка на этой точке
      if (gameState.board[pointIndex] && 
          ((gameState.currentPlayer === 'WHITE' && gameState.board[pointIndex] < 0) ||
           (gameState.currentPlayer === 'BLACK' && gameState.board[pointIndex] > 0))) {
        setSelectedPoint(pointIndex);
      } else if (gameState.bar.white > 0 && gameState.currentPlayer === 'WHITE') {
        setSelectedPoint(-1); // Бар для белых
      } else if (gameState.bar.black > 0 && gameState.currentPlayer === 'BLACK') {
        setSelectedPoint(-1); // Бар для черных
      }
    } else {
      if (onMove && selectedPoint !== pointIndex) {
        onMove(selectedPoint, pointIndex);
      }
      setSelectedPoint(null);
    }
  };

  return (
    <div className="game-board-wrapper">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="game-board-canvas"
      />
      {selectedPoint !== null && (
        <div className="game-board-hint">Выбрана точка: {selectedPoint + 1}</div>
      )}
    </div>
  );
};

