<script setup>
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue';

// Бюджет
const budgetData = reactive({
  amount: '',
  endDate: '',
});

import { db } from '@/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';

const roomId = localStorage.getItem('roomId');

// Добавьте функцию синхронизации бюджета
const syncBudgetToFirebase = async () => {
  if (!roomId) return;
  try {
    const dataToSync = {
      amount: parseFloat(budgetData.amount) || 0,
      endDate: budgetData.endDate || null,
      expenses: expenses.value,
    };
    await updateDoc(doc(db, 'rooms', roomId), {
      budget: dataToSync,
    });
    console.log('✅ Бюджет синхронизирован с Firebase');
  } catch (e) {
    console.error('❌ Ошибка синхронизации бюджета:', e);
  }
};

// Список расходов (загружаем из localStorage)
const expenses = ref([]);
const newExpense = reactive({
  name: '',
  amount: '',
  date: new Date().toISOString().slice(0, 10),
});

// Расходы за выбранный период
const currentPeriodExpenses = computed(() => {
  if (!budgetData.endDate) return expenses.value;
  const endDate = new Date(budgetData.endDate);
  return expenses.value.filter((exp) => new Date(exp.date) <= endDate);
});

// Общая сумма расходов
const totalSpent = computed(() => {
  return currentPeriodExpenses.value.reduce(
    (sum, exp) => sum + parseFloat(exp.amount || 0),
    0
  );
});

// Остаток бюджета
const remainingBudget = computed(() => {
  const budget = parseFloat(budgetData.amount) || 0;
  return budget - totalSpent.value;
});

// Дневной лимит
const dailyLimit = computed(() => {
  const budget = parseFloat(budgetData.amount) || 0;
  if (!budgetData.endDate) return 0;
  const endDate = new Date(budgetData.endDate);
  const startDate = new Date();
  const daysRemaining = Math.max(
    1,
    Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
  );
  return (remainingBudget.value / daysRemaining).toFixed(2);
});

// Процент использования бюджета
const budgetPercent = computed(() => {
  const budget = parseFloat(budgetData.amount) || 0;
  if (budget === 0) return 0;
  return Math.min(100, (totalSpent.value / budget) * 100);
});

// Добавление ручного расхода
const addExpense = () => {
  if (!newExpense.name || !newExpense.amount) {
    alert('Заполните название и сумму');
    return;
  }
  expenses.value.push({
    id: Date.now(),
    name: newExpense.name,
    amount: parseFloat(newExpense.amount),
    date: newExpense.date,
  });
  saveExpenses();
  newExpense.name = '';
  newExpense.amount = '';
};

// Удаление расхода
const deleteExpense = (id) => {
  expenses.value = expenses.value.filter((exp) => exp.id !== id);
  saveExpenses();
};

// Сохранение расходов
const saveExpenses = () => {
  localStorage.setItem('budgetExpenses', JSON.stringify(expenses.value));
  syncBudgetToFirebase();
};

// Загрузка данных (включая расходы из истории)
const loadData = () => {
  // Загружаем расходы из localStorage
  const savedExpenses = localStorage.getItem('budgetExpenses');
  if (savedExpenses) {
    expenses.value = JSON.parse(savedExpenses);
  }

  // Загружаем бюджет из localStorage
  const savedBudget = localStorage.getItem('budgetData');
  if (savedBudget) {
    const parsed = JSON.parse(savedBudget);
    budgetData.amount = parsed.amount || '';
    budgetData.endDate = parsed.endDate || '';
  }
};

// Сброс бюджета
const resetBudget = () => {
  budgetData.amount = '';
  budgetData.endDate = '';
  expenses.value = [];
  localStorage.removeItem('budgetExpenses');
  localStorage.removeItem('budgetData');
};

// Сохранение бюджета при изменении
const saveBudget = () => {
  localStorage.setItem('budgetData', JSON.stringify(budgetData));
  syncBudgetToFirebase();
};

