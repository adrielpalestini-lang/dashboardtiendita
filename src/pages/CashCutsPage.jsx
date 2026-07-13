import { useEffect, useState, Fragment } from 'react';
import Layout from '../components/Layout';
import { getCashCutsHistory, getCashCutSales } from '../api';

export default function CashCutsPage() {
  const [data, setData] = useState({ cuts: [], page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const res = await getCashCutsHistory(1, page, 15);
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  const toggleExpand = async (cutId) => {
    if (expandedId === cutId) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(cutId);
    setLoadingDetail(true);
    try {
      const res = await getCashCutSales(cutId);
      setDetail(res);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <Layout>
      <h1 className="page-title">Cortes de caja</h1>

      <div className="card">
        {loading ? (
          <p>Cargando...</p>
        ) : data.cuts.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Aún no hay cortes registrados.</p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cajero</th>
                  <th>Total ventas</th>
                  <th>Efectivo esperado</th>
                  <th>Efectivo contado</th>
                  <th>Diferencia</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.cuts.map((c) => (
                  <Fragment key={c.id}>
                    <tr style={{ cursor: 'pointer' }} onClick={() => toggleExpand(c.id)}>
                      <td>{new Date(c.period_end).toLocaleString('es-MX')}</td>
                      <td>{c.user_name || '—'}</td>
                      <td>${Number(c.sales_total).toFixed(2)}</td>
                      <td>${Number(c.expected_cash).toFixed(2)}</td>
                      <td>${Number(c.counted_cash).toFixed(2)}</td>
                      <td>
                        <span
                          className={
                            Number(c.difference) === 0
                              ? 'badge badge-gray'
                              : Number(c.difference) > 0
                              ? 'badge badge-green'
                              : 'badge badge-red'
                          }
                        >
                          {Number(c.difference) >= 0 ? '+' : ''}${Number(c.difference).toFixed(2)}
                        </span>
                      </td>
                      <td>{expandedId === c.id ? '▲' : '▼'}</td>
                    </tr>
                    {expandedId === c.id && (
                      <tr>
                        <td colSpan={7} style={{ background: 'var(--gray-lighter)' }}>
                          {loadingDetail ? (
                            <p>Cargando detalle...</p>
                          ) : detail ? (
                            <div style={{ padding: '10px 0' }}>
                              <p style={{ fontWeight: 'bold', marginBottom: 8 }}>
                                Ventas incluidas en este corte ({detail.sales.length})
                              </p>
                              <table>
                                <thead>
                                  <tr>
                                    <th>Folio</th>
                                    <th>Origen</th>
                                    <th>Hora</th>
                                    <th>Métodos</th>
                                    <th style={{ textAlign: 'right' }}>Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {detail.sales.map((s) => (
                                    <tr key={s.id}>
                                      <td>#{s.id}</td>
                                      <td>{s.org_name}</td>
                                      <td>{new Date(s.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</td>
                                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                        {(s.payments || []).map((p) => `${p.method_name}: $${Number(p.amount).toFixed(2)}`).join(' · ')}
                                      </td>
                                      <td style={{ textAlign: 'right' }}>${Number(s.total).toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>

            <div className="flex-between" style={{ marginTop: 16 }}>
              <button
                className="btn btn-outline btn-small"
                disabled={data.page <= 1}
                onClick={() => load(data.page - 1)}
              >
                ◀ Anterior
              </button>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Página {data.page} de {data.totalPages}
              </span>
              <button
                className="btn btn-outline btn-small"
                disabled={data.page >= data.totalPages}
                onClick={() => load(data.page + 1)}
              >
                Siguiente ▶
              </button>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
