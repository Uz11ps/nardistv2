import { useState } from 'react';
import { PageHeader, DataTable, Input, Select } from '../components';
import { Button, Modal, Card } from '../../components/ui';
import { adminTournaments } from '../mock/adminData';
import type { Tournament } from '../../types';
import './AdminTournaments.css';

export const AdminTournaments = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    mode: 'SHORT' as 'SHORT' | 'LONG',
    format: 'BRACKET' as 'BRACKET' | 'ROUND_ROBIN',
    startDate: '',
    maxParticipants: '',
  });

  const columns = [
    {
      key: 'id',
      header: 'ID',
    },
    {
      key: 'name',
      header: 'Название',
    },
    {
      key: 'mode',
      header: 'Режим',
      render: (tournament: Tournament) => (
        <span>{tournament.mode === 'SHORT' ? 'Короткие' : 'Длинные'}</span>
      ),
    },
    {
      key: 'format',
      header: 'Формат',
      render: (tournament: Tournament) => (
        <span>{tournament.format === 'BRACKET' ? 'Брекет' : 'Круговой'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Статус',
      render: (tournament: Tournament) => (
        <span className={`tournament-status tournament-status--${tournament.status.toLowerCase()}`}>
          {tournament.status === 'UPCOMING' && 'Предстоящий'}
          {tournament.status === 'IN_PROGRESS' && 'В процессе'}
          {tournament.status === 'FINISHED' && 'Завершен'}
        </span>
      ),
    },
    {
      key: 'participants',
      header: 'Участники',
      render: (tournament: Tournament) => (
        <span>
          {tournament.participants?.length || 0}/{tournament.maxParticipants || '∞'}
        </span>
      ),
    },
    {
      key: 'startDate',
      header: 'Дата начала',
      render: (tournament: Tournament) => new Date(tournament.startDate).toLocaleString('ru-RU'),
    },
  ];

  const handleCreate = () => {
    setIsCreateModalOpen(true);
    setFormData({
      name: '',
      description: '',
      mode: 'SHORT',
      format: 'BRACKET',
      startDate: '',
      maxParticipants: '',
    });
  };

  const handleSave = () => {
    console.log('Создание турнира:', formData);
    setIsCreateModalOpen(false);
    // Здесь будет логика сохранения
  };

  const handleStart = (tournament: Tournament) => {
    console.log('Запуск турнира:', tournament.id);
    // Здесь будет логика запуска
  };

  const handleFinish = (tournament: Tournament) => {
    console.log('Завершение турнира:', tournament.id);
    // Здесь будет логика завершения
  };

  return (
    <div className="admin-tournaments">
      <PageHeader
        title="Турниры"
        description="Управление турнирами и соревнованиями"
        actions={<Button variant="primary" onClick={handleCreate}>➕ Создать турнир</Button>}
      />

      <DataTable
        columns={columns}
        data={adminTournaments}
        onRowClick={(tournament) => setSelectedTournament(tournament as Tournament)}
        emptyMessage="Турниры не найдены"
      />

      {selectedTournament && (
        <div className="admin-tournaments__actions">
          {selectedTournament.status === 'UPCOMING' && (
            <Button variant="primary" onClick={() => handleStart(selectedTournament)}>
              ▶️ Запустить турнир
            </Button>
          )}
          {selectedTournament.status === 'IN_PROGRESS' && (
            <Button variant="danger" onClick={() => handleFinish(selectedTournament)}>
              🏁 Завершить турнир
            </Button>
          )}
          <Button variant="outline" onClick={() => setSelectedTournament(null)}>
            Закрыть
          </Button>
        </div>
      )}

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Создать турнир"
        size="md"
      >
        <div className="tournament-form">
          <Input
            label="Название турнира"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Описание"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            type="textarea"
          />
          <Select
            label="Режим игры"
            value={formData.mode}
            onChange={(e) => setFormData({ ...formData, mode: e.target.value as 'SHORT' | 'LONG' })}
            options={[
              { value: 'SHORT', label: 'Короткие нарды' },
              { value: 'LONG', label: 'Длинные нарды' },
            ]}
            required
          />
          <Select
            label="Формат турнира"
            value={formData.format}
            onChange={(e) => setFormData({ ...formData, format: e.target.value as 'BRACKET' | 'ROUND_ROBIN' })}
            options={[
              { value: 'BRACKET', label: 'Брекет (на выбывание)' },
              { value: 'ROUND_ROBIN', label: 'Круговой турнир' },
            ]}
            required
          />
          <Input
            label="Дата начала"
            type="datetime-local"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
          <Input
            label="Максимум участников"
            type="number"
            value={formData.maxParticipants}
            onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
            placeholder="Оставьте пустым для неограниченного"
          />
          <div className="tournament-form__actions">
            <Button variant="primary" fullWidth onClick={handleSave}>
              Создать турнир
            </Button>
            <Button variant="outline" fullWidth onClick={() => setIsCreateModalOpen(false)}>
              Отмена
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

