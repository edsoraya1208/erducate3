import { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import SignupForm from '../components/auth/SignupForm';

/**
 * AuthPage Component
 * This is the main authentication page that renders either the login or signup form.
 * It's crucial to pass down the Firebase-related props to the child components.
 * @param {object} props - The component props.
 * @param {object} props.auth - The Firebase Auth instance.
 * @param {object} props.db - The Firestore instance.
 * @param {function} props.setMessage - A function to display messages to the user.
 * @param {object} props.googleProvider - The Firebase GoogleAuthProvider instance.
 */
const AuthPage = ({ auth, db, setMessage, googleProvider }) => {
  // State to toggle between login and signup forms
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="auth-body auth-container">
      {/* Brand Section - Left Side */}
      <div className="brand-section">
        <div className="brand-content">
          <h1 className="brand-title">Ready to begin?</h1>
          <h2 className="brand-subtitle">Join ERDucate Today</h2>
          <p className="brand-description">
            Create your account or log in to start using our AI-powered ERD assessment tool. 
                Get instant feedback on your database designs and accelerate your learning.
          </p>
        </div>
      </div>

      {/* Form Section - Right Side */}
      <div className="form-section">
        <div className="form-container">
          {/* Auth Toggle */}
          <div className="auth-toggle">
            <button 
              className={`toggle-btn ${isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(true)}
            >
              Log In
            </button>
            <button 
              className={`toggle-btn ${!isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(false)}
            >
              Sign Up
            </button>
          </div>

          {/* Conditional form rendering, now with props passed down */}
          {isLogin ? (
            <LoginForm
              auth={auth}
              db={db}
              setMessage={setMessage}
              googleProvider={googleProvider}
            />
          ) : (
            <SignupForm
              auth={auth}
              db={db}
              setMessage={setMessage}
              googleProvider={googleProvider}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;