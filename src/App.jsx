import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import './styles/globals.css';

// Lazy load components
const WelcomePage = lazy(() => import('./components/welcome/WelcomePage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));

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
          <Route path="/" element={<WelcomePage />} />
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;