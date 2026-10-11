import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { adminListUsers, adminCreateUser, adminUpdateUser, adminListOrgs } from '../utils/adminApi';

const ROLE_LABEL = { cashier: 'Cajero', admin: 'Administrador' };
const roleLabel = (r) => ROLE_LABEL[r] || r;
const isAdminRole = (r) => ['admin', 'administrador', 'administrator'].includes(String(r || '').toLowerCase());

// Campo de contraseña con ojito
function PasswordInput({ value, onChange }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <input
        className="input"
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="new-password"
        style={{ flex: 1 }}
      />
      <button
        type="button"
        className="btn btn-outline btn-small"
        aria-label={show ? 'Ocultar contraseña' : 'Ver contraseña'}
        onClick={() => setShow((s) => !s)}
      >
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  );
}

const EMPTY = { name: '', email: '', password: '', role: 'cashier', org_id: '', is_active: true };

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revealed, setRevealed] = useState({}); // id -> true
  const [revealAll, setRevealAll] = useState(false);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [u, o] = await Promise.all([adminListUsers(), adminListOrgs()]);
      setUsers(u);
      setOrgs(o.rows);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter && (roleFilter === 'admin' ? !isAdminRole(u.role) : isAdminRole(u.role))) return false;
      if (!t) return true;
      return `${u.name} ${u.email}`.toLowerCase().includes(t);
    });
  }, [users, q, roleFilter]);

  const openNew = () => {
    setFormError('');
    setForm({ ...EMPTY, org_id: orgs[0]?.id ?? '' });
  };
  const openEdit = (u) => {
    setFormError('');
    setForm({
      id: u.id, name: u.name, email: u.email, password: u.password || '',
      role: u.role, org_id: u.org_id, is_active: u.is_active !== false,
    });
  };

  const save = async () => {
    setSaving(true);
    setFormError('');
    try {
      const body = {
        name: form.name, email: form.email, password: form.password,
        role: form.role, org_id: Number(form.org_id), is_active: form.is_active,
      };
      if (form.id) await adminUpdateUser(form.id, body);
      else await adminCreateUser(body);
      setForm(null);
      await load();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u) => {
    setError('');
    try {
      await adminUpdateUser(u.id, { is_active: u.is_active === false });
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const roleOptions = form && !['cashier', 'admin'].includes(form.role) ? [form.role] : [];

  return (
    <Layout>
      <div className="flex-between" style={{ marginBottom: 12 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Usuarios</h1>
        <button className="btn btn-primary" onClick={openNew}>+ Nuevo usuario</button>
      </div>

      <div className="card" style={{ marginBottom: 12, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        Las contraseñas se guardan y se muestran en texto plano. Un usuario desactivado ya no puede iniciar sesión
        (los usuarios no se borran porque las ventas y cortes quedan ligados a su nombre).
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <input className="input" placeholder="Buscar nombre o correo" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 260 }} />
          <select className="input" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ maxWidth: 180 }}>
            <option value="">Todos los tipos</option>
            <option value="cashier">Cajeros</option>
            <option value="admin">Administradores</option>
          </select>
          <button className="btn btn-outline btn-small" onClick={() => setRevealAll((v) => !v)}>
            {revealAll ? '🙈 Ocultar todas' : '👁️ Ver todas las contraseñas'}
          </button>
        </div>

        {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

        {loading ? (
          <p>Cargando...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nombre</th><th>Correo</th><th>Contraseña</th><th>Tipo</th><th>Organización</th><th>Estado</th><th></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((u) => {
                const visible = revealAll || revealed[u.id];
                return (
                  <tr key={u.id} style={u.is_active === false ? { opacity: 0.6 } : undefined}>
                    <td>{u.name}{me?.id === u.id && <span className="badge badge-gray" style={{ marginLeft: 6 }}>Tú</span>}</td>
                    <td>{u.email}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <code>{visible ? u.password : '••••••••'}</code>{' '}
                      <button
                        type="button"
                        className="btn btn-outline btn-small"
                        aria-label={visible ? 'Ocultar contraseña' : 'Ver contraseña'}
                        onClick={() => setRevealed((r) => ({ ...r, [u.id]: !r[u.id] }))}
                      >
                        {visible ? '🙈' : '👁️'}
                      </button>
                    </td>
                    <td>
                      <span className={isAdminRole(u.role) ? 'badge badge-green' : 'badge badge-gray'}>{roleLabel(u.role)}</span>
                    </td>
                    <td>{u.org_name || u.org_id}</td>
                    <td>
                      <span className={u.is_active === false ? 'badge badge-red' : 'badge badge-green'}>
                        {u.is_active === false ? 'Inactivo' : 'Activo'}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button className="btn btn-outline btn-small" onClick={() => openEdit(u)}>Editar</button>{' '}
                      <button className="btn btn-outline btn-small" onClick={() => toggleActive(u)}>
                        {u.is_active === false ? 'Activar' : 'Desactivar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {shown.length === 0 && (
                <tr><td colSpan={7} style={{ color: 'var(--text-muted)' }}>Sin resultados.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {form && (
        <div className="modal-overlay" onClick={() => setForm(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{form.id ? 'Editar usuario' : 'Nuevo usuario'}</h3>

            <div className="form-row">
              <label>Nombre</label>
              <input className="input" value={form.name} maxLength={100} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-row">
              <label>Correo (con el que inicia sesión)</label>
              <input className="input" value={form.email} maxLength={100} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-row">
              <label>Contraseña</label>
              <PasswordInput value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
            </div>
            <div className="form-row">
              <label>Tipo de usuario</label>
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="cashier">Cajero</option>
                <option value="admin">Administrador</option>
                {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label>Organización</label>
              <select className="input" value={form.org_id} onChange={(e) => setForm({ ...form, org_id: e.target.value })}>
                {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label>
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} style={{ marginRight: 6 }} />
                Activo (puede iniciar sesión)
              </label>
            </div>

            {formError && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{formError}</p>}

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn btn-green" style={{ flex: 1 }} disabled={saving} onClick={save}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setForm(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
