import { useState } from 'react';
import { Card, Button, Modal } from '../components/ui';
import { mockAcademyArticles } from '../mock';
import './Academy.css';

export const Academy = () => {
  const [selectedArticle, setSelectedArticle] = useState<typeof mockAcademyArticles[0] | null>(null);

  return (
    <div className="academy-page">
      <h1 className="academy-page__title">📚 Академия</h1>
      <div className="academy-articles">
        {mockAcademyArticles.map((article) => (
          <Card
            key={article.id}
            className="academy-article"
            onClick={() => setSelectedArticle(article)}
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
        ))}
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
              <Button variant="primary" fullWidth>
                Купить за {selectedArticle.priceCoin} NAR
              </Button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

