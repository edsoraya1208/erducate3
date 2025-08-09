// config/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

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

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Connect to emulators in development (localhost only)
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  // Only connect if not already connected
  if (!auth._authDomain?.includes('localhost')) {
    connectAuthEmulator(auth, 'http://localhost:9099');
  }
  if (!db._delegate?._databaseId?.projectId?.includes('demo-')) {
    connectFirestoreEmulator(db, 'localhost', 8080);
  }
}