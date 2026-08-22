import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('healthsync_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('healthsync_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAuthChange = () => {
      const savedToken = localStorage.getItem('healthsync_token');
      const savedUser = localStorage.getItem('healthsync_user');
      setToken(savedToken);
      setUser(savedUser ? JSON.parse(savedUser) : null);
    };

    window.addEventListener('auth_state_change', handleAuthChange);
    return () => window.removeEventListener('auth_state_change', handleAuthChange);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('healthsync_token');
      if (savedToken) {
        try {
          const res = await api.get('/auth/me');
          const doctorId = user?.doctor_id;
          const fullUserData = { ...res.data, doctor_id: doctorId };
          setUser(fullUserData);
          localStorage.setItem('healthsync_user', JSON.stringify(fullUserData));
        } catch (err) {
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { access_token, user_id, full_name, role, doctor_id } = res.data;
    const userData = { id: user_id, email, full_name, role, doctor_id };
    
    localStorage.setItem('healthsync_token', access_token);
    localStorage.setItem('healthsync_user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const register = async (email, password, full_name, phone) => {
    const res = await api.post('/auth/register', { email, password, full_name, phone });
    const { access_token, user_id, role } = res.data;
    const userData = { id: user_id, email, full_name, role };
    
    localStorage.setItem('healthsync_token', access_token);
    localStorage.setItem('healthsync_user', JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('healthsync_token');
    localStorage.removeItem('healthsync_user');
    setToken(null);
    setUser(null);
  };

  const quickLogin = async (roleType) => {
    if (roleType === 'admin') {
      return login('admin@healthsync.care', 'AdminPassword123!');
    } else if (roleType === 'doctor') {
      return login('dr.sarah.mitchell@healthsync.care', 'DoctorPassword123!');
    } else if (roleType === 'patient') {
      return login('patient@healthsync.care', 'PatientPassword123!');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        role: user?.role,
        loading,
        login,
        register,
        logout,
        quickLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
