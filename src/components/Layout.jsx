import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import '../styles/responsive.css';

// Todas las páginas del dashboard montan este Layout, así que aquí vive el candado:
// sin sesión de administrador => /login. (Sesiones viejas sin "role" también vuelven a /login.)
export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const { user, isAdmin, logout } = useAuth();

  // Si quedó guardada una sesión que no sirve (sin rol / no admin), se limpia
  useEffect(() => {
    if (user && !isAdmin) logout();
  }, [user, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isAdmin) return <Navigate to="/login" replace />;

  return (
    <div className={`app-layout${open ? ' menu-open' : ''}`}>
      <button
        type="button"
        className="menu-toggle"
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? '✕' : '☰'}
      </button>
      <div className="menu-backdrop" onClick={() => setOpen(false)} />
      <Sidebar />
      <div className="main-content">{children}</div>
    </div>
  );
}
