// Firebase core
import { initializeApp } from "firebase/app";

// Firestore (para DNI)
import { getFirestore } from "firebase/firestore";

// Auth (lo usaremos después)
import { getAuth } from "firebase/auth";

// 🔥 TU CONFIG (tal cual la copiaste)
const firebaseConfig = {
  apiKey: "AIzaSyBE5GdV0qRovFDvwKWlUddPVR9dS_1YoNw",
  authDomain: "virgendeguadalupe-c2e7e.firebaseapp.com",
  projectId: "virgendeguadalupe-c2e7e",
  storageBucket: "virgendeguadalupe-c2e7e.firebasestorage.app",
  messagingSenderId: "268086248052",
  appId: "1:268086248052:web:91206587d599f69e6fc721",
  measurementId: "G-MBS7FQWV15"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Exportamos lo que usaremos
export const db = getFirestore(app);
export const auth = getAuth(app);

// (Analytics NO es necesario ahora)
