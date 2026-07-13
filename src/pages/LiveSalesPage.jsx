import { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import { getSalesLive, getCashCutSummary } from '../api';

const REFRESH_MS = 15000;

export default function LiveSalesPage() {
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [salesData, summaryData] = await Promise.all([
        getSalesLive(1, 240),
        getCashCutSummary(1),
      ]);
      setSales(salesData);
      setSummary(summaryData);
      setLastUpdate(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => clearInterval(interval);
  }, [load]);

  const cashExpected = summary?.by_method?.find((m) => m.method_name.toLowerCase().includes('efectivo'))?.total || 0;

  return (
    <Layout>
      <div className="flex-between" style={{ marginBottom: 20 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          <span className="live-dot" />
          Ventas en vivo
        </h1>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {lastUpdate ? `Actualizado ${lastUpdate.toLocaleTimeString('es-MX')}` : ''} · se actualiza cada 15s
        </span>
      </div>

      <div className="card-grid">
        <div className="stat-card">
          <div className="stat-label">Ventas desde el último corte</div>
          <div className="stat-value">${summary?.sales_total?.toFixed(2) ?? '—'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"># de ventas</div>
          <div className="stat-value">{summary?.sale_count ?? '—'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Efectivo esperado en caja</div>
          <div className="stat-value">${Number(cashExpected).toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ventas en las últimas 4 horas</div>
          <div className="stat-value">{sales.length}</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Actividad reciente</h3>
        {loading ? (
          <p>Cargando...</p>
        ) : sales.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No hay ventas en las últimas 4 horas.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Folio</th>
                <th>Origen</th>
                <th>Hora</th>
                <th>Cajero</th>
                <th>Métodos de pago</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id}>
                  <td>#{s.id}</td>
                  <td>
                    <span className={s.org_id === 2 ? 'badge badge-green' : 'badge badge-gray'}>
                      {s.org_id === 2 ? '☕ Café' : '🏪 Tienda'}
                    </span>
                  </td>
                  <td>{new Date(s.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{s.cashier_name || '—'}</td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {(s.payments || []).map((p) => `${p.method_name}: $${Number(p.amount).toFixed(2)}`).join(' · ')}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>${Number(s.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
