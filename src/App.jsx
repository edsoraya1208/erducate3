import { Routes, Route } from 'react-router-dom'; 
import { Suspense, lazy } from 'react'; 
import './styles/globals.css'; 
import CreateExercisePage from './pages/lecturer/create-exercise';  

// 🔥 Import UserProvider
import { UserProvider } from './contexts/UserContext';

// Lazy load components
const Welcome = lazy(() => import('./pages/Welcome')); 
const AuthPage = lazy(() => import('./pages/AuthPage')); 
const Dashboard1 = lazy(() => import('./pages/lecturer/dashboard1')); 
const MyClassLectPage = lazy(() => import('./pages/lecturer/my-class-lect-page')); 

// 🚀 FIX: Import the correct student dashboard PAGE (not component)
const StudentDashboard = lazy(() => import('./pages/student/dashboard2'));  

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
      {/* 🚀 WRAP EVERYTHING WITH UserProvider */}
      <UserProvider>         
        <Suspense fallback={<LoadingFallback />}>           
          <Routes>             
            {/* 📍 EXISTING ROUTES */}
            <Route path="/" element={<Welcome />} />             
            <Route path="/auth" element={<AuthPage />} />             
            <Route path="/lecturer/dashboard1" element={<Dashboard1 />} />             
            <Route path="/lecturer/create-exercise" element={<CreateExercisePage />} />             
            <Route path="/lecturer/class/:classId" element={<MyClassLectPage />} />             
            
            {/* 🎯 FIX: Use the correct StudentDashboard PAGE component */}
            <Route path="/student/dashboard" element={<StudentDashboard />} />                          
            
            {/* 🎯 OPTIONAL: Add 404 page for unknown routes */}
            {/* <Route path="*" element={<NotFound />} /> */}           
          </Routes>         
        </Suspense>       
      </UserProvider>     
    </div>   
  ); 
}  

export default App;