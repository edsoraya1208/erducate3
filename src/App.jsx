import { Routes, Route, useLocation } from 'react-router-dom';
import { Suspense, lazy, useLayoutEffect } from 'react';
import './styles/globals.css';

// Lazy load components with preload
const WelcomePage = lazy(() => import('./components/welcome/WelcomePage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));

// Preload the welcome page component
const preloadWelcomePage = () => {
  WelcomePage.preload?.();
};

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
  const location = useLocation();

  // Force remount of components on navigation
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    // Preload the welcome page when navigating
    preloadWelcomePage();
  }, [location.pathname]);

  return (
    <div className="App">
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route 
            path="/" 
            element={
              <WelcomePage key={location.pathname} /> /* Add key to force remount */
            } 
          />
          <Route 
            path="/auth" 
            element={
              <AuthPage key={location.pathname} /> /* Add key to force remount */
            } 
          />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;