<script setup>
import { ref, computed } from 'vue';

// Переменные для полей ввода
const pricePerKg = ref('');
const isNotPerKg = ref(false);
const actualWeight = ref('');
const priceFromTag = ref('');
const targetWeight = ref('');

// Вычисляемое поле: Итоговая стоимость
const finalCost = computed(() => {
  const weight = parseFloat(targetWeight.value);
  if (!weight || weight <= 0) return '';

  let basePricePerGram = 0;

  if (isNotPerKg.value) {
    // Режим: цена указана НЕ за кг (берем из ценника)
    const tagWeight = parseFloat(actualWeight.value);
    const tagPrice = parseFloat(priceFromTag.value);

    if (!tagWeight || tagWeight <= 0 || !tagPrice || tagPrice <= 0) return '';

    basePricePerGram = tagPrice / tagWeight;
  } else {
    // Режим: цена за кг
    const kgPrice = parseFloat(pricePerKg.value);
    if (!kgPrice || kgPrice <= 0) return '';

    basePricePerGram = kgPrice / 1000;
  }

  // Итоговая стоимость
  return (basePricePerGram * weight).toFixed(2);
});

// Проверка: произведен ли расчет
const isCalculated = computed(() => {
  return finalCost.value !== '' && parseFloat(finalCost.value) > 0;
});
</script>

<template>
  <div class="bg-[var(--color3)] font-sans">
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
    <div class="text-center pt-8 pb-6 pt-[50px]">
      <h1 class="text-2xl font-bold text-gray-800">
        Калькулятор граммовок
      </h1>
      <p class="text-gray-500 text-sm mt-1">Рассчитайте стоимость за грамм</p>
    </div>

    <!-- Основная карточка -->
    <div class="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-6 space-y-6 relative overflow-hidden">
      
      <!-- Декоративная полоска сверху -->
      <div class="absolute top-0 left-0 w-full h-1 bg-[var(--color2)]"></div>

      <!-- 1. Цена за кг -->
      <div class="flex justify-between items-center gap-4">
        <label class="font-semibold text-gray-700 text-sm whitespace-nowrap">Цена за кг.</label>
        <div class="relative w-full max-w-[160px]">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₽</span>
          <input
            type="number"
            v-model="pricePerKg"
            class="w-full bg-gray-50 border border-gray-200 p-2.5 pl-8 rounded-xl text-right font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--color2)] focus:border-transparent transition-all placeholder-gray-400"
            placeholder="0"
            :disabled="isNotPerKg"
            :class="{ 'opacity-50 bg-gray-100 cursor-not-allowed': isNotPerKg }"
          />
        </div>
      </div>

      <!-- 2. Чекбокс (стильный переключатель) -->
      <div class="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
        <span class="font-medium text-gray-700 text-sm">Цена указана не за кг.</span>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" v-model="isNotPerKg" class="sr-only peer" />
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--color2)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color2)]"></div>
        </label>
      </div>

      <!-- 3. Данные с ценника (показываем, если чекбокс включен) -->
      <div v-if="isNotPerKg" class="animate-fade-in-up">
        <div class="text-center mb-3">
          <span class="text-xs font-bold text-[var(--color2)] uppercase tracking-wider bg-[var(--color3)] px-3 py-1 rounded-full">Данные с ценника</span>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-xs font-medium text-gray-600 block">Фактический вес</label>
            <input
              type="number"
              v-model="actualWeight"
              class="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-right font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--color2)] focus:border-transparent transition-all placeholder-gray-400"
              placeholder="г"
            />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-medium text-gray-600 block">Цена</label>
            <input
              type="number"
              v-model="priceFromTag"
              class="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-right font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--color2)] focus:border-transparent transition-all placeholder-gray-400"
              placeholder="₽"
            />
          </div>
        </div>
      </div>

      <!-- Разделитель -->
      <div class="relative py-2">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-200"></div>
        </div>
        <div class="relative flex justify-center">
          <span class="bg-white px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Итоговая стоимость</span>
        </div>
      </div>

      <!-- 4. Итоговая стоимость -->
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="text-xs font-medium text-gray-600 block">Вес</label>
          <input
            type="number"
            v-model="targetWeight"
            class="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-right font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--color2)] focus:border-transparent transition-all placeholder-gray-400"
            placeholder="г"
          />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium text-gray-600 block">Стоимость</label>
          <div
            class="w-full bg-[var(--color3)] border-2 border-[var(--color2)] p-2.5 rounded-xl text-right font-bold flex items-center justify-end h-[44px] transition-all"
            :class="{ 'opacity-100': isCalculated, 'opacity-60': !isCalculated }"
          >
            <span v-if="isCalculated" class="text-[var(--color2)] text-lg">{{ finalCost }} ₽</span>
            <span v-else class="text-gray-400 text-sm">—</span>
          </div>
        </div>
      </div>

      <!-- Подсказка -->
      <div v-if="!isCalculated && (pricePerKg || isNotPerKg)" class="text-center text-xs text-gray-400 mt-2">
        Заполните все поля для расчета
      </div>

    </div>
  </div>
</template>

<style>
/* Анимация появления блока "Данные с ценника" */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.3s ease-out forwards;
}

/* Скрываем стрелки в инпутах number */
input[type=number]::-webkit-outer-spin-button,
input[type=number]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type=number] {
  -moz-appearance: textfield;
}
</style>