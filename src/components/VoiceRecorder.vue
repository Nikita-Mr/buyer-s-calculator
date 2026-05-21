<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  storeName: {
    type: String,
    default: null, // если null - глобальный режим с автоопределением магазина
  },
  storesList: {
    type: Array,
    default: () => [], // для глобального режима
  },
});

const emit = defineEmits(['result', 'start', 'stop']);

const isListening = ref(false);
let recognition = null;

// Функция для добавления продуктов
const addProductsToStore = (storeName, productsText) => {
  emit('result', {
    store: storeName,
    products: productsText,
  });
};

// Парсинг текста на отдельные продукты
const parseProducts = (text) => {
  // Разделяем по запятым, пробелам, "и"
  let products = text.split(/[, ]+/).filter(p => p.trim().length > 1);
  
  // Если продуктов мало, пробуем разбить иначе
  if (products.length === 1 && text.includes(' и ')) {
    products = text.split(' и ');
  }
  
  return products.map(p => p.trim());
};

// Глобальное распознавание (с автоопределением магазина)
const processGlobalVoice = (text) => {
  const lowerText = text.toLowerCase();
  
  // Ищем магазин в тексте
  let foundStore = null;
  for (const store of props.storesList) {
    if (lowerText.includes(store.name.toLowerCase())) {
      foundStore = store;
      break;
    }
  }
  
  // Удаляем название магазина из текста
  let productsText = text;
  if (foundStore) {
    const storeNameRegex = new RegExp(foundStore.name, 'gi');
    productsText = text.replace(storeNameRegex, '').trim();
  }
  
  // Если магазин не найден и есть только один магазин
  if (!foundStore && props.storesList.length === 1) {
    foundStore = props.storesList[0];
  }
  
  if (foundStore) {
    const products = parseProducts(productsText);
    if (products.length > 0) {
      addProductsToStore(foundStore.name, products);
    }
    return true;
  }
  
  return false;
};

// Распознавание для конкретного магазина
const processStoreVoice = (text) => {
  const products = parseProducts(text);
  if (products.length > 0) {
    addProductsToStore(props.storeName, products);
    return true;
  }
  return false;
};

// Старт записи
const startVoiceInput = () => {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    alert('Ваш браузер не поддерживает голосовой ввод');
    return;
  }
  
  const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = 'ru-RU';
  recognition.continuous = false;
  recognition.interimResults = false;
  
  recognition.onstart = () => {
    isListening.value = true;
    emit('start');
  };
  
  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    console.log('🎤 Распознано:', text);
    
    let success = false;
    
    if (props.storeName && props.storeName !== 'global') {
      // Режим конкретного магазина
      success = processStoreVoice(text);
    } else {
      // Глобальный режим
      success = processGlobalVoice(text);
    }
    
    if (!success) {
      if (props.storeName && props.storeName !== 'global') {
        alert(`❌ Не удалось распознать продукты. Скажите, например: "молоко хлеб яйца"`);
      } else {
        alert(`❌ Магазин не найден. Скажите, например: "Пятёрочка молоко хлеб"`);
      }
    }
    
    isListening.value = false;
    emit('stop');
  };
  
  recognition.onerror = (event) => {
    console.error('Ошибка распознавания:', event.error);
    if (event.error === 'not-allowed') {
      alert('Разрешите доступ к микрофону');
    }
    isListening.value = false;
    emit('stop');
  };
  
  recognition.onend = () => {
    isListening.value = false;
    emit('stop');
  };
  
  recognition.start();
};

// Остановка записи
const stopVoiceInput = () => {
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
  isListening.value = false;
  emit('stop');
};

// Очистка при размонтировании
onUnmounted(() => {
  if (recognition) {
    recognition.stop();
  }
});
</script>

<template>
  <div class="voice-input-wrapper">
    <!-- Пульсирующий индикатор -->
    <div v-if="isListening" class="voice-indicator">
      <div class="pulse-ring"></div>
      <div class="pulse-ring delay-1"></div>
      <div class="pulse-ring delay-2"></div>
      <div class="mic-icon">🎤</div>
    </div>
    
    <!-- Кнопка -->
    <button 
      @click="isListening ? stopVoiceInput() : startVoiceInput()"
      :class="['voice-btn', { listening: isListening }]"
      :title="isListening ? 'Остановить запись' : 'Голосовой ввод'"
    >
      <span class="mic-icon">🎤</span>
      <span v-if="isListening" class="listening-text">Слушаю...</span>
      <span v-else class="btn-text">{{ storeName ? 'ГС' : '🎙️' }}</span>
    </button>
  </div>
</template>

<style scoped>
.voice-input-wrapper {
  position: relative;
  display: inline-block;
}

/* Стили для кнопки */
.voice-btn {
  background: var(--color2);
  color: white;
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.voice-btn.listening {
  background: #ef4444;
  animation: pulse-bg 1s infinite;
}

.voice-btn .listening-text {
  font-size: 12px;
  margin-left: 4px;
}

.btn-text {
  font-size: 20px;
}

@keyframes pulse-bg {
  0% { transform: scale(1); background: #ef4444; }
  50% { transform: scale(1.05); background: #dc2626; }
  100% { transform: scale(1); background: #ef4444; }
}

/* Пульсирующий индикатор */
.voice-indicator {
  position: fixed;
  bottom: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.pulse-ring {
  position: absolute;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.3);
  animation: pulse 1.5s infinite;
}

.pulse-ring.delay-1 {
  animation-delay: 0.5s;
  background: rgba(239, 68, 68, 0.2);
}

.pulse-ring.delay-2 {
  animation-delay: 1s;
  background: rgba(239, 68, 68, 0.1);
}

.voice-indicator .mic-icon {
  position: relative;
  z-index: 10;
  width: 80px;
  height: 80px;
  background: #ef4444;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  animation: mic-pulse 1s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.6);
    opacity: 1;
  }
  100% {
    transform: scale(1.8);
    opacity: 0;
  }
}

@keyframes mic-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

/* Мобильная адаптация */
@media (max-width: 640px) {
  .pulse-ring {
    width: 100px;
    height: 100px;
  }
  .voice-indicator .mic-icon {
    width: 60px;
    height: 60px;
    font-size: 30px;
  }
}
</style>