import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

// Import the functions you need from the SDKs you need

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDlMdpAmwE2VpWKUpwrf4-gtMF0DcNthN0',
  authDomain: 'calculator-bdb62.firebaseapp.com',
  projectId: 'calculator-bdb62',
  storageBucket: 'calculator-bdb62.firebasestorage.app',
  messagingSenderId: '365673331483',
  appId: '1:365673331483:web:930c457ce432dbfec831be',
};

// Initialize Firebase

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
