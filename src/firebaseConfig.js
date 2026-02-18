// ============================================
// 🔥 FIREBASE CONFIG
// ============================================

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAbKTQTr5FyPTgXHfAocz4Newi1VFk1y8o",
  authDomain: "intellitech-app.firebaseapp.com",
  projectId: "intellitech-app",
  storageBucket: "intellitech-app.firebasestorage.app",
  messagingSenderId: "835740887277",
  appId: "1:835740887277:web:789a28ec48f96cb6cd84e4",
  measurementId: "G-KPGMF4PBQ3",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
