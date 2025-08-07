import { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';

// Import Firebase instances
import { auth, db } from '../../config/firebase';

// Import necessary Firebase functions
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';



const LoginForm = () => {
  // Form state management
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Message state for displaying feedback to users
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);

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
          window.location.href = '/lecturer-dashboard';
        } else {
          console.log('🎒 Redirecting to student dashboard');
          window.location.href = '/student-dashboard';
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
        window.location.href = '/student-dashboard';
      }
    } catch (error) {
      console.log('❌ Login error occurred');
      console.error('🔥 Login error details:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      // Handle specific Firebase error codes
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please try again.';
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

      console.log('✅ Google sign-in successful, user:', user.uid);
      showMessage('Google sign-in successful! Redirecting...', 'success');

      // Get user document from Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('📄 Existing Google user found, role:', userData.role);

        // Redirect based on user role
        if (userData.role === 'lecturer') {
          console.log('🎓 Redirecting to lecturer dashboard');
          window.location.href = '/lecturer-dashboard';
        } else {
          console.log('🎒 Redirecting to student dashboard');
          window.location.href = '/student-dashboard';
        }
      } else {
        // Create new user document with default role
        console.log('📝 Creating new Google user document');
        await setDoc(userDocRef, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: 'student',
          createdAt: new Date(),
          provider: 'google'
        });

        console.log('🎒 Redirecting new Google user to student dashboard');
        window.location.href = '/student-dashboard';
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
      
      showMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Add this state
const [showForgotPassword, setShowForgotPassword] = useState(false);
const [resetEmail, setResetEmail] = useState('');

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
  
  return (
    <div className="login-form-container">
      <form onSubmit={handleSubmit} className="auth-form">
        {/* Message Display */}
        {message.text && (
          <div className={`message ${message.type === 'success' ? 'message-success' : 'message-error'}`}>
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
        
        <Input
          label="PASSWORD"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          disabled={isLoading}
        />

        {/* Forgot Password Link */}
<div className="forgot-password-container">
  <button 
    type="button" 
    className="forgot-password-link"
    onClick={() => setShowForgotPassword(!showForgotPassword)}
    disabled={isLoading}
  >
    Forgot Password?
  </button>
</div>

{/* Forgot Password Form */}
{showForgotPassword && (
  <div className="forgot-password-form">
    <Input
      label="EMAIL FOR RESET"
      type="email"
      name="resetEmail"
      value={resetEmail}
      onChange={(e) => setResetEmail(e.target.value)}
      required
      disabled={isLoading}
    />
    <div className="forgot-password-actions">
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
          <svg width="18" height="18" viewBox="0 0 18 18" className="google-icon">
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 0 1-7.18-2.53H1.83v2.07A8 8 0 0 0 8.98 17z"/>
            <path fill="#FBBC05" d="M4.5 10.49a4.8 4.8 0 0 1 0-3.07V5.35H1.83a8 8 0 0 0 0 7.28l2.67-2.14z"/>
            <path fill="#EA4335" d="M8.98 4.72c1.16 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.35L4.5 7.42a4.77 4.77 0 0 1 4.48-2.7z"/>
          </svg>
          {isLoading ? 'Signing In...' : 'Continue with Google'}
        </Button>
      </form>

      {/* Add these styles to your CSS file */}
      <style jsx>{`
        .message {
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 16px;
          font-size: 14px;
          font-weight: 500;
        }
        
        .message-error {
          background-color: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }
        
        .message-success {
          background-color: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }
        
        .auth-form {
          max-width: 400px;
          margin: 0 auto;
        }
        
        .google-icon {
          margin-right: 8px;
        }

        .forgot-password-container {
  text-align: right;
  margin-bottom: 16px;
}

.forgot-password-link {
  background: none;
  border: none;
  color: #3b82f6;
  text-decoration: underline;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
}

.forgot-password-link:hover {
  color: #1d4ed8;
}

.forgot-password-link:disabled {
  color: #9cafadff;
  cursor: not-allowed;
}

.forgot-password-form {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.forgot-password-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 12px;
}
      `}</style>
    </div>
  );
};

export default LoginForm;