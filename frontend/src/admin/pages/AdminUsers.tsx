import { useState } from 'react';
import { PageHeader, DataTable, Input } from '../components';
import { Button, Modal } from '../../components/ui';
import { adminUsers } from '../mock/adminData';
import type { User } from '../../types';
import './AdminUsers.css';

export const AdminUsers = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = adminUsers.filter(
    (user) =>
      searchQuery === '' ||
      user.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.telegramId.toString().includes(searchQuery),
  );

  const columns = [
    {
      key: 'id',
      header: 'ID',
    },
    {
      key: 'nickname',
      header: 'Никнейм',
      render: (user: User) => (
        <div className="user-cell">
          <span className="user-cell__nickname">{user.nickname || user.firstName}</span>
          {user.isPremium && <span className="user-cell__badge">⭐ Premium</span>}
        </div>
      ),
    },
    {
      key: 'firstName',
      header: 'Имя',
    },
    {
      key: 'level',
      header: 'Уровень',
      render: (user: User) => (
        <span className="user-level">
          {user.level} ({user.xp} XP)
        </span>
      ),
    },
    {
      key: 'narCoin',
      header: 'Монеты',
      render: (user: User) => <span className="user-coin">💰 {user.narCoin}</span>,
    },
    {
      key: 'energy',
      header: 'Энергия',
      render: (user: User) => (
        <div className="user-energy">
          <div className="user-energy__bar">
            <div
              className="user-energy__fill"
              style={{ width: `${(user.energy / user.energyMax) * 100}%` }}
            />
          </div>
          <span className="user-energy__text">
            {user.energy}/{user.energyMax}
          </span>
        </div>
      ),
    },
    {
      key: 'referralCode',
      header: 'Реферальный код',
      render: (user: User) => (
        <span className="user-referral">{user.referralCode || 'Нет'}</span>
      ),
    },
  ];

  const handleBan = (user: User) => {
    console.log('Бан пользователя:', user.id);
    // Здесь будет логика бана
  };

  const handleUnban = (user: User) => {
    console.log('Разбан пользователя:', user.id);
    // Здесь будет логика разбана
  };

  const handleAddCoins = (user: User) => {
    const amount = prompt('Введите количество монет:');
    if (amount) {
      console.log('Добавление монет:', user.id, amount);
      // Здесь будет логика добавления монет
    }
  };

  return (
    <div className="admin-users">
      <PageHeader
        title="Пользователи"
        description="Управление пользователями и их данными"
        actions={
          <Button variant="primary" onClick={() => console.log('Export')}>
            📥 Экспорт
          </Button>
        }
      />

      <div className="admin-users__filters">
        <Input
          placeholder="Поиск по никнейму, имени или Telegram ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: '400px' }}
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredUsers}
        onRowClick={(user) => setSelectedUser(user as User)}
        emptyMessage="Пользователи не найдены"
      />

      {selectedUser && (
        <Modal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          title={`Пользователь: ${selectedUser.nickname || selectedUser.firstName}`}
          size="md"
        >
          <div className="user-details">
            <div className="user-details__section">
              <h4>Основная информация</h4>
              <div className="user-details__info">
                <div className="user-details__item">
                  <span className="user-details__label">ID:</span>
                  <span className="user-details__value">{selectedUser.id}</span>
                </div>
                <div className="user-details__item">
                  <span className="user-details__label">Telegram ID:</span>
                  <span className="user-details__value">{selectedUser.telegramId}</span>
                </div>
                <div className="user-details__item">
                  <span className="user-details__label">Имя:</span>
                  <span className="user-details__value">
                    {selectedUser.firstName} {selectedUser.lastName || ''}
                  </span>
                </div>
                <div className="user-details__item">
                  <span className="user-details__label">Никнейм:</span>
                  <span className="user-details__value">{selectedUser.nickname || 'Не указан'}</span>
                </div>
                <div className="user-details__item">
                  <span className="user-details__label">Уровень:</span>
                  <span className="user-details__value">
                    {selectedUser.level} ({selectedUser.xp} XP)
                  </span>
                </div>
                <div className="user-details__item">
                  <span className="user-details__label">Монеты:</span>
                  <span className="user-details__value">💰 {selectedUser.narCoin}</span>
                </div>
                <div className="user-details__item">
                  <span className="user-details__label">Энергия:</span>
                  <span className="user-details__value">
                    {selectedUser.energy}/{selectedUser.energyMax}
                  </span>
                </div>
                <div className="user-details__item">
                  <span className="user-details__label">Жизни:</span>
                  <span className="user-details__value">
                    {selectedUser.lives}/{selectedUser.livesMax}
                  </span>
                </div>
                <div className="user-details__item">
                  <span className="user-details__label">Реферальный код:</span>
                  <span className="user-details__value">{selectedUser.referralCode || 'Нет'}</span>
                </div>
                <div className="user-details__item">
                  <span className="user-details__label">Premium:</span>
                  <span className="user-details__value">
                    {selectedUser.isPremium ? '⭐ Да' : 'Нет'}
                  </span>
                </div>
              </div>
            </div>

            <div className="user-details__actions">
              <Button variant="primary" onClick={() => handleAddCoins(selectedUser)}>
                💰 Добавить монеты
              </Button>
              <Button variant="danger" onClick={() => handleBan(selectedUser)}>
                🚫 Заблокировать
              </Button>
              <Button variant="outline" onClick={() => setSelectedUser(null)}>
                Закрыть
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

