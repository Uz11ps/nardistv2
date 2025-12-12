import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Tabs, NotificationModal } from '../components/ui';
import { districtService, businessService, userService } from '../services';
import { useAuthStore } from '../store/auth.store';
import './City.css';

const buildingNames: Record<string, string> = {
  CLUB: 'Клуб',
  WORKSHOP: 'Мастерская',
  FACTORY: 'Фабрика',
  SCHOOL: 'Школа',
};

const buildingIcons: Record<string, string> = {
  CLUB: '🎪',
  WORKSHOP: '🔨',
  FACTORY: '🏭',
  SCHOOL: '🏫',
};

export const City = () => {
  const [districts, setDistricts] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'districts' | 'jobs'>('districts');
  const [userEnergy, setUserEnergy] = useState(0);
  const [notification, setNotification] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    Promise.all([
      districtService.getAll(),
      businessService.getMyBusinesses(),
      businessService.getAvailableJobs().catch(() => []),
      userService.getProfile(),
    ])
      .then(([dists, bus, jobsData, userData]) => {
        setDistricts(dists);
        setBusinesses(bus);
        setJobs(jobsData || []);
        setUserEnergy(userData.energy || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);


  if (loading) {
    return <div className="city-page">Загрузка...</div>;
  }

  const businessTypeNames: Record<string, string> = {
    COURT_TABLE: 'Дворовый стол',
    BOARD_WORKSHOP: 'Мастерская досок',
    DICE_FACTORY: 'Фабрика зариков',
    CUPS_WORKSHOP: 'Цех стаканов',
    CLUB: 'Клуб Нардиста',
    SCHOOL: 'Школа Нардиста',
    ARENA: 'Турнирная Арена',
  };

  return (
    <div className="city-page">
      <Link to="/" className="city-page__back">←</Link>
      <h1 className="city-page__title">🏙️ Город Нард</h1>
      <Tabs
        tabs={[
          { id: 'districts', label: 'Районы' },
          { id: 'jobs', label: '💼 Работа' },
        ]}
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as 'districts' | 'jobs')}
      />
      {activeTab === 'districts' && (
        <div className="city-districts__grid">
            {districts.map((district) => {
              const userDistrictBusinesses = businesses.filter((b) => b.districtId === district.id);
              return (
                <Link key={district.id} to={`/city/district/${district.id}`}>
                  <Card className="city-district">
                    <div className="city-district__icon">{district.icon}</div>
                    <div className="city-district__info">
                      <h3 className="city-district__name">{district.name}</h3>
                      <p className="city-district__description">{district.description}</p>
                      {district.clanId && (
                        <div className="city-district__clan">
                          👑 Контролируется кланом
                        </div>
                      )}
                      {userDistrictBusinesses.length > 0 && (
                        <div className="city-district__businesses">
                          🏢 Ваших предприятий: {userDistrictBusinesses.length}
                        </div>
                      )}
                    </div>
                    <div className="city-district__arrow">→</div>
                  </Card>
                </Link>
              );
            })}
        </div>
      )}

      {activeTab === 'jobs' && (
        <div className="city-jobs">
          <h2 className="city-section__title">Доступные вакансии</h2>
          <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#1a1a1a', borderRadius: '8px' }}>
            <p>⚡ Ваша энергия: {userEnergy}</p>
            <p style={{ fontSize: '0.9rem', color: '#999', marginTop: '0.5rem' }}>
              1 час работы = 10 энергии = зарплата
            </p>
          </div>
          {jobs.length === 0 ? (
            <Card>
              <p>Нет доступных вакансий</p>
            </Card>
          ) : (
            <div className="city-jobs__list">
              {jobs.map((job: any) => {
                const isJobPosting = job.title !== undefined; // Это вакансия, а не предприятие
                const energyPerHour = isJobPosting ? (job.energyPerHour || 10) : 10;
                const salaryPerHour = isJobPosting ? job.salaryPerHour : (job.hourlySalary || 0);
                const canWork = userEnergy >= energyPerHour;
                const maxHours = Math.floor(userEnergy / energyPerHour);
                const isHired = isJobPosting && job.employees?.some((e: any) => e.workerId === user?.id);
                const isFull = isJobPosting && job.employees?.length >= job.maxWorkers;
                
                return (
                  <Card key={job.id} className="city-job">
                    <div className="city-job__header">
                      <div>
                        <h4 className="city-job__name">
                          {isJobPosting ? job.title : (businessTypeNames[job.type] || job.type)}
                        </h4>
                        {isJobPosting && job.description && (
                          <p style={{ fontSize: '0.9rem', color: '#999', marginTop: '0.25rem' }}>{job.description}</p>
                        )}
                        <p className="city-job__owner">
                          {isJobPosting ? (
                            <>
                              Предприятие: {job.business?.type ? businessTypeNames[job.business.type] : 'Неизвестно'} | 
                              Владелец: {job.business?.user?.nickname || job.business?.user?.firstName || 'Неизвестно'} |
                              Район: {job.business?.district?.name || 'Неизвестно'}
                            </>
                          ) : (
                            <>
                              Владелец: {job.user?.nickname || job.user?.firstName || 'Неизвестно'} |
                              Район: {job.district?.name || 'Неизвестно'} | Уровень: {job.level}
                            </>
                          )}
                        </p>
                        {isJobPosting && (
                          <p style={{ fontSize: '0.85rem', color: '#999' }}>
                            Работников: {job.employees?.length || 0}/{job.maxWorkers} | 
                            ⚡ {energyPerHour} энергии/час
                          </p>
                        )}
                      </div>
                      <div className="city-job__salary">
                        💰 {salaryPerHour} NAR/час
                      </div>
                    </div>
                    <div className="city-job__actions">
                      {isJobPosting ? (
                        <>
                          {!isHired && !isFull && (
                            <Button
                              variant="primary"
                              fullWidth
                              onClick={async () => {
                                try {
                                  await businessService.applyForJob(job.id);
                                  setNotification({
                                    title: 'Успех',
                                    message: 'Вы успешно устроились на работу!',
                                    type: 'success',
                                  });
                                  const jobsData = await businessService.getAvailableJobs();
                                  setJobs(jobsData);
                                  const userData = await userService.getProfile();
                                  setUserEnergy(userData.energy || 0);
                                } catch (error: any) {
                                  setNotification({
                                    title: 'Ошибка',
                                    message: error.response?.data?.message || 'Ошибка при устройстве на работу',
                                    type: 'error',
                                  });
                                }
                              }}
                            >
                              Устроиться
                            </Button>
                          )}
                          {isHired && (
                            <Button
                              variant="primary"
                              fullWidth
                              disabled={!canWork}
                              onClick={async () => {
                                try {
                                  const result = await businessService.workAtJob(job.id, 1);
                                  setNotification({
                                    title: 'Успех',
                                    message: `Вы отработали 1 час и получили ${result.salary} NAR!`,
                                    type: 'success',
                                  });
                                  const jobsData = await businessService.getAvailableJobs();
                                  setJobs(jobsData);
                                  const userData = await userService.getProfile();
                                  setUserEnergy(userData.energy || 0);
                                } catch (error: any) {
                                  setNotification({
                                    title: 'Ошибка',
                                    message: error.response?.data?.message || 'Ошибка при работе',
                                    type: 'error',
                                  });
                                }
                              }}
                            >
                              Работать (1 час)
                            </Button>
                          )}
                          {isFull && !isHired && (
                            <p style={{ color: '#f44336', fontSize: '0.9rem' }}>Вакансия заполнена</p>
                          )}
                        </>
                      ) : (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={!canWork}
                            onClick={async () => {
                              try {
                                const result = await businessService.workAtBusiness(job.id, 1);
                                setNotification({
                                  title: 'Успех',
                                  message: `Вы отработали 1 час и получили ${result.salary} NAR (потрачено ${result.energySpent} энергии)`,
                                  type: 'success',
                                });
                                const [jobsData, userData] = await Promise.all([
                                  businessService.getAvailableJobs(),
                                  userService.getProfile(),
                                ]);
                                setJobs(jobsData);
                                setUserEnergy(userData.energy || 0);
                              } catch (error: any) {
                                setNotification({
                                  title: 'Ошибка',
                                  message: error.response?.data?.message || 'Ошибка при работе',
                                  type: 'error',
                                });
                              }
                            }}
                          >
                            Работать 1 час
                          </Button>
                          {maxHours > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const hours = Math.min(maxHours, 8); // Максимум 8 часов за раз
                                  const result = await businessService.workAtBusiness(job.id, hours);
                                  setNotification({
                                    title: 'Успех',
                                    message: `Вы отработали ${result.hours} часов и получили ${result.salary} NAR (потрачено ${result.energySpent} энергии)`,
                                    type: 'success',
                                  });
                                  const [jobsData, userData] = await Promise.all([
                                    businessService.getAvailableJobs(),
                                    userService.getProfile(),
                                  ]);
                                  setJobs(jobsData);
                                  setUserEnergy(userData.energy || 0);
                                } catch (error: any) {
                                  setNotification({
                                    title: 'Ошибка',
                                    message: error.response?.data?.message || 'Ошибка при работе',
                                    type: 'error',
                                  });
                                }
                              }}
                            >
                              Работать {Math.min(maxHours, 8)} ч.
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
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

