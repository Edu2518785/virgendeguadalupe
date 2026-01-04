// src/services/firebase.jsx

import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBE5GdV0qRovFDvwKWlUddPVR9dS_1YoNw",
  authDomain: "virgendeguadalupe-c2e7e.firebaseapp.com",
  projectId: "virgendeguadalupe-c2e7e",
  storageBucket: "virgendeguadalupe-c2e7e.firebasestorage.app",
  messagingSenderId: "268086248052",
  appId: "1:268086248052:web:91206587d599f69e6fc721",
  measurementId: "G-MBS7FQWV15"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export const loginFirebaseUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error(error.code, error.message);
    return null;
  }
};

export const registerUserByDNI = async (dni, password) => {
  try {
    const q = query(collection(db, "asociados"), where("dni", "==", dni));
    const snap = await getDocs(q);
    if (snap.empty) return null;

    const email = dni + "@virgendeguadalupe.com";
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error(error.code, error.message);
    return null;
  }
};
