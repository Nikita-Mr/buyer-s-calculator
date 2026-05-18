<script setup>
import { ref, computed } from 'vue';

// Режим: один товар или несколько
const mode = ref('single'); // 'single' | 'multiple'

// --- Данные для режима "Один товар" ---
const singlePrice = ref('');
const singleDiscountPrice = ref('');
const singleDiscountPercent = ref('');

// --- Данные для режима "Несколько товаров" ---
const items = ref([
  { id: 1, name: '', price: '' },
  { id: 2, name: '', price: '' },
]);
const totalDiscountPrice = ref(''); // Общая цена со скидкой для нескольких товаров
const totalDiscountPercent = ref(''); // Общий процент скидки для нескольких товаров

// --- Результаты для одного товара ---
const singleResult = computed(() => {
  const price = parseFloat(singlePrice.value);
  const discPrice = parseFloat(singleDiscountPrice.value);
  const discPercent = parseFloat(singleDiscountPercent.value);

  if (price > 0 && discPrice > 0) {
    const savings = price - discPrice;
    const percent = (savings / price) * 100;
    return {
      savings: savings.toFixed(2),
      percent: percent.toFixed(2),
      finalPrice: discPrice.toFixed(2),
      originalPrice: price.toFixed(2),
    };
  }

  if (price > 0 && discPercent > 0) {
    const savings = price * (discPercent / 100);
    const finalPrice = price - savings;
    return {
      savings: savings.toFixed(2),
      percent: discPercent.toFixed(2),
      finalPrice: finalPrice.toFixed(2),
      originalPrice: price.toFixed(2),
    };
  }

  return null;
});

// --- Результаты для нескольких товаров ---
const multipleResult = computed(() => {
  const validItems = items.value.filter((item) => {
    const price = parseFloat(item.price);
    return price > 0;
  });

  if (validItems.length === 0) return null;

  const totalPrice = validItems.reduce(
    (sum, item) => sum + parseFloat(item.price),
    0
  );
  const discPrice = parseFloat(totalDiscountPrice.value);
  const discPercent = parseFloat(totalDiscountPercent.value);

  // Если введена цена со скидкой для всей покупки
  if (discPrice > 0) {
    const savings = totalPrice - discPrice;
    const percent = (savings / totalPrice) * 100;
    return {
      totalPrice: totalPrice.toFixed(2),
      finalPrice: discPrice.toFixed(2),
      savings: savings.toFixed(2),
      percent: percent.toFixed(2),
      itemCount: validItems.length,
      items: validItems,
    };
  }

  // Если введен процент скидки для всей покупки
  if (discPercent > 0) {
    const savings = totalPrice * (discPercent / 100);
    const finalPrice = totalPrice - savings;
    return {
      totalPrice: totalPrice.toFixed(2),
      finalPrice: finalPrice.toFixed(2),
      savings: savings.toFixed(2),
      percent: discPercent.toFixed(2),
      itemCount: validItems.length,
      items: validItems,
    };
  }

  // Если цена со скидкой и процент не введены - показываем только сумму
  return {
    totalPrice: totalPrice.toFixed(2),
    finalPrice: null,
    savings: null,
    percent: null,
    itemCount: validItems.length,
    items: validItems,
  };
});

// --- Функции для управления списком товаров ---
const addItem = () => {
  const maxId = items.value.reduce((max, item) => Math.max(max, item.id), 0);
  items.value.push({
    id: maxId + 1,
    name: '',
    price: '',
  });
};

const removeItem = (index) => {
  if (items.value.length <= 1) {
    alert('Должен быть хотя бы 1 товар');
    return;
  }
  items.value.splice(index, 1);
};

// --- Сброс полей при переключении режима ---
const resetFields = () => {
  singlePrice.value = '';
  singleDiscountPrice.value = '';
  singleDiscountPercent.value = '';
  items.value = [
    { id: 1, name: '', price: '' },
    { id: 2, name: '', price: '' },
  ];
  totalDiscountPrice.value = '';
  totalDiscountPercent.value = '';
};

