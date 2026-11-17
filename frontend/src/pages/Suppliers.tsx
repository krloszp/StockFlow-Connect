import React, { useEffect, useState } from 'react';
import { Users, Plus, Trash2, Edit2, Phone, Mail, MapPin, Search } from 'lucide-react';
import { api } from '../services/api';

export const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/suppliers');
      setSuppliers(res.data.suppliers || []);
    } catch (err: any) {
      console.error('Error al cargar proveedores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenModal = (supplier?: any) => {
    if (supplier) {
      setEditingId(supplier.id);
      setName(supplier.name);
      setContactName(supplier.contactName || '');
      setPhone(supplier.phone || '');
      setEmail(supplier.email || '');
      setAddress(supplier.address || '');
    } else {
      setEditingId(null);
      setName('');
      setContactName('');
      setPhone('');
      setEmail('');
      setAddress('');
    }
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('El nombre del proveedor es obligatorio.');
      return;
    }

    try {
      const payload = { name, contactName, phone, email, address };
      if (editingId) {
        await api.put(`/suppliers/${editingId}`, payload);
      } else {
        await api.post('/suppliers', payload);
      }
      setShowModal(false);
      fetchSuppliers();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error al guardar el proveedor.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este proveedor?')) return;
    try {
      await api.delete(`/suppliers/${id}`);
      fetchSuppliers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar proveedor.');
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    (s.contactName && s.contactName.toLowerCase().includes(search.toLowerCase())) ||
    (s.phone && s.phone.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users color="var(--primary)" /> Gestión de <span className="gradient-text">Proveedores</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Administra proveedores y productos asociados. Registra pedidos y compras desde Inventario → +Stock.
          </p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary"><Plus size={18} /><span>Nuevo Proveedor</span></button>
      </div>

      {/* Buscador */}
      <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Search size={18} color="var(--text-dim)" />
        <input
          type="text"
          className="form-input"
          style={{ background: 'transparent', border: 'none' }}
          placeholder="Buscar proveedor por nombre o contacto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grid de Proveedores */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Cargando proveedores...</div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No hay proveedores registrados aún. ¡Haz clic en "Nuevo Proveedor" para crear uno!
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {filteredSuppliers.map((sup) => (
            <div key={sup.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>{sup.name}</h3>
                  <span className="badge badge-success">{sup._count?.products || 0} Productos</span>
                </div>

                {sup.contactName && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    <strong>Contacto:</strong> {sup.contactName}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                  {sup.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Phone size={14} /> {sup.phone}</div>}
                  {sup.email && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={14} /> {sup.email}</div>}
                  {sup.address && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={14} /> {sup.address}</div>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--bg-card-border)' }}>
                <button onClick={() => handleOpenModal(sup)} className="btn btn-secondary" style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem' }}>
                  <Edit2 size={14} /> Editar
                </button>
                <button onClick={() => handleDelete(sup.id)} className="btn btn-secondary" style={{ padding: '0.4rem', color: 'var(--danger)' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Modal Formulario */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editingId ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
            
            {errorMsg && <div className="form-error" style={{ marginBottom: '1rem' }}>{errorMsg}</div>}

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Nombre del Proveedor / Empresa *</label>
                <input type="text" className="form-input" placeholder="Ej: Distribuidora Montería S.A.S." value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Persona de Contacto</label>
                <input type="text" className="form-input" placeholder="Ej: Juan Pérez" value={contactName} onChange={(e) => setContactName(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Teléfono / WhatsApp</label>
                <input type="text" className="form-input" placeholder="Ej: +57 300 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Correo Electrónico</label>
                <input type="email" className="form-input" placeholder="proveedor@contacto.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Dirección</label>
                <input type="text" className="form-input" placeholder="Ej: Calle 24 # 5-30, Montería" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
