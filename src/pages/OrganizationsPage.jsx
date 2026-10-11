import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { adminListOrgs, adminUpdateOrg, adminCreateOrg } from '../utils/adminApi';

const LABELS = {
  name: 'Nombre comercial',
  razon_social: 'Razón social',
  business_name: 'Razón social',
  rfc: 'RFC',
  plan_type: 'Plan',
  is_active: 'Activa',
  loyalty_earn_pct: '% de lealtad (monedero)',
  created_at: 'Creada',
};
const humanize = (n) => LABELS[n] || n.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
const NUMERIC = ['integer', 'smallint', 'bigint', 'numeric', 'real', 'double precision'];
const isLong = (c) => c.type === 'text' || (c.max_length && c.max_length > 250);

const toForm = (cols, row) => {
  const f = {};
  cols.filter((c) => !c.readonly).forEach((c) => {
    const v = row ? row[c.name] : null;
    f[c.name] = c.type === 'boolean' ? (row ? !!v : true) : v == null ? '' : String(v);
  });
  return f;
};

function Field({ col, value, onChange }) {
  if (col.type === 'boolean') {
    return (
      <label>
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} style={{ marginRight: 6 }} />
        {humanize(col.name)}
      </label>
    );
  }
  const num = NUMERIC.includes(col.type);
  const Tag = isLong(col) && !num ? 'textarea' : 'input';
  return (
    <>
      <label>
        {humanize(col.name)}{!col.nullable && !col.has_default ? ' *' : ''}
      </label>
      <Tag
        className="input"
        type={num ? 'number' : undefined}
        step={num && col.scale ? String(1 / 10 ** col.scale) : undefined}
        maxLength={col.max_length || undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={Tag === 'textarea' ? 3 : undefined}
        style={name_upper(col) ? { textTransform: 'uppercase' } : undefined}
      />
    </>
  );
}
const name_upper = (c) => c.name === 'rfc';

function OrgCard({ cols, org, onSaved }) {
  const editable = cols.filter((c) => !c.readonly);
  const [form, setForm] = useState(() => toForm(cols, org));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const dirty = editable.some((c) => String(form[c.name] ?? '') !== String(toForm(cols, org)[c.name] ?? ''));

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const body = { ...form };
      if (body.rfc) body.rfc = String(body.rfc).toUpperCase().trim();
      const saved = await adminUpdateOrg(org.id, body);
      onSaved(saved);
      setForm(toForm(cols, saved));
      setMsg({ ok: true, text: 'Guardado' });
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="flex-between" style={{ marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>{org.name} <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.8rem' }}>(id {org.id})</span></h3>
        <span className={org.is_active === false ? 'badge badge-red' : 'badge badge-green'}>
          {org.is_active === false ? 'Inactiva' : 'Activa'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        {editable.map((c) => (
          <div className="form-row" key={c.name} style={isLong(c) ? { gridColumn: '1 / -1' } : undefined}>
            <Field col={c} value={form[c.name]} onChange={(v) => setForm({ ...form, [c.name]: v })} />
          </div>
        ))}
      </div>

      {form.is_active === false && org.is_active !== false && (
        <p style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>
          Al guardar, esta organización dejará de aparecer en el punto de venta.
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
        <button className="btn btn-green" disabled={!dirty || saving} onClick={save}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {msg && <span style={{ fontSize: '0.85rem', color: msg.ok ? 'green' : 'var(--danger)' }}>{msg.text}</span>}
      </div>
    </div>
  );
}

export default function OrganizationsPage() {
  const [data, setData] = useState({ columns: [], rows: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newForm, setNewForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newError, setNewError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setData(await adminListOrgs());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const createOrg = async () => {
    setSaving(true);
    setNewError('');
    try {
      const body = { ...newForm };
      if (body.rfc) body.rfc = String(body.rfc).toUpperCase().trim();
      await adminCreateOrg(body);
      setNewForm(null);
      await load();
    } catch (e) {
      setNewError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const editable = data.columns.filter((c) => !c.readonly);

  return (
    <Layout>
      <div className="flex-between" style={{ marginBottom: 12 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Organizaciones</h1>
        <button className="btn btn-primary" disabled={loading || !!error} onClick={() => { setNewError(''); setNewForm(toForm(data.columns, null)); }}>
          + Nueva organización
        </button>
      </div>

      <div className="card" style={{ marginBottom: 16, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        Estos datos (razón social, RFC, etc.) los usa el punto de venta para imprimir los tickets.
        Los cambios aplican a las ventas nuevas; los tickets ya impresos no cambian.
      </div>

      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      {loading ? (
        <p>Cargando...</p>
      ) : (
        data.rows.map((o) => (
          <OrgCard
            key={o.id}
            cols={data.columns}
            org={o}
            onSaved={(saved) => setData((d) => ({ ...d, rows: d.rows.map((r) => (r.id === saved.id ? saved : r)) }))}
          />
        ))
      )}

      {newForm && (
        <div className="modal-overlay" onClick={() => setNewForm(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>Nueva organización</h3>
            {editable.map((c) => (
              <div className="form-row" key={c.name}>
                <Field col={c} value={newForm[c.name]} onChange={(v) => setNewForm({ ...newForm, [c.name]: v })} />
              </div>
            ))}
            {newError && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{newError}</p>}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn btn-green" style={{ flex: 1 }} disabled={saving} onClick={createOrg}>
                {saving ? 'Guardando...' : 'Crear'}
              </button>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setNewForm(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
