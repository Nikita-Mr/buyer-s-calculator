// notifications.js
import { Capacitor } from '@capacitor/core';

export const setupNotifications = async () => {
  // Проверяем, что мы не в браузере
  if (!Capacitor.isNativePlatform()) {
    console.log('PushNotifications доступны только в нативном приложении');
    return;
  }
  
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    const result = await PushNotifications.requestPermissions();
    if (result.receive === 'granted') {
      await PushNotifications.register();
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Уведомление получено:', notification);
      });
    }
  } catch (error) {
    console.error('Ошибка настройки уведомлений:', error);
  }
};