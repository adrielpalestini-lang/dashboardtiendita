import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import {
  getPromotions,
  getPromotionDetail,
  createPromotion,
  updatePromotion,
  deactivatePromotion,
  getProductsList,
  getCafeProductsList,
} from '../api';

const TYPE_LABELS = {
  percentage: 'Porcentaje de descuento',
  fixed_amount: 'Monto fijo de descuento',
  nxm: 'Paga X, lleva Y (ej. 3x2)',
};

const SCOPE_LABELS = {
  all: 'Todo el catálogo',
  category: 'Una categoría',
  products: 'Productos específicos (tienda)',
  cafe_products: 'Productos específicos (cafetería)',
};

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const emptyForm = {
  id: null,
  name: '',
  description: '',
  type: 'percentage',
  discount_pct: '',
  discount_amount: '',
  buy_qty: '',
  pay_qty: '',
  scope: 'all',
  category: '',
  start_date: '',
  end_date: '',
  days_of_week: [],
  is_active: true,
  items: [],
};

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const [storeProducts, setStoreProducts] = useState([]);
  const [cafeProducts, setCafeProducts] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getPromotions(1);
      setPromotions(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    getProductsList(1, 1, 500).then((r) => setStoreProducts(r.products));
    getCafeProductsList(2).then(setCafeProducts);
  }, []);

  const openNew = () => setForm({ ...emptyForm });

  const openEdit = async (promo) => {
    const detail = await getPromotionDetail(promo.id);
    setForm({
      ...emptyForm,
      ...detail,
      discount_pct: detail.discount_pct || '',
      discount_amount: detail.discount_amount || '',
      buy_qty: detail.buy_qty || '',
      pay_qty: detail.pay_qty || '',
      category: detail.category || '',
      start_date: detail.start_date ? detail.start_date.split('T')[0] : '',
      end_date: detail.end_date ? detail.end_date.split('T')[0] : '',
      days_of_week: detail.days_of_week || [],
      items: detail.items.map((i) => ({ product_id: i.product_id, cafe_product_id: i.cafe_product_id })),
    });
  };

  const toggleDay = (dayIdx) => {
    setForm((f) => ({
      ...f,
      days_of_week: f.days_of_week.includes(dayIdx)
        ? f.days_of_week.filter((d) => d !== dayIdx)
        : [...f.days_of_week, dayIdx],
    }));
  };

  const toggleItem = (kind, id) => {
    setForm((f) => {
      const key = kind === 'store' ? 'product_id' : 'cafe_product_id';
      const exists = f.items.some((i) => i[key] === id);
      if (exists) {
        return { ...f, items: f.items.filter((i) => i[key] !== id) };
      }
      return { ...f, items: [...f.items, { [key]: id }] };
    });
  };

  const isItemSelected = (kind, id) => {
    const key = kind === 'store' ? 'product_id' : 'cafe_product_id';
    return form.items.some((i) => i[key] === id);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        org_id: form.scope === 'cafe_products' ? 2 : 1,
        name: form.name,
        description: form.description,
        type: form.type,
        discount_pct: form.type === 'percentage' ? Number(form.discount_pct) : null,
        discount_amount: form.type === 'fixed_amount' ? Number(form.discount_amount) : null,
        buy_qty: form.type === 'nxm' ? Number(form.buy_qty) : null,
        pay_qty: form.type === 'nxm' ? Number(form.pay_qty) : null,
        scope: form.scope,
        category: form.scope === 'category' ? form.category : null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        days_of_week: form.days_of_week.length > 0 ? form.days_of_week : null,
        is_active: form.is_active,
        items: form.scope === 'products' || form.scope === 'cafe_products' ? form.items : [],
      };

      if (form.id) {
        await updatePromotion(form.id, payload);
      } else {
        await createPromotion(payload);
      }
      setForm(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id) => {
    await deactivatePromotion(id);
    load();
  };

  const describePromo = (p) => {
    if (p.type === 'percentage') return `${Number(p.discount_pct)}% de descuento`;
    if (p.type === 'fixed_amount') return `$${Number(p.discount_amount).toFixed(2)} de descuento`;
    if (p.type === 'nxm') return `Paga ${p.pay_qty}, lleva ${p.buy_qty}`;
    return '—';
  };

  const categories = [...new Set(storeProducts.map((p) => p.category).filter(Boolean))];

  return (
    <Layout>
      <div className="flex-between">
        <h1 className="page-title">Promociones</h1>
        <button className="btn btn-primary" onClick={openNew}>+ Nueva promoción</button>
      </div>

      <div className="card">
        {loading ? (
          <p>Cargando...</p>
        ) : promotions.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Aún no hay promociones creadas.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Alcance</th>
                <th>Vigencia</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td>{describePromo(p)}</td>
                  <td>{SCOPE_LABELS[p.scope]}{p.scope === 'category' ? ` (${p.category})` : ''}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {p.start_date || p.end_date
                      ? `${p.start_date ? new Date(p.start_date).toLocaleDateString('es-MX') : '...'} → ${p.end_date ? new Date(p.end_date).toLocaleDateString('es-MX') : '...'}`
                      : 'Sin fecha límite'}
                  </td>
                  <td>
                    <span className={p.is_active ? 'badge badge-green' : 'badge badge-red'}>
                      {p.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-outline btn-small" onClick={() => openEdit(p)}>Editar</button>
                    {p.is_active && (
                      <button className="btn btn-outline btn-small" onClick={() => handleDeactivate(p.id)}>Desactivar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {form && (
        <div className="modal-overlay" onClick={() => setForm(null)}>
          <div className="modal-box" style={{ width: 560 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{form.id ? 'Editar' : 'Nueva'} promoción</h3>

            <div className="form-row">
              <label>Nombre</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. 2x1 en cafés fríos" />
            </div>

            <div className="form-row">
              <label>Descripción (opcional)</label>
              <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="form-row">
              <label>Tipo de promoción</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {Object.entries(TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            {form.type === 'percentage' && (
              <div className="form-row">
                <label>Porcentaje de descuento (%)</label>
                <input className="input" type="number" step="0.01" value={form.discount_pct} onChange={(e) => setForm({ ...form, discount_pct: e.target.value })} placeholder="Ej. 15" />
              </div>
            )}

            {form.type === 'fixed_amount' && (
              <div className="form-row">
                <label>Monto de descuento ($)</label>
                <input className="input" type="number" step="0.01" value={form.discount_amount} onChange={(e) => setForm({ ...form, discount_amount: e.target.value })} placeholder="Ej. 20" />
              </div>
            )}

            {form.type === 'nxm' && (
              <div style={{ display: 'flex', gap: 10 }}>
                <div className="form-row" style={{ flex: 1 }}>
                  <label>Lleva (cantidad total)</label>
                  <input className="input" type="number" value={form.buy_qty} onChange={(e) => setForm({ ...form, buy_qty: e.target.value })} placeholder="Ej. 3" />
                </div>
                <div className="form-row" style={{ flex: 1 }}>
                  <label>Paga (cuántas cobra)</label>
                  <input className="input" type="number" value={form.pay_qty} onChange={(e) => setForm({ ...form, pay_qty: e.target.value })} placeholder="Ej. 2" />
                </div>
              </div>
            )}

            <div className="form-row">
              <label>Aplica a</label>
              <select className="input" value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value, items: [] })}>
                {Object.entries(SCOPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            {form.scope === 'category' && (
              <div className="form-row">
                <label>Categoría</label>
                <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="">Selecciona...</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}

            {form.scope === 'products' && (
              <div className="form-row">
                <label>Selecciona los productos ({form.items.length} elegidos)</label>
                <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 6, padding: 8 }}>
                  {storeProducts.map((p) => (
                    <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                      <input type="checkbox" checked={isItemSelected('store', p.id)} onChange={() => toggleItem('store', p.id)} />
                      <span style={{ fontSize: '0.85rem' }}>{p.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {form.scope === 'cafe_products' && (
              <div className="form-row">
                <label>Selecciona los productos de cafetería ({form.items.length} elegidos)</label>
                <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 6, padding: 8 }}>
                  {cafeProducts.map((p) => (
                    <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                      <input type="checkbox" checked={isItemSelected('cafe', p.id)} onChange={() => toggleItem('cafe', p.id)} />
                      <span style={{ fontSize: '0.85rem' }}>☕ {p.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <div className="form-row" style={{ flex: 1 }}>
                <label>Vigencia desde (opcional)</label>
                <input className="input" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div className="form-row" style={{ flex: 1 }}>
                <label>Vigencia hasta (opcional)</label>
                <input className="input" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>

            <div className="form-row">
              <label>Días de la semana en que aplica (deja vacío = todos los días)</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {DAYS.map((day, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => toggleDay(idx)}
                    className="btn btn-small"
                    style={{
                      background: form.days_of_week.includes(idx) ? 'var(--primary)' : 'var(--white)',
                      color: form.days_of_week.includes(idx) ? 'var(--white)' : 'var(--text)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {form.id && (
              <div className="form-row">
                <label>
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} style={{ marginRight: 6 }} />
                  Activa
                </label>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn btn-green" style={{ flex: 1 }} disabled={saving || !form.name} onClick={handleSave}>
                {saving ? 'Guardando...' : '✓ Guardar promoción'}
              </button>
              <button className="btn btn-outline" onClick={() => setForm(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}