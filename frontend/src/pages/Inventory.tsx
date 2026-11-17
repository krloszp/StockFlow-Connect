import React, { useEffect, useState } from 'react';
import { Package, Plus, Search, Edit2, Trash2, AlertTriangle, ArrowUpRight, PackagePlus, Send, CalendarDays } from 'lucide-react';
import { api } from '../services/api';

const formatDateInput = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const Inventory: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [expiringProducts, setExpiringProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);

  // Form State para Crear / Editar
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');
  const [description, setDescription] = useState('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>('');
  const [minStock, setMinStock] = useState<number | ''>(5);
  const [supplierId, setSupplierId] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  
  // Stock Modal State
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [stockToAdd, setStockToAdd] = useState<number | ''>('');
  const [stockIntent, setStockIntent] = useState<'order' | 'acquired' | ''>('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [purchaseSupplierId, setPurchaseSupplierId] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierContact, setSupplierContact] = useState('');
  const [purchaseInvoice, setPurchaseInvoice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(formatDateInput(new Date()));
  const [purchasePaymentMethod, setPurchasePaymentMethod] = useState('EFECTIVO');
  const [purchaseAmountPaid, setPurchaseAmountPaid] = useState<number | ''>('');
  const [purchaseNote, setPurchaseNote] = useState('');
  const [purchaseLines, setPurchaseLines] = useState<any[]>([]);
  const [purchaseError, setPurchaseError] = useState('');
  const [movements, setMovements] = useState<Record<string, any[]>>({});

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
      setExpiringProducts(alertRes.data.expiringProducts || []);
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
      setCategory(product.category || 'General');
      setDescription(product.description || '');
      setCostPrice(product.costPrice);
      setSellingPrice(product.sellingPrice);
      setStock(product.stock);
      setMinStock(product.minStock);
      setSupplierId(product.supplierId);
      setExpirationDate(product.expirationDate ? String(product.expirationDate).slice(0, 10) : '');
    } else {
      setEditingId(null);
      setName('');
      setCategory('General');
      setDescription('');
      setCostPrice('');
      setSellingPrice('');
      setStock(0);
      setMinStock(5);
      setSupplierId(suppliers.length > 0 ? suppliers[0].id : '');
      setExpirationDate('');
    }
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !category.trim() || !supplierId || costPrice === '' || sellingPrice === '') {
      setErrorMsg('Por favor completa todos los campos obligatorios (*).');
      return;
    }

    if (stock === '' || Number(stock) < 0) {
      setErrorMsg('El stock debe ser un número mayor o igual a 0.');
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        category: category.trim() || 'General',
        description: description.trim(),
        costPrice: Number(costPrice),
        sellingPrice: Number(sellingPrice),
        stock: Number(stock),
        minStock: minStock === '' ? 5 : Number(minStock),
        supplierId,
        expirationDate: expirationDate || null
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
    setStockIntent('');
    setSupplierSearch(product.supplier?.name || '');
    setPurchaseSupplierId(product.supplierId || '');
    setSupplierPhone(product.supplier?.phone || '');
    setSupplierContact(product.supplier?.contactName || '');
    setPurchaseInvoice('');
    setPurchaseDate(formatDateInput(new Date()));
    setPurchasePaymentMethod('EFECTIVO');
    setPurchaseAmountPaid('');
    setPurchaseNote('');
    setPurchaseLines([{ productId: product.id, quantity: 1, unitCost: product.costPrice, sellingPrice: product.sellingPrice, expirationDate: '', newProduct: null }]);
    setPurchaseError('');
    setShowStockModal(true);
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || stockIntent !== 'acquired') return;
    if (!purchaseSupplierId && !supplierSearch.trim()) { setPurchaseError('Busca un proveedor o escribe el nombre del tercero.'); return; }
    if (purchaseLines.some(line => !line.quantity || Number(line.quantity) < 1 || line.unitCost === '' || Number(line.unitCost) < 0 || (line.newProduct && !line.newProduct.name.trim()))) {
      setPurchaseError('Revisa las cantidades, costos y precios de venta.'); return;
    }
    try {
      await api.post('/suppliers/purchases', {
        supplierId: purchaseSupplierId || undefined,
        supplierName: purchaseSupplierId ? undefined : supplierSearch.trim(),
        supplierPhone: supplierPhone.trim() || undefined,
        supplierContactName: supplierContact.trim() || undefined,
        invoiceNumber: purchaseInvoice,
        purchaseDate,
        paymentMethod: purchasePaymentMethod,
        amountPaid: purchaseAmountPaid === '' ? undefined : Number(purchaseAmountPaid),
        note: purchaseNote,
        items: purchaseLines.map(line => ({ ...line, expirationDate: line.expirationDate || undefined }))
      });
      setShowStockModal(false);
      fetchData();
    } catch (err: any) {
      setPurchaseError(err.response?.data?.message || 'Error al registrar la compra.');
    }
  };

  const supplierMatches = suppliers.filter(s => `${s.name} ${s.phone || ''} ${s.contactName || ''}`.toLowerCase().includes(supplierSearch.toLowerCase()));

  const sendSupplierOrder = () => {
    const supplier = suppliers.find(s => s.id === purchaseSupplierId);
    const phone = String(supplierPhone || supplier?.phone || '').replace(/\D/g, '');
    const name = supplier?.contactName || supplier?.name || supplierSearch.trim();
    if (!name || !phone || !stockToAdd || Number(stockToAdd) < 1) { setPurchaseError('Escribe el nombre y teléfono del proveedor y define la cantidad que vas a pedir.'); return; }
    const internationalPhone = phone.startsWith('57') ? phone : `57${phone}`;
    const message = `Hola ${name}, quisiera hacer un pedido de ${selectedProduct.name}. Cantidad: ${stockToAdd} unidades. ¿Me confirmas disponibilidad, precio y fecha de entrega?`;
    window.open(`https://wa.me/${internationalPhone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
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

  const handleWriteOff = async (product: any) => {
    const quantity = Number(window.prompt(`Unidades a dar de baja de ${product.name} (disponibles: ${product.stock}):`));
    if (!Number.isInteger(quantity) || quantity < 1) return;
    const reason = window.prompt('Motivo de la baja (vencimiento, daño, pérdida, etc.):');
    if (!reason?.trim()) return;
    try { await api.post(`/products/${product.id}/write-off`, { quantity, reason }); await fetchData(); }
    catch (err: any) { alert(err.response?.data?.message || 'No se pudo registrar la merma.'); }
  };
  const handleMovements = async (product: any) => {
    try { const { data } = await api.get(`/products/${product.id}/movements`); setMovements(prev => ({ ...prev, [product.id]: data.movements || [] })); }
    catch { alert('No se pudo cargar el kardex.'); }
  };

  const filteredProducts = products.filter(p =>
    `${p.name} ${p.category || ''}`.toLowerCase().includes(search.toLowerCase())
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '.8rem', marginBottom: '1.5rem' }}>
        {[
          ['Inventario a costo', products.reduce((s, p) => s + p.stock * p.costPrice, 0)],
          ['Venta potencial', products.reduce((s, p) => s + p.stock * p.sellingPrice, 0)],
          ['Utilidad potencial', products.reduce((s, p) => s + p.stock * (p.sellingPrice - p.costPrice), 0)]
        ].map(([label, amount]) => <div key={String(label)} className="glass-panel" style={{ padding: '1rem 1.25rem' }}><div style={{ color: 'var(--text-muted)', fontSize: '.82rem' }}>{label}</div><strong style={{ fontSize: '1.35rem', color: 'var(--accent)' }}>${Number(amount).toLocaleString('es-CO')}</strong></div>)}
      </div>

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

      {expiringProducts.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', color: 'var(--danger)', fontWeight: 600, marginBottom: '.6rem' }}><CalendarDays size={18} />Productos vencidos o próximos a vencer (30 días)</div>
          <div style={{ display: 'flex', gap: '.65rem', flexWrap: 'wrap' }}>{expiringProducts.map(p => {
            const expiryDay = String(p.expirationDate).slice(0, 10);
            const expired = expiryDay < formatDateInput(new Date());
            const digits = String(p.supplier?.phone || '').replace(/\D/g, '');
            const waPhone = digits ? (digits.startsWith('57') ? digits : `57${digits}`) : '';
            const message = `Hola ${p.supplier?.contactName || p.supplier?.name || 'proveedor'}, tenemos ${p.name} ${expired ? 'vencido' : 'próximo a vencer'} el ${new Date(p.expirationDate).toLocaleDateString('es-CO')}. ¿Podemos revisar el cambio o la devolución?`;
            return <div className="badge" key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', background: 'rgba(239, 68, 68, 0.14)', color: 'var(--danger)' }}><span>{p.name} · {expired ? 'VENCIDO' : 'vence'} {new Date(p.expirationDate).toLocaleDateString('es-CO')} · Proveedor: {p.supplier?.name || 'N/A'} ({p.supplier?.phone || 'sin teléfono'})</span>{waPhone && <a title="Avisar al proveedor por WhatsApp" href={`https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', color: 'inherit' }}><Send size={13} /></a>}</div>;
          })}</div>
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
                <th style={{ padding: '1rem' }}>Categoría</th>
                <th style={{ padding: '1rem' }}>Proveedor</th>
                <th style={{ padding: '1rem' }}>P. Compra</th>
                <th style={{ padding: '1rem' }}>P. Venta</th>
                <th style={{ padding: '1rem' }}>Ganancia/Unid</th>
                <th style={{ padding: '1rem' }}>Valor a costo</th>
                <th style={{ padding: '1rem' }}>Stock Actual</th>
                <th style={{ padding: '1rem' }}>Vencimiento</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => {
                const profit = p.sellingPrice - p.costPrice;
                const margin = p.sellingPrice > 0 ? profit / p.sellingPrice * 100 : 0;
                const isCritical = p.stock <= p.minStock;

                return (
                  <React.Fragment key={p.id}><tr style={{ borderBottom: '1px solid var(--bg-card-border)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{p.name}</div>
                      {p.description && <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{p.description}</div>}
                    </td>
                    <td style={{ padding: '1rem' }}><span className="badge">{p.category || 'General'}</span></td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{p.supplier?.name || 'N/A'}</td>
                    <td style={{ padding: '1rem' }}>${p.costPrice.toLocaleString()}</td>
                    <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--accent)' }}>${p.sellingPrice.toLocaleString()}</td>
                    <td style={{ padding: '1rem', color: 'var(--primary)' }}>+${profit.toLocaleString()} <small>({margin.toLocaleString('es-CO', { maximumFractionDigits: 1 })}%)</small></td>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>${(p.stock * p.costPrice).toLocaleString('es-CO')}</td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${isCritical ? 'badge-danger' : 'badge-success'}`}>
                        {p.stock} unidades {isCritical && '(¡Crítico!)'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: p.expirationDate ? 'var(--text-main)' : 'var(--text-dim)' }}>{p.expirationDate ? new Date(p.expirationDate).toLocaleDateString('es-CO') : '—'}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button onClick={() => handleOpenStockModal(p)} className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', color: 'var(--accent)' }} title="Aumentar Stock (HU-008)">
                          <ArrowUpRight size={14} /> +Stock
                        </button>
                        <button onClick={() => handleOpenModal(p)} className="btn btn-secondary" style={{ padding: '0.4rem', fontSize: '0.8rem' }}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleWriteOff(p)} className="btn btn-secondary" style={{ padding: '0.4rem', color: 'var(--danger)' }} title="Registrar merma"><AlertTriangle size={14} /></button>
                        <button onClick={() => handleMovements(p)} className="btn btn-secondary" style={{ padding: '0.4rem', color: 'var(--accent)' }} title="Ver kardex">Kardex</button>
                        <button onClick={() => handleDelete(p.id)} className="btn btn-secondary" style={{ padding: '0.4rem', color: 'var(--danger)' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {movements[p.id]?.length > 0 && <tr><td colSpan={10} style={{ padding: '0 1rem 1rem' }}><div className="glass-panel" style={{ padding: '.75rem' }}><strong>Movimientos recientes · {p.name}</strong>{movements[p.id].map((m: any) => <div key={m.id} style={{ display: 'flex', gap: '1rem', paddingTop: '.4rem', color: 'var(--text-muted)' }}><span>{new Date(m.createdAt).toLocaleString('es-CO')}</span><b>{m.type}</b><span>{m.quantity} und.</span><span>Costo ${Number(m.unitCost).toLocaleString('es-CO')}</span><span>{m.note || ''}</span></div>)}</div></td></tr>}</React.Fragment>
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
                <label className="form-label">Categoría *</label>
                <input type="text" className="form-input" placeholder="Ej: Abarrotes, Bebidas, Aseo" value={category} onChange={e => setCategory(e.target.value)} required />
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
                  <label className="form-label">{editingId ? 'Stock Actual *' : 'Stock Inicial *'}</label>
                  <input type="number" min="0" className="form-input" placeholder="0" value={stock} onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock Mínimo (Alerta)</label>
                  <input type="number" min="0" className="form-input" placeholder="5" value={minStock} onChange={(e) => setMinStock(e.target.value === '' ? '' : Number(e.target.value))} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Descripción Opcional</label>
                <input type="text" className="form-input" placeholder="Ej: Bolsa de 1000g de arroz grano entero" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>

              <div className="form-group"><label className="form-label">Fecha de vencimiento (opcional)</label><input type="date" className="form-input" value={expirationDate} onChange={e => setExpirationDate(e.target.value)} /></div>

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
          <div className="glass-panel" style={{ width: '100%', maxWidth: '720px', padding: '1.5rem', maxHeight: '92vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '.4rem' }}>Entrada de mercancía</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '.88rem', marginBottom: '1rem' }}>Producto: <strong>{selectedProduct.name}</strong> · Stock actual: {selectedProduct.stock}</p>
            {!stockIntent ? <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setStockIntent('order')}><Send size={16} /> Pedir al proveedor</button>
              <button type="button" className="btn btn-primary" onClick={() => setStockIntent('acquired')}><PackagePlus size={16} /> Ya adquirí el producto</button>
            </div> : <>
              <div className="form-group">
                <label className="form-label">Buscar proveedor por nombre o teléfono</label>
                <input className="form-input" value={supplierSearch} onChange={e => { setSupplierSearch(e.target.value); setPurchaseSupplierId(''); }} placeholder="Nombre, contacto o teléfono" />
                {!purchaseSupplierId && supplierSearch.trim() && supplierMatches.length > 0 && <div className="glass-panel" style={{ marginTop: '.35rem', maxHeight: 150, overflowY: 'auto', padding: '.25rem' }}>{supplierMatches.slice(0, 8).map(s => <button type="button" key={s.id} onClick={() => { setPurchaseSupplierId(s.id); setSupplierSearch(`${s.name}${s.phone ? ` · ${s.phone}` : ''}`); setSupplierPhone(s.phone || ''); setSupplierContact(s.contactName || ''); }} style={{ display: 'block', width: '100%', textAlign: 'left', border: 0, background: 'transparent', color: 'var(--text-main)', padding: '.55rem', cursor: 'pointer' }}><strong>{s.name}</strong><span style={{ color: 'var(--text-dim)' }}> · {s.phone || 'sin teléfono'}{s.contactName ? ` · ${s.contactName}` : ''}</span></button>)}</div>}
              </div>
              {stockIntent === 'order' ? <>
                <div className="form-group"><label className="form-label">Teléfono WhatsApp</label><input className="form-input" value={supplierPhone} onChange={e => setSupplierPhone(e.target.value)} placeholder="+57 300…" /></div>
                <div className="form-group"><label className="form-label">Cantidad que vas a pedir</label><input type="number" min="1" className="form-input" value={stockToAdd} onChange={e => setStockToAdd(e.target.value === '' ? '' : Number(e.target.value))} /></div>
                <p style={{ color: 'var(--text-dim)', fontSize: '.82rem', marginBottom: '1rem' }}>Se abrirá WhatsApp con un mensaje listo para enviar. El inventario solo cambia cuando registres la compra recibida.</p>
                {purchaseError && <div className="form-error" style={{ marginBottom: '.75rem' }}>{purchaseError}</div>}
                <button type="button" className="btn btn-primary" onClick={sendSupplierOrder}><Send size={16} /> Preparar pedido por WhatsApp</button>
              </> : <form onSubmit={handleAddStock}>
                {!purchaseSupplierId && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.65rem' }}><div className="form-group"><label className="form-label">Teléfono del tercero</label><input className="form-input" value={supplierPhone} onChange={e => setSupplierPhone(e.target.value)} /></div><div className="form-group"><label className="form-label">Persona de contacto</label><input className="form-input" value={supplierContact} onChange={e => setSupplierContact(e.target.value)} /></div></div>}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: '.65rem' }}>
                  <div className="form-group"><label className="form-label">Fecha de compra *</label><input type="date" className="form-input" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} required /></div>
                  <div className="form-group"><label className="form-label">Factura (opcional)</label><input className="form-input" value={purchaseInvoice} onChange={e => setPurchaseInvoice(e.target.value)} placeholder="Número de factura" /></div>
                  <div className="form-group"><label className="form-label">Medio de pago</label><select className="form-input" value={purchasePaymentMethod} onChange={e => setPurchasePaymentMethod(e.target.value)}><option value="EFECTIVO">Efectivo</option><option value="TRANSFERENCIA">Transferencia</option><option value="TARJETA">Tarjeta</option><option value="CREDITO">Crédito / pendiente</option></select></div>
                  <div className="form-group"><label className="form-label">Valor pagado</label><input type="number" min="0" className="form-input" value={purchaseAmountPaid} onChange={e => setPurchaseAmountPaid(e.target.value === '' ? '' : Number(e.target.value))} placeholder={purchasePaymentMethod === 'CREDITO' ? 'Vacío = pendiente total' : 'Vacío = total pagado'} /></div>
                </div>
                <div style={{ display: 'grid', gap: '.75rem', marginTop: '.5rem' }}>
                  {purchaseLines.map((line, index) => <div key={index} className="glass-panel" style={{ padding: '.8rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '.55rem' }}>
                    <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}><label className="form-label">Producto comprado</label><select className="form-input" value={line.newProduct ? '__new__' : line.productId} onChange={e => { const value = e.target.value; setPurchaseLines(prev => prev.map((item, i) => i !== index ? item : value === '__new__' ? { ...item, productId: '', newProduct: { name: '', category: selectedProduct.category || 'General', sellingPrice: Number(item.unitCost) || 0, minStock: 5 } } : { ...item, productId: value, newProduct: null, unitCost: products.find(p => p.id === value)?.costPrice ?? item.unitCost, sellingPrice: products.find(p => p.id === value)?.sellingPrice ?? item.sellingPrice })); }}><option value="">Seleccionar producto existente</option>{products.map(p => <option key={p.id} value={p.id}>{p.name} · compra ${p.costPrice.toLocaleString()} · venta ${p.sellingPrice.toLocaleString()}</option>)}<option value="__new__">+ Agregar un producto nuevo</option></select></div>
                    {line.newProduct && <><div className="form-group"><label className="form-label">Nombre</label><input className="form-input" value={line.newProduct.name} onChange={e => setPurchaseLines(prev => prev.map((item, i) => i === index ? { ...item, newProduct: { ...item.newProduct, name: e.target.value } } : item))} required /></div><div className="form-group"><label className="form-label">Categoría</label><input className="form-input" value={line.newProduct.category} onChange={e => setPurchaseLines(prev => prev.map((item, i) => i === index ? { ...item, newProduct: { ...item.newProduct, category: e.target.value } } : item))} /></div></>}
                    <div className="form-group"><label className="form-label">Cantidad</label><input type="number" min="1" className="form-input" value={line.quantity} onChange={e => setPurchaseLines(prev => prev.map((item, i) => i === index ? { ...item, quantity: Number(e.target.value) } : item))} required /></div>
                    <div className="form-group"><label className="form-label">Costo unitario</label><input type="number" min="0" className="form-input" value={line.unitCost} onChange={e => setPurchaseLines(prev => prev.map((item, i) => i === index ? { ...item, unitCost: e.target.value === '' ? '' : Number(e.target.value) } : item))} required /></div>
                    <div className="form-group"><label className="form-label">Precio de venta</label><input type="number" min="0" className="form-input" value={line.newProduct ? line.newProduct.sellingPrice : line.sellingPrice} onChange={e => setPurchaseLines(prev => prev.map((item, i) => i === index ? item.newProduct ? { ...item, newProduct: { ...item.newProduct, sellingPrice: Number(e.target.value) } } : { ...item, sellingPrice: Number(e.target.value) } : item))} required /></div>
                    <div className="form-group"><label className="form-label">Vencimiento (opcional)</label><input type="date" className="form-input" value={line.expirationDate} onChange={e => setPurchaseLines(prev => prev.map((item, i) => i === index ? { ...item, expirationDate: e.target.value } : item))} /></div>
                    {purchaseLines.length > 1 && <button type="button" className="btn btn-secondary" style={{ alignSelf: 'end' }} onClick={() => setPurchaseLines(prev => prev.filter((_, i) => i !== index))}><Trash2 size={14} /> Quitar</button>}
                    {!line.newProduct && line.productId && Number(line.unitCost) !== Number(products.find(p => p.id === line.productId)?.costPrice) && <span style={{ gridColumn: '1 / -1', color: 'var(--warning)', fontSize: '.8rem' }}>El nuevo costo se guardará como otra presentación del producto; el registro anterior conservará su precio y ganancia.</span>}
                  </div>)}
                </div>
                <button type="button" className="btn btn-secondary" style={{ marginTop: '.7rem' }} onClick={() => setPurchaseLines(prev => [...prev, { productId: '', quantity: 1, unitCost: 0, sellingPrice: 0, expirationDate: '', newProduct: null }])}><Plus size={15} /> Agregar producto a la compra</button>
                <div className="form-group" style={{ marginTop: '.75rem' }}><label className="form-label">Nota (opcional)</label><input className="form-input" value={purchaseNote} onChange={e => setPurchaseNote(e.target.value)} placeholder="Observaciones de compra" /></div>
                <div style={{ margin: '.8rem 0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}><strong>Total compra: ${purchaseLines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.unitCost || 0), 0).toLocaleString('es-CO')}</strong><span style={{ color: 'var(--accent)' }}>Ganancia estimada: ${purchaseLines.reduce((sum, line) => sum + Number(line.quantity || 0) * (Number(line.newProduct?.sellingPrice ?? line.sellingPrice ?? 0) - Number(line.unitCost || 0)), 0).toLocaleString('es-CO')}</span></div>
                {purchaseError && <div className="form-error" style={{ marginBottom: '.75rem' }}>{purchaseError}</div>}
                <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap' }}><button type="button" className="btn btn-secondary" onClick={() => setShowStockModal(false)}>Cancelar</button><button type="submit" className="btn btn-primary"><PackagePlus size={16} /> Registrar compra y aumentar stock</button></div>
              </form>}
            </>}
            <div style={{ marginTop: '1.25rem' }}><button type="button" className="btn btn-secondary" onClick={() => setShowStockModal(false)}>Cerrar</button></div>
          </div>
        </div>
      )}
    </div>
  );
};
