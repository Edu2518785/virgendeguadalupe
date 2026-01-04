// Firebase core
import { initializeApp } from "firebase/app";

// Firestore
import { getFirestore, collection, addDoc, getDocs, query, where } from "firebase/firestore";

// Auth
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

// 🔥 Configuración de tu proyecto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBE5GdV0qRovFDvwKWlUddPVR9dS_1YoNw",
  authDomain: "virgendeguadalupe-c2e7e.firebaseapp.com",
  projectId: "virgendeguadalupe-c2e7e",
  storageBucket: "virgendeguadalupe-c2e7e.firebasestorage.app",
  messagingSenderId: "268086248052",
  appId: "1:268086248052:web:91206587d599f69e6fc721",
  measurementId: "G-MBS7FQWV15"
};

// Inicializamos Firebase
const app = initializeApp(firebaseConfig);

// Exportamos Firestore y Auth
export const db = getFirestore(app);
export const auth = getAuth(app);

// -----------------------------
// Función de login con Firebase Auth
// -----------------------------
export const loginFirebaseUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Usuario autenticado Firebase:", userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error("Error al autenticar Firebase:", error.code, error.message);
    return null;
  }
};

// -----------------------------
// Funciones auxiliares para Firestore (opcional)
// -----------------------------
export const getAsociadoByDNI = async (dni) => {
  const q = query(collection(db, "asociados"), where("dni", "==", dni));
  const snap = await getDocs(q);
  return snap.empty ? null : snap.docs[0].data();
};

export const getUsuarioByDNI = async (dni) => {
  const q = query(collection(db, "usuariosNuevos"), where("dni", "==", dni));
  const snap = await getDocs(q);
  return snap.empty ? null : snap.docs[0].data();
};
