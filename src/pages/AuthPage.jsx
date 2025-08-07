import { useState } from 'react'
import LoginForm from '../components/auth/LoginForm'
import SignupForm from '../components/auth/SignupForm'

const AuthPage = () => {
  // State to toggle between login and signup forms
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="auth-container">
      {/* Left side - Purple brand section */}
      <div className="brand-section">
        <div className="brand-content">
          <h1 className="brand-title">ERDucate</h1>
          <p className="brand-subtitle">
            An AI-Powered ERD Assessment & Feedback Tool
          </p>
          <p className="brand-description">
            Revolutionize database design education with AI-powered feedback. 
            Students upload ERD diagrams and receive instant, intelligent analysis 
            that helps them learn from mistakes without waiting for manual review sessions.
          </p>
        </div>
      </div>

      {/* Right side - Auth forms */}
      <div className="form-section">
        <div className="form-container">
          {/* Toggle buttons */}
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

          {/* Conditional form rendering */}
          {isLogin ? <LoginForm /> : <SignupForm />}
        </div>
      </div>
    </div>
  )
}

export default AuthPage