import { createContext, useContext, useEffect, useState } from 'react';
import '../utils/authFetch';

const AuthContext = createContext(null);

export const isAdminRole = (r) =>
  ['admin', 'administrador', 'administrator'].includes(String(r || '').trim().toLowerCase());

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('dashboard_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const loginUser = (userData) => {
    localStorage.setItem('dashboard_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('dashboard_user');
    setUser(null);
  };

  // authFetch avisa cuando el servidor rechaza el token (vencido o inválido)
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const isAdmin = !!user?.token && isAdminRole(user?.role);

  return (
    <AuthContext.Provider value={{ user, loginUser, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
