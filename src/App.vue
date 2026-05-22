<script setup>
import Footer from './components/Footer.vue';

import { onMounted, onUnmounted, ref } from 'vue';
import { initBackButtonHandler } from '@/composables/useBackButton';
import { useRouter } from 'vue-router';
import { setupNotifications, showLocalNotification } from '@/utils/notifications';

const router = useRouter();
let cleanup = null;
const updateAvailable = ref(false);


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
        console.log('🔄 Доступно обновление!');
        updateAvailable.value = true;
        localStorage.setItem('app_version', latest.version);

        // Показываем уведомление
        showLocalNotification({
          title: '🔄 Обновление готово',
          body: 'Перезапустите приложение для применения обновлений',
        });
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
    <div v-if="updateAvailable" class="update-banner">
      🔄 Доступна новая версия! Перезапустите приложение.
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
