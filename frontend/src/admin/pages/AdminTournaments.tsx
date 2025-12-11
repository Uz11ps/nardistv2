import { useState, useEffect } from 'react';
import { PageHeader, DataTable, Input, Select } from '../components';
import { Button, Modal, Card } from '../../components/ui';
import { adminService } from '../../services';
import type { Tournament } from '../../types';
import './AdminTournaments.css';

export const AdminTournaments = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    mode: 'SHORT' as 'SHORT' | 'LONG',
    format: 'BRACKET' as 'BRACKET' | 'ROUND_ROBIN',
    startDate: '',
    maxParticipants: '',
  });

  useEffect(() => {
    adminService.getTournaments()
      .then(setTournaments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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

  const handleSave = async () => {
    try {
      await adminService.createTournament({
        name: formData.name,
        description: formData.description || undefined,
        mode: formData.mode,
        format: formData.format,
        startDate: new Date(formData.startDate),
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
      });
      alert('Турнир создан!');
      setIsCreateModalOpen(false);
      window.location.reload();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка при создании турнира');
    }
  };

  const handleStart = async (tournament: Tournament) => {
    try {
      await adminService.startTournament(tournament.id);
      alert('Турнир запущен!');
      window.location.reload();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка при запуске турнира');
    }
  };

  const handleFinish = async (tournament: Tournament) => {
    try {
      await adminService.finishTournament(tournament.id);
      alert('Турнир завершен!');
      window.location.reload();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка при завершении турнира');
    }
  };

  return (
    <div className="admin-tournaments">
      <PageHeader
        title="Турниры"
        description="Управление турнирами и соревнованиями"
        actions={<Button variant="primary" onClick={handleCreate}>➕ Создать турнир</Button>}
      />

      {loading ? (
        <div>Загрузка...</div>
      ) : (
        <DataTable
          columns={columns}
          data={tournaments}
          onRowClick={(tournament) => setSelectedTournament(tournament as Tournament)}
          emptyMessage="Турниры не найдены"
        />
      )}

      {selectedTournament && (
        <Modal
          isOpen={!!selectedTournament}
          onClose={() => setSelectedTournament(null)}
          title={`Турнир: ${selectedTournament.name}`}
          size="md"
        >
          <div className="tournament-details">
            <div className="tournament-details__info">
              <p><strong>Режим:</strong> {selectedTournament.mode === 'SHORT' ? 'Короткие' : 'Длинные'} нарды</p>
              <p><strong>Формат:</strong> {selectedTournament.format === 'BRACKET' ? 'Брекет' : 'Круговой'}</p>
              <p><strong>Участников:</strong> {selectedTournament.participants?.length || 0}/{selectedTournament.maxParticipants || '∞'}</p>
              <p><strong>Дата начала:</strong> {new Date(selectedTournament.startDate).toLocaleString('ru-RU')}</p>
            </div>
            <div className="tournament-details__actions">
              {selectedTournament.status === 'UPCOMING' && (
                <Button variant="primary" fullWidth onClick={() => handleStart(selectedTournament)}>
                  ▶️ Запустить турнир
                </Button>
              )}
              {selectedTournament.status === 'IN_PROGRESS' && (
                <Button variant="danger" fullWidth onClick={() => handleFinish(selectedTournament)}>
                  🏁 Завершить турнир
                </Button>
              )}
              <Button variant="outline" fullWidth onClick={() => setSelectedTournament(null)}>
                Закрыть
              </Button>
            </div>
          </div>
        </Modal>
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

