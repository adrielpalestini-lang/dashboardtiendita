import { useEffect, useState, Fragment } from 'react';
import Layout from '../components/Layout';
import { getCashCutsHistory, getCashCutSales } from '../api';
import { fmtDateTime, fmtTime } from '../utils/dates';

const money = (v) => `$${Number(v || 0).toFixed(2)}`;

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
    setDetail(null);
    setLoadingDetail(true);
    try {
      const res = await getCashCutSales(cutId);
      setDetail(res);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Métodos de pago (además de efectivo) presentes en los cortes de esta página.
  // Dinámico a propósito: si mañana agregan "Transferencia" en payment_methods,
  // aparece solo como columna, sin tocar este componente.
  const paymentMethods = [...new Set(
    data.cuts.flatMap((c) => (c.payments_breakdown || []).map((m) => m.method_name))
  )].filter((name) => !name.toLowerCase().includes('efectivo'));

  const getMethodTotal = (cut, methodName) => {
    const found = (cut.payments_breakdown || []).find((m) => m.method_name === methodName);
    return found ? Number(found.total) : 0;
  };

  // Ventas olvidadas que se registraron al cerrar el corte (suman en "Total ventas")
  const getManualTotal = (cut) =>
    (cut.manual_adjustments || []).reduce((a, x) => a + Number(x.amount || 0), 0);

  // Fijas: Periodo, Cajero, Fondo, Total ventas, Devoluciones, Esperado, Contado, Diferencia, flecha
  const FIXED_COLS = 9;

  return (
    <Layout>
      <h1 className="page-title">Cortes de caja</h1>

      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <p>Cargando...</p>
        ) : data.cuts.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Aún no hay cortes registrados.</p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Cierre del corte</th>
                  <th>Cajero</th>
                  <th>Fondo de caja</th>
                  <th>Total ventas</th>
                  <th>Devoluciones</th>
                  {paymentMethods.map((m) => (
                    <th key={m}>{m}</th>
                  ))}
                  <th>Efectivo esperado</th>
                  <th>Efectivo contado</th>
                  <th>Diferencia</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.cuts.map((c) => {
                  const manual = getManualTotal(c);
                  return (
                    <Fragment key={c.id}>
                      <tr style={{ cursor: 'pointer' }} onClick={() => toggleExpand(c.id)}>
                        <td>
                          <div>{fmtDateTime(c.period_end)}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            desde {fmtDateTime(c.period_start)}
                          </div>
                        </td>
                        <td>{c.user_name || '—'}</td>
                        <td>{money(c.opening_fund)}</td>
                        <td>
                          {money(c.sales_total)}
                          {manual > 0 && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              incl. {money(manual)} olvidadas
                            </div>
                          )}
                        </td>
                        <td style={{ color: Number(c.returns_total) > 0 ? 'var(--danger, #c0392b)' : undefined }}>
                          {money(c.returns_total)}
                        </td>
                        {paymentMethods.map((m) => (
                          <td key={m}>{money(getMethodTotal(c, m))}</td>
                        ))}
                        <td>{money(c.expected_cash)}</td>
                        <td>{money(c.counted_cash)}</td>
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
                            {Number(c.difference) >= 0 ? '+' : '-'}${Math.abs(Number(c.difference)).toFixed(2)}
                          </span>
                        </td>
                        <td>{expandedId === c.id ? '▲' : '▼'}</td>
                      </tr>
                      {expandedId === c.id && (
                        <tr>
                          <td colSpan={FIXED_COLS + paymentMethods.length} style={{ background: 'var(--gray-lighter)' }}>
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
                                      <tr key={s.id} style={s.is_cancelled ? { opacity: 0.55 } : undefined}>
                                        <td>
                                          #{s.id}
                                          {s.is_cancelled && (
                                            <span className="badge badge-red" style={{ marginLeft: 6 }}>Cancelada</span>
                                          )}
                                        </td>
                                        <td>{s.org_name}</td>
                                        <td>{fmtTime(s.created_at)}</td>
                                        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                          {(s.payments || []).map((p) => `${p.method_name}: $${Number(p.amount).toFixed(2)}`).join(' · ')}
                                        </td>
                                        <td
                                          style={{
                                            textAlign: 'right',
                                            textDecoration: s.is_cancelled ? 'line-through' : undefined,
                                          }}
                                        >
                                          {money(s.total)}
                                        </td>
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
                  );
                })}
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
