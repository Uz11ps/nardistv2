import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Button, Modal, Input, NotificationModal, ConfirmModal, Icon } from '../components/ui';
import { clanService } from '../services';
import { useAuthStore } from '../store/auth.store';
import { placeholders } from '../utils/placeholders';
import './ClanDetail.css';

export const ClanDetail = () => {
  const { id } = useParams<{ id: string }>();
  const clanId = parseInt(id || '0');
  const [clan, setClan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [districtFunds, setDistrictFunds] = useState<any[]>([]);
  const [distributeModal, setDistributeModal] = useState<{ district: any; fund: any } | null>(null);
  const [distributeAmount, setDistributeAmount] = useState(0);
  const [treasuryModal, setTreasuryModal] = useState(false);
  const [treasuryAmount, setTreasuryAmount] = useState(0);
  const [treasuryRecipient, setTreasuryRecipient] = useState<number | null>(null);
  const [settingsModal, setSettingsModal] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ name: '', description: '' });
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmKick, setConfirmKick] = useState<{ member: any } | null>(null);
  const [notification, setNotification] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [activeTab, setActiveTab] = useState<'treasury' | 'upgrade' | 'members' | 'districts'>('treasury');
  const { user: authUser } = useAuthStore();

  useEffect(() => {
    Promise.all([
      clanService.getById(clanId),
      clanService.getDistrictFunds(clanId).catch(() => []),
    ])
      .then(([clanData, fundsData]) => {
        setClan(clanData);
        setDistrictFunds(fundsData);
        setSettingsForm({ name: clanData.name, description: clanData.description || '' });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [clanId]);

  if (loading) {
    return <div className="clan-detail">Загрузка...</div>;
  }

  if (!clan) {
    return (
      <div className="clan-detail">
        <Card>
          <p>Клан не найден</p>
          <Link to="/clans">
            <Button variant="outline">Вернуться к кланам</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const isMember = Array.isArray(clan?.members) ? clan.members.some((m: any) => m.userId === authUser?.id) : false;
  const isLeader = clan?.leaderId === authUser?.id;

         return (
           <div className="clan-detail">
             <Link to="/clans" className="clan-detail__back">←</Link>
             <div className="clan-detail__header">
               <div className="clan-detail__clan-hero">
                 <div className="clan-detail__clan-icon-large">
                  <Icon name="shield" size={48} />
                </div>
                 <div className="clan-detail__clan-details">
                   <h1 className="clan-detail__title">{clan.name}</h1>
                   <div className="clan-detail__clan-meta">
                     Уровень {clan.level || 1} - {clan.members?.length || 0} участника
                     {clan.districts?.length > 0 && ` - Владеет, Район ${clan.districts.length}`}
                   </div>
                 </div>
               </div>
             </div>

      <div className="clan-detail__navigation">
        <button 
          className={`clan-detail__nav-item ${activeTab === 'treasury' ? 'clan-detail__nav-item--active' : ''}`}
          onClick={() => setActiveTab('treasury')}
        >
          Казна
        </button>
        <button 
          className={`clan-detail__nav-item ${activeTab === 'upgrade' ? 'clan-detail__nav-item--active' : ''}`}
          onClick={() => setActiveTab('upgrade')}
        >
          Улучшить клан
        </button>
        <button 
          className={`clan-detail__nav-item ${activeTab === 'members' ? 'clan-detail__nav-item--active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          Участники
        </button>
        <button 
          className={`clan-detail__nav-item ${activeTab === 'districts' ? 'clan-detail__nav-item--active' : ''}`}
          onClick={() => setActiveTab('districts')}
        >
          Районы
        </button>
      </div>

      <div className="clan-detail__content">
        {activeTab === 'treasury' && (
          <Card className="clan-detail__section">
            <h3 className="clan-detail__section-title">Казна клана</h3>
            <p className="clan-detail__section-subtitle">
              Общий фонд клана. Средства поступают из налогов и вкладов участников
            </p>
            <div className="clan-detail__treasury-balance">
              <div className="clan-detail__treasury-icon">
                <Icon name="coin" size={32} />
              </div>
              <div className="clan-detail__treasury-amount">{(clan.treasury || 0).toLocaleString()} NAR</div>
              <div className="clan-detail__treasury-income">+3 200 NAR / неделя (поступления)</div>
            </div>
            <div className="clan-detail__treasury-operations">
              <h4 className="clan-detail__operations-title">Последние операции</h4>
              <div className="clan-detail__operations-list">
                {/* Здесь будут операции */}
              </div>
              <Button variant="outline" fullWidth>Посмотреть всё</Button>
            </div>
          </Card>
        )}

        {activeTab === 'upgrade' && (
          <Card className="clan-detail__section">
            <h3 className="clan-detail__section-title">Улучшение клана</h3>
            <p className="clan-detail__section-subtitle">
              Используй средства из казны, чтобы усиливать влияние и бонусы клана
            </p>
            <div className="clan-detail__upgrades">
              <div className="clan-detail__upgrade-item">
                <div className="clan-detail__upgrade-info">
                  <div className="clan-detail__upgrade-name">Уровень клана</div>
                  <div className="clan-detail__upgrade-level">Текущий уровень: {clan.level || 1}</div>
                </div>
                <Button variant="primary" size="sm">Улучшить</Button>
              </div>
              <div className="clan-detail__upgrade-item">
                <div className="clan-detail__upgrade-info">
                  <div className="clan-detail__upgrade-name">Сила районов</div>
                  <div className="clan-detail__upgrade-level">Текущий уровень: 1</div>
                </div>
                <Button variant="primary" size="sm">Улучшить</Button>
              </div>
              <div className="clan-detail__upgrade-item">
                <div className="clan-detail__upgrade-info">
                  <div className="clan-detail__upgrade-name">Экономика</div>
                  <div className="clan-detail__upgrade-level">Текущий уровень: 1</div>
                </div>
                <Button variant="primary" size="sm">Улучшить</Button>
              </div>
              <div className="clan-detail__upgrade-item">
                <div className="clan-detail__upgrade-info">
                  <div className="clan-detail__upgrade-name">Форт клана</div>
                  <div className="clan-detail__upgrade-level">Текущий уровень: 1</div>
                </div>
                <Button variant="primary" size="sm">Улучшить</Button>
              </div>
            </div>
            <p className="clan-detail__upgrade-note">
              Только глава клана может управлять улучшениями
            </p>
          </Card>
        )}

        {activeTab === 'members' && (
          <Card className="clan-detail__section">
            <h3 className="clan-detail__section-title">Участники клана</h3>
            <p className="clan-detail__section-subtitle">Всего участников: {clan.members?.length || 0}</p>
            <Input 
              placeholder="Поиск игрока"
              style={{ marginBottom: '1rem' }}
            />
            <div className="clan-detail__members">
              {Array.isArray(clan.members) ? clan.members.map((member: any) => (
            <div key={member.id} className="clan-detail__member">
              <div className="clan-detail__member-info">
                <div className="clan-detail__member-avatar">
                  <img src={member.user?.photoUrl || member.user?.avatar || placeholders.avatarSmall} alt="Avatar" />
                </div>
                <div className="clan-detail__member-details">
                  <div className="clan-detail__member-name">
                    {member.user?.nickname || member.user?.firstName || `Игрок #${member.userId}`}
                  </div>
                  <div className="clan-detail__member-role">
                    {member.role === 'LEADER'
                      ? 'Глава клана'
                      : member.role === 'OFFICER'
                      ? 'Офицер'
                      : 'Участник'}
                  </div>
                  <div className="clan-detail__member-contribution">
                    Вклад +5 200 NAR | Уровень {member.user?.level || 1}
                  </div>
                </div>
                <div className="clan-detail__member-online" />
              </div>
              {isLeader && member.role !== 'LEADER' && (
                <div className="clan-detail__member-actions">
                  {member.role !== 'OFFICER' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await clanService.changeMemberRole(clanId, member.userId, 'OFFICER');
                          setNotification({
                            title: 'Успех',
                            message: 'Роль участника изменена',
                            type: 'success',
                          });
                          const clanData = await clanService.getById(clanId);
                          setClan(clanData);
                        } catch (error: any) {
                          setNotification({
                            title: 'Ошибка',
                            message: error.response?.data?.message || 'Ошибка при изменении роли',
                            type: 'error',
                          });
                        }
                      }}
                    >
                      <Icon name="star" size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                      Офицер
                    </Button>
                  )}
                  {member.role === 'OFFICER' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await clanService.changeMemberRole(clanId, member.userId, 'MEMBER');
                          setNotification({
                            title: 'Успех',
                            message: 'Роль участника изменена',
                            type: 'success',
                          });
                          const clanData = await clanService.getById(clanId);
                          setClan(clanData);
                        } catch (error: any) {
                          setNotification({
                            title: 'Ошибка',
                            message: error.response?.data?.message || 'Ошибка при изменении роли',
                            type: 'error',
                          });
                        }
                      }}
                    >
                      👤 Участник
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setConfirmKick({ member })}
                  >
                    Исключить
                  </Button>
                </div>
              )}
            </div>
          )) : null}
            </div>
          </Card>
        )}

        {activeTab === 'districts' && (
          <Card className="clan-detail__section">
            <h3 className="clan-detail__section-title">Районы города</h3>
            {clan.districts && clan.districts.length > 0 ? (
              <div className="clan-detail__districts">
                {Array.isArray(clan.districts) ? clan.districts.map((district) => {
                  const safeDistrictFunds = Array.isArray(districtFunds) ? districtFunds : [];
                  const fund = safeDistrictFunds.find((f) => f.district.id === district.id);
                  const fundBalance = fund?.fund?.balance || 0;
                  return (
                    <Card key={district.id} className="clan-detail__district-card">
                      <div className="clan-detail__district-icon">🛡️</div>
                      <div className="clan-detail__district-info">
                        <div className="clan-detail__district-name">{district.name}</div>
                        <div className="clan-detail__district-owner">Владелец: {clan.name}</div>
                        {fundBalance > 0 && (
                          <div className="clan-detail__district-income">{fundBalance.toLocaleString()} NAR / день</div>
                        )}
                      </div>
                      <Link to={`/city/district/${district.id}`}>
                        <Button variant="outline" size="sm">Подробнее</Button>
                      </Link>
                    </Card>
                  );
                }) : (
                  <div>Нет районов</div>
                )}
              </div>
            ) : (
              <p>Клан не владеет районами</p>
            )}
          </Card>
        )}
      </div>

      {!isMember && (
        <Card className="clan-detail__join">
          <h3 className="clan-detail__section-title">Присоединиться к клану</h3>
          <p className="clan-detail__join-description">
            Станьте частью этого клана и получите доступ к клановым функциям
          </p>
          <Button
            variant="primary"
            fullWidth
            onClick={async () => {
              try {
                await clanService.join(clanId);
                setNotification({
                  title: 'Успех',
                  message: 'Вы успешно присоединились к клану!',
                  type: 'success',
                });
                const clanData = await clanService.getById(clanId);
                setClan(clanData);
              } catch (error: any) {
                setNotification({
                  title: 'Ошибка',
                  message: error.response?.data?.message || 'Ошибка при присоединении к клану',
                  type: 'error',
                });
              }
            }}
          >
            Подать заявку
          </Button>
        </Card>
      )}

      {isMember && !isLeader && (
        <Card className="clan-detail__join">
          <Button
            variant="danger"
            fullWidth
            onClick={() => setConfirmLeave(true)}
          >
            Покинуть клан
          </Button>
        </Card>
      )}

      {isLeader && (
        <Card className="clan-detail__management">
          <h3 className="clan-detail__section-title">Управление кланом</h3>
          <div className="clan-detail__management-actions">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setTreasuryModal(true)}
            >
              <Icon name="coin" size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Управление казной ({clan.treasury.toLocaleString()} NAR)
            </Button>
            <Button
              variant="outline"
              fullWidth
              onClick={() => setSettingsModal(true)}
            >
              <Icon name="settings" size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Настройки клана
            </Button>
          </div>
        </Card>
      )}

      {distributeModal && (
        <Modal
          isOpen={!!distributeModal}
          onClose={() => {
            setDistributeModal(null);
            setDistributeAmount(0);
          }}
          title={`Распределить фонд района "${distributeModal.district.name}"`}
          size="sm"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p>Доступно в фонде: {distributeModal.fund.balance.toLocaleString()} NAR</p>
            <Input
              type="number"
              min={1}
              max={distributeModal.fund.balance}
              value={distributeAmount}
              onChange={(e) => setDistributeAmount(parseInt(e.target.value) || 0)}
              label="Сумма для распределения"
            />
            <p style={{ fontSize: '0.9rem', color: '#999' }}>
              Средства будут переведены в клановую казну
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  setDistributeModal(null);
                  setDistributeAmount(0);
                }}
              >
                Отмена
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={async () => {
                  try {
                    const result = await clanService.distributeDistrictFund(
                      clanId,
                      distributeModal.district.id,
                      distributeAmount,
                    );
                    setNotification({
                      title: 'Успех',
                      message: `Распределено ${distributeAmount.toLocaleString()} NAR в клановую казну. Новая казна: ${result.newClanTreasury.toLocaleString()} NAR`,
                      type: 'success',
                    });
                    const [clanData, fundsData] = await Promise.all([
                      clanService.getById(clanId),
                      clanService.getDistrictFunds(clanId),
                    ]);
                    setClan(clanData);
                    setDistrictFunds(fundsData);
                    setDistributeModal(null);
                    setDistributeAmount(0);
                  } catch (error: any) {
                    setNotification({
                      title: 'Ошибка',
                      message: error.response?.data?.message || 'Ошибка при распределении фонда',
                      type: 'error',
                    });
                  }
                }}
              >
                Распределить
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {treasuryModal && (
        <Modal
          isOpen={treasuryModal}
          onClose={() => {
            setTreasuryModal(false);
            setTreasuryAmount(0);
            setTreasuryRecipient(null);
          }}
          title="Управление казной"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p>Доступно в казне: {clan.treasury.toLocaleString()} NAR</p>
            <Input
              type="number"
              min={1}
              max={clan.treasury}
              value={treasuryAmount}
              onChange={(e) => setTreasuryAmount(parseInt(e.target.value) || 0)}
              label="Сумма для распределения"
            />
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Участник:</label>
              <select
                value={treasuryRecipient || ''}
                onChange={(e) => setTreasuryRecipient(parseInt(e.target.value) || null)}
                style={{ width: '100%', padding: '0.5rem', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', color: '#fff' }}
              >
                <option value="">Выберите участника</option>
                {Array.isArray(clan.members) ? clan.members.map((member: any) => (
                  <option key={member.userId} value={member.userId}>
                    {member.user?.nickname || member.user?.firstName || `Игрок #${member.userId}`}
                  </option>
                )) : null}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  setTreasuryModal(false);
                  setTreasuryAmount(0);
                  setTreasuryRecipient(null);
                }}
              >
                Отмена
              </Button>
              <Button
                variant="primary"
                fullWidth
                disabled={!treasuryRecipient || treasuryAmount <= 0 || treasuryAmount > clan.treasury}
                onClick={async () => {
                  try {
                    const result = await clanService.distributeTreasury(clanId, treasuryAmount, treasuryRecipient!);
                    setNotification({
                      title: 'Успех',
                      message: `Распределено ${treasuryAmount.toLocaleString()} NAR участнику. Новая казна: ${result.newTreasury.toLocaleString()} NAR`,
                      type: 'success',
                    });
                    const clanData = await clanService.getById(clanId);
                    setClan(clanData);
                    setTreasuryModal(false);
                    setTreasuryAmount(0);
                    setTreasuryRecipient(null);
                  } catch (error: any) {
                    setNotification({
                      title: 'Ошибка',
                      message: error.response?.data?.message || 'Ошибка при распределении казны',
                      type: 'error',
                    });
                  }
                }}
              >
                Распределить
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {settingsModal && (
        <Modal
          isOpen={settingsModal}
          onClose={() => {
            setSettingsModal(false);
            setSettingsForm({ name: clan.name, description: clan.description || '' });
          }}
          title="Настройки клана"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="Название клана"
              value={settingsForm.name}
              onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
              required
            />
            <Input
              label="Описание"
              value={settingsForm.description}
              onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
              type="textarea"
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  setSettingsModal(false);
                  setSettingsForm({ name: clan.name, description: clan.description || '' });
                }}
              >
                Отмена
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={async () => {
                  try {
                    await clanService.updateClan(clanId, {
                      name: settingsForm.name.trim() || undefined,
                      description: settingsForm.description.trim() || undefined,
                    });
                    setNotification({
                      title: 'Успех',
                      message: 'Настройки клана обновлены',
                      type: 'success',
                    });
                    const clanData = await clanService.getById(clanId);
                    setClan(clanData);
                    setSettingsModal(false);
                  } catch (error: any) {
                    setNotification({
                      title: 'Ошибка',
                      message: error.response?.data?.message || 'Ошибка при обновлении настроек',
                      type: 'error',
                    });
                  }
                }}
              >
                Сохранить
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {confirmLeave && (
        <ConfirmModal
          isOpen={confirmLeave}
          onClose={() => setConfirmLeave(false)}
          onConfirm={async () => {
            try {
              await clanService.leave(clanId);
              setNotification({
                title: 'Успех',
                message: 'Вы покинули клан',
                type: 'success',
              });
              setConfirmLeave(false);
              setTimeout(() => {
                window.location.href = '/clans';
              }, 1500);
            } catch (error: any) {
              setNotification({
                title: 'Ошибка',
                message: error.response?.data?.message || 'Ошибка при выходе из клана',
                type: 'error',
              });
              setConfirmLeave(false);
            }
          }}
          title="Покинуть клан"
          message="Вы уверены, что хотите покинуть клан?"
          confirmText="Покинуть"
          cancelText="Отмена"
        />
      )}

      {confirmKick && (
        <ConfirmModal
          isOpen={!!confirmKick}
          onClose={() => setConfirmKick(null)}
          onConfirm={async () => {
            try {
              await clanService.kickMember(clanId, confirmKick.member.userId);
              setNotification({
                title: 'Успех',
                message: 'Участник исключен из клана',
                type: 'success',
              });
              const clanData = await clanService.getById(clanId);
              setClan(clanData);
              setConfirmKick(null);
            } catch (error: any) {
              setNotification({
                title: 'Ошибка',
                message: error.response?.data?.message || 'Ошибка при исключении участника',
                type: 'error',
              });
              setConfirmKick(null);
            }
          }}
          title="Исключить участника"
          message={`Вы уверены, что хотите исключить ${confirmKick.member.user?.nickname || confirmKick.member.user?.firstName || 'этого участника'} из клана?`}
          confirmText="Исключить"
          cancelText="Отмена"
        />
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
    </div>
  );
};

