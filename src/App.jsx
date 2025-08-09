import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import './styles/globals.css';

// Lazy load components
const WelcomePage = lazy(() => import('./components/welcome/WelcomePage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));

// 🔥 ADD THIS: Import your lecturer dashboard page
const Dashboard1 = lazy(() => import('./pages/lecturer/dashboard1'));

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
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* 📍 EXISTING ROUTES - These are your current pages */}
          <Route path="/" element={<WelcomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          
          {/* 🔥 ADD THIS: New route for lecturer dashboard */}
          <Route path="/lecturer/dashboard1" element={<Dashboard1 />} />
          
          {/* 🚀 OPTIONAL: Add more lecturer routes */}
          {/* <Route path="/lecturer/profile" element={<LecturerProfile />} /> */}
          {/* <Route path="/lecturer/classes/:classId" element={<ClassDetails />} /> */}
          
          {/* 🛡️ OPTIONAL: Add protected routes (requires authentication) */}
          {/* <Route path="/lecturer/*" element={<ProtectedRoute><LecturerRoutes /></ProtectedRoute>} /> */}
          
          {/* 🎯 OPTIONAL: Add 404 page for unknown routes */}
          {/* <Route path="*" element={<NotFound />} /> */}
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;

/* 
📝 EXPLANATION OF CHANGES:

1. IMPORT SECTION (Line 8-9):
   - Added lazy import for Dashboard1 component
   - Uses lazy() for code-splitting (loads only when needed)
   - This keeps your initial bundle smaller

2. ROUTES SECTION (Line 28):
   - Added new route for "/lecturer/dashboard"
   - When user visits this URL, Dashboard1 component will render
   - Follows REST-ful URL pattern

🔧 WHERE TO MODIFY AND WHY:

1. ADD MORE LAZY IMPORTS (Lines 8-9):
   - Add any new pages you create
   - Example: const StudentDashboard = lazy(() => import('./pages/student/dashboard'));

2. ADD MORE ROUTES (Lines 28-35):
   - Add routes for different pages
   - Use nested routes for related pages
   - Example: "/lecturer/classes", "/lecturer/profile"

3. MODIFY LOADING COMPONENT (Lines 12-22):
   - Customize the loading spinner/message
   - Add your brand colors or logo
   - Make it match your app's design

4. ADD ROUTE GUARDS (Optional):
   - Protect routes that need authentication
   - Redirect unauthorized users to login
   - Check user roles (lecturer vs student)

🚀 COMMON PATTERNS TO ADD:

1. NESTED ROUTES:
   <Route path="/lecturer" element={<LecturerLayout />}>
     <Route path="dashboard" element={<Dashboard1 />} />
     <Route path="profile" element={<Profile />} />
   </Route>

2. PROTECTED ROUTES:
   <Route path="/lecturer/dashboard" element={
     <ProtectedRoute>
       <Dashboard1 />
     </ProtectedRoute>
   } />

3. DYNAMIC ROUTES:
   <Route path="/lecturer/class/:classId" element={<ClassDetails />} />

📱 HOW TO NAVIGATE TO YOUR DASHBOARD:
- From any component: navigate('/lecturer/dashboard')
- With React Router Link: <Link to="/lecturer/dashboard">Dashboard</Link>
- Direct URL: http://localhost:3000/lecturer/dashboard
*/