<!-- components/PartnerInvite.vue -->
<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { db } from '@/firebase';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  getDoc,
  onSnapshot,
  doc,
  updateDoc,
} from 'firebase/firestore';

const userId = computed(() => {
  let id = localStorage.getItem('userId');
  if (!id) {
    id = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('userId', id);
  }
  return id;
});

const props = defineProps({
  stores: {
    type: Array,
    required: true,
  },
  productsText: {
    type: Object,
    default: () => ({}),
  },
  shoppingHistory: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits([
  'update-stores',
  'update-products',
  'update-history',
]);

const leaveRoom = async () => {
  if (!roomId.value) return;
  
  if (confirm('Вы уверены, что хотите выйти из комнаты? Все локальные данные сохранятся, но вы перестанете синхронизироваться с партнёром.')) {
    try {
      // Удаляем пользователя из списка партнёров
      const roomRef = doc(db, 'rooms', roomId.value);
      const roomSnap = await getDoc(roomRef);  // <-- ТЕПЕРЬ БУДЕТ РАБОТАТЬ
      
      if (roomSnap.exists()) {
        const data = roomSnap.data();
        const updatedPartners = (data.partners || []).filter(p => p !== userId.value);
        
        await updateDoc(roomRef, {
          partners: updatedPartners
        });
      }
      
      // Очищаем локальное хранилище
      localStorage.removeItem('roomId');
      localStorage.removeItem('roomCode');
      localStorage.removeItem('userStores');
      localStorage.removeItem('productsList');
      localStorage.removeItem('shoppingHistory');
      localStorage.removeItem('allAvailableStores');
      localStorage.removeItem('allSelectedStores');
      localStorage.removeItem('budgetData');
      localStorage.removeItem('budgetExpenses');
      
      // Перезагружаем страницу
      window.location.reload();
    } catch (error) {
      console.error('Ошибка выхода из комнаты:', error);
      alert('Не удалось выйти из комнаты: ' + error.message);
    }
  }
};

const roomCode = ref('');
const roomId = ref(localStorage.getItem('roomId') || '');
const isCreating = ref(false);
const isJoining = ref(false);
const roomCodeDisplay = computed(() => localStorage.getItem('roomCode') || '');
let unsubscribe = null;

const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

const createRoom = async () => {
  isCreating.value = true;
  const code = generateCode();
  roomCode.value = code;
  try {
    const docRef = await addDoc(collection(db, 'rooms'), {
      code: code,
      createdAt: new Date().toISOString(),
      partners: [userId.value],
      stores: [],
      products: {},
      history: [],
      budget: { amount: 0, endDate: null, expenses: [] },
    });
    roomId.value = docRef.id;
    localStorage.setItem('roomId', docRef.id);
    localStorage.setItem('roomCode', code);
    window.location.reload();
  } catch (error) {
    console.error('Ошибка создания комнаты:', error);
  } finally {
    isCreating.value = false;
  }
};

const joinRoom = async () => {
  if (!roomCode.value.trim()) {
    alert('Введите код комнаты');
    return;
  }
  isJoining.value = true;
  try {
    const q = query(
      collection(db, 'rooms'),
      where('code', '==', roomCode.value.trim().toUpperCase())
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docData = querySnapshot.docs[0];
      const data = docData.data();
      await updateDoc(doc(db, 'rooms', docData.id), {
        partners: [...data.partners, userId.value],
      });
      roomId.value = docData.id;
      localStorage.setItem('roomId', docData.id);
      localStorage.setItem('roomCode', roomCode.value.trim().toUpperCase());
      window.location.reload();
    } else {
      alert('Комната не найдена');
    }
  } catch (error) {
    console.error('Ошибка присоединения:', error);
  } finally {
    isJoining.value = false;
  }
};

const setupRoomListener = () => {
  if (!roomId.value) return;

  unsubscribe = onSnapshot(doc(db, 'rooms', roomId.value), (docSnapshot) => {
    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      // Если изменения прислал НЕ этот пользователь — только тогда обновляем
      if (data.lastChangedBy !== userId.value) {
        if (data.stores) {
          localStorage.setItem('userStores', JSON.stringify(data.stores));
          emit('update-stores', data.stores);
        }
        if (data.products) {
          localStorage.setItem('productsText', JSON.stringify(data.products));
          emit('update-products', data.products);
        }
        if (data.history) {
          localStorage.setItem('shoppingHistory', JSON.stringify(data.history));
          emit('update-history', data.history);
        }
        if (data.budget) {
          localStorage.setItem('budgetData', JSON.stringify(data.budget));
          window.dispatchEvent(
            new CustomEvent('budgetUpdated', { detail: data.budget })
          );
        }
        window.dispatchEvent(new Event('storesUpdated'));
      }
    }
  });
};

const copyCode = () => {
  const code = localStorage.getItem('roomCode');
  if (code) {
    navigator.clipboard.writeText(code);
    alert('Код скопирован!');
  }
};

onMounted(() => {
  setupRoomListener();
});

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
});
</script>

