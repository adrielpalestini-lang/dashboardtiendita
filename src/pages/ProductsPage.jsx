import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getProductsList, updateProduct, toggleProductActive } from '../api';
import { useAuth } from '../context/AuthContext';

const ORG_ID = 1;

export default function ProductsPage() {
  const { user } = useAuth();
  const [data, setData] = useState({ products: [], page: 1, totalPages: 1 });
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async (page = 1, query = q) => {
    setLoading(true);
    try {
      const res = await getProductsList(ORG_ID, page, 20, query);
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openEdit = (p) => {
    setEditing({
      id: p.id,
      name: p.name,
      description: p.description || '',
      category: p.category || '',
      unit_type: p.unit_type || 'pieza',
      pieces_per_box: p.pieces_per_box || 1,
      stock_alert_limit: p.stock_alert_limit || 5,
      price_with_tax: p.price_with_tax || '',
      cost_no_tax: p.cost_no_tax || '',
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProduct(editing.id, {
        name: editing.name,
        description: editing.description,
        category: editing.category,
        unit_type: editing.unit_type,
        pieces_per_box: Number(editing.pieces_per_box),
        stock_alert_limit: Number(editing.stock_alert_limit),
        org_id: ORG_ID,
        price_with_tax: editing.price_with_tax ? Number(editing.price_with_tax) : undefined,
        cost_no_tax: editing.cost_no_tax ? Number(editing.cost_no_tax) : undefined,
        user_id: user?.id,
      });
      setEditing(null);
      load(data.page);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (p) => {
    await toggleProductActive(p.id, ORG_ID, !p.is_active);
    load(data.page);
  };

  return (
    <Layout>
      <h1 className="page-title">Productos — Tienda</h1>

      <div className="card" style={{ display: 'flex', gap: 10 }}>
        <input
          className="input"
          placeholder="Buscar por nombre o SKU..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(1, q)}
        />
        <button className="btn btn-primary" onClick={() => load(1, q)}>Buscar</button>
      </div>

      <div className="card">
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Precio (c/IVA)</th>
                  <th>Costo</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.sku}</td>
                    <td>{p.name}</td>
                    <td>{p.category || '—'}</td>
                    <td>${Number(p.price_with_tax || 0).toFixed(2)}</td>
                    <td>${Number(p.cost_no_tax || 0).toFixed(2)}</td>
                    <td>
                      <span className={p.is_active ? 'badge badge-green' : 'badge badge-red'}>
                        {p.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline btn-small" onClick={() => openEdit(p)}>Editar</button>
                      <button className="btn btn-outline btn-small" onClick={() => handleToggle(p)}>
                        {p.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex-between" style={{ marginTop: 16 }}>
              <button className="btn btn-outline btn-small" disabled={data.page <= 1} onClick={() => load(data.page - 1)}>◀ Anterior</button>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Página {data.page} de {data.totalPages}</span>
              <button className="btn btn-outline btn-small" disabled={data.page >= data.totalPages} onClick={() => load(data.page + 1)}>Siguiente ▶</button>
            </div>
          </>
        )}
      </div>

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Editar producto</h3>

            <div className="form-row">
              <label>Nombre</label>
              <input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div className="form-row">
              <label>Descripción</label>
              <input className="input" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            </div>
            <div className="form-row">
              <label>Categoría</label>
              <input className="input" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="form-row" style={{ flex: 1 }}>
                <label>Precio con IVA</label>
                <input className="input" type="number" step="0.01" value={editing.price_with_tax} onChange={(e) => setEditing({ ...editing, price_with_tax: e.target.value })} />
              </div>
              <div className="form-row" style={{ flex: 1 }}>
                <label>Costo (sin IVA)</label>
                <input className="input" type="number" step="0.01" value={editing.cost_no_tax} onChange={(e) => setEditing({ ...editing, cost_no_tax: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="form-row" style={{ flex: 1 }}>
                <label>Piezas por caja</label>
                <input className="input" type="number" value={editing.pieces_per_box} onChange={(e) => setEditing({ ...editing, pieces_per_box: e.target.value })} />
              </div>
              <div className="form-row" style={{ flex: 1 }}>
                <label>Alerta de stock mínimo</label>
                <input className="input" type="number" value={editing.stock_alert_limit} onChange={(e) => setEditing({ ...editing, stock_alert_limit: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn btn-green" style={{ flex: 1 }} disabled={saving} onClick={handleSave}>
                {saving ? 'Guardando...' : '✓ Guardar cambios'}
              </button>
              <button className="btn btn-outline" onClick={() => setEditing(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
