import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import {
  getCafeProductsList,
  createCafeProduct,
  updateCafeProduct,
  getCafeModifierGroups,
  getCafeProductModifiers,
  linkModifierGroup,
  unlinkModifierGroup,
} from '../api';

const ORG_ID = 2;

const emptyForm = { id: null, name: '', description: '', base_price: '', is_active: true };

export default function CafeProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const [modifierModal, setModifierModal] = useState(null); // producto seleccionado
  const [allGroups, setAllGroups] = useState([]);
  const [linkedGroups, setLinkedGroups] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getCafeProductsList(ORG_ID);
      setProducts(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        org_id: ORG_ID,
        name: form.name,
        description: form.description,
        base_price: Number(form.base_price) || 0,
        is_active: form.is_active,
      };
      if (form.id) {
        await updateCafeProduct(form.id, payload);
      } else {
        await createCafeProduct(payload);
      }
      setForm(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const openModifiers = async (product) => {
    setModifierModal(product);
    const [groups, linked] = await Promise.all([
      getCafeModifierGroups(ORG_ID),
      getCafeProductModifiers(product.id),
    ]);
    setAllGroups(groups);
    setLinkedGroups(linked);
  };

  const isLinked = (groupId) => linkedGroups.some((g) => g.id === groupId);

  const toggleGroup = async (group) => {
    if (isLinked(group.id)) {
      await unlinkModifierGroup(modifierModal.id, group.id);
    } else {
      await linkModifierGroup(modifierModal.id, group.id, group.sort_order);
    }
    const linked = await getCafeProductModifiers(modifierModal.id);
    setLinkedGroups(linked);
  };

  return (
    <Layout>
      <div className="flex-between">
        <h1 className="page-title">Productos — Cafetería</h1>
        <button className="btn btn-primary" onClick={() => setForm(emptyForm)}>+ Nuevo producto</button>
      </div>

      <div className="card">
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Precio base</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>☕ {p.name}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{p.description || '—'}</td>
                  <td>${Number(p.base_price).toFixed(2)}</td>
                  <td>
                    <span className={p.is_active ? 'badge badge-green' : 'badge badge-red'}>
                      {p.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-outline btn-small" onClick={() => setForm({ ...p, base_price: String(p.base_price) })}>
                      Editar
                    </button>
                    <button className="btn btn-outline btn-small" onClick={() => openModifiers(p)}>
                      Modificadores
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {form && (
        <div className="modal-overlay" onClick={() => setForm(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{form.id ? 'Editar' : 'Nuevo'} producto de cafetería</h3>
            <div className="form-row">
              <label>Nombre</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-row">
              <label>Descripción</label>
              <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-row">
              <label>Precio base</label>
              <input className="input" type="number" step="0.01" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} />
            </div>
            {form.id && (
              <div className="form-row">
                <label>
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    style={{ marginRight: 6 }}
                  />
                  Activo
                </label>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn btn-green" style={{ flex: 1 }} disabled={saving} onClick={handleSave}>
                {saving ? 'Guardando...' : '✓ Guardar'}
              </button>
              <button className="btn btn-outline" onClick={() => setForm(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {modifierModal && (
        <div className="modal-overlay" onClick={() => setModifierModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Modificadores de "{modifierModal.name}"</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Marca los grupos de modificadores que aplican a este producto.
            </p>
            {allGroups.map((g) => (
              <label key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--gray-lighter)' }}>
                <input type="checkbox" checked={isLinked(g.id)} onChange={() => toggleGroup(g)} />
                <span style={{ fontWeight: 600 }}>{g.name}</span>
                {g.required && <span className="badge badge-red">requerido</span>}
                {g.multiple && <span className="badge badge-gray">varios</span>}
              </label>
            ))}
            <button className="btn btn-outline" style={{ marginTop: 16, width: '100%' }} onClick={() => setModifierModal(null)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
