import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getSalesDaily } from '../api';

function toISODate(d) {
  return d.toISOString().split('T')[0];
}

export default function SalesReportPage() {
  const today = new Date();
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);

  const [from, setFrom] = useState(toISODate(monthAgo));
  const [to, setTo] = useState(toISODate(today));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getSalesDaily(1, from, to);
      setRows(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPeriodo = rows.reduce((a, r) => a + r.total, 0);
  const totalTienda = rows.reduce((a, r) => a + r.total_tienda, 0);
  const totalCafe = rows.reduce((a, r) => a + r.total_cafe, 0);
  const maxTotal = Math.max(...rows.map((r) => r.total), 1);

  return (
    <Layout>
      <h1 className="page-title">Reporte de ventas</h1>

      <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
        <div className="form-row" style={{ marginBottom: 0 }}>
          <label>Desde</label>
          <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="form-row" style={{ marginBottom: 0 }}>
          <label>Hasta</label>
          <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={load}>Filtrar</button>
      </div>

      <div className="card-grid">
        <div className="stat-card">
          <div className="stat-label">Total del período</div>
          <div className="stat-value">${totalPeriodo.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Tienda</div>
          <div className="stat-value" style={{ color: 'var(--text)' }}>${totalTienda.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cafetería</div>
          <div className="stat-value" style={{ color: 'var(--cafe)' }}>${totalCafe.toFixed(2)}</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Ventas por día</h3>
        {loading ? (
          <p>Cargando...</p>
        ) : rows.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No hay ventas en este período.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Día</th>
                <th># Ventas</th>
                <th>Tienda</th>
                <th>Cafetería</th>
                <th>Total</th>
                <th style={{ width: 200 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.day}>
                  <td>{new Date(r.day).toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td>{r.sale_count}</td>
                  <td>${r.total_tienda.toFixed(2)}</td>
                  <td>${r.total_cafe.toFixed(2)}</td>
                  <td style={{ fontWeight: 'bold' }}>${r.total.toFixed(2)}</td>
                  <td>
                    <div style={{ background: 'var(--gray-light)', borderRadius: 4, height: 10, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${(r.total / maxTotal) * 100}%`,
                          background: 'var(--primary)',
                          height: '100%',
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
