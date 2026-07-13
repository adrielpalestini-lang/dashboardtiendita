import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import {
  getCafeModifierGroups,
  createCafeModifierGroup,
  updateCafeModifierGroup,
  getCafeModifierOptions,
  createCafeModifierOption,
  updateCafeModifierOption,
} from '../api';

const ORG_ID = 2;
const emptyGroup = { id: null, name: '', sort_order: 0, required: false, multiple: false, is_active: true };
const emptyOption = { id: null, group_id: null, name: '', price_delta: 0, sort_order: 0, is_active: true };

export default function ModifiersPage() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupForm, setGroupForm] = useState(null);
  const [optionForm, setOptionForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const res = await getCafeModifierGroups(ORG_ID);
      setGroups(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const selectGroup = async (group) => {
    setSelectedGroup(group);
    const opts = await getCafeModifierOptions(group.id);
    setOptions(opts);
  };

  const handleSaveGroup = async () => {
    setSaving(true);
    try {
      const payload = {
        org_id: ORG_ID,
        name: groupForm.name,
        sort_order: Number(groupForm.sort_order),
        required: groupForm.required,
        multiple: groupForm.multiple,
        is_active: groupForm.is_active,
      };
      if (groupForm.id) {
        await updateCafeModifierGroup(groupForm.id, payload);
      } else {
        await createCafeModifierGroup(payload);
      }
      setGroupForm(null);
      loadGroups();
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOption = async () => {
    setSaving(true);
    try {
      const payload = {
        group_id: optionForm.group_id,
        name: optionForm.name,
        price_delta: Number(optionForm.price_delta),
        sort_order: Number(optionForm.sort_order),
        is_active: optionForm.is_active,
      };
      if (optionForm.id) {
        await updateCafeModifierOption(optionForm.id, payload);
      } else {
        await createCafeModifierOption(payload);
      }
      setOptionForm(null);
      const opts = await getCafeModifierOptions(selectedGroup.id);
      setOptions(opts);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="flex-between">
        <h1 className="page-title">Modificadores</h1>
        <button className="btn btn-primary" onClick={() => setGroupForm(emptyGroup)}>+ Nuevo grupo</button>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        <div className="card" style={{ flex: 1 }}>
          <h3 style={{ marginTop: 0 }}>Grupos</h3>
          {loading ? (
            <p>Cargando...</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Orden</th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <tr
                    key={g.id}
                    style={{ cursor: 'pointer', background: selectedGroup?.id === g.id ? 'var(--gray-lighter)' : undefined }}
                    onClick={() => selectGroup(g)}
                  >
                    <td>
                      {g.name}
                      {g.required && <span className="badge badge-red" style={{ marginLeft: 6 }}>req</span>}
                      {g.multiple && <span className="badge badge-gray" style={{ marginLeft: 6 }}>varios</span>}
                      {!g.is_active && <span className="badge badge-red" style={{ marginLeft: 6 }}>inactivo</span>}
                    </td>
                    <td>{g.sort_order}</td>
                    <td>
                      <button
                        className="btn btn-outline btn-small"
                        onClick={(e) => { e.stopPropagation(); setGroupForm(g); }}
                      >
                        Editar
                      </button>
                    </td>
                    <td>{selectedGroup?.id === g.id ? '▶' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card" style={{ flex: 1 }}>
          <div className="flex-between">
            <h3 style={{ marginTop: 0 }}>
              {selectedGroup ? `Opciones — ${selectedGroup.name}` : 'Selecciona un grupo'}
            </h3>
            {selectedGroup && (
              <button
                className="btn btn-primary btn-small"
                onClick={() => setOptionForm({ ...emptyOption, group_id: selectedGroup.id })}
              >
                + Opción
              </button>
            )}
          </div>

          {selectedGroup && (
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Precio +</th>
                  <th>Orden</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {options.map((o) => (
                  <tr key={o.id}>
                    <td>{o.name} {!o.is_active && <span className="badge badge-red">inactivo</span>}</td>
                    <td>${Number(o.price_delta).toFixed(2)}</td>
                    <td>{o.sort_order}</td>
                    <td>
                      <button
                        className="btn btn-outline btn-small"
                        onClick={() => setOptionForm({ ...o, group_id: selectedGroup.id })}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {groupForm && (
        <div className="modal-overlay" onClick={() => setGroupForm(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{groupForm.id ? 'Editar' : 'Nuevo'} grupo de modificadores</h3>
            <div className="form-row">
              <label>Nombre</label>
              <input className="input" value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} />
            </div>
            <div className="form-row">
              <label>Orden (posición en el flujo)</label>
              <input className="input" type="number" value={groupForm.sort_order} onChange={(e) => setGroupForm({ ...groupForm, sort_order: e.target.value })} />
            </div>
            <div className="form-row">
              <label>
                <input type="checkbox" checked={groupForm.required} onChange={(e) => setGroupForm({ ...groupForm, required: e.target.checked })} style={{ marginRight: 6 }} />
                Requerido
              </label>
            </div>
            <div className="form-row">
              <label>
                <input type="checkbox" checked={groupForm.multiple} onChange={(e) => setGroupForm({ ...groupForm, multiple: e.target.checked })} style={{ marginRight: 6 }} />
                Permite selección múltiple
              </label>
            </div>
            {groupForm.id && (
              <div className="form-row">
                <label>
                  <input type="checkbox" checked={groupForm.is_active} onChange={(e) => setGroupForm({ ...groupForm, is_active: e.target.checked })} style={{ marginRight: 6 }} />
                  Activo
                </label>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn btn-green" style={{ flex: 1 }} disabled={saving} onClick={handleSaveGroup}>
                {saving ? 'Guardando...' : '✓ Guardar'}
              </button>
              <button className="btn btn-outline" onClick={() => setGroupForm(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {optionForm && (
        <div className="modal-overlay" onClick={() => setOptionForm(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{optionForm.id ? 'Editar' : 'Nueva'} opción</h3>
            <div className="form-row">
              <label>Nombre</label>
              <input className="input" value={optionForm.name} onChange={(e) => setOptionForm({ ...optionForm, name: e.target.value })} />
            </div>
            <div className="form-row">
              <label>Precio adicional</label>
              <input className="input" type="number" step="0.01" value={optionForm.price_delta} onChange={(e) => setOptionForm({ ...optionForm, price_delta: e.target.value })} />
            </div>
            <div className="form-row">
              <label>Orden</label>
              <input className="input" type="number" value={optionForm.sort_order} onChange={(e) => setOptionForm({ ...optionForm, sort_order: e.target.value })} />
            </div>
            {optionForm.id && (
              <div className="form-row">
                <label>
                  <input type="checkbox" checked={optionForm.is_active} onChange={(e) => setOptionForm({ ...optionForm, is_active: e.target.checked })} style={{ marginRight: 6 }} />
                  Activo
                </label>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn btn-green" style={{ flex: 1 }} disabled={saving} onClick={handleSaveOption}>
                {saving ? 'Guardando...' : '✓ Guardar'}
              </button>
              <button className="btn btn-outline" onClick={() => setOptionForm(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
