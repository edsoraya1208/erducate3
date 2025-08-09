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

  //pasword eye
  const [showPassword, setShowPassword] = useState(false);

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
//eye hide unhide password
  const togglePasswordVisibility = () => {
  setShowPassword(!showPassword);
};

  

return (
  <div className="signup-form-container">
    {/* Logo Section with inline styles */}
    <div 
      className="logo-section"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '32px'
      }}
    >
      <div 
        className="logo"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}
      >
        <div 
          className="logo-icon"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="4.9rem"
            viewBox="0 0 1024.5 576"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <clipPath id="54c61c8446">
                <path d="M 0 0.140625 L 1024 0.140625 L 1024 575.859375 L 0 575.859375 Z M 0 0.140625 " />
              </clipPath>
              <clipPath id="d8454990b4">
                <path d="M 284.785156 17.242188 L 739.0625 17.242188 L 739.0625 541.984375 L 284.785156 541.984375 Z M 284.785156 17.242188 " />
              </clipPath>
            </defs>
            <g id="9098073d47">
              <g clipRule="nonzero" clipPath="url(#54c61c8446)">
              </g>
              <g clipRule="nonzero" clipPath="url(#d8454990b4)">
                <path fill="#140e01ff" fillOpacity="1" d="M 511.929688 541.671875 L 284.835938 410.550781 L 284.832031 148.34375 L 511.925781 17.242188 L 739.019531 148.335938 L 739.019531 410.550781 Z M 301.484375 400.941406 L 511.929688 522.445312 L 722.371094 400.941406 L 722.371094 157.945312 L 511.925781 36.464844 L 301.480469 157.957031 Z M 301.484375 400.941406 " />
              </g>
              <path fill="#a09797ff" fillOpacity="1" d="M 529.277344 298.402344 L 528.597656 298.414062 L 494.148438 298.421875 L 493.484375 298.421875 L 331.066406 392.164062 L 331.816406 392.597656 L 331.789062 392.621094 L 511.105469 496.121094 L 511.375 495.964844 L 511.65625 496.117188 L 673.882812 402.484375 L 673.867188 402.449219 L 673.863281 382.699219 L 673.867188 381.902344 Z M 622.125 392.566406 L 511.363281 456.433594 L 400.632812 392.566406 L 511.382812 328.171875 Z M 622.125 392.566406 " />
              <path fill="#b30101" fillOpacity="1" d="M 501.683594 65.167969 L 501.75 105.3125 L 354.828125 190.125 L 354.832031 233.320312 L 354.828125 235.285156 L 501.191406 150.8125 L 501.257812 190.964844 L 354.832031 275.5 L 354.839844 319.667969 L 501.742188 234.785156 L 501.765625 274.957031 L 320.078125 379.859375 L 319.988281 170.015625 Z M 501.683594 65.167969 " />
              <path fill="#2ec6cbff" fillOpacity="1" d="M 685.6875 157.988281 L 520.796875 62.789062 L 520.789062 63.652344 L 520.753906 63.640625 L 520.769531 273.863281 L 521.054688 274.027344 L 521.054688 274.34375 L 555.796875 294.398438 L 555.796875 208.121094 L 668.347656 273.09375 L 668.472656 359.4375 L 703.859375 379.859375 L 703.851562 293.957031 L 703.292969 292.96875 L 685.941406 262.9375 L 703.371094 252.859375 L 703.851562 252.589844 L 703.859375 189.457031 L 703.511719 188.875 L 686.027344 158.582031 Z M 668.476562 232.785156 L 555.78125 167.796875 L 555.757812 124.136719 L 668.609375 188.832031 Z M 668.476562 232.785156 " />
            </g>
          </svg>
        </div>
        {/* CHANGE FONT HERE: Add your desired font-family to the logo-text class */}
        <h1 
          className="logo-text"
          style={{
            fontSize: '2.8rem',
            fontWeight: '850',
            color: '#1f2937',
            margin: '0',
            marginLeft: '25px',
            fontFamily: 'Nunito, sans-serif',
            marginBottom: '-25px' // Change this to your desired font
          }}
        >
          ERDucate
        </h1>
      </div>
    </div>

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
      
      <div style={{ position: 'relative' }}>
        <Input
          label="PASSWORD"
          type={showPassword ? "text" : "password"}
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          disabled={isLoading}
          placeholder="Create a password (min. 6 characters)"
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          disabled={isLoading}
          style={{
            position: 'absolute',
            right: '12px',
            top: '70%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            color: '#6b7280',
            padding: '4px'
          }}
        >
          {showPassword ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          )}
        </button>
      </div>
      
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
  </div>
);
};

export default SignupForm;