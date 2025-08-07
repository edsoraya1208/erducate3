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
    <div className="flex flex-col md:flex-row h-screen font-sans">
      {/* Left side - Brand section with a gradient background */}
      <div className="flex-1 bg-gradient-to-br from-indigo-700 to-purple-800 text-white p-8 md:p-16 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 drop-shadow-lg">
            ERDucate
          </h1>
          <p className="text-xl md:text-2xl font-light mb-6 opacity-90">
            An AI-Powered ERD Assessment & Feedback Tool
          </p>
          <p className="text-sm md:text-base leading-relaxed opacity-80 max-w-xl mx-auto">
            Revolutionize database design education with AI-powered feedback. 
            Students upload ERD diagrams and receive instant, intelligent analysis 
            that helps them learn from mistakes without waiting for manual review sessions.
          </p>
        </div>
      </div>

      {/* Right side - Auth forms section */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6 md:p-12">
        <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-2xl">
          {/* Toggle buttons for Login/Sign Up */}
          <div className="flex justify-center mb-8 gap-4">
            <button 
              className={`py-2 px-6 rounded-full font-semibold transition-all duration-300 ease-in-out ${
                isLogin 
                  ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setIsLogin(true)}
            >
              Log In
            </button>
            <button 
              className={`py-2 px-6 rounded-full font-semibold transition-all duration-300 ease-in-out ${
                !isLogin 
                  ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
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
