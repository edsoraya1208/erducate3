import { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import RoleSelector from '../ui/RoleSelector';

// Import necessary Firebase functions
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

/**
 * SignupForm Component
 * @param {object} props - The component props.
 * @param {object} props.auth - The Firebase Auth instance.
 * @param {object} props.db - The Firestore instance.
 * @param {function} props.setMessage - A function to display messages to the user.
 * @param {object} props.googleProvider - The Firebase GoogleAuthProvider instance.
 */
const SignupForm = ({ auth, db, setMessage, googleProvider }) => {
  // Form state management
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student' // Default role
  });

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle role selection
  const handleRoleChange = (role) => {
    setFormData({
      ...formData,
      role: role
    });
  };

  // Handle form submission (signup logic)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); // Clear any previous messages

    if (!auth || !db) {
      setMessage('Firebase not initialized. Please refresh.', 'error');
      return;
    }

    try {
      // Create the user with email and password in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Create a new document in Firestore to store the user's role
      await setDoc(doc(db, 'users', user.uid), {
        name: formData.name,
        email: user.email,
        role: formData.role, // Use the selected role
        createdAt: new Date()
      });

      // After successful signup, show a success message and clear the form.
      // The user will now be prompted to log in.
      setMessage('Account created successfully! Please log in.', 'success');
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'student'
      });

    } catch (error) {
      let errorMessage = 'Signup failed. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      }
      setMessage(errorMessage, 'error');
      console.error('Signup error:', error);
    }
  };

  // Handle Google sign-up (same logic as Google sign-in)
  const handleGoogleSignUp = async () => {
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

        // Keep the redirection logic for existing Google users
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
          role: 'student', // Default role for new Google users
          createdAt: new Date(),
          provider: 'google'
        });

        console.log('New Google user created with default role');
        
        // After successful sign-up via Google, show a success message and redirect
        // This is a common pattern for social logins.
        setMessage('Account created successfully!', 'success');
        window.location.href = '/student-dashboard';
      }
    } catch (error) {
      let errorMessage = 'Google sign-up failed. Please try again.';
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Sign-up process was canceled.';
      }
      setMessage(errorMessage, 'error');
      console.error('Google sign-up error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <Input
        label="NAME"
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
      />
      
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
      
      <RoleSelector
        selectedRole={formData.role}
        onRoleChange={handleRoleChange}
      />
      
      <Button type="submit" variant="primary" fullWidth>
        Create Account
      </Button>
      
      <Button 
        type="button" 
        variant="google" 
        fullWidth
        onClick={handleGoogleSignUp}
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

export default SignupForm;
