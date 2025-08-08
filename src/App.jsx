import { Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import WelcomePage from './components/welcome/WelcomePage';
import './styles/globals.css';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/auth" element={<AuthPage />} />
      </Routes>
    </div>
  );
}

export default App;