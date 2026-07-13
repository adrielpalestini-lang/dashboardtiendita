import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LINKS = [
  { to: '/', label: '📊 Ventas en vivo' },
  { to: '/reportes', label: '📈 Reporte de ventas' },
  { to: '/cortes', label: '💰 Cortes de caja' },
  { to: '/productos', label: '📦 Productos (tienda)' },
  { to: '/cafe', label: '☕ Productos (cafetería)' },
  { to: '/modificadores', label: '🧩 Modificadores' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <div className="sidebar" style={{ position: 'relative' }}>
      <div className="sidebar-title">LA TIENDITA</div>
      {LINKS.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.to === '/'}
          className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
        >
          {l.label}
        </NavLink>
      ))}

      <div className="sidebar-footer">
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem', marginBottom: 8 }}>
          {user?.name}
        </div>
        <button
          onClick={logout}
          className="btn btn-outline btn-small"
          style={{ width: '100%', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
