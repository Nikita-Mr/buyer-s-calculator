<script setup>
import { ref, computed } from 'vue';

// Список товаров для сравнения
const items = ref([
  { id: 1, name: '', price: '', quantity: '', unit: 'г' },
  { id: 2, name: '', price: '', quantity: '', unit: 'г' }
]);

// Единицы измерения
const units = [
  { value: 'г', label: 'грамм' },
  { value: 'кг', label: 'килограмм' },
  { value: 'мл', label: 'миллилитр' },
  { value: 'л', label: 'литр' },
  { value: 'шт', label: 'штука' }
];

// Вычисляем цену за единицу (1 грамм / 1 мл)
const getPricePerUnit = (item) => {
  const price = parseFloat(item.price);
  const quantity = parseFloat(item.quantity);
  
  if (!price || !quantity || quantity <= 0) return null;
  
  let baseQuantity = quantity;
  
  // Приводим к базовой единице (г, мл)
  if (item.unit === 'кг') {
    // 1 кг = 1000 г, поэтому количество в кг умножаем на 1000
    baseQuantity = quantity * 1000;
  } else if (item.unit === 'л') {
    // 1 л = 1000 мл, поэтому количество в л умножаем на 1000
    baseQuantity = quantity * 1000;
  } else if (item.unit === 'шт') {
    // Для штук оставляем как есть (цена за штуку)
    baseQuantity = quantity;
  }
  // Для грамм и миллилитров оставляем как есть
  
  return price / baseQuantity;
};

// Результаты сравнения
const results = computed(() => {
  return items.value.map(item => {
    const pricePerUnit = getPricePerUnit(item);
    return {
      ...item,
      pricePerUnit: pricePerUnit,
      pricePerUnitFormatted: pricePerUnit !== null ? pricePerUnit.toFixed(2) : null
    };
  });
});

// Находим самый выгодный товар
const bestItem = computed(() => {
  const validItems = results.value.filter(item => item.pricePerUnit !== null);
  if (validItems.length === 0) return null;
  
  return validItems.reduce((best, current) => {
    return current.pricePerUnit < best.pricePerUnit ? current : best;
  });
});

// Функции управления
const addItem = () => {
  const maxId = items.value.reduce((max, item) => Math.max(max, item.id), 0);
  items.value.push({
    id: maxId + 1,
    name: '',
    price: '',
    quantity: '',
    unit: 'г'
  });
};

const removeItem = (index) => {
  if (items.value.length <= 2) {
    alert('Должно быть минимум 2 товара для сравнения');
    return;
  }
  items.value.splice(index, 1);
};

const clearAll = () => {
  items.value.forEach(item => {
    item.name = '';
    item.price = '';
    item.quantity = '';
  });
};

const formatPrice = (price) => {
  if (!price) return '—';
  return parseFloat(price).toFixed(2) + ' ₽';
};

const getUnitLabel = (unitValue) => {
  const found = units.find(u => u.value === unitValue);
  return found ? found.label : unitValue;
};

const isWinner = (itemId) => {
  if (!bestItem.value) return false;
  return bestItem.value.id === itemId;
};
</script>

