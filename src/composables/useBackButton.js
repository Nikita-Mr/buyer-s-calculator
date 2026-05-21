import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { watch, onMounted, onUnmounted } from 'vue';

// Глобальный стек модальных окон
let modalStack = [];

// Глобальный стек вкладок (для истории переключений)
let tabStack = [];

// Регистрация модального окна
export const registerModal = (id, closeFunction) => {
  modalStack = modalStack.filter(m => m.id !== id);
  modalStack.push({ id, close: closeFunction });
  console.log('📱 Модалка зарегистрирована:', id);
};

// Удаление модального окна
export const unregisterModal = (id) => {
  modalStack = modalStack.filter(m => m.id !== id);
  console.log('📱 Модалка удалена:', id);
};

// Регистрация текущей вкладки (для навигации назад)
export const registerTab = (tabId, switchFunction, currentTabRef) => {
  // Сохраняем информацию о вкладке
  tabStack.push({ 
    id: tabId, 
    switch: switchFunction,
    currentTab: currentTabRef
  });
};

// Удаление вкладки
export const unregisterTab = (tabId) => {
  tabStack = tabStack.filter(t => t.id !== tabId);
};

// Инициализация глобального обработчика (вызвать один раз в App.vue)
export const initBackButtonHandler = (router) => {
  if (Capacitor.getPlatform() !== 'android') return () => {};
  
  let backListener = null;
  
  const handleBack = () => {
    console.log('🔙 Нажата кнопка назад, стек модалок:', modalStack.length, 'стек вкладок:', tabStack.length);
    
    // 1. Закрываем модальные окна (если есть)
    if (modalStack.length > 0) {
      const lastModal = modalStack.pop();
      console.log('📱 Закрываем модалку:', lastModal.id);
      if (lastModal.close && typeof lastModal.close === 'function') {
        lastModal.close();
      }
      return true;
    }
    
    // 2. Проверяем вкладки (если есть зарегистрированные)
    if (tabStack.length > 0) {
      const lastTab = tabStack[tabStack.length - 1];
      // Если текущая вкладка не 'products' - переключаем на 'products'
      if (lastTab.currentTab && lastTab.currentTab.value !== 'products') {
        console.log('📱 Переключаем вкладку с', lastTab.currentTab.value, 'на products');
        if (lastTab.switch && typeof lastTab.switch === 'function') {
          lastTab.switch('products');
        }
        return true;
      }
    }
    
    // 3. Пытаемся вернуться по роуту
    if (router && router.options.history.state.back) {
      console.log('🔙 Возврат по роуту');
      router.back();
      return true;
    }
    
    // 4. Ничего не открыто и некуда возвращаться — выходим
    console.log('🚪 Выход из приложения');
    return false;
  };
  
  // Регистрируем слушатель
  const setup = async () => {
    backListener = await App.addListener('backButton', () => {
      const handled = handleBack();
      if (!handled) {
        App.exitApp();
      }
    });
  };
  
  setup();
  
  // Функция для очистки
  const cleanup = () => {
    if (backListener) {
      backListener.remove();
    }
  };
  
  return { cleanup, handleBack };
};

// Хук для компонентов (для модалок)
export const useModalBack = (modalId, isActive, closeFunction) => {
  onMounted(() => {
    if (isActive.value) {
      registerModal(modalId, closeFunction);
    }
  });
  
  onUnmounted(() => {
    unregisterModal(modalId);
  });
  
  watch(isActive, (newVal) => {
    if (newVal) {
      registerModal(modalId, closeFunction);
    } else {
      unregisterModal(modalId);
    }
  });
};

// Хук для вкладок (для навигации назад)
export const useTabBack = (tabId, currentTabRef, switchFunction) => {
  onMounted(() => {
    registerTab(tabId, switchFunction, currentTabRef);
  });
  
  onUnmounted(() => {
    unregisterTab(tabId);
  });
};