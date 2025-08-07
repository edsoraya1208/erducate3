import { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';

// Import necessary Firebase functions
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

/**
 * LoginForm Component
 * @param {object} props - The component props.
 * @param {object} props.auth - The Firebase Auth instance.
 * @param {object} props.db - The Firestore instance.
 * @param {function} props.setMessage - A function to display messages to the user.
 * @param {object} props.googleProvider - The Firebase GoogleAuthProvider instance.
 */
const LoginForm = ({ auth, db, setMessage, googleProvider }) => {
  // Form state management
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle form submission with role-based logic (email/password)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); // Clear any previous messages

    if (!auth || !db) {
      setMessage('Firebase not initialized. Please refresh.', 'error');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('User role:', userData.role);

        if (userData.role === 'lecturer') {
          window.location.href = '/lecturer-dashboard';
        } else {
          window.location.href = '/student-dashboard';
        }
      } else {
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          role: 'student',
          createdAt: new Date()
        });
        window.location.href = '/student-dashboard';
      }
    } catch (error) {
      let errorMessage = 'Login failed. Please try again.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      }
      setMessage(errorMessage, 'error');
      console.error('Login error:', error);
    }
  };

  // Handle Google sign-in with role-based logic
  const handleGoogleSignIn = async () => {
    setMessage(''); // Clear any previous messages
    
    if (!auth || !db) {
      setMessage('Firebase not initialized. Please refresh.', 'error');
      return;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('Existing Google user role:', userData.role);

        if (userData.role === 'lecturer') {
          window.location.href = '/lecturer-dashboard';
        } else {
          window.location.href = '/student-dashboard';
        }
      } else {
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: 'student',
          createdAt: new Date(),
          provider: 'google'
        });

        console.log('New Google user created with default role');
        window.location.href = '/student-dashboard';
      }
    } catch (error) {
      let errorMessage = 'Google sign-in failed. Please try again.';
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Sign-in process was canceled.';
      }
      setMessage(errorMessage, 'error');
      console.error('Google sign-in error:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <Input
        label="EMAIL"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        required
      />
      
      <Input
        label="PASSWORD"
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        required
      />
      
      <Button type="submit" variant="primary" fullWidth>
        Log In
      </Button>
      
      <Button 
        type="button" 
        variant="google" 
        fullWidth
        onClick={handleGoogleSignIn}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" className="google-icon">
          <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
          <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 0 1-7.18-2.53H1.83v2.07A8 8 0 0 0 8.98 17z"/>
          <path fill="#FBBC05" d="M4.5 10.49a4.8 4.8 0 0 1 0-3.07V5.35H1.83a8 8 0 0 0 0 7.28l2.67-2.14z"/>
          <path fill="#EA4335" d="M8.98 4.72c1.16 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.35L4.5 7.42a4.77 4.77 0 0 1 4.48-2.7z"/>
        </svg>
        Continue with Google
      </Button>
    </form>
  );
};

export default LoginForm;