<template>
  <div class="partner-invite-wrapper max-w-md mx-auto my-4 px-3">
    <!-- Если комнаты нет -->
    <div
      v-if="!roomId"
      class="room-create bg-white rounded-2xl p-6 shadow-md"
      :style="{ border: '1px solid rgba(57, 172, 175, 0.1)' }"
    >
      <div class="header-section text-center mb-5">
        <div
          class="icon-circle w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
          :style="{ background: 'var(--color3)', color: 'var(--color2)' }"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <h3 class="text-xl font-bold text-gray-900 mb-1">Совместные покупки</h3>
        <p class="text-sm text-gray-500">
          Планируйте бюджет и списки вместе с близкими
        </p>
      </div>

      <div class="action-buttons flex flex-col gap-3">
        <button
          @click="createRoom"
          :disabled="isCreating"
          class="btn-primary w-full py-3.5 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          :style="{ background: 'var(--color2)', color: 'white' }"
        >
          {{ isCreating ? 'Создание...' : 'Создать комнату' }}
        </button>

        <div class="divider flex items-center gap-3 text-gray-400 text-xs">
          <div class="flex-1 h-px bg-gray-200"></div>
          <span>или</span>
          <div class="flex-1 h-px bg-gray-200"></div>
        </div>

        <div class="join-input-group flex gap-2 sm:flex-row flex-col">
          <input
            v-model="roomCode"
            placeholder="Введите код комнаты"
            class="code-input flex-1 py-3 px-4 border-2 rounded-xl text-center text-base uppercase tracking-wider focus:outline-none"
            :style="{ borderColor: '#e0e0e0' }"
            @keyup.enter="joinRoom"
          />
          <button
            @click="joinRoom"
            :disabled="isJoining"
            class="btn-secondary py-3 px-4 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed sm:w-auto w-full"
            :style="{ background: 'var(--color3)', color: 'var(--color2)' }"
          >
            {{ isJoining ? 'Присоединение...' : 'Присоединиться' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Если комната есть -->
    <div v-else class="room-active bg-white rounded-2xl p-4 shadow-md">
      <div
        class="room-info-card flex items-center gap-3 flex-wrap sm:flex-nowrap"
      >
      <div class="flex justify-between items-center w-[100%]">
          <div
            class="room-badge w-11 h-11 rounded-full flex items-center justify-center shrink-0 mr-[15px]"
            :style="{ background: 'var(--color3)', color: 'var(--color2)' }"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20px"
              height="20px"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M7.05025 1.53553C8.03344 0.552348 9.36692 0 10.7574 0C13.6528 0 16 2.34721 16 5.24264C16 6.63308 15.4477 7.96656 14.4645 8.94975L12.4142 11L11 9.58579L13.0503 7.53553C13.6584 6.92742 14 6.10264 14 5.24264C14 3.45178 12.5482 2 10.7574 2C9.89736 2 9.07258 2.34163 8.46447 2.94975L6.41421 5L5 3.58579L7.05025 1.53553Z"
                :fill="'var(--color2)'"
              />
              <path
                d="M7.53553 13.0503L9.58579 11L11 12.4142L8.94975 14.4645C7.96656 15.4477 6.63308 16 5.24264 16C2.34721 16 0 13.6528 0 10.7574C0 9.36693 0.552347 8.03344 1.53553 7.05025L3.58579 5L5 6.41421L2.94975 8.46447C2.34163 9.07258 2 9.89736 2 10.7574C2 12.5482 3.45178 14 5.24264 14C6.10264 14 6.92742 13.6584 7.53553 13.0503Z"
                :fill="'var(--color2)'"
              />
              <path
                d="M5.70711 11.7071L11.7071 5.70711L10.2929 4.29289L4.29289 10.2929L5.70711 11.7071Z"
                :fill="'var(--color2)'"
              />
            </svg>
          </div>
          <div class="room-details flex-1">
            <span class="label block text-xs text-gray-400">Код комнаты</span>
            <span
              class="code block text-xl font-bold tracking-wider"
              :style="{ color: 'var(--color2)' }"
              >{{ roomCodeDisplay }}</span
            >
          </div>
          <div class="">
            <button
              @click="leaveRoom"
              class="btn-leave py-2 px-4 rounded-lg font-semibold text-sm flex items-center gap-1.5 transition-all active:scale-95"
              style="background: #ef4444; color: white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <!-- <span>Выйти</span> -->
            </button>
          </div>

        </div>
        <button
          @click="copyCode"
          class="btn-copy py-2 px-4 rounded-lg font-semibold text-sm flex items-center gap-1.5 transition-all active:scale-95 sm:w-auto w-full justify-center"
          :style="{ background: 'var(--color3)', color: 'var(--color2)' }"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path
              d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
            ></path>
          </svg>
          <span>Скопировать</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Только глобальные переменные и специфичные для фокуса стили, которые нельзя через Tailwind */
.code-input:focus {
  border-color: var(--color2) !important;
  outline: none;
}
</style>
