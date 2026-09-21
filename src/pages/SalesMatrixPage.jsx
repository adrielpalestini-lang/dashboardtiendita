import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getSalesMatrix } from '../api';

const DAYS = [
  { dow: 1, label: 'L' },
  { dow: 2, label: 'M' },
  { dow: 3, label: 'X' },
  { dow: 4, label: 'J' },
  { dow: 5, label: 'V' },
  { dow: 6, label: 'S' },
  { dow: 7, label: 'D' },
];

const SLOTS = Array.from({ length: 48 }, (_, i) => i * 30); // minutos desde medianoche, cada 30

function formatSlot(minutes) {
  const fmt = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  return `${fmt(minutes)} - ${fmt(minutes + 30)}`;
}

function toISODate(d) {
  return d.toISOString().split('T')[0];
}

export default function SalesMatrixPage() {
  const today = new Date();
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);

  const [from, setFrom] = useState(toISODate(monthAgo));
  const [to, setTo] = useState(toISODate(today));
  const [orgId, setOrgId] = useState(''); // '' = todas
  const [matrix, setMatrix] = useState({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const rows = await getSalesMatrix(1, orgId || null, from, to);
      const m = {};
      for (const r of rows) {
        if (!m[r.dow]) m[r.dow] = {};
        m[r.dow][r.slot_minutes] = r.total;
      }
      setMatrix(m);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getVal = (dow, slot) => matrix[dow]?.[slot] || 0;
  const maxVal = Math.max(1, ...DAYS.flatMap((d) => SLOTS.map((s) => getVal(d.dow, s))));
  const rowTotal = (slot) => DAYS.reduce((a, d) => a + getVal(d.dow, slot), 0);
  const colTotal = (dow) => SLOTS.reduce((a, s) => a + getVal(dow, s), 0);
  const grandTotal = SLOTS.reduce((a, s) => a + rowTotal(s), 0);

  const cellStyle = (val) => {
    if (!val) return {};
    const ratio = val / maxVal;
    return { background: `rgba(46, 134, 222, ${0.08 + ratio * 0.55})`, fontWeight: ratio > 0.5 ? 'bold' : 'normal' };
  };

  return (
    <Layout>
      <h1 className="page-title">Reporte matricial de ventas por horario</h1>

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
          <label>Unidad de negocio</label>
          <select className="input" value={orgId} onChange={(e) => setOrgId(e.target.value)}>
            <option value="">Todas</option>
            <option value="1">🏪 Tienda</option>
            <option value="2">☕ Cafetería</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={load}>Filtrar</button>
      </div>

      <div className="card-grid">
        <div className="stat-card">
          <div className="stat-label">Total del período</div>
          <div className="stat-value">${grandTotal.toFixed(2)}</div>
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <table style={{ fontSize: '0.78rem' }}>
            <thead>
              <tr>
                <th>Horario</th>
                {DAYS.map((d) => <th key={d.dow} style={{ textAlign: 'center' }}>{d.label}</th>)}
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {SLOTS.map((slot) => (
                <tr key={slot}>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{formatSlot(slot)}</td>
                  {DAYS.map((d) => {
                    const val = getVal(d.dow, slot);
                    return (
                      <td key={d.dow} style={{ textAlign: 'center', ...cellStyle(val) }}>
                        {val > 0 ? `$${val.toFixed(0)}` : '—'}
                      </td>
                    );
                  })}
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>${rowTotal(slot).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ fontWeight: 'bold' }}>Total</td>
                {DAYS.map((d) => (
                  <td key={d.dow} style={{ textAlign: 'center', fontWeight: 'bold' }}>${colTotal(d.dow).toFixed(2)}</td>
                ))}
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>${grandTotal.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </Layout>
  );
}