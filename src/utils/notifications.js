// notifications.js
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

// Генератор корректного ID в пределах Java int
let notificationCounter = 0;
const generateNotificationId = () => {
  notificationCounter = (notificationCounter + 1) % 2000000000;
  return notificationCounter;
};

// Создание канала для уведомлений
const createNotificationChannel = async () => {
  if (Capacitor.getPlatform() === 'android') {
    try {
      await LocalNotifications.createChannel({
        id: 'default',
        name: 'Основной канал',
        description: 'Уведомления приложения',
        importance: 4,
        visibility: 1,
        sound: null,
      });
      console.log('✅ Канал уведомлений создан');
    } catch (error) {
      console.error('❌ Ошибка создания канала:', error);
    }
  }
};

// Запрос разрешения
export const requestNotificationPermissions = async () => {
  if (Capacitor.getPlatform() === 'web') {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }
  
  try {
    await createNotificationChannel();
    const permission = await LocalNotifications.requestPermissions();
    console.log('📱 Разрешение:', permission);
    return permission.display === 'granted';
  } catch (error) {
    console.error('Ошибка запроса разрешений:', error);
    return false;
  }
};

// Показ локального уведомления
export const showLocalNotification = async ({ title, body }) => {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    console.log('❌ Нет разрешения на уведомления');
    return false;
  }
  
  // Веб-версия
  if (Capacitor.getPlatform() === 'web') {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
      console.log('✅ Веб-уведомление показано');
    }
    return true;
  }
  
  // Нативная версия
  try {
    const notificationId = generateNotificationId();
    console.log('📱 Отправляем уведомление с ID:', notificationId);
    
    await LocalNotifications.schedule({
      notifications: [
        {
          id: notificationId,  // <-- ИСПРАВЛЕНО: небольшое целое число
          title: title,
          body: body,
          sound: null,
          channelId: 'default',
        },
      ],
    });
    console.log('✅ Нативное уведомление показано:', title);
    return true;
  } catch (error) {
    console.error('❌ Ошибка показа уведомления:', error);
    return false;
  }
};

// Тестовое уведомление
export const testNotification = async () => {
  console.log('🔔 Запуск тестового уведомления...');
  
  await requestNotificationPermissions();
  
  await showLocalNotification({
    title: '🔔 Тест 1',
    body: 'Если вы видите это сообщение — уведомления работают!'
  });
  
  setTimeout(async () => {
    await showLocalNotification({
      title: '✅ Тест 2',
      body: 'Второе уведомление через 2 секунды'
    });
  }, 2000);
};

// Уведомление об обновлении списка
export const notifyListUpdated = (storeName, changeType = 'updated') => {
  const title = '📝 Список покупок обновлён';
  const body = `Партнёр ${changeType === 'added' ? 'добавил продукты в' : 'обновил'} ${storeName}`;
  return showLocalNotification({ title, body });
};

// Уведомление о превышении бюджета
export const notifyBudgetExceeded = (spent, budget) => {
  const title = '⚠️ Превышение бюджета';
  const body = `Вы потратили ${spent} ₽ при бюджете ${budget} ₽`;
  return showLocalNotification({ title, body });
};

// Уведомление о приближении к лимиту
export const notifyBudgetWarning = (spent, budget) => {
  const percent = Math.round((spent / budget) * 100);
  const title = '💰 Внимание! Бюджет';
  const body = `Вы использовали ${percent}% бюджета (${spent} из ${budget} ₽)`;
  return showLocalNotification({ title, body });
};

// Настройка уведомлений
export const setupNotifications = async () => {
  const hasPermission = await requestNotificationPermissions();
  console.log('📱 Уведомления:', hasPermission ? 'разрешены' : 'запрещены');
  return hasPermission;
};