// Форматирование даты
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const editExpense = (exp) => {
  const newAmount = prompt('Введите сумму:', exp.amount);
  if (newAmount !== null && !isNaN(parseFloat(newAmount))) {
    exp.amount = parseFloat(newAmount);
    exp.unrated = false;
    saveExpenses();
  }
};

// Предустановленные суммы
const quickAmounts = [500, 1000, 2000, 3000, 5000, 10000];

onMounted(() => {
  loadData();

  if (roomId) {
    const unsubscribe = onSnapshot(doc(db, 'rooms', roomId), (docSnapshot) => {
      console.log('📡 Получены данные из Firebase:', docSnapshot.data());
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        if (data.budget) {
          console.log('💰 Бюджет получен:', data.budget);
          // Обновляем локальные данные
          budgetData.amount = data.budget.amount || '';
          budgetData.endDate = data.budget.endDate || '';
          expenses.value = data.budget.expenses || [];
          localStorage.setItem('budgetData', JSON.stringify(data.budget));
          localStorage.setItem(
            'budgetExpenses',
            JSON.stringify(data.budget.expenses || [])
          );
        }
      }
    });

    // Отписываемся при размонтировании
    onUnmounted(() => {
      if (unsubscribe) unsubscribe();
    });
  }
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
    <div class="text-center pt-8 pb-6 px-4">
      <h1 class="text-2xl font-bold text-gray-800">Планировщик бюджета</h1>
      <p class="text-gray-500 text-sm mt-1">Контролируйте свои расходы</p>
    </div>

    <!-- Основная карточка -->
    <div
      class="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-5 space-y-4 relative overflow-hidden"
    >
      <!-- Декоративная полоска сверху -->
      <div class="absolute top-0 left-0 w-full h-1 bg-[var(--color2)]"></div>

      <!-- Настройка бюджета -->
      <div class="space-y-3">
        <div>
          <label class="text-sm font-medium text-gray-600 block mb-1.5"
            >Сумма бюджета</label
          >
          <div class="relative">
            <span
              class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base font-bold"
              >₽</span
            >
            <input
              type="number"
              v-model="budgetData.amount"
              @change="saveBudget"
              class="w-full bg-gray-50 border border-gray-200 p-4 pl-10 rounded-xl text-right text-lg font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--color2)] placeholder-gray-400"
              placeholder="0"
              inputmode="numeric"
            />
          </div>
          <div class="flex gap-2 mt-2 overflow-x-auto pb-1">
            <button
              v-for="amount in quickAmounts"
              :key="amount"
              @click="
                budgetData.amount = amount;
                saveBudget();
              "
              class="flex-shrink-0 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-[var(--color2)] hover:text-[var(--color2)] transition-colors"
            >
              {{ amount }} ₽
            </button>
          </div>
        </div>

        <div>
          <label class="text-sm font-medium text-gray-600 block mb-1.5"
            >Дата окончания</label
          >
          <input
            type="date"
            v-model="budgetData.endDate"
            @change="saveBudget"
            class="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--color2)]"
          />
        </div>
      </div>

      <!-- Статистика бюджета -->
      <div
        v-if="budgetData.amount && budgetData.endDate"
        class="mt-2 p-4 bg-[var(--color3)] rounded-xl space-y-3"
      >
        <div class="flex justify-between items-center text-base">
          <span class="text-gray-600">Бюджет</span>
          <span class="font-bold text-gray-800 text-lg"
            >{{ parseFloat(budgetData.amount).toFixed(0) }} ₽</span
          >
        </div>
        <div class="flex justify-between items-center text-base">
          <span class="text-gray-600">Потрачено</span>
          <span class="font-bold text-gray-800 text-lg"
            >{{ totalSpent.toFixed(0) }} ₽</span
          >
        </div>
        <div class="flex justify-between items-center text-base">
          <span class="text-gray-600">Осталось</span>
          <span
            :class="
              remainingBudget >= 0
                ? 'text-green-600 font-bold text-lg'
                : 'text-red-600 font-bold text-lg'
            "
          >
            {{ remainingBudget.toFixed(0) }} ₽
          </span>
        </div>
        <div class="flex justify-between items-center text-base">
          <span class="text-gray-600">Дневной лимит</span>
          <span class="font-bold text-[var(--color2)] text-lg"
            >{{ dailyLimit }} ₽/день</span
          >
        </div>

        <div class="mt-2">
          <div class="w-full bg-gray-200 rounded-full h-3">
            <div
              class="h-3 rounded-full transition-all duration-300"
              :class="
                budgetPercent > 80
                  ? 'bg-red-500'
                  : budgetPercent > 50
                  ? 'bg-yellow-500'
                  : 'bg-[var(--color2)]'
              "
              :style="{ width: Math.min(100, budgetPercent) + '%' }"
            ></div>
          </div>
          <div class="text-xs text-gray-400 text-right mt-1">
            {{ budgetPercent.toFixed(1) }}% использовано
          </div>
        </div>
      </div>

      <!-- Добавление расхода -->
      <div class="border-t border-gray-100 pt-4">
        <h3 class="text-base font-bold text-gray-700 mb-3">Добавить расход</h3>
        <div class="space-y-3">
          <input
            type="text"
            v-model="newExpense.name"
            placeholder="Название траты"
            class="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--color2)] placeholder-gray-400"
          />
          <div class="flex gap-3">
            <div class="flex-1 relative">
              <span
                class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold"
                >₽</span
              >
              <input
                type="number"
                v-model="newExpense.amount"
                class="w-full bg-gray-50 border border-gray-200 p-4 pl-10 rounded-xl text-right text-lg font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--color2)] placeholder-gray-400"
                placeholder="0"
                inputmode="numeric"
              />
            </div>
            <button
              @click="addExpense"
              class="bg-[var(--color2)] text-white px-6 rounded-xl font-bold text-base hover:opacity-90 transition-opacity min-h-[56px]"
            >
              Добавить
            </button>
          </div>
        </div>
      </div>

      <!-- Список расходов (включая те, что из истории) -->
      <div v-if="expenses.length > 0" class="border-t border-gray-100 pt-4">
        <h3 class="text-base font-bold text-gray-700 mb-3">Ваши расходы</h3>
        <div class="space-y-2 max-h-60 overflow-y-auto">
          <div
            v-for="exp in expenses"
            :key="exp.id"
            class="flex justify-between items-center p-3.5 bg-gray-50 rounded-xl"
          >
            <div>
              <div @click="editExpense(exp)" class="text-base font-medium text-gray-800">
                {{ exp.name }}
                <span v-if="exp.unrated" class="text-xs text-orange-500 ml-2">
                  (не оценено)
                </span>
              </div>
              <div class="text-xs text-gray-400">
                {{ formatDate(exp.date) }}
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span
                v-if="!exp.unrated"
                class="font-bold text-gray-800 text-base"
              >
                {{ exp.amount.toFixed(0) }} ₽
              </span>
              <span v-else class="text-orange-500 text-sm"> ? </span>
              <button
                @click="deleteExpense(exp.id)"
                class="text-gray-400 hover:text-red-500 transition-colors p-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Кнопка сброса -->
      <button
        @click="resetBudget"
        class="w-full py-4 border border-gray-200 rounded-xl text-gray-500 hover:text-red-500 hover:border-red-200 transition-all text-base font-medium"
      >
        Сбросить бюджет
      </button>
    </div>
  </div>
</template>

<style scoped>
input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type='number'] {
  -moz-appearance: textfield;
}

input,
select,
button {
  min-height: 40px;
}

.overflow-x-auto::-webkit-scrollbar {
  display: none;
}
.overflow-x-auto {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
