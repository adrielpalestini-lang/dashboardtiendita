import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      loginUser({ ...res.user, token: res.token });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-card" onSubmit={handleSubmit}>
        <h2 style={{ textAlign: 'center', color: 'var(--primary)', marginBottom: 4 }}>LA TIENDITA</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 0, marginBottom: 20, fontSize: '0.85rem' }}>
          Dashboard administrativo
        </p>

        <div className="form-row">
          <label>Correo</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-row">
          <label>Contraseña</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</p>}

        <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
