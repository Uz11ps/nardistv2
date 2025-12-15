/**
 * Утилиты для placeholder изображений
 * Используем data URI вместо внешних сервисов для надежности
 */

// Простой SVG placeholder в виде data URI (без эмодзи для совместимости с btoa)
export const getPlaceholderImage = (width: number = 100, height: number = 100, text: string = '') => {
  // Используем только ASCII символы для совместимости с btoa
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#e0e0e0"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="#999" text-anchor="middle" dy=".3em">${text || 'No Image'}</text></svg>`;
  
  // Используем encodeURIComponent вместо btoa для поддержки Unicode
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

// Предустановленные placeholder'ы для разных размеров
export const placeholders = {
  avatar: getPlaceholderImage(100, 100, 'Avatar'),
  avatarSmall: getPlaceholderImage(50, 50, 'Avatar'),
  avatarLarge: getPlaceholderImage(120, 120, 'Avatar'),
  item: getPlaceholderImage(200, 200, 'Item'),
  itemSmall: getPlaceholderImage(100, 100, 'Item'),
  itemMedium: getPlaceholderImage(200, 150, 'Item'),
};

