import { useState, useEffect } from 'react';
import { PageHeader, DataTable, Input, Select } from '../components';
import { Button, Modal, Card, NotificationModal, ConfirmModal } from '../../components/ui';
import { adminService } from '../../services';
import './AdminQuests.css';

interface Quest {
  id: number;
  type: string;
  title: string;
  description: string;
  target: number;
  rewardCoin: number;
  rewardXp: number;
  rewardSkin?: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  durationType?: string;
  isHoliday: boolean;
  isInfinite: boolean;
  holidayName?: string;
  createdAt: string;
  updatedAt: string;
}

export const AdminQuests = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Quest | null>(null);
  const [formData, setFormData] = useState({
    type: 'DAILY',
    title: '',
    description: '',
    target: '',
    rewardCoin: '',
    rewardXp: '',
    rewardSkin: '',
    startDate: '',
    endDate: '',
    durationType: '',
    isHoliday: false,
    isInfinite: false,
    holidayName: '',
    isActive: true,
  });

  useEffect(() => {
    loadQuests();
  }, []);

  const loadQuests = async () => {
    try {
      setLoading(true);
      const data = await adminService.getQuests();
      setQuests(data);
    } catch (error) {
      console.error('Error loading quests:', error);
      setNotification({
        title: 'Ошибка',
        message: 'Не удалось загрузить квесты',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'id',
      header: 'ID',
    },
    {
      key: 'title',
      header: 'Название',
    },
    {
      key: 'type',
      header: 'Тип',
      render: (quest: Quest) => (
        <span>
          {quest.type === 'DAILY' && 'Дневной'}
          {quest.type === 'WEEKLY' && 'Недельный'}
          {quest.type === 'EVENT' && 'Событие'}
          {quest.type === 'INFINITE' && 'Бесконечный'}
        </span>
      ),
    },
    {
      key: 'target',
      header: 'Цель',
    },
    {
      key: 'reward',
      header: 'Награда',
      render: (quest: Quest) => (
        <span>
          💰 {quest.rewardCoin} | ⭐ {quest.rewardXp} XP
        </span>
      ),
    },
    {
      key: 'duration',
      header: 'Длительность',
      render: (quest: Quest) => {
        if (quest.isInfinite) return <span>♾️ Бесконечный</span>;
        if (quest.durationType === 'EVER') return <span>♾️ Вечно</span>;
        if (quest.durationType === 'DAY') return <span>📅 День</span>;
        if (quest.durationType === 'WEEK') return <span>📅 Неделя</span>;
        if (quest.durationType === 'MONTH') return <span>📅 Месяц</span>;
        if (quest.startDate && quest.endDate) {
          return (
            <span>
              {new Date(quest.startDate).toLocaleDateString('ru-RU')} - {new Date(quest.endDate).toLocaleDateString('ru-RU')}
            </span>
          );
        }
        return <span>-</span>;
      },
    },
    {
      key: 'isHoliday',
      header: 'Праздник',
      render: (quest: Quest) => (
        quest.isHoliday ? <span>🎉 {quest.holidayName || 'Праздник'}</span> : <span>-</span>
      ),
    },
    {
      key: 'isActive',
      header: 'Статус',
      render: (quest: Quest) => (
        <span className={`quest-status quest-status--${quest.isActive ? 'active' : 'inactive'}`}>
          {quest.isActive ? '✅ Активен' : '❌ Неактивен'}
        </span>
      ),
    },
  ];

  const handleCreate = () => {
    setIsCreateModalOpen(true);
    setSelectedQuest(null);
    setFormData({
      type: 'DAILY',
      title: '',
      description: '',
      target: '',
      rewardCoin: '',
      rewardXp: '',
      rewardSkin: '',
      startDate: '',
      endDate: '',
      durationType: '',
      isHoliday: false,
      isInfinite: false,
      holidayName: '',
      isActive: true,
    });
  };

  const handleEdit = (quest: Quest) => {
    setSelectedQuest(quest);
    setIsCreateModalOpen(true);
    setFormData({
      type: quest.type,
      title: quest.title,
      description: quest.description,
      target: quest.target.toString(),
      rewardCoin: quest.rewardCoin.toString(),
      rewardXp: quest.rewardXp.toString(),
      rewardSkin: quest.rewardSkin?.toString() || '',
      startDate: quest.startDate ? new Date(quest.startDate).toISOString().slice(0, 16) : '',
      endDate: quest.endDate ? new Date(quest.endDate).toISOString().slice(0, 16) : '',
      durationType: quest.durationType || '',
      isHoliday: quest.isHoliday,
      isInfinite: quest.isInfinite,
      holidayName: quest.holidayName || '',
      isActive: quest.isActive,
    });
  };

  const handleSave = async () => {
    try {
      const data: any = {
        type: formData.type,
        title: formData.title,
        description: formData.description,
        target: parseInt(formData.target),
        rewardCoin: parseInt(formData.rewardCoin) || 0,
        rewardXp: parseInt(formData.rewardXp) || 0,
        rewardSkin: formData.rewardSkin ? parseInt(formData.rewardSkin) : undefined,
        isHoliday: formData.isHoliday,
        isInfinite: formData.isInfinite,
        holidayName: formData.holidayName || undefined,
        isActive: formData.isActive,
      };

      if (formData.startDate) {
        data.startDate = new Date(formData.startDate).toISOString();
      }

      if (formData.durationType) {
        data.durationType = formData.durationType;
        if (formData.durationType === 'CUSTOM' && formData.endDate) {
          data.endDate = new Date(formData.endDate).toISOString();
        } else if (formData.durationType === 'EVER') {
          data.endDate = null;
        }
      } else if (formData.endDate) {
        data.endDate = new Date(formData.endDate).toISOString();
      }

      if (selectedQuest) {
        await adminService.updateQuest(selectedQuest.id, data);
        setNotification({
          title: 'Успех',
          message: 'Квест успешно обновлен',
          type: 'success',
        });
      } else {
        await adminService.createQuest(data);
        setNotification({
          title: 'Успех',
          message: 'Квест успешно создан',
          type: 'success',
        });
      }

      setIsCreateModalOpen(false);
      loadQuests();
    } catch (error: any) {
      setNotification({
        title: 'Ошибка',
        message: error.response?.data?.message || 'Ошибка при сохранении квеста',
        type: 'error',
      });
      console.error('Error saving quest:', error);
    }
  };

  const handleDelete = async (quest: Quest) => {
    setDeleteConfirm(quest);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await adminService.deleteQuest(deleteConfirm.id);
      setDeleteConfirm(null);
      setNotification({
        title: 'Успех',
        message: 'Квест успешно удален',
        type: 'success',
      });
      loadQuests();
    } catch (error: any) {
      setNotification({
        title: 'Ошибка',
        message: error.response?.data?.message || 'Ошибка при удалении квеста',
        type: 'error',
      });
      console.error('Error deleting quest:', error);
    }
  };

  if (loading) {
    return <div className="admin-quests">Загрузка...</div>;
  }

  return (
    <div className="admin-quests">
      <PageHeader
        title="Квесты"
        description="Управление квестами: создание, редактирование, удаление"
      />

      <div className="admin-quests__actions">
        <Button variant="primary" onClick={handleCreate}>
          ➕ Создать квест
        </Button>
      </div>

      <Card>
        <DataTable
          data={quests}
          columns={columns}
          onRowClick={(quest) => handleEdit(quest)}
          actions={(quest: Quest) => (
            <>
              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(quest); }}>
                ✏️ Редактировать
              </Button>
              <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(quest); }}>
                🗑️ Удалить
              </Button>
            </>
          )}
        />
      </Card>

      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title={selectedQuest ? 'Редактировать квест' : 'Создать квест'}
          size="lg"
        >
          <div className="admin-quests__form">
            <Select
              label="Тип квеста"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              options={[
                { value: 'DAILY', label: 'Дневной' },
                { value: 'WEEKLY', label: 'Недельный' },
                { value: 'EVENT', label: 'Событие' },
                { value: 'INFINITE', label: 'Бесконечный' },
              ]}
              required
            />

            <Input
              label="Название"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            <Input
              label="Описание"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />

            <Input
              label="Целевое значение"
              type="number"
              value={formData.target}
              onChange={(e) => setFormData({ ...formData, target: e.target.value })}
              required
            />

            <div className="admin-quests__form-row">
              <Input
                label="Награда NAR"
                type="number"
                value={formData.rewardCoin}
                onChange={(e) => setFormData({ ...formData, rewardCoin: e.target.value })}
              />
              <Input
                label="Награда XP"
                type="number"
                value={formData.rewardXp}
                onChange={(e) => setFormData({ ...formData, rewardXp: e.target.value })}
              />
            </div>

            <Input
              label="Награда скин (ID, необязательно)"
              type="number"
              value={formData.rewardSkin}
              onChange={(e) => setFormData({ ...formData, rewardSkin: e.target.value })}
            />

            <div className="admin-quests__form-row">
              <Input
                label="Дата начала"
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
              <Select
                label="Длительность"
                value={formData.durationType}
                onChange={(e) => setFormData({ ...formData, durationType: e.target.value })}
                options={[
                  { value: '', label: 'Не указано' },
                  { value: 'EVER', label: 'Вечно' },
                  { value: 'DAY', label: 'День' },
                  { value: 'WEEK', label: 'Неделя' },
                  { value: 'MONTH', label: 'Месяц' },
                  { value: 'CUSTOM', label: 'Произвольная дата' },
                ]}
              />
            </div>

            {formData.durationType === 'CUSTOM' && (
              <Input
                label="Дата окончания"
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            )}

            <div className="admin-quests__form-checkboxes">
              <label className="admin-quests__checkbox">
                <input
                  type="checkbox"
                  checked={formData.isInfinite}
                  onChange={(e) => setFormData({ ...formData, isInfinite: e.target.checked })}
                />
                <span>Бесконечный цикл (повторяется)</span>
              </label>

              <label className="admin-quests__checkbox">
                <input
                  type="checkbox"
                  checked={formData.isHoliday}
                  onChange={(e) => setFormData({ ...formData, isHoliday: e.target.checked })}
                />
                <span>Приурочен к празднику</span>
              </label>

              {formData.isHoliday && (
                <Input
                  label="Название праздника"
                  value={formData.holidayName}
                  onChange={(e) => setFormData({ ...formData, holidayName: e.target.value })}
                />
              )}

              <label className="admin-quests__checkbox">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <span>Активен</span>
              </label>
            </div>

            <div className="admin-quests__form-actions">
              <Button variant="outline" fullWidth onClick={() => setIsCreateModalOpen(false)}>
                Отмена
              </Button>
              <Button variant="primary" fullWidth onClick={handleSave}>
                {selectedQuest ? 'Сохранить' : 'Создать'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {notification && (
        <NotificationModal
          isOpen={!!notification}
          onClose={() => setNotification(null)}
          title={notification.title}
          message={notification.message}
          type={notification.type}
        />
      )}

      {deleteConfirm && (
        <ConfirmModal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={confirmDelete}
          title="Удаление квеста"
          message={`Вы уверены, что хотите удалить квест "${deleteConfirm.title}"? Это действие нельзя отменить.`}
          confirmText="Удалить"
          cancelText="Отмена"
          variant="danger"
        />
      )}
    </div>
  );
};

