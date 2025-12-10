import { useState } from 'react';
import { PageHeader, DataTable, Input, Select } from '../components';
import { Button, Modal } from '../../components/ui';
import { adminGameHistory } from '../mock/adminData';
import type { GameHistory } from '../../types';
import './AdminGames.css';

export const AdminGames = () => {
  const [selectedGame, setSelectedGame] = useState<GameHistory | null>(null);
  const [filterMode, setFilterMode] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGames = adminGameHistory.filter((game) => {
    const matchesMode = filterMode === 'ALL' || game.mode === filterMode;
    const matchesSearch =
      searchQuery === '' ||
      game.whitePlayer?.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.blackPlayer?.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.roomId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMode && matchesSearch;
  });

  const columns = [
    {
      key: 'id',
      header: 'ID',
    },
    {
      key: 'roomId',
      header: 'Комната',
    },
    {
      key: 'mode',
      header: 'Режим',
      render: (game: GameHistory) => (
        <span className={`game-mode game-mode--${game.mode.toLowerCase()}`}>
          {game.mode === 'SHORT' ? 'Короткие' : 'Длинные'}
        </span>
      ),
    },
    {
      key: 'players',
      header: 'Игроки',
      render: (game: GameHistory) => (
        <div className="game-players">
          <span>{game.whitePlayer?.nickname || 'Игрок 1'}</span>
          <span>vs</span>
          <span>{game.blackPlayer?.nickname || 'Игрок 2'}</span>
        </div>
      ),
    },
    {
      key: 'winner',
      header: 'Победитель',
      render: (game: GameHistory) => (
        <span className={game.winnerId === game.whitePlayerId ? 'game-winner' : 'game-loser'}>
          {game.winnerId === game.whitePlayerId
            ? game.whitePlayer?.nickname
            : game.blackPlayer?.nickname}
        </span>
      ),
    },
    {
      key: 'duration',
      header: 'Длительность',
      render: (game: GameHistory) =>
        game.duration ? `${Math.floor(game.duration / 60)}:${(game.duration % 60).toString().padStart(2, '0')}` : '-',
    },
    {
      key: 'createdAt',
      header: 'Дата',
      render: (game: GameHistory) => new Date(game.createdAt).toLocaleString('ru-RU'),
    },
  ];

  return (
    <div className="admin-games">
      <PageHeader
        title="История игр"
        description="Просмотр и управление всеми играми"
        actions={
          <Button variant="primary" onClick={() => console.log('Export')}>
            📥 Экспорт
          </Button>
        }
      />

      <div className="admin-games__filters">
        <Input
          placeholder="Поиск по игрокам или комнате..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: '300px' }}
        />
        <Select
          value={filterMode}
          onChange={(e) => setFilterMode(e.target.value)}
          options={[
            { value: 'ALL', label: 'Все режимы' },
            { value: 'SHORT', label: 'Короткие нарды' },
            { value: 'LONG', label: 'Длинные нарды' },
          ]}
          style={{ maxWidth: '200px' }}
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredGames}
        onRowClick={(game) => setSelectedGame(game as GameHistory)}
        emptyMessage="Игры не найдены"
      />

      {selectedGame && (
        <Modal
          isOpen={!!selectedGame}
          onClose={() => setSelectedGame(null)}
          title={`Игра #${selectedGame.id}`}
          size="lg"
        >
          <div className="game-details">
            <div className="game-details__section">
              <h4>Информация об игре</h4>
              <div className="game-details__info">
                <div className="game-details__item">
                  <span className="game-details__label">Комната:</span>
                  <span className="game-details__value">{selectedGame.roomId}</span>
                </div>
                <div className="game-details__item">
                  <span className="game-details__label">Режим:</span>
                  <span className="game-details__value">
                    {selectedGame.mode === 'SHORT' ? 'Короткие нарды' : 'Длинные нарды'}
                  </span>
                </div>
                <div className="game-details__item">
                  <span className="game-details__label">Длительность:</span>
                  <span className="game-details__value">
                    {selectedGame.duration
                      ? `${Math.floor(selectedGame.duration / 60)}:${(selectedGame.duration % 60).toString().padStart(2, '0')}`
                      : '-'}
                  </span>
                </div>
                <div className="game-details__item">
                  <span className="game-details__label">Дата:</span>
                  <span className="game-details__value">
                    {new Date(selectedGame.createdAt).toLocaleString('ru-RU')}
                  </span>
                </div>
              </div>
            </div>

            <div className="game-details__section">
              <h4>Игроки</h4>
              <div className="game-details__players">
                <div className="game-details__player">
                  <div className="game-details__player-name">
                    {selectedGame.whitePlayer?.nickname || 'Игрок 1'}
                    {selectedGame.winnerId === selectedGame.whitePlayerId && ' 👑'}
                  </div>
                  <div className="game-details__player-info">
                    Уровень: {selectedGame.whitePlayer?.level || 'N/A'} | Рейтинг: 1650
                  </div>
                </div>
                <div className="game-details__vs">VS</div>
                <div className="game-details__player">
                  <div className="game-details__player-name">
                    {selectedGame.blackPlayer?.nickname || 'Игрок 2'}
                    {selectedGame.winnerId === selectedGame.blackPlayerId && ' 👑'}
                  </div>
                  <div className="game-details__player-info">
                    Уровень: {selectedGame.blackPlayer?.level || 'N/A'} | Рейтинг: 1580
                  </div>
                </div>
              </div>
            </div>

            <div className="game-details__actions">
              <Button variant="outline" fullWidth>
                📊 Просмотр реплея
              </Button>
              <Button variant="outline" fullWidth>
                📥 Экспорт JSON
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

