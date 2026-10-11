import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getSalesDaily, getCafeTopProducts, getCashFundSummary } from '../api';
import { todayMX, daysAgoMX, fmtDay } from '../utils/dates';

export default function SalesReportPage() {
  const [from, setFrom] = useState(daysAgoMX(30));
  const [to, setTo] = useState(todayMX());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [topProducts, setTopProducts] = useState([]);
  const [fundSummary, setFundSummary] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [dailyData, topData, fundData] = await Promise.all([
        getSalesDaily(1, from, to),
        getCafeTopProducts(1, from, to),
        getCashFundSummary(1, from, to),
      ]);
      setRows(dailyData);
      setTopProducts(topData);
      setFundSummary(fundData);
    } catch (e) {
      setError(e.message || 'No se pudo cargar el reporte');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sum = (k) => rows.reduce((a, r) => a + Number(r[k] || 0), 0);
  const totalPeriodo = sum('total');
  const totalTienda = sum('total_tienda');
  const totalCafe = sum('total_cafe');
  const maxTotal = Math.max(...rows.map((r) => Number(r.total)), 1);

  return (
    <Layout>
      <h1 className="page-title">Reporte de ventas</h1>

      <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
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

      {error && <p style={{ color: 'var(--danger)' }}>⚠️ {error}</p>}

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

      <div className="card-grid">
        <div className="stat-card">
          <div className="stat-label">Descuentos otorgados</div>
          <div className="stat-value" style={{ color: 'var(--danger, #c0392b)' }}>${sum('total_descuentos').toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cancelaciones</div>
          <div className="stat-value" style={{ color: 'var(--danger, #c0392b)' }}>
            ${sum('total_cancelaciones').toFixed(2)}
            <span style={{ fontSize: '0.7rem', display: 'block' }}>{sum('cancelled_count')} ventas</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Devoluciones parciales</div>
          <div className="stat-value" style={{ color: 'var(--danger, #c0392b)' }}>${sum('total_devoluciones').toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Fondo de caja aportado</div>
          <div className="stat-value">${Number(fundSummary?.total_fondo ?? 0).toFixed(2)}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            en {fundSummary?.cuts_count ?? 0} corte(s)
          </div>
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
                <th>Descuentos</th>
                <th>Cancelaciones</th>
                <th>Devoluciones</th>
                <th>Total</th>
                <th style={{ width: 160 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={String(r.day)}>
                  <td>{fmtDay(r.day)}</td>
                  <td>{r.sale_count}</td>
                  <td>${Number(r.total_tienda).toFixed(2)}</td>
                  <td>${Number(r.total_cafe).toFixed(2)}</td>
                  <td style={{ color: 'var(--danger, #c0392b)' }}>${Number(r.total_descuentos).toFixed(2)}</td>
                  <td style={{ color: 'var(--danger, #c0392b)' }}>${Number(r.total_cancelaciones).toFixed(2)}</td>
                  <td style={{ color: 'var(--danger, #c0392b)' }}>${Number(r.total_devoluciones).toFixed(2)}</td>
                  <td style={{ fontWeight: 'bold' }}>${Number(r.total).toFixed(2)}</td>
                  <td>
                    <div style={{ background: 'var(--gray-light)', borderRadius: 4, height: 10, overflow: 'hidden' }}>
                      <div style={{ width: `${(Number(r.total) / maxTotal) * 100}%`, background: 'var(--primary)', height: '100%' }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>☕ Productos de cafetería más vendidos</h3>
        {loading ? (
          <p>Cargando...</p>
        ) : topProducts.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No hay ventas de cafetería en este período.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad vendida</th>
                <th># de tickets</th>
                <th style={{ textAlign: 'right' }}>Ingresos</th>
                <th style={{ width: 160 }}></th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p, idx) => {
                const maxQty = Math.max(...topProducts.map((x) => Number(x.total_qty)), 1);
                return (
                  <tr key={p.cafe_product_id}>
                    <td>
                      {idx === 0 && '🥇 '}
                      {idx === 1 && '🥈 '}
                      {idx === 2 && '🥉 '}
                      ☕ {p.name}
                    </td>
                    <td>{p.total_qty}</td>
                    <td>{p.times_sold}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>${Number(p.total_revenue).toFixed(2)}</td>
                    <td>
                      <div style={{ background: 'var(--gray-light)', borderRadius: 4, height: 10, overflow: 'hidden' }}>
                        <div style={{ width: `${(Number(p.total_qty) / maxQty) * 100}%`, background: 'var(--cafe)', height: '100%' }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
