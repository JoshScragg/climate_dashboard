import React, { useState, useEffect } from 'react';
import LoginForm from '../components/Auth/LoginForm';
import RegisterForm from '../components/Auth/RegisterForm';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';

const AuthPage: React.FC = () => {
  const [showLogin, setShowLogin] = useState(true);
  const { isAuthenticated, isLoading, user, registerSuccess } = useAuth();
  const navigate = useNavigate();
  
  console.log('Auth Page State:', { isAuthenticated, isLoading, user, registerSuccess });
  
  const handleSwitchToRegister = () => {
    setShowLogin(false);
  };
  
  const handleSwitchToLogin = () => {
    setShowLogin(true);
  };
  
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('User is authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-800 flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        <p className="mt-4 text-white">Loading...</p>
      </div>
    );
  }

  if (isAuthenticated && user) {
    console.log('User is authenticated, rendering redirect component');
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-800 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-white">Climate Dashboard</h2>
          <p className="mt-2 text-lg text-primary-100">
            {showLogin ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {showLogin ? (
          <LoginForm onSwitchToRegister={handleSwitchToRegister} />
        ) : (
          <RegisterForm onSwitchToLogin={handleSwitchToLogin} />
        )}
      </div>
    </div>
  );
};

export default AuthPage;