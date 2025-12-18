import WebApp from '@twa-dev/sdk';

export function initTelegramWebApp() {
  WebApp.ready();
  WebApp.expand();
}

export function getTelegramUser() {
  return WebApp.initDataUnsafe?.user;
}

export function getTelegramInitData() {
  return WebApp.initData;
}
