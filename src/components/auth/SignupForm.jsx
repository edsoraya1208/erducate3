import { useState, useEffect } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import RoleSelector from '../ui/RoleSelector';

// Import Firebase instances directly from config
import { auth, db, googleProvider } from '../../config/firebase';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';


const SignupForm = () => {
  // Form state management
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '' // No default - user must choose
  });

  // Message state management
  const [message, setMessage] = useState({
    text: '',
    type: '' // 'success' or 'error'
  });

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Helper function for consistent message display
  const showMessage = (text, type = 'error') => {
    setMessage({ text, type });
    
    // Auto-clear success messages after 3 seconds
    if (type === 'success') {
      setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 3000);
    }
  };

  // Clear messages when user starts typing
  const clearMessage = () => {
    if (message.text) {
      setMessage({ text: '', type: '' });
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    clearMessage();
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle role selection
  const handleRoleChange = (role) => {
    clearMessage();
    setFormData({
      ...formData,
      role: role
    });
  };

  // Form validation
  const validateForm = () => {
    if (!formData.name.trim()) {
      showMessage('Please enter your name');
      return false;
    }
    
    if (!formData.email.trim()) {
      showMessage('Please enter your email');
      return false;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showMessage('Please enter a valid email address');
      return false;
    }
    
    if (!formData.password) {
      showMessage('Please enter a password');
      return false;
    }
    
    if (formData.password.length < 6) {
      showMessage('Password must be at least 6 characters long');
      return false;
    }
    
    if (!formData.role) {
      showMessage('Please select your role (Lecturer or Student)');
      return false;
    }
    
    return true;
  };

  // Handle form submission (signup logic)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear any previous messages
    setMessage({ text: '', type: '' });
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    // Check Firebase initialization
    if (!auth || !db) {
      showMessage('Firebase not initialized. Please refresh the page and try again.');
      return;
    }

    setIsLoading(true);
    console.log('Starting email signup process...');

    try {
      // Create the user with email and password in Firebase Authentication
      console.log('Creating user with email:', formData.email);
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      console.log('User created successfully:', user.uid);

      // Create a new document in Firestore to store the user's information
      console.log('Creating Firestore document with role:', formData.role);
      await setDoc(doc(db, 'users', user.uid), {
        name: formData.name,
        email: user.email,
        role: formData.role, // Use the selected role (required)
        createdAt: new Date(),
        provider: 'email'
      });
      console.log('Firestore document created successfully');

      // Show success message
      showMessage('Account created successfully! Redirecting to your dashboard...', 'success');
      
      // Clear the form
      setFormData({
        name: '',
        email: '',
        password: '',
        role: ''
      });

      // Redirect based on role after a brief delay
      setTimeout(() => {
        if (formData.role === 'lecturer') {
          window.location.href = '/lecturer-dashboard';
        } else {
          window.location.href = '/student-dashboard';
        }
      }, 2000);

    } catch (error) {
      console.error('Signup error:', error);
      
      // Handle specific Firebase error codes
      let errorMessage = 'Signup failed. Please try again.';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already registered. Please use a different email or try logging in.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please use at least 6 characters.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled. Please contact support.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection and try again.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
        default:
          errorMessage = `Signup failed: ${error.message}`;
      }
      
      showMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google sign-up
  const handleGoogleSignUp = async () => {
    setMessage({ text: '', type: '' });
    
    if (!auth || !db) {
      showMessage('Firebase not initialized. Please refresh the page and try again.');
      return;
    }

    setIsLoading(true);
    console.log('Starting Google signup process...');

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      console.log('Google auth successful:', user.uid);

      // Check if user already exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('Existing Google user found with role:', userData.role);

        showMessage('Welcome back! Redirecting to your dashboard...', 'success');
        
        // Redirect based on existing role
        setTimeout(() => {
          if (userData.role === 'lecturer') {
            window.location.href = '/lecturer-dashboard';
          } else {
            window.location.href = '/student-dashboard';
          }
        }, 1500);
        
      } else {
        // New Google user - create with default student role
        console.log('Creating new Google user with default student role');
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          role: 'student', // Default role for new Google users
          createdAt: new Date(),
          provider: 'google'
        });

        console.log('New Google user created successfully');
        showMessage('Account created successfully! Redirecting to your dashboard...', 'success');
        
        // Redirect to student dashboard for new Google users
        setTimeout(() => {
          window.location.href = '/student-dashboard';
        }, 2000);
      }
      
    } catch (error) {
      console.error('Google sign-up error:', error);
      
      let errorMessage = 'Google sign-up failed. Please try again.';
      
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Sign-up process was canceled. Please try again.';
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = 'Sign-up was canceled. Please try again.';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Popup was blocked by browser. Please allow popups and try again.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection and try again.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many attempts. Please try again later.';
          break;
        default:
          errorMessage = `Google sign-up failed: ${error.message}`;
      }
      
      showMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      {/* Message Display Area */}
      {message.text && (
        <div className={`message ${message.type === 'success' ? 'message-success' : 'message-error'}`}>
          {message.text}
        </div>
      )}

      <Input
        label="FULL NAME"
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
        disabled={isLoading}
        placeholder="Enter your full name"
      />
      
      <Input
        label="EMAIL ADDRESS"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        required
        disabled={isLoading}
        placeholder="Enter your email address"
      />
      
      <Input
        label="PASSWORD"
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        required
        disabled={isLoading}
        placeholder="Create a password (min. 6 characters)"
      />
      
      <RoleSelector
        selectedRole={formData.role}
        onRoleChange={handleRoleChange}
        required={true}
        disabled={isLoading}
        label="SELECT YOUR ROLE *"
      />
      
      <Button 
        type="submit" 
        variant="primary" 
        fullWidth 
        disabled={isLoading}
      >
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </Button>
      
      <div className="divider">
        <span>OR</span>
      </div>
      
      <Button 
        type="button" 
        variant="google" 
        fullWidth
        onClick={handleGoogleSignUp}
        disabled={isLoading}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" className="google-icon">
          <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
          <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 0 1-7.18-2.53H1.83v2.07A8 8 0 0 0 8.98 17z"/>
          <path fill="#FBBC05" d="M4.5 10.49a4.8 4.8 0 0 1 0-3.07V5.35H1.83a8 8 0 0 0 0 7.28l2.67-2.14z"/>
          <path fill="#EA4335" d="M8.98 4.72c1.16 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.35L4.5 7.42a4.77 4.77 0 0 1 4.48-2.7z"/>
        </svg>
        {isLoading ? 'Signing up...' : 'Continue with Google'}
      </Button>

      {/* Additional Links */}
      <div className="auth-links">
        
        <p>
          Already have an account? 
          <a href="/auth" className="auth-link">Sign In</a>
        </p>
      </div>
    </form>
  );
};

export default SignupForm;