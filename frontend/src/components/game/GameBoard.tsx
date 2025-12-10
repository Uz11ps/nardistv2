import { useEffect, useRef, useState } from 'react';
import './GameBoard.css';

interface GameBoardProps {
  mode: 'SHORT' | 'LONG';
  onMove?: (from: number, to: number) => void;
}

export const GameBoard = ({ mode, onMove }: GameBoardProps) => {
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

    drawBoard(ctx, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio, mode);
  }, [mode, selectedPoint]);

  const drawBoard = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    gameMode: 'SHORT' | 'LONG',
  ) => {
    ctx.clearRect(0, 0, width, height);

    // Фон доски
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 0, width, height);

    // Центральная линия
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();

    const pointWidth = width / 12;
    const pointHeight = height / 2;

    for (let i = 0; i < 12; i++) {
      const x = i * pointWidth;
      const isTop = i < 6;

      ctx.beginPath();
      ctx.moveTo(x, isTop ? 0 : height);
      ctx.lineTo(x + pointWidth / 2, isTop ? pointHeight : pointHeight);
      ctx.lineTo(x + pointWidth, isTop ? 0 : height);
      ctx.closePath();
      ctx.fillStyle = i % 2 === 0 ? '#DEB887' : '#8B4513';
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (selectedPoint === i) {
        ctx.fillStyle = 'rgba(25, 118, 210, 0.3)';
        ctx.fill();
      }
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pointWidth = rect.width / 12;
    const pointIndex = Math.floor(x / pointWidth);

    if (selectedPoint === null) {
      setSelectedPoint(pointIndex);
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

