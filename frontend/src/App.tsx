// frontend/src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Login from './Login';
import MainPage from './MainPage';
import Ticket from './Ticket';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('token'));

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  return (
    <div className="app-container">
      <Routes>
        <Route 
          path="/login" 
          element={<Login onLoginSuccess={handleLoginSuccess} />} 
        />

        {/* Корекция тук: нелогнатите отиват към /login */}
        <Route 
          path="/" 
          element={isAuthenticated ? <MainPage /> : <Navigate to="/login" replace />} 
        />

        <Route 
          path="/ticket/:id" 
          element={isAuthenticated ? <Ticket /> : <Navigate to="/login" replace />} 
        />

        {/* Защита от грешни URL адреси - винаги към / */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;