import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '../config/firebase'

export const signUp = async (email, password, name, role) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  
  // Store additional user data in Firestore
  await setDoc(doc(db, 'users', userCredential.user.uid), {
    name,
    email,
    role,
    createdAt: new Date().toISOString()
  })
  
  return userCredential
}

export const signIn = async (email, password) => {
  return await signInWithEmailAndPassword(auth, email, password)
}

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider()
  return await signInWithPopup(auth, provider)
}

export const logOut = async () => {
  return await signOut(auth)
}

export const getUserRole = async (uid) => {
  const userDoc = await getDoc(doc(db, 'users', uid))
  return userDoc.exists() ? userDoc.data().role : null
}