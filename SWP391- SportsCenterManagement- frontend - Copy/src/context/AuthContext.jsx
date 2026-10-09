import { authApi } from '../services/api.js';
import { getApiToken } from '../services/http.js';

const { createContext, useContext, useState, useEffect } = React;

const AuthContext = createContext(null);

const SESSION_KEY = 'SCMS_AUTH_SESSION';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      if (!getApiToken()) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) return JSON.parse(saved);
      // Default to null so user starts at Landing page / Login
      return null;
    } catch (e) {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [currentUser]);

  useEffect(() => {
    const handleExpiredSession = () => setCurrentUser(null);
    window.addEventListener('scms:session-expired', handleExpiredSession);
    return () => window.removeEventListener('scms:session-expired', handleExpiredSession);
  }, []);

  const refreshUser = async () => {
    if (!currentUser) return;
    const fresh = await authApi.getCurrentUser();
    if (fresh) setCurrentUser(fresh);
    return fresh;
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      setCurrentUser(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const newUser = await authApi.register(userData);
      setCurrentUser(newUser);
      return newUser;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (googleUser) => {
    setLoading(true);
    try {
      const res = await authApi.loginWithGoogle(googleUser);
      setCurrentUser(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authApi.logout();
    setCurrentUser(null);
  };

  const updateProfile = async (profileData) => {
    if (!currentUser) return;
    const updated = await authApi.updateProfile(currentUser.id, profileData);
    setCurrentUser(updated);
    return updated;
  };

  const changePassword = async (currentPassword, newPassword) => {
    if (!currentUser) return;
    const updated = await authApi.changePassword(currentUser.id, currentPassword, newPassword);
    setCurrentUser(updated);
    return updated;
  };

  const value = {
    currentUser,
    role: currentUser?.role || null,
    isAuthenticated: Boolean(currentUser),
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
