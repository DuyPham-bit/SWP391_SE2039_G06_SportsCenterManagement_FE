import React from 'react';
import { authApi, catalogApi } from '../services/api.js';
import { getSession, setSession } from '../services/httpClient.js';
import { setAccess } from '../services/permissions.js';
const { createContext, useContext, useState, useEffect } = React;
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshUser = async () => {
    const user = await authApi.getProfile();
    const access = await catalogApi.permissions();
    setAccess(user.role, access.permissionCodes);
    setSession({ ...getSession(), user });
    setCurrentUser(user);
    return user;
  };
  useEffect(() => {
    let active = true;
    const restore = async () => {
      const saved = getSession();
      if (!saved?.token || Date.parse(saved.expiresAt) <= Date.now()) {
        setSession(null); if (active) setLoading(false); return;
      }
      try {
        const user = await authApi.getProfile();
        const access = await catalogApi.permissions();
        if (active) { setAccess(user.role, access.permissionCodes); setSession({ ...saved, user }); setCurrentUser(user); }
      } catch { if (active) { setSession(null); setCurrentUser(null); } }
      finally { if (active) setLoading(false); }
    };
    restore();
    const expired = () => { setCurrentUser(null); setAccess(null, []); };
    window.addEventListener('SCMS_SESSION_EXPIRED', expired);
    return () => { active = false; window.removeEventListener('SCMS_SESSION_EXPIRED', expired); };
  }, []);
  const login = async (email, password) => {
    setLoading(true);
    try { await authApi.login(email, password); return await refreshUser(); }
    catch (error) { setSession(null); setAccess(null, []); setCurrentUser(null); throw error; }
    finally { setLoading(false); }
  };
  const register = data => authApi.register(data);
  const logout = () => { setSession(null); setAccess(null, []); setCurrentUser(null); };
  const updateProfile = async data => { await authApi.updateProfile(currentUser.id, data); return refreshUser(); };
  const changePassword = async (oldPassword, newPassword) => { await authApi.changePassword(currentUser.id, oldPassword, newPassword); await refreshUser(); };
  return <AuthContext.Provider value={{ currentUser, role: currentUser?.role || null, isAuthenticated: Boolean(currentUser), loading, login, register, logout, updateProfile, changePassword, refreshUser, loginWithGoogle: authApi.loginWithGoogle }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
