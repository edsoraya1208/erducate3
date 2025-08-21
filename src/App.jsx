import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import './styles/globals.css';
import CreateExercisePage from './pages/lecturer/create-exercise';

// 🔥 ADD THIS: Import UserProvider
import { UserProvider } from './contexts/UserContext';

// Lazy load components
const Welcome = lazy(() => import('./pages/Welcome'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const Dashboard1 = lazy(() => import('./pages/lecturer/dashboard1'));
const MyClassLectPage = lazy(() => import('./pages/lecturer/my-class-lect-page'));
const JoinClassStud = lazy(() => import('./pages/student/join-class-stud'));

// Loading component with better styling
const LoadingFallback = () => (
  <div style={{
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f8f9fa'
  }}>
    <div>Loading...</div>
  </div>
);

function App() {
  return (
    <div className="App">
      {/* 🚀 WRAP EVERYTHING WITH UserProvider - This gives ALL components access to user data */}
      <UserProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* 📍 EXISTING ROUTES - These are your current pages */}
            <Route path="/" element={<Welcome />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/lecturer/dashboard1" element={<Dashboard1 />} />
            <Route path="/lecturer/create-exercise" element={<CreateExercisePage />} />
            <Route path="/lecturer/class/:classId" element={<MyClassLectPage />} />
            <Route path= "/student/join-class" element={<JoinClassStud />} />
            
            {/* 🎯 OPTIONAL: Add 404 page for unknown routes */}
            {/* <Route path="*" element={<NotFound />} /> */}
          </Routes>
        </Suspense>
      </UserProvider>
    </div>
  );
}

export default App;

/* 
📝 WHAT CHANGED:

1. IMPORT ADDED (Line 7):
   - Added UserProvider import from contexts
   - This gives us access to user authentication state

2. WRAPPER ADDED (Line 29):
   - Wrapped entire app with <UserProvider>
   - Now ANY component in your app can use useUser() hook
   - User data is available everywhere (dashboard, create-exercise, etc.)

🔧 HOW THIS HELPS:

1. GLOBAL USER ACCESS:
   - Any component can import { useUser } from '../contexts/UserContext'
   - Get user data: const { user, getUserDisplayName } = useUser()
   - No need to pass user data down through props

2. AUTOMATIC UPDATES:
   - When user logs in/out, ALL components update automatically
   - Header shows correct name everywhere
   - Database gets correct user info

3. CONSISTENT BEHAVIOR:
   - Same user data across all pages
   - No more hardcoded "Prof. Johnson"
   - Real Firebase user information

🚀 NEXT STEPS AFTER THIS:

1. Create the UserContext.jsx file in src/contexts/
2. Update your dashboard and create-exercise components to use useUser()
3. Replace hardcoded user names with getUserDisplayName()

📱 THE FLOW:
User logs in → Firebase Auth → UserContext catches it → All components get updated user data
*/