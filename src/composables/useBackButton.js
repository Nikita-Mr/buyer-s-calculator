// composables/useBackButton.js
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { watch, onMounted, onUnmounted } from 'vue';

// Глобальный стек модальных окон
let modalStack = [];

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

// Инициализация глобального обработчика (вызвать один раз в App.vue)
export const initBackButtonHandler = (router) => {
  if (Capacitor.getPlatform() !== 'android') return () => {};
  
  let backListener = null;
  
  const handleBack = () => {
    if (modalStack.length > 0) {
      const lastModal = modalStack.pop();
      if (lastModal.close && typeof lastModal.close === 'function') {
        lastModal.close();
      }
      return true;
    }
    
    if (router && router.options.history.state.back) {
      router.back();
      return true;
    }
    
    return false;
  };
  
  const setup = async () => {
    backListener = await App.addListener('backButton', () => {
      const handled = handleBack();
      if (!handled) {
        App.exitApp();
      }
    });
  };
  
  setup();
  
  const cleanup = () => {
    if (backListener) backListener.remove();
  };
  
  return { cleanup, handleBack };
};

// Хук для компонентов (упрощённый)
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