import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import axios from 'axios';

export interface User {
  _id: string;
  name: string;
  email: string;
  token: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  debug: any;
  registerSuccess: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  clearRegisterSuccess: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<any>(null);
  const [registerSuccess, setRegisterSuccess] = useState<boolean>(false);
  
  useEffect(() => {
    axios.defaults.baseURL = 'http://localhost:5000/api';
    console.log('Setting axios baseURL to:', axios.defaults.baseURL);
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        axios.defaults.headers.common['Authorization'] = `Bearer ${parsedUser.token}`;
      } catch (err) {
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setDebug(null);
      
      console.log('Attempting login with:', { email });
      
      const path = '/users/login';
      
      const response = await axios.post(path, {
        email,
        password
      });
      
      console.log('Login response:', response.status);
      const userData = response.data;
      console.log('User data received:', { 
        id: userData._id, 
        name: userData.name, 
        tokenReceived: !!userData.token 
      });
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
      
      console.log('Login successful, state updated');
      
    } catch (err: any) {
      console.error('Login error:', err.message);
      setError(err?.response?.data?.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setDebug(null);
      setRegisterSuccess(false);
      
      console.log('Attempting registration with:', { name, email });
      console.log('Current axios baseURL:', axios.defaults.baseURL);
      
      const response = await axios.post('/users/register', {
        name,
        email,
        password
      });
      
      console.log('Registration response:', response.status);
      
      setRegisterSuccess(true);
      
      console.log('Registration successful, success flag set');
      
    } catch (err: any) {
      console.error('Registration error details:', err);
      
      let errorMsg = 'Failed to register';
      if (err.response) {
        errorMsg = err.response.data?.message || 
                  `Server error: ${err.response.status}`;
        
        if (err.response.data?.errors) {
          errorMsg += ` - ${err.response.data.errors.map((e: any) => e.message).join(', ')}`;
        }
      } else if (err.request) {
        errorMsg = 'No response from server. Please check your connection.';
      } else {
        errorMsg = err.message || errorMsg;
      }
      
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  };

  const clearError = () => {
    setError(null);
    setDebug(null);
  };
  
  const clearRegisterSuccess = () => {
    setRegisterSuccess(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        debug,
        registerSuccess,
        login,
        register,
        logout,
        clearError,
        clearRegisterSuccess
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;