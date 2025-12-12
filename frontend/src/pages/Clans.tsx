import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Modal, Input, NotificationModal } from '../components/ui';
import { clanService, userService } from '../services';
import { useAuthStore } from '../store/auth.store';
import './Clans.css';

export const Clans = () => {
  const [clans, setClans] = useState<any[]>([]);
  const [userClan, setUserClan] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [notification, setNotification] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const { user: authUser } = useAuthStore();
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    Promise.all([
      clanService.getAll(),
      clanService.getMyClan(),
      import('../services').then(m => m.userService.getProfile()),
    ])
      .then(([allClans, myClan, userProfile]) => {
        setClans(allClans);
        setUserClan(myClan);
        setUser(userProfile);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="clans-page">Загрузка...</div>;
  }

  const userLevel = user?.level || 0;
  const clansAvailable = userLevel >= 20;

  // Если кланы недоступны
  if (!clansAvailable) {
    return (
      <div className="clans-page">
        <div className="clans-page__unavailable">
          <div className="clans-page__unavailable-icon">🛡️</div>
          <h2 className="clans-page__unavailable-title">Кланы недоступны</h2>
          <p className="clans-page__unavailable-text">
            Кланы открываются с 20 уровня, прокачайся, играй в турнирах и зарабатывай очки
          </p>
          <Link to="/game">
            <Button variant="primary" size="lg" fullWidth>
              Играть, чтобы получить XP
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Если показываем поиск кланов
  if (showSearch) {
         return (
             <div className="clans-page">
               <Link to="/clans" className="clans-page__back">←</Link>
               <div className="clans-page__header">
                 <div>
                   <h1 className="clans-page__title">Найди свой клан</h1>
                   <p className="clans-page__subtitle">Выбирай по духу, рейтингу или числу участников и присоединяйся</p>
                 </div>
               </div>
        <div className="clans-page__tabs">
          <button className="clans-page__tab clans-page__tab--active">Активные</button>
          <button className="clans-page__tab">Новые</button>
          <button className="clans-page__tab">Топ</button>
          <button className="clans-page__tab">Все</button>
        </div>
        <div className="clans-page__list">
          {clans.map((clan) => (
            <Card key={clan.id} className="clans-page__clan-card">
              <div className="clans-page__clan-card-icon">🛡️</div>
              <div className="clans-page__clan-card-info">
                <div className="clans-page__clan-card-name">{clan.name}</div>
                <div className="clans-page__clan-card-details">
                  Уровень {clan.level || 1} - {clan.members?.length || 0} участника
                </div>
                <div className="clans-page__clan-card-treasury">
                  Казна: {clan.treasury?.toLocaleString() || 0} NAR
                </div>
              </div>
              <Link to={`/clans/${clan.id}`}>
                <Button variant="primary" size="sm">Вступить</Button>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    );
  }

         // Основная страница с кнопками создания/поиска
         return (
           <div className="clans-page">
             <Link to="/" className="clans-page__back">←</Link>
             <div className="clans-page__header">
               <div className="clans-page__profile">
                 <div className="clans-page__profile-avatar">
                   <img src={user?.avatar || user?.photoUrl || 'https://via.placeholder.com/60'} alt="Avatar" />
                 </div>
                 <div>
                   <div className="clans-page__profile-name">{user?.nickname || user?.firstName}</div>
                   <div className="clans-page__profile-level">Уровень {userLevel}</div>
                 </div>
               </div>
             </div>

      <div className="clans-page__actions">
        <Button 
          variant="primary" 
          size="lg"
          fullWidth
          onClick={() => setCreateModal(true)}
        >
          Создать клан
        </Button>
        <Button 
          variant="outline" 
          size="lg"
          fullWidth
          onClick={() => setShowSearch(true)}
        >
          Найти клан
        </Button>
      </div>

      <Modal
        isOpen={createModal}
        onClose={() => {
          setCreateModal(false);
          setCreateForm({ name: '', description: '' });
        }}
        title="Создай клан"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            и начни свой путь к господству в городе
          </p>
          <Input
            label="Введите название"
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            required
            placeholder="Название клана"
          />
          <Input
            label="Описание (необязательно)"
            value={createForm.description}
            onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
            type="textarea"
            placeholder="Кратко опиши свой клан..."
          />
          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={async () => {
              try {
                if (!createForm.name.trim()) {
                  setNotification({
                    title: 'Ошибка',
                    message: 'Название клана обязательно',
                    type: 'error',
                  });
                  return;
                }
                await clanService.create({
                  name: createForm.name.trim(),
                  description: createForm.description.trim() || undefined,
                });
                setNotification({
                  title: 'Успех',
                  message: 'Клан успешно создан!',
                  type: 'success',
                });
                setCreateModal(false);
                setCreateForm({ name: '', description: '' });
                const [allClans, myClan] = await Promise.all([
                  clanService.getAll(),
                  clanService.getMyClan(),
                ]);
                setClans(allClans);
                setUserClan(myClan);
              } catch (error: any) {
                setNotification({
                  title: 'Ошибка',
                  message: error.response?.data?.message || 'Ошибка при создании клана',
                  type: 'error',
                });
              }
            }}
          >
            Создать клан
          </Button>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)', textAlign: 'center' }}>
            После создания клана ты сможешь приглашать участников и улучшать район
          </p>
        </div>
      </Modal>

      {notification && (
        <NotificationModal
          isOpen={!!notification}
          onClose={() => setNotification(null)}
          title={notification.title}
          message={notification.message}
          type={notification.type}
        />
      )}
    </div>
  );
};

