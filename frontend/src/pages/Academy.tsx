import { useState, useEffect } from 'react';
import { Card, Button, Modal } from '../components/ui';
import { academyService } from '../services';
import './Academy.css';

export const Academy = () => {
  const [articles, setArticles] = useState<any[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    academyService.getArticles()
      .then(setArticles)
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
              <Button
                variant="primary"
                fullWidth
                onClick={async () => {
                  // TODO: Implement purchase logic
                  alert('Покупка статей будет реализована позже');
                }}
              >
                Купить за {selectedArticle.priceCoin} NAR
              </Button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

