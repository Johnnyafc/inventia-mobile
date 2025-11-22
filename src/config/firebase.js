// src/config/firebase.js
import { initializeApp } from 'firebase/app';
// Imports de Autenticación con soporte híbrido
import { initializeAuth, getAuth, getReactNativePersistence, browserLocalPersistence } from 'firebase/auth';
// Base de datos Firestore (si la usas para usuarios)
import { getFirestore } from 'firebase/firestore';
// Base de datos Realtime (DÓNDE TIENES TU INVENTARIO)
import { getDatabase } from 'firebase/database';
// Almacenamiento local para el celular
import AsyncStorage from '@react-native-async-storage/async-storage';
// Para detectar si es Web o Celular
import { Platform } from 'react-native';

// TUS CREDENCIALES REALES
const firebaseConfig = {
  apiKey: "AIzaSyBMn7bETAXB3hfSec8DnPaXLyPnXD6Z-i8",
  authDomain: "emprendimiento-7d2bc.firebaseapp.com",
  projectId: "emprendimiento-7d2bc",
  storageBucket: "emprendimiento-7d2bc.firebasestorage.app",
  messagingSenderId: "480105153534",
  appId: "1:480105153534:web:ffdcc3b8b3e97a08b236af",
  measurementId: "G-2E1ZKD02SN",
  databaseURL: "https://emprendimiento-7d2bc-default-rtdb.firebaseio.com"
};

// 1. Inicializamos la App
const app = initializeApp(firebaseConfig);

// 2. Configuración Inteligente de Autenticación
let auth;

if (Platform.OS === 'web') {
  // Si estamos en el navegador (Chrome/Edge), usamos persistencia web normal
  auth = getAuth(app);
  auth.setPersistence(browserLocalPersistence);
} else {
  // Si estamos en el celular (Android/iOS), usamos AsyncStorage
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } catch (e) {
    // Si falla (por reinicio rápido), recuperamos la instancia existente
    auth = getAuth(app);
  }
}

// 3. Inicializamos las bases de datos
const db = getFirestore(app); // Firestore
const database = getDatabase(app); // Realtime Database (Importante para tu inventario)

// 4. Exportamos todo para usarlo en la app
export { auth, db, database };