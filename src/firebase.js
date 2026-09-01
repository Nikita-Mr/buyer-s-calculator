import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyDlMdpAmwE2VpWKUpwrf4-gtMF0DcNthN0',
  authDomain: 'calculator-bdb62.firebaseapp.com',
  projectId: 'calculator-bdb62',
  storageBucket: 'calculator-bdb62.firebasestorage.app',
  messagingSenderId: '365673331483',
  appId: '1:365673331483:web:930c457ce432dbfec831be',
};

const app = initializeApp(firebaseConfig);

// Просто используем getFirestore
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

// Включаем офлайн-режим
enableIndexedDbPersistence(db)
  .then(() => console.log('🔥 Офлайн-режим Firestore включён'))
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.log('ℹ️ Офлайн-режим уже был включён');
    } else {
      console.error('❌ Ошибка включения офлайн-режима:', err);
    }
  });