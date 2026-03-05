import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAbKTQTr5FyPTgXHfAocz4Newi1VFk1y8o",
  authDomain: "intellitech-app.firebaseapp.com",
  projectId: "intellitech-app",
  storageBucket: "intellitech-app.appspot.com",
  messagingSenderId: "835740887277",
  appId: "1:835740887277:web:789a28ec48f96cb6cd84e4",
};

export const app = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Secondary auth para crear usuarios sin desloguear admin
export const secondaryApp =
  getApps().find((a) => a.name === "Secondary") ||
  initializeApp(firebaseConfig, "Secondary");
export const secondaryAuth = getAuth(secondaryApp);
