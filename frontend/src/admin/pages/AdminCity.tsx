import { useState, useEffect } from 'react';
import { PageHeader, DataTable, Input } from '../components';
import { Button, Card, Modal, Tabs, NotificationModal } from '../../components/ui';
import { adminService } from '../../services';
import './AdminCity.css';

interface BusinessConfig {
  type: string;
  districtId?: number;
  districtName?: string;
  creationCost: number;
  baseIncomePerHour: number;
  baseProductionPerHour: number;
  baseStorageLimit: number;
  baseMaintenanceCost: number;
  upgradeCostMultiplier: number;
  incomeIncreasePerLevel: number;
  productionIncreasePerLevel: number;
}

interface District {
  id: number;
  name: string;
  description: string;
  type: string;
  icon: string;
  commissionRate: number;
  clan?: any;
  fund?: any;
  _count?: {
    businesses: number;
  };
}

export const AdminCity = () => {
  const [activeTab, setActiveTab] = useState<'districts' | 'businesses'>('districts');
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [businessConfigs, setBusinessConfigs] = useState<BusinessConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingConfig, setEditingConfig] = useState<BusinessConfig | null>(null);
  const [editingDistrict, setEditingDistrict] = useState<District | null>(null);
  const [notification, setNotification] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    fetchDistricts();
  }, []);

  useEffect(() => {
    if (selectedDistrict) {
      fetchBusinessConfigs(selectedDistrict.id);
    }
  }, [selectedDistrict]);

  const fetchDistricts = async () => {
    try {
      setLoading(true);
      const dists = await adminService.getAllDistricts();
      setDistricts(dists);
    } catch (error) {
      console.error('Error fetching districts:', error);
      setNotification({
        title: 'Ошибка',
        message: 'Не удалось загрузить районы',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessConfigs = async (districtId: number) => {
    try {
      const configs = await adminService.getBusinessConfigsForDistrict(districtId);
      setBusinessConfigs(configs);
    } catch (error) {
      console.error('Error fetching business configs:', error);
      setNotification({
        title: 'Ошибка',
        message: 'Не удалось загрузить конфигурацию предприятий',
        type: 'error',
      });
    }
  };

  const handleSaveBusinessConfig = async (config: BusinessConfig) => {
    if (!config.districtId) return;
    
    try {
      await adminService.updateBusinessConfigForDistrict(config.districtId, config.type, {
        creationCost: config.creationCost,
        baseIncomePerHour: config.baseIncomePerHour,
        baseProductionPerHour: config.baseProductionPerHour,
        baseStorageLimit: config.baseStorageLimit,
        baseMaintenanceCost: config.baseMaintenanceCost,
        upgradeCostMultiplier: config.upgradeCostMultiplier,
        incomeIncreasePerLevel: config.incomeIncreasePerLevel,
        productionIncreasePerLevel: config.productionIncreasePerLevel,
      });
      setNotification({
        title: 'Успех',
        message: 'Конфигурация предприятия сохранена',
        type: 'success',
      });
      setEditingConfig(null);
      if (selectedDistrict) {
        fetchBusinessConfigs(selectedDistrict.id);
      }
    } catch (error: any) {
      setNotification({
        title: 'Ошибка',
        message: error.response?.data?.message || 'Ошибка при сохранении',
        type: 'error',
      });
    }
  };

  const handleSaveDistrict = async (district: District) => {
    try {
      await adminService.updateDistrict(district.id, {
        name: district.name,
        description: district.description,
        icon: district.icon,
        commissionRate: district.commissionRate,
      });
      setNotification({
        title: 'Успех',
        message: 'Район обновлен',
        type: 'success',
      });
      setEditingDistrict(null);
      fetchDistricts();
    } catch (error: any) {
      setNotification({
        title: 'Ошибка',
        message: error.response?.data?.message || 'Ошибка при сохранении',
        type: 'error',
      });
    }
  };

  const businessTypeNames: Record<string, string> = {
    COURT_TABLE: 'Дворовый стол',
    BOARD_WORKSHOP: 'Мастерская досок',
    DICE_FACTORY: 'Фабрика зариков',
    CUPS_WORKSHOP: 'Цех стаканов',
    CLUB: 'Клуб Нардиста',
    SCHOOL: 'Школа Нардиста',
    ARENA: 'Турнирная Арена',
  };

  if (loading && !selectedDistrict) {
    return <div className="admin-city">Загрузка...</div>;
  }

  const tabs = [
    {
      id: 'districts',
      label: 'Районы',
      content: (
        <div className="admin-city__districts">
          <div className="admin-city__districts-list">
            {Array.isArray(districts) ? districts.map((district) => (
              <Card key={district.id} className="admin-city__district-card">
                <div className="admin-city__district-header">
                  <div className="admin-city__district-info">
                    <div className="admin-city__district-icon">{district.icon}</div>
                    <div>
                      <h3 className="admin-city__district-name">{district.name}</h3>
                      <p className="admin-city__district-description">{district.description}</p>
                    </div>
                  </div>
                  <div className="admin-city__district-actions">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDistrict(district);
                        setActiveTab('businesses');
                      }}
                    >
                      Управлять предприятиями
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingDistrict({ ...district })}
                    >
                      Редактировать
                    </Button>
                  </div>
                </div>
                <div className="admin-city__district-stats">
                  <span>Комиссия: {district.commissionRate}%</span>
                  <span>Предприятий: {district._count?.businesses || 0}</span>
                </div>
              </Card>
            )) : null}
          </div>
        </div>
      ),
    },
    {
      id: 'businesses',
      label: selectedDistrict ? `Предприятия: ${selectedDistrict.name}` : 'Предприятия',
      content: selectedDistrict ? (
        <div className="admin-city__businesses">
          <div className="admin-city__businesses-header">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedDistrict(null);
                setActiveTab('districts');
              }}
            >
              ← Назад к районам
            </Button>
            <h3>Предприятия в районе "{selectedDistrict.name}"</h3>
          </div>
          <div className="admin-city__list">
            {businessConfigs.length > 0 ? (
              Array.isArray(businessConfigs) ? businessConfigs.map((config) => (
                <Card key={config.type} className="admin-city__config-card">
                  <div className="admin-city__config-header">
                    <h3>{businessTypeNames[config.type] || config.type}</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingConfig({ ...config })}
                    >
                      Редактировать
                    </Button>
                  </div>
                  <div className="admin-city__config-info">
                    <div className="admin-city__config-item">
                      <span>Стоимость создания:</span>
                      <strong>{config.creationCost.toLocaleString()} NAR</strong>
                    </div>
                    <div className="admin-city__config-item">
                      <span>Доход в час (базовый):</span>
                      <strong>{config.baseIncomePerHour} NAR</strong>
                    </div>
                    <div className="admin-city__config-item">
                      <span>Прирост дохода за уровень:</span>
                      <strong>+{config.incomeIncreasePerLevel} NAR</strong>
                    </div>
                    <div className="admin-city__config-item">
                      <span>Множитель стоимости улучшения:</span>
                      <strong>{config.upgradeCostMultiplier}x</strong>
                    </div>
                    {config.baseProductionPerHour > 0 && (
                      <div className="admin-city__config-item">
                        <span>Производство в час:</span>
                        <strong>{config.baseProductionPerHour}</strong>
                      </div>
                    )}
                    {config.baseStorageLimit > 0 && (
                      <div className="admin-city__config-item">
                        <span>Лимит склада:</span>
                        <strong>{config.baseStorageLimit}</strong>
                      </div>
                    )}
                    <div className="admin-city__config-item">
                      <span>Стоимость обслуживания:</span>
                      <strong>{config.baseMaintenanceCost} NAR/час</strong>
                    </div>
                  </div>
                </Card>
              )) : null
            ) : (
              <Card>
                <p>В этом районе нет доступных предприятий</p>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <div className="admin-city__businesses">
          <p>Выберите район для управления предприятиями</p>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-city">
      <PageHeader
        title="Управление городом"
        description="Настройка предприятий и районов"
      />

      <Tabs tabs={tabs} onChange={(id) => setActiveTab(id as 'districts' | 'businesses')} activeTab={activeTab} />

      {editingConfig && (
        <Modal
          isOpen={!!editingConfig}
          onClose={() => setEditingConfig(null)}
          title={`Редактировать: ${businessTypeNames[editingConfig.type] || editingConfig.type}${editingConfig.districtName ? ` (${editingConfig.districtName})` : ''}`}
          size="lg"
        >
          <div className="admin-city__edit-form">
            <Input
              label="Стоимость создания (NAR)"
              type="number"
              value={editingConfig.creationCost}
              onChange={(e) => setEditingConfig({ ...editingConfig, creationCost: parseInt(e.target.value) || 0 })}
            />
            <Input
              label="Базовый доход в час (NAR)"
              type="number"
              value={editingConfig.baseIncomePerHour}
              onChange={(e) => setEditingConfig({ ...editingConfig, baseIncomePerHour: parseInt(e.target.value) || 0 })}
            />
            <Input
              label="Прирост дохода за уровень (NAR)"
              type="number"
              value={editingConfig.incomeIncreasePerLevel}
              onChange={(e) => setEditingConfig({ ...editingConfig, incomeIncreasePerLevel: parseInt(e.target.value) || 0 })}
            />
            <Input
              label="Множитель стоимости улучшения"
              type="number"
              step="0.1"
              value={editingConfig.upgradeCostMultiplier}
              onChange={(e) => setEditingConfig({ ...editingConfig, upgradeCostMultiplier: parseFloat(e.target.value) || 2 })}
              helperText="Формула: baseCost * level * multiplier"
            />
            {editingConfig.baseProductionPerHour > 0 && (
              <>
                <Input
                  label="Производство в час"
                  type="number"
                  step="0.1"
                  value={editingConfig.baseProductionPerHour}
                  onChange={(e) => setEditingConfig({ ...editingConfig, baseProductionPerHour: parseFloat(e.target.value) || 0 })}
                />
                <Input
                  label="Прирост производства за уровень"
                  type="number"
                  step="0.1"
                  value={editingConfig.productionIncreasePerLevel}
                  onChange={(e) => setEditingConfig({ ...editingConfig, productionIncreasePerLevel: parseFloat(e.target.value) || 0 })}
                />
                <Input
                  label="Лимит склада"
                  type="number"
                  value={editingConfig.baseStorageLimit}
                  onChange={(e) => setEditingConfig({ ...editingConfig, baseStorageLimit: parseInt(e.target.value) || 0 })}
                />
              </>
            )}
            <Input
              label="Стоимость обслуживания (NAR/час)"
              type="number"
              value={editingConfig.baseMaintenanceCost}
              onChange={(e) => setEditingConfig({ ...editingConfig, baseMaintenanceCost: parseInt(e.target.value) || 0 })}
            />
            <div className="admin-city__edit-actions">
              <Button variant="outline" fullWidth onClick={() => setEditingConfig(null)}>
                Отмена
              </Button>
              <Button variant="primary" fullWidth onClick={() => handleSaveBusinessConfig(editingConfig)}>
                Сохранить
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {editingDistrict && (
        <Modal
          isOpen={!!editingDistrict}
          onClose={() => setEditingDistrict(null)}
          title={`Редактировать район: ${editingDistrict.name}`}
          size="md"
        >
          <div className="admin-city__edit-form">
            <Input
              label="Название"
              value={editingDistrict.name}
              onChange={(e) => setEditingDistrict({ ...editingDistrict, name: e.target.value })}
            />
            <div className="admin-city__textarea-wrapper">
              <label className="admin-city__textarea-label">Описание</label>
              <textarea
                className="admin-city__textarea"
                value={editingDistrict.description}
                onChange={(e) => setEditingDistrict({ ...editingDistrict, description: e.target.value })}
                rows={3}
              />
            </div>
            <Input
              label="Иконка (эмодзи)"
              value={editingDistrict.icon}
              onChange={(e) => setEditingDistrict({ ...editingDistrict, icon: e.target.value })}
              maxLength={2}
            />
            <Input
              label="Комиссия (%)"
              type="number"
              value={editingDistrict.commissionRate}
              onChange={(e) => setEditingDistrict({ ...editingDistrict, commissionRate: parseInt(e.target.value) || 5 })}
            />
            <div className="admin-city__edit-actions">
              <Button variant="outline" fullWidth onClick={() => setEditingDistrict(null)}>
                Отмена
              </Button>
              <Button variant="primary" fullWidth onClick={() => handleSaveDistrict(editingDistrict)}>
                Сохранить
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
    </div>
  );
};
