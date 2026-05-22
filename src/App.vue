<script setup>
import Footer from './components/Footer.vue';

import { onMounted, onUnmounted, ref, computed } from 'vue';
import { initBackButtonHandler } from '@/composables/useBackButton';
import { useRouter } from 'vue-router';
import { Capacitor } from '@capacitor/core';
import {
  setupNotifications,
  showLocalNotification,
} from '@/utils/notifications';

const router = useRouter();
let cleanup = null;
const updateAvailable = ref(false);
const updateBannerClosed = ref(false);

const showUpdateBanner = computed(() => {
  return updateAvailable.value && !updateBannerClosed.value;
});

const closeUpdateBanner = () => {
  updateBannerClosed.value = true;
  // Сохраняем в localStorage, чтобы баннер не появлялся снова
  localStorage.setItem('update_banner_closed', 'true');
};

const checkForUpdates = async () => {
  try {
    // Запрашиваем version.json с GitHub Pages
    const baseUrl = 'https://nikita-mr.github.io/buyer-s-calculator';
    const response = await fetch(`${baseUrl}/version.json?t=${Date.now()}`, {
      cache: 'no-store',
    });

    if (response.ok) {
      const latest = await response.json();
      const currentVersion = localStorage.getItem('app_version') || '1.0.0';

      console.log('📱 Текущая версия:', currentVersion);
      console.log('📱 Последняя версия:', latest.version);

      if (latest.version !== currentVersion) {
        updateAvailable.value = true;
        // Проверяем, не закрыл ли пользователь баннер раньше
        const wasClosed = localStorage.getItem('update_banner_closed');
        if (wasClosed === 'true') {
          updateBannerClosed.value = true;
        }
      }
    }
  } catch (error) {
    console.log('❌ Не удалось проверить обновления:', error);
  }
};

onMounted(async () => {
  setTimeout(checkForUpdates, 2000);
  const result = initBackButtonHandler(router);
  cleanup = result.cleanup;

  // Инициализация уведомлений
  const hasPermission = await setupNotifications();
  console.log('📱 Уведомления инициализированы, разрешение:', hasPermission);

  // Если в нативном приложении, запрашиваем разрешение ещё раз
  if (Capacitor.getPlatform() !== 'web' && !hasPermission) {
    const { LocalNotifications } = await import(
      '@capacitor/local-notifications'
    );
    await LocalNotifications.requestPermissions();
  }

  setTimeout(() => {
    checkForUpdates();
  }, 2000);
});

onUnmounted(() => {
  if (cleanup) cleanup();
});
</script>

<template>
  <div class="app-container">
    <div
      v-if="showUpdateBanner"
      class="update-banner flex justify-between items-center px-4 py-2"
    >
      <span>Приложение обновлено до актуальной версии!</span>
      <button @click="closeUpdateBanner" class="ml-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="25px"
          height="25px"
          viewBox="0 -0.5 25 25"
          fill="none"
        >
          <path
            d="M6.96967 16.4697C6.67678 16.7626 6.67678 17.2374 6.96967 17.5303C7.26256 17.8232 7.73744 17.8232 8.03033 17.5303L6.96967 16.4697ZM13.0303 12.5303C13.3232 12.2374 13.3232 11.7626 13.0303 11.4697C12.7374 11.1768 12.2626 11.1768 11.9697 11.4697L13.0303 12.5303ZM11.9697 11.4697C11.6768 11.7626 11.6768 12.2374 11.9697 12.5303C12.2626 12.8232 12.7374 12.8232 13.0303 12.5303L11.9697 11.4697ZM18.0303 7.53033C18.3232 7.23744 18.3232 6.76256 18.0303 6.46967C17.7374 6.17678 17.2626 6.17678 16.9697 6.46967L18.0303 7.53033ZM13.0303 11.4697C12.7374 11.1768 12.2626 11.1768 11.9697 11.4697C11.6768 11.7626 11.6768 12.2374 11.9697 12.5303L13.0303 11.4697ZM16.9697 17.5303C17.2626 17.8232 17.7374 17.8232 18.0303 17.5303C18.3232 17.2374 18.3232 16.7626 18.0303 16.4697L16.9697 17.5303ZM11.9697 12.5303C12.2626 12.8232 12.7374 12.8232 13.0303 12.5303C13.3232 12.2374 13.3232 11.7626 13.0303 11.4697L11.9697 12.5303ZM8.03033 6.46967C7.73744 6.17678 7.26256 6.17678 6.96967 6.46967C6.67678 6.76256 6.67678 7.23744 6.96967 7.53033L8.03033 6.46967ZM8.03033 17.5303L13.0303 12.5303L11.9697 11.4697L6.96967 16.4697L8.03033 17.5303ZM13.0303 12.5303L18.0303 7.53033L16.9697 6.46967L11.9697 11.4697L13.0303 12.5303ZM11.9697 12.5303L16.9697 17.5303L18.0303 16.4697L13.0303 11.4697L11.9697 12.5303ZM13.0303 11.4697L8.03033 6.46967L6.96967 7.53033L11.9697 12.5303L13.0303 11.4697Z"
            fill="#dffffe"
          />
        </svg>
      </button>
    </div>
    <main class="main-content">
      <!-- Здесь будет ваш контент -->
      <div class="content">
        <router-view></router-view>
      </div>
    </main>
    <Footer class="sticky bottom-0" />
  </div>
</template>

<style scoped>
.update-banner {
  background: var(--color2);
  color: white;
  text-align: center;
  padding: 10px;
  font-size: 14px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app-container {
  min-height: 100vh; /* Минимальная высота = весь экран */
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* Распределяет пространство */
}

.main-content {
  flex: 1; /* Занимает всё свободное пространство */
  overflow-y: auto; /* Скролл внутри контента если нужно */
  padding: 20px;
}

/* Пример для футера (в вашем Footer.vue уже есть свои стили) */
</style>
