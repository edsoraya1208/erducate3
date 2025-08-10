import { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';

import { useNavigate } from 'react-router-dom';


// Import Firebase instances
import { auth, db } from '../../config/firebase';

// Import necessary Firebase functions
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Create Google provider
const googleProvider = new GoogleAuthProvider();


const LoginForm = () => {
  const navigate = useNavigate(); // ✅ define navigate

  // Form state management
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Message state for displaying feedback to users
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Add this state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear any previous error messages when user starts typing
    if (message.text) {
      setMessage({ text: '', type: '' });
    }
  };

  // Display message helper function
  const showMessage = (text, type = 'error') => {
    setMessage({ text, type });
    // Auto-clear success messages after 3 seconds
    if (type === 'success') {
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  
  // Handle form submission with role-based logic (email/password)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' }); // Clear any previous messages
    
    console.log('🚀 Form submitted');
    console.log('📧 Form data:', formData);

    // Validate form data
    if (!formData.email || !formData.password) {
      showMessage('Please fill in all fields.');
      setIsLoading(false);
      return;
    }

    // Check Firebase initialization
    if (!auth || !db) {
      showMessage('Firebase not initialized. Please refresh the page and try again.');
      setIsLoading(false);
      return;
    }

    console.log('✅ Firebase initialized, attempting login...');

    try {
      console.log('🔐 Attempting signInWithEmailAndPassword...');
      
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      console.log('✅ Login successful, user:', user.uid);
      showMessage('Login successful! Redirecting...', 'success');

      // Get user document from Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('📄 User document found, role:', userData.role);

        // Redirect based on user role
        if (userData.role === 'lecturer') {
          console.log('🎓 Redirecting to lecturer dashboard');
          navigate('/lecturer/dashboard1');        
        } else {
          console.log('🎒 Redirecting to student dashboard');
          navigate('/student-dashboard');
        }
      } else {
        // Create new user document with default role
        console.log('📝 Creating new user document');
        await setDoc(userDocRef, {
          email: user.email,
          role: 'student',
          createdAt: new Date(),
          provider: 'email'
        });
        console.log('🎒 Redirecting new user to student dashboard');
        navigate('/student-dashboard');
      }
    } catch (error) {
      console.log('❌ Login error occurred');
      console.error('🔥 Login error details:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      // Handle specific Firebase error codes
      switch (error.code) {
         case 'auth/user-not-found':
          errorMessage = `No password account found for this email. If you signed up with Google, try "Continue with Google" instead.`;
          break;
          case 'auth/wrong-password':
          errorMessage = `Incorrect password. If you signed up with Google, try "Continue with Google" instead.`;
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password. Please check your credentials.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed login attempts. Please try again later.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled. Please contact support.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        default:
          errorMessage = `Login failed: ${error.message}`;
      }
      
      console.log('💬 Showing error message:', errorMessage);
      showMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

// Handle Google sign-in with role-based logic
const handleGoogleSignIn = async () => {
  setIsLoading(true);
  setMessage({ text: '', type: '' }); // Clear any previous messages
  
  // Check Firebase initialization
  if (!auth || !db) {
    showMessage('Firebase not initialized. Please refresh the page and try again.');
    setIsLoading(false);
    return;
  }

  try {
    console.log('🔐 Attempting Google sign-in...');
    
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    console.log('✅ Google authentication successful, user:', user.uid);

    // Get user document from Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('📄 Existing Google user found, role:', userData.role);

      // Only show success message when we're sure the user has access
      showMessage('Login successful! Redirecting...', 'success');

      // Redirect based on user role
      if (userData.role === 'lecturer') {
        console.log('🎓 Redirecting to lecturer dashboard');
        navigate('/lecturer/dashboard1');
      } else {
        console.log('🎒 Redirecting to student dashboard');
        navigate('/student-dashboard');
      }
    } else {
      // User doesn't exist in database - block access
      console.log('❌ No account found for this Google user');
      
      try {
        // Delete the Firebase user account completely (not just sign out)
        await user.delete();
        console.log('🗑️ Firebase user account deleted');
      } catch (deleteError) {
        console.error('❌ Error deleting user account:', deleteError);
        // If deletion fails, at least sign them out
        await auth.signOut();
      }
      
      // Show error message with explicit 'error' type to ensure it doesn't auto-clear
      showMessage('No account associated with this email address. Please sign up first.', 'error');
    }
  } catch (error) {
    console.error('❌ Google sign-in error:', error);
    
    let errorMessage = 'Google sign-in failed. Please try again.';
    
    // Handle specific Google sign-in errors
    switch (error.code) {
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        errorMessage = 'Sign-in process was canceled. Please try again.';
        break;
      case 'auth/popup-blocked':
        errorMessage = 'Pop-up was blocked by your browser. Please allow pop-ups and try again.';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your internet connection.';
        break;
      case 'auth/internal-error':
        errorMessage = 'An internal error occurred. Please try again.';
        break;
      default:
        errorMessage = `Google sign-in failed: ${error.message}`;
    }
    
    // Explicitly set message type to 'error' to prevent auto-clearing
    showMessage(errorMessage, 'error');
  } finally {
    setIsLoading(false);
  }
};

  // Add this handler function
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    if (!resetEmail) {
      showMessage('Please enter your email address.');
      setIsLoading(false);
      return;
    }

    if (!auth) {
      showMessage('Firebase not initialized. Please refresh the page and try again.');
      setIsLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      showMessage('Password reset email sent! Check your inbox.', 'success');
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many requests. Please wait before trying again.';
          break;
      }
      
      showMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
/* eye toggle hid eunhide pass nanti*/
  const togglePasswordVisibility = () => {
  setShowPassword(!showPassword);
};

  // Inline styles object
  const styles = {
    message: {
      padding: '12px',
      borderRadius: '4px',
      marginBottom: '16px',
      fontSize: '14px',
      fontWeight: '500'
    },
    messageError: {
      backgroundColor: '#fef2f2',
      color: '#dc2626',
      border: '1px solid #fecaca'
    },
    messageSuccess: {
      backgroundColor: '#f0fdf4',
      color: '#16a34a',
      border: '1px solid #bbf7d0'
    },
    authForm: {
      maxWidth: '400px',
      margin: '0 auto'
    },
    logoSection: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: '32px'
    },
    logo: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px'
    },
    logoIcon: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    },
    logoText: {
      fontSize: '2.8rem',
      fontWeight: '850',
      color: '#1f2937',
      margin: '0',
      fontFamily: 'Nunito, sans-serif'
    },
    googleIcon: {
      marginRight: '8px'
    },
    forgotPasswordContainer: {
      textAlign: 'right',
      marginBottom: '16px'
    },
    forgotPasswordLink: {
      background: 'none',
      border: 'none',
      color: '#3b82f6',
      textDecoration: 'underline',
      cursor: 'pointer',
      fontSize: '14px',
      padding: '0'
    },
    forgotPasswordLinkHover: {
      color: '#1d4ed8'
    },
    forgotPasswordLinkDisabled: {
      color: '#9ca3af',
      cursor: 'not-allowed'
    },
    forgotPasswordForm: {
      background: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '16px'
    },
    forgotPasswordActions: {
      display: 'flex',
      gap: '8px',
      justifyContent: 'flex-end',
      marginTop: '12px'
    }
  };
  
  return (
    <div className="login-form-container">
      {/* Logo Section */}
      <div style={styles.logoSection}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>
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
          <h1 style={styles.logoText}>ERDucate</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={styles.authForm}>
        {/* Message Display */}
        {message.text && (
          <div 
            style={{
              ...styles.message,
              ...(message.type === 'success' ? styles.messageSuccess : styles.messageError)
            }}
          >
            {message.text}
          </div>
        )}
        
        <Input
          label="EMAIL"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={isLoading}
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

        {/* Forgot Password Link */}
        <div style={styles.forgotPasswordContainer}>
          <button 
            type="button" 
            style={{
              ...styles.forgotPasswordLink,
              ...(isLoading ? styles.forgotPasswordLinkDisabled : {})
            }}
            onClick={() => setShowForgotPassword(!showForgotPassword)}
            disabled={isLoading}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.color = styles.forgotPasswordLinkHover.color;
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.color = styles.forgotPasswordLink.color;
              }
            }}
          >
            Forgot Password?
          </button>
        </div>

        {/* Forgot Password Form */}
        {showForgotPassword && (
          <div style={styles.forgotPasswordForm}>
            <Input
              label="EMAIL FOR RESET"
              type="email"
              name="resetEmail"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
              disabled={isLoading}
            />
            <div style={styles.forgotPasswordActions}>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmail('');
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="primary" 
                onClick={handleForgotPassword}
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Reset Email'}
              </Button>
            </div>
          </div>
        )}
        
        <Button 
          type="submit" 
          variant="primary" 
          fullWidth 
          disabled={isLoading}
          style={{marginBottom: '16px'}}
        >
          {isLoading ? 'Signing In...' : 'Log In'}
        </Button>
        
      
        <Button 
          type="button" 
          variant="google" 
          fullWidth
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" style={styles.googleIcon}>
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 0 1-7.18-2.53H1.83v2.07A8 8 0 0 0 8.98 17z"/>
            <path fill="#FBBC05" d="M4.5 10.49a4.8 4.8 0 0 1 0-3.07V5.35H1.83a8 8 0 0 0 0 7.28l2.67-2.14z"/>
            <path fill="#EA4335" d="M8.98 4.72c1.16 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.35L4.5 7.42a4.77 4.77 0 0 1 4.48-2.7z"/>
          </svg>
          {isLoading ? 'Signing In...' : 'Continue with Google'}
        </Button>
      </form>
    </div>
  );
};

export default LoginForm;