import { useState, useEffect } from 'react';
import { PageHeader, DataTable, Input, Select } from '../components';
import { Button, Modal } from '../../components/ui';
import { adminService } from '../../services';
import type { GameHistory } from '../../types';
import './AdminGames.css';

export const AdminGames = () => {
  const [selectedGame, setSelectedGame] = useState<GameHistory | null>(null);
  const [filterMode, setFilterMode] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    adminService.getGames(page, 50)
      .then((data) => setGames(data.games))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  const filteredGames = Array.isArray(games) ? games.filter((game) => {
    const matchesMode = filterMode === 'ALL' || game.mode === filterMode;
    const matchesSearch =
      searchQuery === '' ||
      game.whitePlayer?.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.whitePlayer?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.blackPlayer?.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.blackPlayer?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
          <span>{game.whitePlayer?.nickname || game.whitePlayer?.firstName || 'Игрок 1'}</span>
          <span>vs</span>
          <span>{game.blackPlayer?.nickname || game.blackPlayer?.firstName || 'Игрок 2'}</span>
        </div>
      ),
    },
    {
      key: 'winner',
      header: 'Победитель',
      render: (game: GameHistory) => (
        <span className={game.winnerId === game.whitePlayerId ? 'game-winner' : 'game-loser'}>
          {game.winnerId === game.whitePlayerId
            ? (game.whitePlayer?.nickname || game.whitePlayer?.firstName || 'Игрок 1')
            : (game.blackPlayer?.nickname || game.blackPlayer?.firstName || 'Игрок 2')}
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
          <Button
            variant="primary"
            onClick={() => {
              const csv = [
                ['ID', 'Комната', 'Режим', 'Игрок 1', 'Игрок 2', 'Победитель', 'Длительность', 'Дата'].join(','),
                ...(Array.isArray(filteredGames) ? filteredGames.map((g) =>
                  [
                    g.id,
                    g.roomId,
                    g.mode === 'SHORT' ? 'Короткие' : 'Длинные',
                    g.whitePlayer?.nickname || g.whitePlayer?.firstName || 'Игрок 1',
                    g.blackPlayer?.nickname || g.blackPlayer?.firstName || 'Игрок 2',
                    g.winnerId === g.whitePlayerId
                      ? (g.whitePlayer?.nickname || g.whitePlayer?.firstName || 'Игрок 1')
                      : (g.blackPlayer?.nickname || g.blackPlayer?.firstName || 'Игрок 2'),
                    g.duration ? `${Math.floor(g.duration / 60)}:${(g.duration % 60).toString().padStart(2, '0')}` : '-',
                    new Date(g.createdAt).toLocaleString('ru-RU'),
                  ].join(','),
                ) : []),
              ].join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `games-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
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

      {loading ? (
        <div>Загрузка...</div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredGames}
          onRowClick={(game) => setSelectedGame(game as GameHistory)}
          emptyMessage="Игры не найдены"
        />
      )}

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
                    {selectedGame.whitePlayer?.nickname || selectedGame.whitePlayer?.firstName || 'Игрок 1'}
                    {selectedGame.winnerId === selectedGame.whitePlayerId && ' 👑'}
                  </div>
                  <div className="game-details__player-info">
                    Уровень: {selectedGame.whitePlayer?.level || 'N/A'}
                  </div>
                </div>
                <div className="game-details__vs">VS</div>
                <div className="game-details__player">
                  <div className="game-details__player-name">
                    {selectedGame.blackPlayer?.nickname || selectedGame.blackPlayer?.firstName || 'Игрок 2'}
                    {selectedGame.winnerId === selectedGame.blackPlayerId && ' 👑'}
                  </div>
                  <div className="game-details__player-info">
                    Уровень: {selectedGame.blackPlayer?.level || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            <div className="game-details__actions">
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  const json = JSON.stringify(selectedGame, null, 2);
                  const blob = new Blob([json], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `game-${selectedGame.id}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                📥 Экспорт JSON
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