<template>
  <div class="bg-[var(--color3)] font-sans pb-24">
    <!-- Кнопка назад -->
    <button
      class="absolute top-4 left-4 w-[40px] h-[40px] bg-[var(--color2)] rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform"
      @click="$router.back"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24px"
        height="24px"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M11.7071 4.29289C12.0976 4.68342 12.0976 5.31658 11.7071 5.70711L6.41421 11H20C20.5523 11 21 11.4477 21 12C21 12.5523 20.5523 13 20 13H6.41421L11.7071 18.2929C12.0976 18.6834 12.0976 19.3166 11.7071 19.7071C11.3166 20.0976 10.6834 20.0976 10.2929 19.7071L3.29289 12.7071C3.10536 12.5196 3 12.2652 3 12C3 11.7348 3.10536 11.4804 3.29289 11.2929L10.2929 4.29289C10.6834 3.90237 11.3166 3.90237 11.7071 4.29289Z"
          fill="var(--color3)"
        />
      </svg>
    </button>

    <!-- Заголовок -->
    <div class="text-center pt-8 pb-4 px-4">
      <h1 class="text-2xl font-bold text-gray-800">
        Сравнение цен
      </h1>
      <p class="text-gray-500 text-sm mt-1">
        Узнайте, какой товар выгоднее
      </p>
    </div>

    <!-- Основная карточка -->
    <div class="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-4 space-y-4 relative overflow-hidden">
      
      <!-- Декоративная полоска сверху -->
      <div class="absolute top-0 left-0 w-full h-1 bg-[var(--color2)]"></div>

      <!-- Список товаров -->
      <div class="space-y-4">
        <div 
          v-for="(item, index) in items" 
          :key="item.id"
          class="p-4 border rounded-xl transition-all relative group"
          :class="{
            'border-[var(--color2)] bg-[var(--color3)] ring-1 ring-[var(--color2)]': isWinner(item.id) && item.pricePerUnit !== null,
            'border-gray-200 bg-white': !isWinner(item.id) || item.pricePerUnit === null
          }"
        >
          <!-- Бейдж победителя -->
          <div v-if="isWinner(item.id) && item.pricePerUnit !== null" 
               class="absolute -top-2 -right-2 bg-[var(--color2)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
            🏆 Выгоднее
          </div>

          <div class="space-y-3">
            <!-- Номер и название -->
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                {{ index + 1 }}
              </div>
              <input
                v-model="item.name"
                type="text"
                placeholder="Название товара"
                class="flex-1 bg-transparent border-b border-gray-200 p-1 text-base font-medium text-gray-800 focus:outline-none focus:border-[var(--color2)] transition-colors placeholder-gray-400"
              />
              <!-- Кнопка удаления (показываем всегда на телефоне) -->
              <button 
                @click="removeItem(index)"
                class="text-gray-400 hover:text-red-500 transition-colors p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Поля ввода - вертикальная компоновка для телефона -->
            <div class="space-y-3">
              <!-- Цена -->
              <div>
                <label class="text-xs font-medium text-gray-500 block mb-1">Цена</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₽</span>
                  <input
                    type="number"
                    v-model="item.price"
                    class="w-full bg-gray-50 border border-gray-200 p-3 pl-8 rounded-xl text-right text-base font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--color2)] focus:border-transparent placeholder-gray-400"
                    placeholder="0"
                    inputmode="numeric"
                  />
                </div>
              </div>

              <!-- Количество и единица измерения в одной строке -->
              <div class="flex gap-3">
                <div class="flex-1">
                  <label class="text-xs font-medium text-gray-500 block mb-1">Количество</label>
                  <input
                    type="number"
                    v-model="item.quantity"
                    class="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-right text-base font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--color2)] focus:border-transparent placeholder-gray-400"
                    placeholder="0"
                    inputmode="numeric"
                  />
                </div>
                <div class="w-28">
                  <label class="text-xs font-medium text-gray-500 block mb-1">Единица</label>
                  <select
                    v-model="item.unit"
                    class="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-base font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--color2)] focus:border-transparent"
                  >
                    <option v-for="unit in units" :key="unit.value" :value="unit.value">
                      {{ unit.label }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Результат для этого товара -->
            <div v-if="item.pricePerUnit !== null" class="mt-2 pt-2 border-t border-gray-100">
              <div class="flex justify-between items-center text-sm">
                <span class="text-gray-600">Цена за 1 {{ getUnitLabel(item.unit) === 'килограмм' ? 'грамм' : getUnitLabel(item.unit) === 'литр' ? 'миллилитр' : getUnitLabel(item.unit) }}:</span>
                <span class="font-bold" :class="isWinner(item.id) ? 'text-[var(--color2)]' : 'text-gray-800'">
                  {{ item.pricePerUnitFormatted }} ₽
                </span>
              </div>
            </div>
            <div v-else-if="item.price && item.quantity" class="mt-2 text-center text-xs text-gray-400">
              ⚠️ Недостаточно данных для расчета
            </div>
          </div>
        </div>
      </div>

      <!-- Кнопки действий -->
      <div class="flex gap-2 pt-2">
        <button 
          @click="addItem"
          class="flex-1 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-[var(--color2)] hover:text-[var(--color2)] transition-all flex items-center justify-center gap-1 text-sm font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Добавить товар
        </button>
        <button 
          @click="clearAll"
          class="py-3 px-4 border border-gray-200 rounded-xl text-gray-500 hover:text-red-500 hover:border-red-200 transition-all text-sm font-medium"
        >
          Очистить
        </button>
      </div>

      <!-- Блок с лучшим результатом -->
      <div v-if="bestItem && bestItem.pricePerUnit !== null" class="mt-4 pt-4 border-t border-gray-100">
        <div class="bg-[var(--color2)]/10 rounded-xl p-4 text-center">
          <div class="text-xs text-[var(--color2)] font-bold uppercase tracking-wider mb-1">
            ✅ Самый выгодный товар
          </div>
          <div class="text-xl font-bold text-gray-800">
            {{ bestItem.name || `Товар #${items.indexOf(bestItem) + 1}` }}
          </div>
          <div class="text-sm text-gray-600 mt-1">
            Цена: {{ formatPrice(bestItem.price) }} за {{ getUnitLabel(bestItem.unit) }}
          </div>
          <div class="text-sm text-[var(--color2)] font-medium mt-1">
            {{ bestItem.pricePerUnitFormatted }} ₽ за 1 {{ getUnitLabel(bestItem.unit) === 'килограмм' ? 'грамм' : getUnitLabel(bestItem.unit) === 'литр' ? 'миллилитр' : getUnitLabel(bestItem.unit) }}
          </div>
        </div>
      </div>

      <!-- Подсказка -->
      <div v-if="!bestItem && items.some(item => item.price && item.quantity)" class="text-center text-xs text-gray-400 mt-2">
        Заполните все поля для сравнения
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Скрываем стрелки в инпутах number */
input[type=number]::-webkit-outer-spin-button,
input[type=number]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type=number] {
  -moz-appearance: textfield;
}

/* Анимация для появления победителя */
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(57, 172, 175, 0.3);
  }
  50% {
    box-shadow: 0 0 8px 2px rgba(57, 172, 175, 0.2);
  }
}

.group {
  transition: all 0.3s ease;
}

/* Увеличиваем размеры для телефона */
input, select, button {
  min-height: 40px;
}
</style>