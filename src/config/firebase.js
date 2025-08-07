// config/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAeGIuGHEwVy8YSWw4EVJnrG8mW_Oy9mzU",
  authDomain: "test-login-93e07.firebaseapp.com",
  projectId: "test-login-93e07",
  storageBucket: "test-login-93e07.firebasestorage.app",
  messagingSenderId: "474856125810",
  appId: "1:474856125810:web:5b68c13345b59badc019eb",
  measurementId: "G-SC7CWEBPHC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services and EXPORT them
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider(); // Add this
