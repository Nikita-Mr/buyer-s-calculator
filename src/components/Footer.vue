<script setup>
import { ref, onMounted, watch, nextTick, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const activeIndex = ref(0);
const indicatorPosition = ref({ left: '0px', width: '70px' });

// Маппинг путей к индексам
const pathToIndex = {
  '/': 0,
  '/list-products': 1,
  '/budget-planner': 2,
};

// Функция обновления активного индекса по URL
const updateActiveIndexFromRoute = () => {
  const path = route.path;
  const index = pathToIndex[path];
  if (index !== undefined) {
    activeIndex.value = index;
  }
};

// Переключение вкладки
const active = (num) => {
  activeIndex.value = num;
  updateIndicatorPosition();
  
  // Переход по маршруту
  const paths = ['/', '/list-products', '/budget-planner'];
  if (paths[num]) {
    router.push(paths[num]);
  }
};

// Обновление позиции индикатора
const updateIndicatorPosition = () => {
  nextTick(() => {
    const activeLi = document.querySelector('.navigation ul li.active');
    const indicator = document.querySelector('.indicator');
    const ul = document.querySelector('.navigation ul');

    if (activeLi && indicator && ul) {
      const liRect = activeLi.getBoundingClientRect();
      const ulRect = ul.getBoundingClientRect();
      const leftPosition = liRect.left - ulRect.left;
      const liWidth = liRect.width;

      indicator.style.left = `${leftPosition}px`;
      indicator.style.width = `${liWidth}px`;
      indicator.style.transform = 'translateX(0)';
    }
  });
};

// Следим за изменением активного индекса
watch(activeIndex, () => {
  updateIndicatorPosition();
});

// Следим за изменением маршрута (когда нажимают кнопку "Назад")
watch(() => route.path, () => {
  updateActiveIndexFromRoute();
  updateIndicatorPosition();
}, { immediate: true });

// При монтировании компонента
onMounted(() => {
  updateActiveIndexFromRoute();
  updateIndicatorPosition();

  // Обновляем позицию при изменении размера окна
  window.addEventListener('resize', updateIndicatorPosition);
});

// Очищаем обработчик
onUnmounted(() => {
  window.removeEventListener('resize', updateIndicatorPosition);
});
</script>

<template>
  <div class="footer">
    <nav class="navigation">
      <ul>
        <li
          @click="active(0)"
          class="list"
          :class="{ active: activeIndex === 0 }"
        >
          <router-link to="/">
            <span class="icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M15.5 8.25h-7c-.28 0-.5-.22-.5-.5v-1.5c0-.28.22-.5.5-.5h7c.28 0 .5.22.5.5v1.5c0 .28-.22.5-.5.5m.5 3v-1c0-.28-.22-.5-.5-.5h-1c-.28 0-.5.22-.5.5v1c0 .28.22.5.5.5h1c.28 0 .5-.22.5-.5m-6 0v-1c0-.28-.22-.5-.5-.5h-1c-.28 0-.5.22-.5.5v1c0 .28.22.5.5.5h1c.28 0 .5-.22.5-.5m3 0v-1c0-.28-.22-.5-.5-.5h-1c-.28 0-.5.22-.5.5v1c0 .28.22.5.5.5h1c.28 0 .5-.22.5-.5m3 3.25v-1c0-.28-.22-.5-.5-.5h-1c-.28 0-.5.22-.5.5v1c0 .28.22.5.5.5h1c.28 0 .5-.22.5-.5m-6 0v-1c0-.28-.22-.5-.5-.5h-1c-.28 0-.5.22-.5.5v1c0 .28.22.5.5.5h1c.28 0 .5-.22.5-.5m3 0v-1c0-.28-.22-.5-.5-.5h-1c-.28 0-.5.22-.5.5v1c0 .28.22.5.5.5h1c.28 0 .5-.22.5-.5m3 3.25v-1c0-.28-.22-.5-.5-.5h-1c-.28 0-.5.22-.5.5v1c0 .28.22.5.5.5h1c.28 0 .5-.22.5-.5m-3 0v-1c0-.28-.22-.5-.5-.5h-4c-.28 0-.5.22-.5.5v1c0 .28.22.5.5.5h4c.28 0 .5-.22.5-.5m6.25 1.75v-15c0-1.24-1.01-2.25-2.25-2.25H7c-1.24 0-2.25 1.01-2.25 2.25v15c0 1.24 1.01 2.25 2.25 2.25h10c1.24 0 2.25-1.01 2.25-2.25M17 3.75c.41 0 .75.34.75.75v15c0 .41-.34.75-.75.75H7c-.41 0-.75-.34-.75-.75v-15c0-.41.34-.75.75-.75z"
                />
              </svg>
            </span>
            <span class="text">Калькулятор</span>
          </router-link>
        </li>
        <li
          @click="active(1)"
          class="list"
          :class="{ active: activeIndex === 1 }"
        >
          <router-link to="/list-products">
            <span class="icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M11.25 18.75c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5s1.5.67 1.5 1.5m5-1.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5s1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5m4.48-9.57l-2 8a.75.75 0 0 1-.73.57H8c-.36 0-.67-.26-.74-.62L5.37 5.25H4c-.41 0-.75-.34-.75-.75s.34-.75.75-.75h2c.36 0 .67.26.74.62l.43 2.38H20a.754.754 0 0 1 .73.93m-1.69.57H7.44l1.18 6.5h8.79z"
                />
              </svg>
            </span>
            <span class="text">Список продуктов</span>
          </router-link>
        </li>
        <li
          @click="active(2)"
          class="list"
          :class="{ active: activeIndex === 2 }"
        >
          <router-link to="/budget-planner">
            <span class="icon">
              <svg
                width="32px"
                height="32px"
                viewBox="-0.5 0 25 25"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 22.9199C17.5228 22.9199 22 18.4428 22 12.9199C22 7.39707 17.5228 2.91992 12 2.91992C6.47715 2.91992 2 7.39707 2 12.9199C2 18.4428 6.47715 22.9199 12 22.9199Z"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M12.7002 17.1099V18.21C12.7002 18.3877 12.6296 18.5582 12.504 18.6838C12.3783 18.8095 12.2079 18.8799 12.0302 18.8799C11.8525 18.8799 11.6821 18.8095 11.5565 18.6838C11.4308 18.5582 11.3602 18.3877 11.3602 18.21V17.0801C10.9165 17.0072 10.4917 16.8468 10.1106 16.6082C9.72943 16.3695 9.39958 16.0573 9.14023 15.6899C9.04577 15.57 8.99311 15.4226 8.99023 15.27C8.99014 15.1834 9.00762 15.0975 9.04164 15.0178C9.07566 14.9382 9.12551 14.8662 9.18816 14.8064C9.2508 14.7466 9.32494 14.7 9.40608 14.6697C9.48723 14.6393 9.5737 14.6258 9.66023 14.6299C9.74611 14.6294 9.83102 14.648 9.90884 14.6843C9.98667 14.7206 10.0554 14.774 10.1102 14.8401C10.4301 15.258 10.8643 15.574 11.3602 15.75V13.21C10.0302 12.69 9.36023 11.9099 9.36023 10.8999C9.38027 10.3592 9.59279 9.84343 9.95949 9.44556C10.3262 9.04769 10.8229 8.79397 11.3602 8.72998V7.62988C11.3602 7.45219 11.4308 7.2819 11.5565 7.15625C11.6821 7.0306 11.8525 6.95996 12.0302 6.95996C12.2079 6.95996 12.3783 7.0306 12.504 7.15625C12.6296 7.2819 12.7002 7.45219 12.7002 7.62988V8.71997C13.0723 8.77828 13.4289 8.91103 13.7485 9.11035C14.0681 9.30967 14.3442 9.57137 14.5602 9.87988C14.6555 9.99235 14.7117 10.1329 14.7202 10.28C14.7229 10.3657 14.7083 10.451 14.6774 10.531C14.6464 10.611 14.5997 10.684 14.54 10.7456C14.4803 10.8072 14.4088 10.856 14.3298 10.8894C14.2509 10.9228 14.166 10.94 14.0802 10.9399C13.9906 10.9394 13.9022 10.9196 13.8211 10.8816C13.74 10.8436 13.668 10.7884 13.6102 10.72C13.3718 10.4221 13.0574 10.1942 12.7002 10.0601V12.3101L12.9502 12.4099C14.2202 12.9099 15.0102 13.63 15.0102 14.77C14.9954 15.3808 14.7481 15.9629 14.3189 16.3977C13.8897 16.8325 13.3108 17.0871 12.7002 17.1099ZM11.3602 11.73V10.0999C11.1988 10.1584 11.0599 10.2662 10.963 10.408C10.8662 10.5497 10.8162 10.7183 10.8202 10.8899C10.8185 11.0673 10.8688 11.2414 10.9647 11.3906C11.0607 11.5399 11.1981 11.6579 11.3602 11.73ZM13.5502 14.8C13.5502 14.32 13.2202 14.03 12.7002 13.8V15.8C12.9387 15.7639 13.156 15.6427 13.3122 15.459C13.4684 15.2752 13.553 15.0412 13.5502 14.8Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <span class="text">Бюджет</span>
          </router-link>
        </li>
        <div class="indicator"></div>
      </ul>
    </nav>
  </div>
</template>

<style scoped>
.navigation {
  position: relative;
  width: 100%;
  height: 70px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 10px 10px 0 0;
  box-shadow: 1px 1px 8px 0px #00000073;
  background: var(--color2);
}

.navigation ul {
  display: flex;
  padding: 0 15px;
  margin: 0;
  justify-content: space-between;
  width: 100%;
}

.navigation ul li {
  position: relative;
  list-style: none;
  width: 70px;
  height: 70px;
  z-index: 1;
}

.navigation ul li a {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  width: 100%;
  text-align: center;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
}

.navigation ul li a .icon {
  position: relative;
  display: block;
  line-height: 70px;
  font-size: 1.5em;
  text-align: center;
  transition: 0.5s;
  color: #b6b1b1;
}

.navigation ul li.active a .icon {
  transform: translateY(-15px);
  color: var(--color3);
}

.navigation ul li.active a .icon svg {
  color: var(--color2);
  fill: none;
}

.navigation ul li a .icon svg {
  color: var(--color3);
  fill: none;
  stroke-width: 10px;
}

.navigation ul li a .text {
  position: absolute;
  color: var(--color3);
  font-weight: 500;
  font-size: 0.75em;
  letter-spacing: 0.05em;
  transition: 0.5s;
  opacity: 0;
  transform: translateY(20px);
  text-transform: uppercase;
  font-family: 'Roboto', sans-serif;
  line-height: 10px;
}

.navigation ul li.active a .text {
  opacity: 1;
  transform: translateY(30px);
}

.indicator {
  position: absolute;
  top: -50%;
  width: 70px;
  height: 70px;
  background: #fff;
  border-radius: 50%;
  border: 1px solid var(--color3);
  transition: 0.5s;
}
</style>