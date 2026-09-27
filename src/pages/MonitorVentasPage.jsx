import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getUsersList, getCartRemovals, getCartRemovalsByCashier } from '../api';

function toISODate(d) {
  return d.toISOString().split('T')[0];
}

export default function MonitorVentasPage() {
  const today = new Date();
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);

  const [from, setFrom] = useState(toISODate(monthAgo));
  const [to, setTo] = useState(toISODate(today));
  const [userId, setUserId] = useState('');
  const [productType, setProductType] = useState('');
  const [users, setUsers] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [data, setData] = useState({ removals: [], page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const [rankingData, removalsData] = await Promise.all([
        getCartRemovalsByCashier(1, from, to),
        getCartRemovals(1, { from, to, userId, productType, page, limit: 20 }),
      ]);
      setRanking(rankingData);
      setData(removalsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUsersList().then(setUsers).catch(() => {});
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxRemovals = Math.max(1, ...ranking.map((r) => r.removals_count));

  return (
    <Layout>
      <h1 className="page-title">🔎 Monitor de ventas</h1>

      <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="form-row" style={{ marginBottom: 0 }}>
          <label>Desde</label>
          <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="form-row" style={{ marginBottom: 0 }}>
          <label>Hasta</label>
          <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="form-row" style={{ marginBottom: 0 }}>
          <label>Cajero</label>
          <select className="input" value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Todos</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
        <div className="form-row" style={{ marginBottom: 0 }}>
          <label>Tipo</label>
          <select className="input" value={productType} onChange={(e) => setProductType(e.target.value)}>
            <option value="">Todos</option>
            <option value="store">🏪 Tienda</option>
            <option value="cafe">☕ Cafetería</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => load(1)}>Filtrar</button>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Remociones por cajero</h3>
        {ranking.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Sin remociones en este período.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Cajero</th>
                <th># de remociones</th>
                <th>Cantidad total removida</th>
                <th># de ventas afectadas</th>
                <th style={{ width: 160 }}></th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r) => (
                <tr key={r.user_id || 'sin-usuario'}>
                  <td>{r.user_name}</td>
                  <td style={{ fontWeight: 'bold' }}>{r.removals_count}</td>
                  <td>{r.total_qty_removed}</td>
                  <td>{r.sales_affected}</td>
                  <td>
                    <div style={{ background: 'var(--gray-light)', borderRadius: 4, height: 10, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${(r.removals_count / maxRemovals) * 100}%`,
                          background: 'var(--danger, #c0392b)',
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

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Detalle de remociones</h3>
        {loading ? (
          <p>Cargando...</p>
        ) : data.removals.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No hay remociones en este período.</p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Fecha/Hora</th>
                  <th>Cajero</th>
                  <th>Venta</th>
                  <th>Unidad</th>
                  <th>Producto</th>
                  <th>Cant.</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {data.removals.map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.created_at).toLocaleString('es-MX')}</td>
                    <td>{r.user_name || '—'}</td>
                    <td>{r.sale_id ? `#${r.sale_id}` : '—'}</td>
                    <td>{r.product_type === 'cafe' ? '☕' : '🏪'} {r.org_name || ''}</td>
                    <td>{r.product_name}</td>
                    <td>{r.quantity_removed}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{r.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex-between" style={{ marginTop: 16 }}>
              <button className="btn btn-outline btn-small" disabled={data.page <= 1} onClick={() => load(data.page - 1)}>
                ◀ Anterior
              </button>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Página {data.page} de {data.totalPages}
              </span>
              <button className="btn btn-outline btn-small" disabled={data.page >= data.totalPages} onClick={() => load(data.page + 1)}>
                Siguiente ▶
              </button>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}