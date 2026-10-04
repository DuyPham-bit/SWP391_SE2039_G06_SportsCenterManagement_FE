import { authApi, isMockMode } from '../services/api.js';
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
    }
  }, [currentUser]);

  useEffect(() => {
    if (isMockMode) return;
    if (!currentUser?.token) {
      setCurrentUser(null);
      return;
    }

    let active = true;
    authApi.getProfile()
      .then(user => {
        if (active) setCurrentUser({ ...user, token: currentUser.token });
      })
      .catch(error => {
        console.error('Không thể khôi phục phiên đăng nhập API:', error);
        if (active) setCurrentUser(null);
      });

    return () => {
      active = false;
    };
  }, []);

  const refreshUser = async () => {
    if (!currentUser) return;
    if (!isMockMode) {
      const fresh = await authApi.getProfile();
      setCurrentUser({ ...fresh, token: currentUser.token });
      return fresh;
    }
    const users = db.get(DB_KEYS.USERS);
    const fresh = users.find(u => u.id === currentUser.id);
    if (fresh) {
      setCurrentUser(fresh);
    }
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
    if (isMockMode && currentUser) {
      db.logAudit(currentUser.fullName, currentUser.role, 'LOGOUT', `Đăng xuất khỏi hệ thống`);
    }
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
    const token = await authApi.changePassword(currentUser.id, currentPassword, newPassword);
    if (!isMockMode) {
      setCurrentUser({ ...currentUser, token });
      return;
    }
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