// --- Форматирование цены ---
const formatPrice = (price) => {
  if (!price) return '—';
  return parseFloat(price).toFixed(2) + ' ₽';
};
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
          fill="#ffffff"
        />
      </svg>
    </button>

    <!-- Заголовок -->
    <div class="text-center pt-8 pb-6">
      <h1 class="text-2xl font-bold text-gray-800">Расчет скидки</h1>
      <p class="text-gray-500 text-sm mt-1">
        Рассчитайте скидку на один или несколько товаров
      </p>
    </div>

    <!-- Основная карточка -->
    <div
      class="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-5 space-y-4 relative overflow-hidden"
    >
      <!-- Декоративная полоска сверху -->
      <div class="absolute top-0 left-0 w-full h-1 bg-[var(--color2)]"></div>

      <!-- Переключатель режимов -->
      <div class="flex bg-gray-100 rounded-xl p-1 mb-2">
        <button
          @click="
            mode = 'single';
            resetFields();
          "
          class="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
          :class="
            mode === 'single'
              ? 'bg-white shadow-sm text-[var(--color2)]'
              : 'text-gray-600 hover:text-gray-900'
          "
        >
          Один товар
        </button>
        <button
          @click="
            mode = 'multiple';
            resetFields();
          "
          class="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
          :class="
            mode === 'multiple'
              ? 'bg-white shadow-sm text-[var(--color2)]'
              : 'text-gray-600 hover:text-gray-900'
          "
        >
          Несколько товаров
        </button>
      </div>

      <!-- === РЕЖИМ: ОДИН ТОВАР === -->
      <div v-if="mode === 'single'" class="space-y-4">
        <div class="text-center mb-2">
          <span
            class="text-xs font-bold text-[var(--color2)] uppercase tracking-wider bg-[var(--color3)] px-3 py-1 rounded-full"
          >
            Один товар
          </span>
        </div>

        <div class="grid grid-cols-1 gap-3">
          <!-- Цена товара -->
          <div>
            <label class="text-xs font-medium text-gray-600 block mb-1"
              >Цена товара</label
            >
            <div class="relative">
              <span
                class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold"
                >₽</span
              >
              <input
                type="number"
                v-model="singlePrice"
                class="w-full bg-gray-50 border border-gray-200 p-2.5 pl-8 rounded-xl text-right font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--color2)] focus:border-transparent transition-all placeholder-gray-400"
                placeholder="0"
              />
            </div>
          </div>

          <!-- Цена со скидкой -->

          <div>
            <label class="text-xs font-medium text-gray-600 block mb-1"
              >Процент скидки</label
            >
            <div class="relative">
              <input
                type="number"
                v-model="singleDiscountPercent"
                class="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-right font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--color2)] focus:border-transparent transition-all placeholder-gray-400"
                placeholder="0"
              />
              <span
                class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold"
                >%</span
              >
            </div>
          </div>

          <!-- ИЛИ разделитель -->
          <div class="relative py-1">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-200"></div>
            </div>
            <div class="relative flex justify-center">
              <span class="bg-white px-3 text-xs text-gray-400">или</span>
            </div>
          </div>

          <!-- Процент скидки -->
          <div>
            <label class="text-xs font-medium text-gray-600 block mb-1"
              >Цена со скидкой</label
            >
            <div class="relative">
              <span
                class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold"
                >₽</span
              >
              <input
                type="number"
                v-model="singleDiscountPrice"
                class="w-full bg-gray-50 border border-gray-200 p-2.5 pl-8 rounded-xl text-right font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--color2)] focus:border-transparent transition-all placeholder-gray-400"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <!-- Результаты для одного товара -->
        <div v-if="singleResult" class="mt-4 pt-4 border-t border-gray-100">
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-gray-50 rounded-xl p-3 text-center">
              <div class="text-xs text-gray-500">Цена со скидкой</div>
              <div class="text-lg font-bold text-[var(--color2)]">
                {{ singleResult.finalPrice }} ₽
              </div>
            </div>
            <div class="bg-gray-50 rounded-xl p-3 text-center">
              <div class="text-xs text-gray-500">Вы экономите</div>
              <div class="text-lg font-bold text-green-600">
                {{ singleResult.savings }} ₽
              </div>
            </div>
          </div>
          <div class="mt-2 text-center text-sm text-gray-600">
            Скидка: <span class="font-bold">{{ singleResult.percent }}%</span>
          </div>
          <div class="mt-1 text-center text-xs text-gray-400">
            Оригинальная цена: {{ singleResult.originalPrice }} ₽
          </div>
        </div>

        <div
          v-else-if="
            singlePrice && !singleDiscountPrice && !singleDiscountPercent
          "
          class="text-center text-xs text-gray-400 mt-2"
        >
          Введите цену со скидкой или процент скидки
        </div>
      </div>

      <!-- === РЕЖИМ: НЕСКОЛЬКО ТОВАРОВ === -->
      <div v-if="mode === 'multiple'" class="space-y-3">
        <div class="text-center mb-2">
          <span
            class="text-xs font-bold text-[var(--color2)] uppercase tracking-wider bg-[var(--color3)] px-3 py-1 rounded-full"
          >
            Несколько товаров
          </span>
        </div>

        <!-- Список товаров -->
        <div
          v-for="(item, index) in items"
          :key="item.id"
          class="flex gap-2 items-start"
        >
          <div class="flex-1 grid grid-cols-2 gap-2">
            <div>
              <input
                v-model="item.name"
                type="text"
                placeholder="Название"
                class="w-full bg-gray-50 border border-gray-200 p-2 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[var(--color2)] focus:border-transparent placeholder-gray-400"
              />
            </div>
            <div class="relative">
              <span
                class="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
                >₽</span
              >
              <input
                type="number"
                v-model="item.price"
                class="w-full bg-gray-50 border border-gray-200 p-2 pl-5 rounded-lg text-right text-sm font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-[var(--color2)] focus:border-transparent placeholder-gray-400"
                placeholder="0"
              />
            </div>
          </div>
          <button
            @click="removeItem(index)"
            class="text-gray-400 hover:text-red-500 transition-colors"
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
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Кнопка добавления товара -->
        <button
          @click="addItem"
          class="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-[var(--color2)] hover:text-[var(--color2)] transition-all flex items-center justify-center gap-1 text-sm font-medium"
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
            <path d="M12 5v14M5 12h14" />
          </svg>
          Добавить товар
        </button>


        <!-- Поле для ввода общего процента скидки -->
        <div class="mt-2">
          <label class="text-xs font-medium text-gray-600 block mb-1"
            >Общий процент скидки</label
          >
          <div class="relative">
            <input
              type="number"
              v-model="totalDiscountPercent"
              class="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-right font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--color2)] focus:border-transparent transition-all placeholder-gray-400"
              placeholder="0"
            />
            <span
              class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold"
              >%</span
            >
          </div>
        </div>

        <!-- Результаты для нескольких товаров -->
        <div
          v-if="multipleResult && multipleResult.finalPrice !== null"
          class="mt-4 pt-4 border-t border-gray-100"
        >
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-[var(--color3)] rounded-xl p-3 text-center">
              <div class="text-xs text-gray-500">Общая сумма без скидки</div>
              <div class="text-lg font-bold text-gray-800">
                {{ multipleResult.totalPrice }} ₽
              </div>
            </div>
            <div class="bg-[var(--color3)] rounded-xl p-3 text-center">
              <div class="text-xs text-gray-500">Вы экономите</div>
              <div class="text-lg font-bold text-green-600">
                {{ multipleResult.savings }} ₽
              </div>
            </div>
          </div>
          <div class="mt-2 text-center">
            <div class="text-sm text-gray-600">
              Скидка:
              <span class="font-bold text-[var(--color2)]"
                >{{ multipleResult.percent }}%</span
              >
            </div>
            <div class="text-sm text-gray-600">
              Итоговая цена со скидкой:
              <span class="font-bold">{{ multipleResult.finalPrice }} ₽</span>
            </div>
            <div class="text-xs text-gray-400 mt-1">
              Товаров: {{ multipleResult.itemCount }}
            </div>
          </div>
        </div>

        <div
          v-else-if="multipleResult && multipleResult.finalPrice === null"
          class="text-center text-xs text-gray-400 mt-2"
        >
          Введите общую цену со скидкой или процент скидки для расчета
        </div>

        <div
          v-else-if="items.some((item) => item.price)"
          class="text-center text-xs text-gray-400 mt-2"
        >
          Заполните цены для всех товаров
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Скрываем стрелки в инпутах number */
input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type='number'] {
  -moz-appearance: textfield;
}
</style>
