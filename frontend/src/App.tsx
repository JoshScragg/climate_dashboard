// frontend/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard/Dashboard';
import Sidebar from './components/Layout/Sidebar';
import Footer from './components/Layout/Footer';
import AuthPage from './pages/AuthPage';
import DrillDownPage from './pages/DrillDownPage';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { WebSocketProvider } from './contexts/WebSocketContext';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  console.log('App component rendered');
  
  return (
    <AuthProvider>
      <WebSocketProvider>
        <Router>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/analysis" element={
              <ProtectedRoute>
                <AppLayout>
                  <DrillDownPage />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            {/* 404 route */}
            <Route 
              path="*" 
              element={
                <div className="min-h-screen flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-800">404</h1>
                    <p className="text-gray-600 mt-2">Page not found</p>
                    <button 
                      onClick={() => window.history.back()}
                      className="mt-4 px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
                    >
                      Go Back
                    </button>
                  </div>
                </div>
              } 
            />
          </Routes>
        </Router>
      </WebSocketProvider>
    </AuthProvider>
  );
};

export default App;