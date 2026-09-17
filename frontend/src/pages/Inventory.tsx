import React, { useEffect, useState } from 'react';
import { Package, Plus, Search, Edit2, Trash2, AlertTriangle, ArrowUpRight, DollarSign } from 'lucide-react';
import { api } from '../services/api';

export const Inventory: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);

  // Form State para Crear / Editar
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>('');
  const [minStock, setMinStock] = useState<number | ''>(5);
  const [supplierId, setSupplierId] = useState('');
  
  // Stock Modal State
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [stockToAdd, setStockToAdd] = useState<number | ''>('');

  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, supRes, alertRes] = await Promise.all([
        api.get('/products'),
        api.get('/suppliers'),
        api.get('/products/alerts')
      ]);

      setProducts(prodRes.data.products || []);
      setSuppliers(supRes.data.suppliers || []);
      setAlerts(alertRes.data.criticalProducts || []);
    } catch (err: any) {
      console.error('Error cargando inventario:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (product?: any) => {
    if (product) {
      setEditingId(product.id);
      setName(product.name);
      setDescription(product.description || '');
      setCostPrice(product.costPrice);
      setSellingPrice(product.sellingPrice);
      setStock(product.stock);
      setMinStock(product.minStock);
      setSupplierId(product.supplierId);
    } else {
      setEditingId(null);
      setName('');
      setDescription('');
      setCostPrice('');
      setSellingPrice('');
      setStock(0);
      setMinStock(5);
      setSupplierId(suppliers.length > 0 ? suppliers[0].id : '');
    }
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !supplierId || costPrice === '' || sellingPrice === '') {
      setErrorMsg('Por favor completa todos los campos obligatorios (*).');
      return;
    }

    if (Number(sellingPrice) < Number(costPrice)) {
      setErrorMsg('HU-004 Regla de negocio: El precio de venta no puede ser menor al precio de compra ($' + costPrice + ').');
      return;
    }

    try {
      const payload = {
        name,
        description,
        costPrice: Number(costPrice),
        sellingPrice: Number(sellingPrice),
        stock: Number(stock),
        minStock: Number(minStock),
        supplierId
      };

      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
      } else {
        await api.post('/products', payload);
      }

      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error al guardar el producto.');
    }
  };

  const handleOpenStockModal = (product: any) => {
    setSelectedProduct(product);
    setStockToAdd('');
    setShowStockModal(true);
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !stockToAdd || Number(stockToAdd) <= 0) return;

    try {
      await api.patch(`/products/${selectedProduct.id}/stock`, { quantity: Number(stockToAdd) });
      setShowStockModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al aumentar stock.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Deseas eliminar este producto del inventario?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'No se puede eliminar el producto.');
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package color="var(--primary)" /> Control de <span className="gradient-text">Inventario</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Catálogo completo de productos, precios y entradas de mercancía
          </p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary" disabled={suppliers.length === 0}>
          <Plus size={18} />
          <span>Agregar Producto</span>
        </button>
      </div>

      {suppliers.length === 0 && (
        <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', borderLeft: '4px solid var(--warning)', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--warning)' }}>
          <AlertTriangle size={20} />
          <span>Nota: Debes registrar al menos 1 Proveedor en el módulo de Proveedores antes de poder crear productos.</span>
        </div>
      )}

      {/* Alerta de Stock Crítico (HU-009) */}
      {alerts.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)', fontWeight: 600, marginBottom: '0.5rem' }}>
            <AlertTriangle size={18} />
            <span>HU-009 Alerta de Stock Crítico ({alerts.length} productos por agotarse):</span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {alerts.map(a => (
              <span key={a.id} className="badge badge-danger" style={{ display: 'inline-flex', gap: '0.35rem' }}>
                {a.name} (Stock: {a.stock} / Mín: {a.minStock}) — Proveedor: {a.supplier?.name} ({a.supplier?.phone || 'Sin tel'})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Buscador */}
      <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Search size={18} color="var(--text-dim)" />
        <input
          type="text"
          className="form-input"
          style={{ background: 'transparent', border: 'none' }}
          placeholder="Buscar producto por nombre (HU-005)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabla de Productos */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Cargando inventario...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No hay productos encontrados en el inventario.
        </div>
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--bg-card-border)', background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '1rem' }}>Producto</th>
                <th style={{ padding: '1rem' }}>Proveedor</th>
                <th style={{ padding: '1rem' }}>P. Compra</th>
                <th style={{ padding: '1rem' }}>P. Venta</th>
                <th style={{ padding: '1rem' }}>Ganancia/Unid</th>
                <th style={{ padding: '1rem' }}>Stock Actual</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => {
                const profit = p.sellingPrice - p.costPrice;
                const isCritical = p.stock <= p.minStock;

                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--bg-card-border)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{p.name}</div>
                      {p.description && <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{p.description}</div>}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{p.supplier?.name || 'N/A'}</td>
                    <td style={{ padding: '1rem' }}>${p.costPrice.toLocaleString()}</td>
                    <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--accent)' }}>${p.sellingPrice.toLocaleString()}</td>
                    <td style={{ padding: '1rem', color: 'var(--primary)' }}>+${profit.toLocaleString()}</td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${isCritical ? 'badge-danger' : 'badge-success'}`}>
                        {p.stock} unidades {isCritical && '(¡Crítico!)'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button onClick={() => handleOpenStockModal(p)} className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', color: 'var(--accent)' }} title="Aumentar Stock (HU-008)">
                          <ArrowUpRight size={14} /> +Stock
                        </button>
                        <button onClick={() => handleOpenModal(p)} className="btn btn-secondary" style={{ padding: '0.4rem', fontSize: '0.8rem' }}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="btn btn-secondary" style={{ padding: '0.4rem', color: 'var(--danger)' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Formulario Producto */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '540px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editingId ? 'Editar Producto' : 'Crear Nuevo Producto (HU-004)'}</h2>
            {errorMsg && <div className="form-error" style={{ marginBottom: '1rem' }}>{errorMsg}</div>}

            <form onSubmit={handleSaveProduct}>
              <div className="form-group">
                <label className="form-label">Nombre del Producto *</label>
                <input type="text" className="form-input" placeholder="Ej: Arroz Diana 1Kg" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Proveedor Asociado (Obligatorio) *</label>
                <select className="form-input" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required>
                  <option value="">Selecciona un Proveedor...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Precio de Compra ($) *</label>
                  <input type="number" className="form-input" placeholder="3200" value={costPrice} onChange={(e) => setCostPrice(e.target.value === '' ? '' : Number(e.target.value))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Precio de Venta ($) *</label>
                  <input type="number" className="form-input" placeholder="4000" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Stock Inicial *</label>
                  <input type="number" className="form-input" placeholder="50" value={stock} onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock Mínimo (Alerta)</label>
                  <input type="number" className="form-input" placeholder="5" value={minStock} onChange={(e) => setMinStock(e.target.value === '' ? '' : Number(e.target.value))} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Descripción Opcional</label>
                <input type="text" className="form-input" placeholder="Ej: Bolsa de 1000g de arroz grano entero" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Guardar Producto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Aumentar Stock (HU-008) */}
      {showStockModal && selectedProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
            <h2 style={{ marginBottom: '0.5rem' }}>Entrada de Mercancía</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Aumentar stock para: <strong>{selectedProduct.name}</strong> (Actual: {selectedProduct.stock})
            </p>

            <form onSubmit={handleAddStock}>
              <div className="form-group">
                <label className="form-label">Cantidad a Ingresar *</label>
                <input type="number" min="1" className="form-input" placeholder="Ej: 20" value={stockToAdd} onChange={(e) => setStockToAdd(e.target.value === '' ? '' : Number(e.target.value))} required />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowStockModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>+ Agregar Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
