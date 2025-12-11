import { useState, useEffect } from 'react';
import { PageHeader, Input } from '../components';
import { Button, Card } from '../../components/ui';
import { adminService } from '../../services';
import './AdminSettings.css';

export const AdminSettings = () => {
  const [settings, setSettings] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getSettings()
      .then(setSettings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key: string, value: number) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!settings) return;
    try {
      await adminService.updateSettings(settings);
      alert('Настройки сохранены!');
      setHasChanges(false);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка при сохранении настроек');
    }
  };

  const handleReset = async () => {
    try {
      const defaultSettings = await adminService.getSettings();
      setSettings(defaultSettings);
      setHasChanges(false);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка при загрузке настроек');
    }
  };

  if (loading || !settings) {
    return <div className="admin-settings">Загрузка...</div>;
  }

  return (
    <div className="admin-settings">
      <PageHeader
        title="Настройки"
        description="Управление игровыми параметрами и балансом"
        actions={
          <div className="admin-settings__actions">
            {hasChanges && (
              <>
                <Button variant="outline" onClick={handleReset}>
                  Отменить
                </Button>
                <Button variant="primary" onClick={handleSave}>
                  💾 Сохранить изменения
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="admin-settings__sections">
        <Card className="admin-settings__section">
          <h3 className="admin-settings__section-title">📊 Система рейтинга</h3>
          <p className="admin-settings__section-description">
            Настройка изменения рейтинга Elo при победе, поражении и ничьей
          </p>
          <div className="admin-settings__fields">
            <Input
              label="Рейтинг за победу"
              type="number"
              value={settings.ratingPerWin}
              onChange={(e) => handleChange('ratingPerWin', parseInt(e.target.value) || 0)}
              helperText="Количество очков рейтинга, добавляемых при победе"
            />
            <Input
              label="Рейтинг за поражение"
              type="number"
              value={settings.ratingPerLoss}
              onChange={(e) => handleChange('ratingPerLoss', parseInt(e.target.value) || 0)}
              helperText="Количество очков рейтинга, вычитаемых при поражении (отрицательное значение)"
            />
            <Input
              label="Рейтинг за ничью"
              type="number"
              value={settings.ratingPerDraw}
              onChange={(e) => handleChange('ratingPerDraw', parseInt(e.target.value) || 0)}
              helperText="Количество очков рейтинга при ничьей"
            />
          </div>
        </Card>

        <Card className="admin-settings__section">
          <h3 className="admin-settings__section-title">🎁 Реферальная система</h3>
          <p className="admin-settings__section-description">
            Награды за приглашение друзей по реферальному коду
          </p>
          <div className="admin-settings__fields">
            <Input
              label="Монеты за реферала"
              type="number"
              value={settings.referralRewardCoin}
              onChange={(e) => handleChange('referralRewardCoin', parseInt(e.target.value) || 0)}
              helperText="Количество монет, начисляемых за каждого приглашенного пользователя"
            />
            <Input
              label="Опыт за реферала"
              type="number"
              value={settings.referralRewardXp}
              onChange={(e) => handleChange('referralRewardXp', parseInt(e.target.value) || 0)}
              helperText="Количество опыта, начисляемого за каждого приглашенного пользователя"
            />
          </div>
        </Card>

        <Card className="admin-settings__section">
          <h3 className="admin-settings__section-title">🏙️ Система "Город"</h3>
          <p className="admin-settings__section-description">
            Настройки пассивного дохода и развития города
          </p>
          <div className="admin-settings__fields">
            <Input
              label="Множитель дохода города"
              type="number"
              step="0.1"
              value={settings.cityIncomeMultiplier}
              onChange={(e) => handleChange('cityIncomeMultiplier', parseFloat(e.target.value) || 0)}
              helperText="Множитель для расчета пассивного дохода (1.0 = базовый уровень)"
            />
          </div>
        </Card>

        <Card className="admin-settings__section">
          <h3 className="admin-settings__section-title">⚡ Энергия и жизни</h3>
          <p className="admin-settings__section-description">
            Настройки восстановления энергии и жизней
          </p>
          <div className="admin-settings__fields">
            <Input
              label="Восстановление энергии в час"
              type="number"
              value={settings.energyRegenPerHour}
              onChange={(e) => handleChange('energyRegenPerHour', parseInt(e.target.value) || 0)}
              helperText="Количество единиц энергии, восстанавливаемых за час"
            />
            <Input
              label="Восстановление жизней в день"
              type="number"
              value={settings.livesRegenPerDay}
              onChange={(e) => handleChange('livesRegenPerDay', parseInt(e.target.value) || 0)}
              helperText="Количество жизней, восстанавливаемых за день"
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

