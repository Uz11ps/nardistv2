/**
 * Утилиты для placeholder изображений
 * Используем data URI вместо внешних сервисов для надежности
 */

// Простой SVG placeholder в виде data URI
export const getPlaceholderImage = (width: number = 100, height: number = 100, text: string = '') => {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#e0e0e0"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="#999" text-anchor="middle" dy=".3em">
        ${text || 'No Image'}
      </text>
    </svg>
  `.trim();
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Предустановленные placeholder'ы для разных размеров
export const placeholders = {
  avatar: getPlaceholderImage(100, 100, '👤'),
  avatarSmall: getPlaceholderImage(50, 50, '👤'),
  avatarLarge: getPlaceholderImage(120, 120, '👤'),
  item: getPlaceholderImage(200, 200, '📦'),
  itemSmall: getPlaceholderImage(100, 100, '📦'),
  itemMedium: getPlaceholderImage(200, 150, '📦'),
};

