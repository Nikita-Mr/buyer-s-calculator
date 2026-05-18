// budgetStore.js
import { ref } from 'vue';

export const budgetStore = ref({
  expenses: [],
  budgetAmount: 0,
  endDate: ''
});

export const addExpenseToBudget = (name, amount) => {
  budgetStore.value.expenses.push({
    id: Date.now(),
    name: name,
    amount: amount,
    date: new Date().toISOString().slice(0, 10)
  });
  // Сохраняем в localStorage
  localStorage.setItem('budgetExpenses', JSON.stringify(budgetStore.value.expenses));
};