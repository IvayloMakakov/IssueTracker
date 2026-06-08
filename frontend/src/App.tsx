import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Login from './pages/Login/Login';
import MainPage from './pages/MainPage/MainPage';
import Ticket from './pages/Ticket/Ticket';

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

        <Route 
          path="/" 
          element={isAuthenticated ? <MainPage /> : <Navigate to="/login" replace />} 
        />

        <Route 
          path="/ticket/:id" 
          element={isAuthenticated ? <Ticket /> : <Navigate to="/login" replace />} 
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;