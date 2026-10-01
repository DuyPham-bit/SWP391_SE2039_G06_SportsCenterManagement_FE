import { authApi } from '../services/api.js';
import { db, DB_KEYS } from '../services/dbStorage.js';

const { createContext, useContext, useState, useEffect } = React;

const AuthContext = createContext(null);

const SESSION_KEY = 'SCMS_AUTH_SESSION';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
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
      localStorage.removeItem('SCMS_AUTH_TOKEN');
    }
  }, [currentUser]);

  // Listen to 401 unauthorized event from httpClient
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('SCMS_UNAUTHORIZED', handleUnauthorized);
    return () => window.removeEventListener('SCMS_UNAUTHORIZED', handleUnauthorized);
  }, []);

  // Refresh user data from API / DB storage
  const refreshUser = async () => {
    if (!currentUser) return;
    try {
      const fresh = await authApi.getProfile(currentUser.id);
      if (fresh) {
        setCurrentUser(fresh);
        return;
      }
    } catch (e) {
      const users = db.get(DB_KEYS.USERS);
      const fresh = users.find(u => u.id === currentUser.id);
      if (fresh) {
        setCurrentUser(fresh);
      }
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      if (res?.token) {
        localStorage.setItem('SCMS_AUTH_TOKEN', res.token);
      }
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
      if (newUser?.token) {
        localStorage.setItem('SCMS_AUTH_TOKEN', newUser.token);
      }
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
      if (res?.token) {
        localStorage.setItem('SCMS_AUTH_TOKEN', res.token);
      }
      setCurrentUser(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    if (currentUser) {
      db.logAudit(currentUser.fullName, currentUser.role, 'LOGOUT', `Đăng xuất khỏi hệ thống`);
    }
    localStorage.removeItem('SCMS_AUTH_TOKEN');
    localStorage.removeItem(SESSION_KEY);
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
    await authApi.changePassword(currentUser.id, currentPassword, newPassword);
    refreshUser();
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
