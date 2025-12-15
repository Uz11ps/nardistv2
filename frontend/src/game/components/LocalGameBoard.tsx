import { useEffect, useRef, useState } from 'react';
import type { GameState, PlayerColor } from '../logic/gameLogic';
import { isValidMoveShort, isValidMoveLong } from '../logic/gameLogic';
import './LocalGameBoard.css';

interface LocalGameBoardProps {
  mode: 'SHORT' | 'LONG';
  gameState: GameState;
  isMyTurn: boolean;
  isWhite: boolean;
  onMove: (from: number, to: number, dieValue: number) => void;
  selectedDie?: number | null;
}

interface PointInfo {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isTop: boolean;
}

export const LocalGameBoard = ({
  mode,
  gameState,
  isMyTurn,
  isWhite,
  onMove,
  selectedDie,
}: LocalGameBoardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Array<{ from: number; to: number }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    drawBoard(
      ctx,
      canvas.width / window.devicePixelRatio,
      canvas.height / window.devicePixelRatio,
      mode,
      gameState,
      isWhite,
      selectedPoint,
      hoveredPoint,
      possibleMoves,
    );
  }, [mode, gameState, isWhite, selectedPoint, hoveredPoint, possibleMoves]);

  // Вычисляем возможные ходы при выборе точки
  useEffect(() => {
    if (!gameState.dice || !selectedPoint || selectedPoint === -1) {
      setPossibleMoves([]);
      return;
    }

    const { die1, die2 } = gameState.dice;
    const moves: Array<{ from: number; to: number }> = [];
    const isValid = mode === 'SHORT' ? isValidMoveShort : isValidMoveLong;
    
    // Определяем текущего игрока из gameState
    const currentPlayerIsWhite = gameState.currentPlayer === 'WHITE';
    const playerIsWhite = isWhite; // Это цвет игрока (пользователя), а не текущего хода
    
    // ВАЖНО: для валидации нужно использовать currentPlayer из gameState, а не isWhite из пропсов
    // Но для расчета возможных ходов используем isWhite (цвет игрока)
    
    console.log('🎯 Расчет возможных ходов:', {
      selectedPoint,
      position: selectedPoint + 1,
      mode,
      isWhite, // Цвет игрока (пользователя)
      currentPlayer: gameState.currentPlayer,
      currentPlayerIsWhite,
      dice: { die1, die2 },
      boardAtSelected: gameState.board[selectedPoint],
    });
    
    if (selectedPoint === -1) {
      // Ход с бара
      const barCount = isWhite ? gameState.bar.white : gameState.bar.black;
      if (barCount > 0) {
        const target1 = isWhite ? die1 - 1 : 24 - die1;
        const target2 = isWhite ? die2 - 1 : 24 - die2;
        
        if (target1 >= 0 && target1 < 24 && isValid(gameState, -1, target1, die1)) {
          moves.push({ from: -1, to: target1 });
        }
        if (target2 >= 0 && target2 < 24 && isValid(gameState, -1, target2, die2)) {
          moves.push({ from: -1, to: target2 });
        }
      }
    } else {
      // Обычные ходы - проверяем оба кубика
      if (mode === 'LONG') {
        // В длинных нардах:
        // Белые: движение вперед (от меньших индексов к большим: 0→1→2→...→23)
        // Черные: движение назад по индексам (от больших к меньшим: 23→22→21→...→0)
        if (isWhite) {
          // Белые: движение вперед от позиции 1 (индекс 0) к позиции 24 (индекс 23)
          // Проверяем оба кубика
          const diceToCheck = die1 === die2 ? [die1, die1, die1, die1] : [die1, die2];
          
          console.log('🔍 Проверка ходов для белых:', {
            selectedPoint,
            position: selectedPoint + 1,
            die1,
            die2,
            isDouble: die1 === die2,
            diceToCheck,
            boardAtSelected: gameState.board[selectedPoint],
            currentPlayer: gameState.currentPlayer,
            isWhite,
            mode,
          });
          
          // Проверяем каждый кубик
          for (const dieValue of diceToCheck) {
            const target = selectedPoint + dieValue;
            
            if (target >= 0 && target < 24 && target > selectedPoint) {
              try {
                const valid = isValid(gameState, selectedPoint, target, dieValue);
                console.log(`  Ход на позицию ${target + 1} (индекс ${target}, ${dieValue} шагов):`, valid ? '✅ ВАЛИДЕН' : '❌ НЕВАЛИДЕН', {
                  boardAtTarget: gameState.board[target],
                  hasOpponent: gameState.board[target] > 0,
                });
                if (valid) {
                  moves.push({ from: selectedPoint, to: target });
                }
              } catch (error) {
                console.error(`Ошибка при проверке хода на target ${target}:`, error);
              }
            } else {
              console.log(`  Ход на ${target} пропущен:`, {
                inBounds: target >= 0 && target < 24,
                forward: target > selectedPoint,
              });
            }
          }
        } else {
          const target1 = selectedPoint - die1;
          const target2 = selectedPoint - die2;
          
          if (target1 >= 0 && target1 < 24 && target1 < selectedPoint) {
            if (isValid(gameState, selectedPoint, target1, die1)) {
              moves.push({ from: selectedPoint, to: target1 });
            }
          }
          if (target2 >= 0 && target2 < 24 && target2 < selectedPoint) {
            if (isValid(gameState, selectedPoint, target2, die2)) {
              moves.push({ from: selectedPoint, to: target2 });
            }
          }
        }
      } else {
        // В коротких нардах
        const direction = isWhite ? -1 : 1;
        const target1 = selectedPoint + (die1 * direction);
        const target2 = selectedPoint + (die2 * direction);
        
        if (target1 >= 0 && target1 < 24 && isValid(gameState, selectedPoint, target1, die1)) {
          moves.push({ from: selectedPoint, to: target1 });
        }
        if (target2 >= 0 && target2 < 24 && isValid(gameState, selectedPoint, target2, die2)) {
          moves.push({ from: selectedPoint, to: target2 });
        }
      }
    }
    
    console.log('🎯 Возможные ходы:', {
      selectedPoint,
      mode,
      isWhite,
      dice: { die1, die2 },
      moves,
    });
    
    setPossibleMoves(moves);
  }, [selectedPoint, gameState, isWhite, mode]);

  const drawBoard = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    gameMode: 'SHORT' | 'LONG',
    state: GameState,
    playerIsWhite: boolean,
    selected?: number | null,
    hovered?: number | null,
    possibleMoves?: Array<{ from: number; to: number }>,
  ) => {
    ctx.clearRect(0, 0, width, height);

    // Фон доски с градиентом
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#8B4513');
    bgGradient.addColorStop(0.5, '#654321');
    bgGradient.addColorStop(1, '#8B4513');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    const barWidth = 50;
    const leftHalfWidth = (width - barWidth) / 2;
    const rightHalfWidth = (width - barWidth) / 2;
    const pointWidth = leftHalfWidth / 6; // 6 точек на каждую половину
    const pointHeight = height / 2;
    const barX = leftHalfWidth;
    const barEndX = barX + barWidth;

    // Рисуем бар (центр доски) с рамкой
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(barX, 0, barWidth, height);
    ctx.strokeStyle = '#3E2723';
    ctx.lineWidth = 3;
    ctx.strokeRect(barX, 0, barWidth, height);

    // Рисуем фишки на баре
    if (state.bar.white > 0) {
      const barY = height / 2 - 40;
      const checkerX = barX + barWidth / 2;
      for (let i = 0; i < Math.min(state.bar.white, 5); i++) {
        drawChecker(ctx, checkerX, barY - i * 18, true, selected === -1 && playerIsWhite);
      }
      if (state.bar.white > 5) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`+${state.bar.white - 5}`, checkerX, barY - 5 * 18 - 12);
      }
    }
    if (state.bar.black > 0) {
      const barY = height / 2 + 40;
      const checkerX = barX + barWidth / 2;
      for (let i = 0; i < Math.min(state.bar.black, 5); i++) {
        drawChecker(ctx, checkerX, barY + i * 18, false, selected === -1 && !playerIsWhite);
      }
      if (state.bar.black > 5) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`+${state.bar.black - 5}`, checkerX, barY + 5 * 18 + 12);
      }
    }

    // Создаем массив точек для удобства
    const points: PointInfo[] = [];
    
    // Левая половина (точки 0-11)
    // Точки 0-5 сверху, точки 6-11 снизу
    for (let i = 0; i < 12; i++) {
      const pointIndex = i;
      const isTop = i < 6;
      const pointNum = isTop ? i : i - 6; // Номер точки в ряду (0-5)
      const x = pointNum * pointWidth;
      const y = isTop ? 0 : height;
      
      points.push({
        index: pointIndex,
        x,
        y,
        width: pointWidth,
        height: pointHeight,
        isTop,
      });
    }
    
    // Правая половина (точки 12-23)
    // Точки 12-17 сверху, точки 18-23 снизу
    for (let i = 0; i < 12; i++) {
      const pointIndex = 12 + i;
      const isTop = i < 6;
      const pointNum = isTop ? i : i - 6; // Номер точки в ряду (0-5)
      const x = barEndX + pointNum * pointWidth;
      const y = isTop ? 0 : height;
      
      points.push({
        index: pointIndex,
        x,
        y,
        width: pointWidth,
        height: pointHeight,
        isTop,
      });
    }

    // Рисуем точки
    points.forEach((point) => {
      const { index, x, y, width, height: h, isTop } = point;
      
      // Цвет точки (чередование)
      const isLight = (Math.floor(index / 6) + (index % 2)) % 2 === 0;
      ctx.fillStyle = isLight ? '#DEB887' : '#8B4513';
      
      // Треугольник точки
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + width / 2, isTop ? h : h);
      ctx.lineTo(x + width, y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#654321';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Подсветка возможных ходов
      if (possibleMoves && possibleMoves.some(m => m.to === index)) {
        ctx.fillStyle = 'rgba(76, 175, 80, 0.4)';
        ctx.fill();
      }

      // Подсветка выбранной точки
      if (selected === index) {
        ctx.fillStyle = 'rgba(25, 118, 210, 0.5)';
        ctx.fill();
        ctx.strokeStyle = '#1976d2';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      
      // Подсветка при наведении
      if (hovered === index && isMyTurn) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();
      }

      // Номер точки
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        (index + 1).toString(),
        x + width / 2,
        isTop ? h - 8 : h + 18,
      );

      // Рисуем фишки на точке
      if (state.board[index] !== 0) {
        const count = Math.abs(state.board[index]);
        const checkerIsWhite = state.board[index] < 0;
        const maxVisible = 5;
        const checkerRadius = 12;
        const checkerSpacing = 18; // Расстояние между фишками
        const checkerX = x + width / 2;

        for (let j = 0; j < Math.min(count, maxVisible); j++) {
          const offsetY = isTop
            ? h - checkerRadius - 5 - j * checkerSpacing
            : h + checkerRadius + 5 + j * checkerSpacing;
          
          drawChecker(
            ctx,
            checkerX,
            offsetY,
            checkerIsWhite,
            selected === index && ((playerIsWhite && checkerIsWhite) || (!playerIsWhite && !checkerIsWhite)),
          );
        }

        // Показываем количество, если больше 5
        if (count > maxVisible) {
          const lastVisibleY = isTop
            ? h - checkerRadius - 5 - (maxVisible - 1) * checkerSpacing
            : h + checkerRadius + 5 + (maxVisible - 1) * checkerSpacing;
          
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(
            `+${count - maxVisible}`,
            checkerX,
            isTop ? lastVisibleY - checkerRadius - 8 : lastVisibleY + checkerRadius + 18,
          );
        }
      }
    });

    // Дом (выведенные фишки) с улучшенным дизайном
    const homeAreaWidth = 80;
    const homeAreaHeight = 50;
    
    // Белые дом (слева внизу)
    if (state.home.white > 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(10, height - homeAreaHeight - 10, homeAreaWidth, homeAreaHeight);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, height - homeAreaHeight - 10, homeAreaWidth, homeAreaHeight);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Дом: ${state.home.white}`, 15, height - 25);
    }
    
    // Черные дом (справа внизу)
    if (state.home.black > 0) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(width - homeAreaWidth - 10, height - homeAreaHeight - 10, homeAreaWidth, homeAreaHeight);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(width - homeAreaWidth - 10, height - homeAreaHeight - 10, homeAreaWidth, homeAreaHeight);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`Дом: ${state.home.black}`, width - 15, height - 25);
    }
  };

  const drawChecker = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    isWhite: boolean,
    isSelected: boolean,
  ) => {
    const radius = 12;
    
    // Тень
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.arc(x + 2, y + 2, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Фишка с градиентом
    const gradient = ctx.createRadialGradient(x - 4, y - 4, 0, x, y, radius);
    if (isWhite) {
      gradient.addColorStop(0, '#fff');
      gradient.addColorStop(0.7, '#e0e0e0');
      gradient.addColorStop(1, '#bdbdbd');
    } else {
      gradient.addColorStop(0, '#424242');
      gradient.addColorStop(0.7, '#212121');
      gradient.addColorStop(1, '#000');
    }
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Обводка
    ctx.strokeStyle = isWhite ? '#000' : '#fff';
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.stroke();
    
    // Подсветка выбранной фишки
    if (isSelected) {
      ctx.fillStyle = 'rgba(25, 118, 210, 0.4)';
      ctx.beginPath();
      ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Блик
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(x - 3, y - 3, radius / 3, 0, Math.PI * 2);
    ctx.fill();
  };

  const getPointAtPosition = (x: number, y: number, width: number, height: number): number | null => {
    const barWidth = 50;
    const leftHalfWidth = (width - barWidth) / 2;
    const rightHalfWidth = (width - barWidth) / 2;
    const pointWidth = leftHalfWidth / 6;
    const pointHeight = height / 2;
    const barX = leftHalfWidth;
    const barEndX = barX + barWidth;

    // Проверка клика по бару
    if (x >= barX && x <= barEndX) {
      return -1;
    }

    // Левая половина
    if (x < barX) {
      const pointNum = Math.floor(x / pointWidth);
      const isTop = y < pointHeight;
      if (pointNum >= 0 && pointNum < 6) {
        return isTop ? pointNum : pointNum + 6;
      }
    }
    
    // Правая половина
    if (x > barEndX) {
      const pointNum = Math.floor((x - barEndX) / pointWidth);
      const isTop = y < pointHeight;
      if (pointNum >= 0 && pointNum < 6) {
        return isTop ? 12 + pointNum : 18 + pointNum;
      }
    }

    return null;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMyTurn || !gameState.dice) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;

    const clickedPoint = getPointAtPosition(x, y, width, height);
    if (clickedPoint === null) return;

    // Проверяем, можем ли мы выбрать эту точку
    if (selectedPoint === null) {
      // Выбор исходной точки
      if (clickedPoint === -1) {
        // Клик по бару - проверяем, что на баре есть наши фишки
        const barCount = isWhite ? gameState.bar.white : gameState.bar.black;
        if (barCount > 0) {
          setSelectedPoint(-1);
        } else {
          console.log('⚠️ На баре нет ваших фишек');
        }
      } else {
        // Клик по точке на доске - проверяем, что это наши фишки
        const boardValue = gameState.board[clickedPoint];
        const hasMyChecker = isWhite ? boardValue < 0 : boardValue > 0;
        const hasOpponentChecker = isWhite ? boardValue > 0 : boardValue < 0;
        
        console.log(`🔍 Проверка выбора точки ${clickedPoint + 1}:`, {
          boardValue,
          isWhite,
          hasMyChecker,
          hasOpponentChecker,
          expected: isWhite ? 'negative (white)' : 'positive (black)',
        });
        
        if (hasMyChecker) {
          setSelectedPoint(clickedPoint);
          console.log(`✅ Выбрана точка ${clickedPoint + 1} с вашими фишками (${Math.abs(boardValue)})`);
        } else if (hasOpponentChecker) {
          console.log(`❌ Нельзя выбрать точку ${clickedPoint + 1} - там фишки противника (${Math.abs(boardValue)})`);
          // Не позволяем выбрать фишки противника
          return;
        } else {
          console.log(`⚠️ Точка ${clickedPoint + 1} пуста`);
        }
      }
    } else {
      // Выполнение хода
      if (selectedPoint === clickedPoint) {
        // Отмена выбора
        setSelectedPoint(null);
        return;
      }

      // Дополнительная проверка: нельзя ходить на точку с фишками противника (кроме коротких нард, где можно бить)
      if (clickedPoint !== -1 && clickedPoint >= 0 && clickedPoint < 24) {
        const targetBoardValue = gameState.board[clickedPoint];
        const hasOpponentChecker = isWhite ? targetBoardValue > 0 : targetBoardValue < 0;
        
        // В длинных нардах нельзя ставить на точку с фишками противника
        if (mode === 'LONG' && hasOpponentChecker) {
          console.log(`❌ Нельзя ходить на точку ${clickedPoint + 1} - там фишки противника`);
          setSelectedPoint(null);
          return;
        }
        
        // В коротких нардах можно бить только одиночные фишки противника
        if (mode === 'SHORT' && hasOpponentChecker && Math.abs(targetBoardValue) >= 2) {
          console.log(`❌ Нельзя ходить на точку ${clickedPoint + 1} - там блок противника`);
          setSelectedPoint(null);
          return;
        }
      }
      
      // Определяем расстояние в зависимости от режима игры
      let distance: number;
      if (selectedPoint === -1) {
        // Ход с бара
        distance = isWhite ? (clickedPoint + 1) : (24 - clickedPoint);
      } else {
        // Обычный ход
        if (mode === 'LONG') {
          // В длинных нардах:
          // Белые: движение от меньших индексов к большим (0→1→2→...→23)
          // Черные: движение от больших индексов к меньшим (23→22→21→...→0)
          if (isWhite) {
            distance = clickedPoint > selectedPoint ? clickedPoint - selectedPoint : 0;
          } else {
            distance = selectedPoint > clickedPoint ? selectedPoint - clickedPoint : 0;
          }
        } else {
          // В коротких нардах:
          // Белые: движение от больших индексов к меньшим
          // Черные: движение от меньших индексов к большим
          distance = isWhite 
            ? (selectedPoint - clickedPoint)  // Белые: от большего к меньшему
            : (clickedPoint - selectedPoint); // Черные: от меньшего к большему
        }
      }
      
      // Проверка корректности направления
      if (distance <= 0) {
        console.log(`❌ Неправильное направление: расстояние = ${distance}`);
        setSelectedPoint(null);
        return;
      }

      const { die1, die2 } = gameState.dice;
      
      // Если выбран конкретный кубик, используем его значение для определения целевой точки
      if (selectedDie) {
        let targetPoint: number;
        if (selectedPoint === -1) {
          // Ход с бара
          targetPoint = isWhite ? (selectedDie - 1) : (24 - selectedDie);
        } else {
          // Обычный ход
          if (mode === 'LONG') {
            if (isWhite) {
              targetPoint = selectedPoint + selectedDie;
            } else {
              targetPoint = selectedPoint - selectedDie;
            }
          } else {
            // Короткие нарды
            targetPoint = isWhite 
              ? selectedPoint - selectedDie
              : selectedPoint + selectedDie;
          }
        }
        
        // Проверяем, что целевая точка совпадает с кликнутой
        if (targetPoint === clickedPoint && targetPoint >= 0 && targetPoint < 24) {
          // Проверяем валидность хода через функцию валидации
          const isValid = mode === 'SHORT' ? isValidMoveShort : isValidMoveLong;
          if (isValid(gameState, selectedPoint, clickedPoint, selectedDie)) {
            console.log(`✅ Ход с выбранным кубиком ${selectedDie}: с позиции ${selectedPoint + 1} на позицию ${clickedPoint + 1}`);
            onMove(selectedPoint, clickedPoint, selectedDie);
            setSelectedPoint(null);
            return;
          } else {
            console.log(`❌ Ход с выбранным кубиком ${selectedDie} невалиден`);
            setSelectedPoint(null);
            return;
          }
        } else {
          console.log(`⚠️ Выбран кубик ${selectedDie}, но кликнута позиция ${clickedPoint + 1}, а должна быть ${targetPoint + 1}`);
          // Не сбрасываем выбор, позволяем пользователю кликнуть на правильную позицию
          return;
        }
      }
      
      // Если кубик не выбран, используем стандартную логику
      let dieValue: number | null = null;
      if (distance === die1) {
        dieValue = die1;
      } else if (distance === die2) {
        dieValue = die2;
      }

      if (dieValue) {
        console.log(`✅ Ход без выбранного кубика: расстояние ${distance}, используется кубик ${dieValue}`);
        onMove(selectedPoint, clickedPoint, dieValue);
        setSelectedPoint(null);
      } else {
        console.log(`❌ Расстояние ${distance} не соответствует ни одному кубику (${die1}, ${die2})`);
        // Попытка выбрать другую точку - только если это наши фишки
        const boardValue = gameState.board[clickedPoint];
        const hasMyChecker = isWhite ? boardValue < 0 : boardValue > 0;
        const hasOpponentChecker = isWhite ? boardValue > 0 : boardValue < 0;
        
        if (hasMyChecker) {
          setSelectedPoint(clickedPoint);
          console.log(`✅ Выбрана новая точка ${clickedPoint + 1} с вашими фишками`);
        } else if (hasOpponentChecker) {
          console.log(`❌ Нельзя выбрать точку ${clickedPoint + 1} - там фишки противника`);
          setSelectedPoint(null);
        } else {
          setSelectedPoint(null);
        }
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMyTurn) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;

    const hovered = getPointAtPosition(x, y, width, height);
    setHoveredPoint(hovered);
  };

  return (
    <div className="local-game-board-wrapper">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={() => setHoveredPoint(null)}
        className="local-game-board-canvas"
      />
      {selectedPoint !== null && gameState.dice && (
        <div className="local-game-board-hint">
          <span className="hint-label">Выбрана точка:</span>
          <span className="hint-value">{selectedPoint === -1 ? 'Бар' : selectedPoint + 1}</span>
          {possibleMoves.length > 0 && (
            <>
              <span className="hint-arrow">→</span>
              <span className="hint-label">Возможные ходы:</span>
              <span className="hint-value">{possibleMoves.map(m => m.to + 1).join(', ')}</span>
            </>
          )}
          {possibleMoves.length === 0 && (
            <span className="hint-error">Нет возможных ходов с этой точки</span>
          )}
        </div>
      )}
    </div>
  );
};
