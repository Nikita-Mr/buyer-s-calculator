import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import "./assets/main.css"
import { Icon } from '@iconify/vue'
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

// Проверка соединения с Firebase
async function checkFirebase() {
  try {
    const test = await getDocs(collection(db, 'test'));
    console.log('✅ Firebase работает! Документов в test:', test.size);
  } catch (error) {
    console.error('❌ Ошибка Firebase:', error);
  }
}
const app = createApp(App)

app.use(router)
app.component('UIcon', Icon)
app.mount('#app')
setTimeout(checkFirebase, 2000);