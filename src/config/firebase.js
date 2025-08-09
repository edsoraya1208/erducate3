// config/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Your Firebase config (from Firebase console)
const firebaseConfig = {
  apiKey: "AIzaSyAeGIuGHEwVy8YSWw4EVJnrG8mW_Oy9mzU",
  authDomain: "test-login-93e07.firebaseapp.com",
  projectId: "test-login-93e07",
  storageBucket: "test-login-93e07.firebasestorage.app",
  messagingSenderId: "474856125810",
  appId: "1:474856125810:web:5b68c13345b59badc019eb",
  measurementId: "G-SC7CWEBPHC"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Toggle: set to true when you want to use local emulator, false for real Firebase
const USE_EMULATORS = false;

if (USE_EMULATORS) {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
}
