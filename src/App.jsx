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
const SubmissionsListPage = lazy(() => import('./pages/lecturer/submissions-list-page')); // ✅ NEW
const SubmitExercise = lazy(() => import('./pages/student/submit-exercise'));
const LecturerReviewERD = lazy(() => import('./pages/lecturer/review-erd')); 

// 🚀 FIX: Import the correct student dashboard PAGE (not component)
const StudentDashboard = lazy(() => import('./pages/student/dashboard2'));  
const MyClassStudPage = lazy(() => import('./pages/student/my-class-stud-page'));

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
            <Route path="/lecturer/exercise/:exerciseId/submissions" element={<SubmissionsListPage />} /> {/* ✅ NEW */}
            <Route path="/student/dashboard" element={<StudentDashboard />} />  
            <Route path="/student/class/:classId" element={<MyClassStudPage />} />                     
            <Route path="/student/class/:classId/submit-exercise/:exerciseId" element={<SubmitExercise />} />
            <Route path="/lecturer/review-erd" element={<LecturerReviewERD />} />
          </Routes>         
        </Suspense>       
      </UserProvider>     
    </div>   
  ); 
}  

export default App;