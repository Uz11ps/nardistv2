import { useEffect, useRef, useState } from 'react';

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

    // Устанавливаем размеры canvas
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Очищаем canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Рисуем доску
    drawBoard(ctx, canvas.width, canvas.height, mode);
  }, [mode]);

  const drawBoard = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    gameMode: 'SHORT' | 'LONG',
  ) => {
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

    // Рисуем треугольники (точки)
    const pointWidth = width / 12;
    const pointHeight = height / 2;

    for (let i = 0; i < 12; i++) {
      const x = i * pointWidth;
      const isTop = i < 6;

      // Треугольник
      ctx.beginPath();
      ctx.moveTo(x, isTop ? 0 : height);
      ctx.lineTo(x + pointWidth / 2, isTop ? pointHeight : pointHeight);
      ctx.lineTo(x + pointWidth, isTop ? 0 : height);
      ctx.closePath();
      ctx.fillStyle = i % 2 === 0 ? '#DEB887' : '#8B4513';
      ctx.fill();
      ctx.stroke();

      // Номер точки
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        (i + 1).toString(),
        x + pointWidth / 2,
        isTop ? pointHeight - 10 : pointHeight + 20,
      );
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Определяем, на какую точку кликнули
    const pointWidth = canvas.width / 12;
    const pointIndex = Math.floor(x / pointWidth);

    if (selectedPoint === null) {
      setSelectedPoint(pointIndex);
    } else {
      if (onMove) {
        onMove(selectedPoint, pointIndex);
      }
      setSelectedPoint(null);
    }
  };

  return (
    <div className="game-board">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{
          width: '100%',
          maxWidth: '600px',
          height: '400px',
          border: '2px solid #000',
          borderRadius: '8px',
        }}
      />
      {selectedPoint !== null && (
        <p>Выбрана точка: {selectedPoint + 1}</p>
      )}
    </div>
  );
};

