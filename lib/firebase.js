import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyANQCj-kSQAn3VBF3vIMijVSKFwIED8PIU",
  authDomain: "fs-inventario.firebaseapp.com",
  databaseURL: "https://fs-inventario-default-rtdb.firebaseio.com",
  projectId: "fs-inventario",
  storageBucket: "fs-inventario.firebasestorage.app",
  messagingSenderId: "142764541039",
  appId: "1:142764541039:web:6e326c56f30231d906399a"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);