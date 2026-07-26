import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import {
  getCafeIngredients,
  createCafeIngredient,
  updateCafeIngredient,
  adjustCafeIngredientStock,
  getCafeProductsList,
  getCafeRecipe,
  addRecipeLine,
  deleteRecipeLine,
} from '../api';
import { useAuth } from '../context/AuthContext';

const UNIT_TYPES = ['ml', 'l', 'g', 'kg', 'pieza'];
const emptyIngredient = { id: null, sku: '', name: '', unit_type: 'ml', stock_alert_limit: 500, initial_stock: '' };

export default function CafeIngredientsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('insumos');

  // Insumos
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');

  // Recetas
  const [cafeProducts, setCafeProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [recipe, setRecipe] = useState([]);
  const [newLine, setNewLine] = useState({ ingredient_product_id: '', quantity: '', unit: 'ml' });

  const loadIngredients = async () => {
    setLoading(true);
    try {
      const res = await getCafeIngredients(1);
      setIngredients(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIngredients();
    getCafeProductsList(2).then(setCafeProducts);
  }, []);

  const handleSaveIngredient = async () => {
    setSaving(true);
    try {
      if (form.id) {
        await updateCafeIngredient(form.id, {
          name: form.name,
          unit_type: form.unit_type,
          stock_alert_limit: Number(form.stock_alert_limit),
        });
      } else {
        await createCafeIngredient({
          sku: form.sku,
          name: form.name,
          unit_type: form.unit_type,
          stock_alert_limit: Number(form.stock_alert_limit),
          initial_stock: Number(form.initial_stock) || 0,
          warehouse_id: 1,
          user_id: user?.id,
        });
      }
      setForm(null);
      loadIngredients();
    } finally {
      setSaving(false);
    }
  };

  const handleAdjust = async () => {
    if (!adjustQty) return;
    setSaving(true);
    try {
      await adjustCafeIngredientStock(adjustTarget.id, {
        warehouse_id: 1,
        quantity_change: Number(adjustQty),
        notes: adjustNotes,
        user_id: user?.id,
      });
      setAdjustTarget(null);
      setAdjustQty('');
      setAdjustNotes('');
      loadIngredients();
    } finally {
      setSaving(false);
    }
  };

  const selectProductForRecipe = async (product) => {
    setSelectedProduct(product);
    const res = await getCafeRecipe(product.id);
    setRecipe(res);
  };

  const handleAddRecipeLine = async () => {
    if (!newLine.ingredient_product_id || !newLine.quantity) return;
    await addRecipeLine(selectedProduct.id, {
      ingredient_product_id: Number(newLine.ingredient_product_id),
      quantity: Number(newLine.quantity),
      unit: newLine.unit,
    });
    setNewLine({ ingredient_product_id: '', quantity: '', unit: 'ml' });
    const res = await getCafeRecipe(selectedProduct.id);
    setRecipe(res);
  };

  const handleDeleteRecipeLine = async (recipeId) => {
    await deleteRecipeLine(recipeId);
    const res = await getCafeRecipe(selectedProduct.id);
    setRecipe(res);
  };

  const alertCount = ingredients.filter((i) => i.needs_reorder).length;

  return (
    <Layout>
      <div className="flex-between">
        <h1 className="page-title">
          Insumos de Cafetería
          {alertCount > 0 && <span className="badge badge-red" style={{ marginLeft: 10 }}>{alertCount} en alerta</span>}
        </h1>
      </div>

      <div className="tabs-row">
        <button className={`tab-btn ${tab === 'insumos' ? 'active' : ''}`} onClick={() => setTab('insumos')}>
          📦 Insumos y stock
        </button>
        <button className={`tab-btn ${tab === 'recetas' ? 'active' : ''}`} onClick={() => setTab('recetas')}>
          📋 Recetas
        </button>
      </div>

      {tab === 'insumos' && (
        <>
          <div className="flex-between" style={{ marginBottom: 10 }}>
            <div />
            <button className="btn btn-primary" onClick={() => setForm({ ...emptyIngredient })}>+ Nuevo insumo</button>
          </div>

          <div className="card">
            {loading ? (
              <p>Cargando...</p>
            ) : ingredients.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>
                Aún no hay insumos dados de alta. Crea leche, café molido, jarabes, vasos, tapas, popotes, etc.
              </p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Insumo</th>
                    <th>Unidad</th>
                    <th>Stock actual</th>
                    <th>Alerta en</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients
                    .sort((a, b) => (a.needs_reorder === b.needs_reorder ? 0 : a.needs_reorder ? -1 : 1))
                    .map((i) => (
                      <tr key={i.id} style={i.needs_reorder ? { background: 'var(--danger-soft)' } : undefined}>
                        <td style={{ fontWeight: 600 }}>{i.name}</td>
                        <td>{i.unit_type}</td>
                        <td>{Number(i.current_stock).toLocaleString()}</td>
                        <td>{i.stock_alert_limit}</td>
                        <td>
                          {i.needs_reorder ? (
                            <span className="badge badge-red">⚠️ Reabastecer</span>
                          ) : (
                            <span className="badge badge-green">OK</span>
                          )}
                        </td>
                        <td style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-outline btn-small"
                            onClick={() => setForm({
                              id: i.id, sku: i.sku, name: i.name, unit_type: i.unit_type,
                              stock_alert_limit: i.stock_alert_limit, initial_stock: '',
                            })}
                          >
                            Editar
                          </button>
                          <button className="btn btn-green btn-small" onClick={() => setAdjustTarget(i)}>
                            Ajustar stock
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {tab === 'recetas' && (
        <div style={{ display: 'flex', gap: 20 }}>
          <div className="card" style={{ flex: 1 }}>
            <h3 style={{ marginTop: 0 }}>Productos de cafetería</h3>
            <table>
              <tbody>
                {cafeProducts.map((p) => (
                  <tr
                    key={p.id}
                    style={{ cursor: 'pointer', background: selectedProduct?.id === p.id ? 'var(--gray-lighter)' : undefined }}
                    onClick={() => selectProductForRecipe(p)}
                  >
                    <td>☕ {p.name}</td>
                    <td style={{ textAlign: 'right' }}>{selectedProduct?.id === p.id ? '▶' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card" style={{ flex: 1.4 }}>
            <h3 style={{ marginTop: 0 }}>
              {selectedProduct ? `Receta — ${selectedProduct.name}` : 'Selecciona un producto'}
            </h3>

            {selectedProduct && (
              <>
                <table>
                  <thead>
                    <tr>
                      <th>Insumo</th>
                      <th>Cantidad</th>
                      <th>Unidad</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipe.map((r) => (
                      <tr key={r.id}>
                        <td>{r.ingredient_name}</td>
                        <td>{r.quantity}</td>
                        <td>{r.unit}</td>
                        <td>
                          <button className="btn btn-danger btn-small" onClick={() => handleDeleteRecipeLine(r.id)}>Quitar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ display: 'flex', gap: 8, marginTop: 14, alignItems: 'flex-end' }}>
                  <div className="form-row" style={{ flex: 2, marginBottom: 0 }}>
                    <label>Insumo</label>
                    <select
                      className="input"
                      value={newLine.ingredient_product_id}
                      onChange={(e) => setNewLine({ ...newLine, ingredient_product_id: e.target.value })}
                    >
                      <option value="">Selecciona...</option>
                      {ingredients.map((i) => (
                        <option key={i.id} value={i.id}>{i.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Cantidad</label>
                    <input className="input" type="number" value={newLine.quantity} onChange={(e) => setNewLine({ ...newLine, quantity: e.target.value })} />
                  </div>
                  <div className="form-row" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Unidad</label>
                    <select className="input" value={newLine.unit} onChange={(e) => setNewLine({ ...newLine, unit: e.target.value })}>
                      {UNIT_TYPES.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <button className="btn btn-primary" onClick={handleAddRecipeLine}>+ Agregar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {form && (
        <div className="modal-overlay" onClick={() => setForm(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{form.id ? 'Editar' : 'Nuevo'} insumo</h3>

            {!form.id && (
              <div className="form-row">
                <label>SKU (opcional, se genera solo si lo dejas vacío)</label>
                <input className="input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
            )}

            <div className="form-row">
              <label>Nombre</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. Leche entera, Café molido, Vaso 12oz..." />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <div className="form-row" style={{ flex: 1 }}>
                <label>Unidad de medida</label>
                <select className="input" value={form.unit_type} onChange={(e) => setForm({ ...form, unit_type: e.target.value })}>
                  {UNIT_TYPES.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="form-row" style={{ flex: 1 }}>
                <label>Avisar cuando quede menos de</label>
                <input className="input" type="number" value={form.stock_alert_limit} onChange={(e) => setForm({ ...form, stock_alert_limit: e.target.value })} />
              </div>
            </div>

            {!form.id && (
              <div className="form-row">
                <label>Stock inicial (opcional)</label>
                <input className="input" type="number" value={form.initial_stock} onChange={(e) => setForm({ ...form, initial_stock: e.target.value })} />
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn btn-green" style={{ flex: 1 }} disabled={saving || !form.name} onClick={handleSaveIngredient}>
                {saving ? 'Guardando...' : '✓ Guardar'}
              </button>
              <button className="btn btn-outline" onClick={() => setForm(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {adjustTarget && (
        <div className="modal-overlay" onClick={() => setAdjustTarget(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Ajustar stock — {adjustTarget.name}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Stock actual: {Number(adjustTarget.current_stock).toLocaleString()} {adjustTarget.unit_type}
            </p>
            <div className="form-row">
              <label>Cantidad a sumar (o negativo para restar)</label>
              <input className="input" type="number" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} placeholder="Ej. 5000 (llegó leche) o -200 (merma)" />
            </div>
            <div className="form-row">
              <label>Nota (opcional)</label>
              <input className="input" value={adjustNotes} onChange={(e) => setAdjustNotes(e.target.value)} placeholder="Ej. Compra proveedor, merma por caducidad..." />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn btn-green" style={{ flex: 1 }} disabled={saving || !adjustQty} onClick={handleAdjust}>
                {saving ? 'Guardando...' : '✓ Confirmar ajuste'}
              </button>
              <button className="btn btn-outline" onClick={() => setAdjustTarget(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}