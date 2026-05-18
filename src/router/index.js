import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/CalculatorPage.vue'),
    },
    {
      path: '/price-for-gramm',
      name: 'priceForGramm',
      component: () => import('@/views/PriceForGramm.vue'),
    },
    {
      path: '/list-products',
      name: 'ListOfProducts',
      component: () => import('@/views/ListOfProducts.vue'),
    },
    {
      path: '/compare-prices',
      name: 'ComparePrices',
      component: () => import('@/views/ComparePrices.vue'),
    },
    {
      path: '/discount-calculator',
      name: 'DiscountCalculator',
      component: () => import('@/views/DiscountCalculator.vue'),
    },
    {
      path: '/budget-planner',
      name: 'BudgetPlanner',
      component: () => import('@/views/BudgetPlanner.vue'),
    },
  ],
});

export default router;
