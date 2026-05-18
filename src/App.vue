<script setup>
import Footer from './components/Footer.vue';

import { onMounted, onUnmounted } from 'vue';
import { setupNotifications } from './notifications';
import { initBackButtonHandler } from '@/composables/useBackButton';
import { useRouter } from 'vue-router';

const router = useRouter();
let cleanup = null;

onMounted(() => {
  const result = initBackButtonHandler(router);
  cleanup = result.cleanup;
});

onUnmounted(() => {
  if (cleanup) cleanup();
});
</script>

<template>
  <div class="app-container">
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
