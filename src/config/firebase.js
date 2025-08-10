// config/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAeGIuGHEwVy8YSWw4EVJnrG8mW_Oy9mzU",
  authDomain: "test-login-93e07.firebaseapp.com",
  projectId: "test-login-93e07",
  storageBucket: "test-login-93e07.firebasestorage.app",
  messagingSenderId: "474856125810",
  appId: "1:474856125810:web:5b68c13345b59badc019eb",
  measurementId: "G-SC7CWEBPHC"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const storage = getStorage(app);

// Better approach: use environment or hostname detection
const USE_EMULATORS = process.env.NODE_ENV === 'development' || 
                     window.location.hostname === 'localhost';

if (USE_EMULATORS) {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('Connected to Firebase emulators');
  } catch (error) {
    console.log('Emulator connection failed:', error);
  }
}