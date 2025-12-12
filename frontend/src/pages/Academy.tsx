import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Modal, NotificationModal, ConfirmModal } from '../components/ui';
import { academyService, userService } from '../services';
import { useAuthStore } from '../store/auth.store';
import './Academy.css';

export const Academy = () => {
  const [articles, setArticles] = useState<any[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [userBalance, setUserBalance] = useState(0);
  const [notification, setNotification] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmPurchase, setConfirmPurchase] = useState<{ article: any } | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    Promise.all([
      academyService.getArticles(),
      userService.getProfile().catch(() => ({ narCoin: 0 })),
    ])
      .then(([articlesData, userData]) => {
        setArticles(articlesData);
        setUserBalance(userData.narCoin || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleArticleClick = async (article: any) => {
    try {
      const fullArticle = await academyService.getArticle(article.id);
      setSelectedArticle(fullArticle);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка при загрузке статьи');
    }
  };

  if (loading) {
    return <div className="academy-page">Загрузка...</div>;
  }

  return (
    <div className="academy-page">
      <Link to="/" className="academy-page__back">←</Link>
      <h1 className="academy-page__title">📚 Академия</h1>
      <div className="academy-articles">
        {articles.length === 0 ? (
          <Card>Нет доступных статей</Card>
        ) : (
          articles.map((article) => (
            <Card
              key={article.id}
              className="academy-article"
              onClick={() => handleArticleClick(article)}
              hover
            >
              <div className="academy-article__header">
                <h3 className="academy-article__title">{article.title}</h3>
                {article.isPaid && (
                  <span className="academy-article__badge">💰 {article.priceCoin} NAR</span>
                )}
              </div>
              <div className="academy-article__meta">
                <span className="academy-article__category">{article.category}</span>
                <span className="academy-article__views">👁️ {article.views}</span>
              </div>
            </Card>
          ))
        )}
      </div>
      {selectedArticle && (
        <Modal
          isOpen={!!selectedArticle}
          onClose={() => setSelectedArticle(null)}
          title={selectedArticle.title}
          size="lg"
        >
          <div className="academy-article-content">
            <div className="academy-article-content__meta">
              <span>Категория: {selectedArticle.category}</span>
              <span>Просмотров: {selectedArticle.views}</span>
            </div>
            <div className="academy-article-content__text">{selectedArticle.content}</div>
            {selectedArticle.isPaid && (
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selectedArticle.priceCoin > 0 && (
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => {
                      setConfirmPurchase({ article: selectedArticle });
                    }}
                    disabled={userBalance < selectedArticle.priceCoin}
                  >
                    Купить за {selectedArticle.priceCoin.toLocaleString()} NAR
                  </Button>
                )}
                {selectedArticle.priceCrypto && (
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => {
                      setNotification({
                        title: 'Информация',
                        message: 'Оплата через TON/USDT будет доступна в ближайшее время',
                        type: 'info',
                      });
                    }}
                  >
                    Купить за {selectedArticle.priceCrypto} TON/USDT
                  </Button>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {confirmPurchase && (
        <ConfirmModal
          isOpen={!!confirmPurchase}
          onClose={() => setConfirmPurchase(null)}
          onConfirm={async () => {
            try {
              await academyService.purchaseArticleWithNAR(confirmPurchase.article.id);
              setNotification({
                title: 'Успех',
                message: 'Статья успешно куплена! Теперь у вас есть доступ.',
                type: 'success',
              });
              const userData = await userService.getProfile();
              setUserBalance(userData.narCoin || 0);
              // Перезагружаем статью для проверки доступа
              const fullArticle = await academyService.getArticle(confirmPurchase.article.id);
              setSelectedArticle(fullArticle);
              setConfirmPurchase(null);
            } catch (error: any) {
              setNotification({
                title: 'Ошибка',
                message: error.response?.data?.message || 'Ошибка при покупке статьи',
                type: 'error',
              });
            }
          }}
          title="Покупка статьи"
          message={`Вы уверены, что хотите купить доступ к статье "${confirmPurchase.article.title}"?`}
          confirmText="Купить"
          cancelText="Отмена"
          cost={confirmPurchase.article.priceCoin}
          balance={userBalance}
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

