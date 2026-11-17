import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, MessageCircle, PackageCheck, Plus, RefreshCw, Send, Smartphone, Trash2 } from 'lucide-react';
import { api } from '../services/api';

type Product = { id: string; name: string; category?: string; whatsappCode?: string; description?: string | null; sellingPrice: number; stock: number };
type Order = { id: string; customerName: string; customerPhone: string; source: string; status: string; paymentMethod?: string | null; totalAmount: number; createdAt: string; items: { id: string; quantity: number; subtotal: number; product: { name: string } }[] };
type DraftItem = { productId: string; quantity: number };
type Customer = { id: string; name: string; cedula: string; phone?: string | null };

const formatCOP = (amount: number) => `$${amount.toLocaleString('es-CO')}`;
const waLink = (phone: string, text: string) => {
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 10) digits = `57${digits}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
};

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [businessName, setBusinessName] = useState('la tienda');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCedula, setCustomerCedula] = useState('');
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [productQueries, setProductQueries] = useState<Record<number, string>>({});
  const [shareCategory, setShareCategory] = useState('');
  const [items, setItems] = useState<DraftItem[]>([{ productId: '', quantity: 1 }]);

  const load = async () => {
    try {
      setLoading(true);
      const [ordersRes, catalogRes, settingsRes] = await Promise.all([
        api.get('/orders/admin'), api.get('/orders/catalog'), api.get('/settings/business').catch(() => null)
      ]);
      setOrders(ordersRes.data.orders || []);
      setProducts(catalogRes.data.products || []);
      if (settingsRes?.data?.settings?.name) setBusinessName(settingsRes.data.settings.name);
      setError('');
    } catch { setError('No se pudieron cargar los pedidos o el inventario.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  useEffect(() => {
    const query = customerQuery.trim();
    if (query.length < 2 || selectedCustomerId) { setCustomerResults([]); return; }
    const timer = window.setTimeout(async () => {
      try {
        const res = await api.get(`/customers/search?query=${encodeURIComponent(query)}`);
        setCustomerResults(res.data.customers || []);
      } catch { setCustomerResults([]); }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [customerQuery, selectedCustomerId]);

  const selectedLines = useMemo(() => items.map(line => ({ ...line, product: products.find(p => p.id === line.productId) })).filter(line => line.product), [items, products]);
  const pendingOrders = useMemo(() => orders.filter(order => order.status === 'PENDIENTE'), [orders]);
  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category?.trim() || 'General'))).sort((a, b) => a.localeCompare(b, 'es')), [products]);
  const total = selectedLines.reduce((sum, line) => sum + line.product!.sellingPrice * line.quantity, 0);
  const catalogMessage = `Hola${customerName.trim() ? ` ${customerName.trim()}` : ''}, bienvenido a ${businessName}. Elige una categoría de nuestro inventario disponible:\n\n${categories.map((category, index) => `${index + 1}. ${category}`).join('\n')}\n\nRespóndeme con la categoría y te enviaré sus productos, precios y códigos.`;
  const categoryProducts = products.filter(p => (p.category?.trim() || 'General') === shareCategory);
  let internationalPhone = customerPhone.replace(/\D/g, '');
  if (internationalPhone.length === 10) internationalPhone = `57${internationalPhone}`;
  const categoryMessage = `Productos disponibles en ${shareCategory}:\n\n${categoryProducts.map(p => `• [${p.whatsappCode}] ${p.name}${p.description ? ` — ${p.description}` : ''}\n  ${formatCOP(p.sellingPrice)} · ${p.stock} disponibles`).join('\n')}\n\nPara confirmar, envía: SF1|${internationalPhone}|${categoryProducts[0]?.whatsappCode || 'CODIGO'}:2|FIN. Cambia el código y la cantidad; separa varios productos con coma.`;

  const setStatus = async (order: Order, status: string) => {
    try { await api.patch(`/orders/admin/${order.id}/status`, { status }); await load(); }
    catch (e: any) { setError(e.response?.data?.message || 'No se pudo actualizar el pedido.'); }
  };

  const setPaymentMethod = async (order: Order, paymentMethod: 'EFECTIVO' | 'TRANSFERENCIA') => {
    try { await api.patch(`/orders/admin/${order.id}/payment`, { paymentMethod }); await load(); }
    catch (e: any) { setError(e.response?.data?.message || 'No se pudo guardar el medio de pago.'); }
  };

  const deleteCancelledOrder = async (order: Order) => {
    if (!window.confirm(`¿Eliminar el pedido cancelado #${order.id.slice(-8).toUpperCase()}?`)) return;
    try { await api.delete(`/orders/admin/${order.id}`); await load(); }
    catch (e: any) { setError(e.response?.data?.message || 'No se pudo eliminar el pedido cancelado.'); }
  };

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      setSaving(true);
      const res = await api.post('/orders/admin/whatsapp', {
        customerId: selectedCustomerId || undefined, customerName, customerPhone, customerCedula,
        items: selectedLines.map(line => ({ productId: line.productId, quantity: line.quantity }))
      });
      setSuccess(res.data.message || 'Pedido registrado como pendiente de recogida.');
      setCustomerName(''); setCustomerPhone(''); setCustomerCedula(''); setCustomerQuery(''); setSelectedCustomerId(''); setProductQueries({}); setItems([{ productId: '', quantity: 1 }]);
      await load();
    } catch (e: any) { setError(e.response?.data?.message || 'No se pudo registrar el pedido.'); }
    finally { setSaving(false); }
  };

  return <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
      <div><h1>Pedidos de WhatsApp</h1><p style={{ color: 'var(--text-muted)' }}>Comparte el inventario, registra lo que el cliente pidió y prepara su recogida.</p></div>
      <button className="btn btn-secondary" onClick={() => void load()}><RefreshCw size={16} /> Actualizar</button>
    </div>
    {error && <div className="form-error" style={{ marginBottom: '1rem' }}>{error}</div>}
    {success && <div style={{ marginBottom: '1rem', color: 'var(--accent)' }}>{success}</div>}

    <form className="glass-panel" onSubmit={submitOrder} style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
      <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Registrar pedido recibido por WhatsApp</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '.75rem', marginBottom: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <input className="form-input" placeholder="Buscar cliente por nombre, cédula o teléfono" value={customerQuery} onChange={e => { setCustomerQuery(e.target.value); setSelectedCustomerId(''); setCustomerName(''); setCustomerPhone(''); setCustomerCedula(''); }} required={!selectedCustomerId} />
          {customerResults.length > 0 && <div className="glass-panel" style={{ position: 'absolute', zIndex: 5, top: '100%', left: 0, right: 0, maxHeight: 220, overflowY: 'auto', padding: '.35rem' }}>{customerResults.map(customer => <button type="button" key={customer.id} onClick={() => { setSelectedCustomerId(customer.id); setCustomerName(customer.name); setCustomerCedula(customer.cedula); setCustomerPhone(customer.phone || ''); setCustomerQuery(`${customer.name} · CC ${customer.cedula}`); setCustomerResults([]); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '.6rem', border: 0, background: 'transparent', color: 'var(--text-main)', cursor: 'pointer' }}><strong>{customer.name}</strong><br/><small>CC: {customer.cedula} · Tel: {customer.phone || 'Sin teléfono'}</small></button>)}</div>}
        </div>
        <input className="form-input" type="tel" placeholder="WhatsApp, ej. +57 301…" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} required />
        <input className="form-input" placeholder="Cédula del cliente" value={customerCedula} onChange={e => setCustomerCedula(e.target.value)} required />
      </div>
      {customerPhone.trim() && <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <a className="btn btn-secondary" href={waLink(customerPhone, catalogMessage)} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', textDecoration: 'none' }}><MessageCircle size={16} /> Enviar bienvenida y menú de categorías</a>
        <select className="form-input" value={shareCategory} onChange={e => setShareCategory(e.target.value)} style={{ maxWidth: 220 }}><option value="">Elegir categoría</option>{categories.map(category => <option key={category} value={category}>{category}</option>)}</select>
        {shareCategory && categoryProducts.length > 0 && <a className="btn btn-secondary" href={waLink(customerPhone, categoryMessage)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}><MessageCircle size={16} /> Enviar productos de {shareCategory}</a>}
      </div>}
      <div style={{ display: 'grid', gap: '.6rem' }}>
        {items.map((line, index) => {
          const product = products.find(p => p.id === line.productId);
          return <div key={index} style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 1fr) 100px auto auto', alignItems: 'center', gap: '.6rem' }}>
            <input className="form-input" placeholder={product ? `${product.name} · ${formatCOP(product.sellingPrice)} · stock ${product.stock}` : 'Buscar producto para agregar…'} value={productQueries[index] ?? ''} onChange={e => { const value = e.target.value; setProductQueries(prev => ({ ...prev, [index]: value })); setItems(prev => prev.map((item, i) => i === index ? { ...item, productId: '' } : item)); }} required={!line.productId} />
            <input className="form-input" type="number" min="1" max={product?.stock || undefined} value={line.quantity} onChange={e => setItems(prev => prev.map((item, i) => i === index ? { ...item, quantity: Number(e.target.value) } : item))} required aria-label="Cantidad" />
            <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{product ? formatCOP(product.sellingPrice * line.quantity) : ''}</span>
            <button type="button" className="btn btn-secondary" aria-label="Quitar producto" onClick={() => setItems(prev => prev.length > 1 ? prev.filter((_, i) => i !== index) : [{ productId: '', quantity: 1 }])}><Trash2 size={15} /></button>
          </div>;
        })}
      </div>
      {Object.entries(productQueries).filter(([, query]) => query.trim()).map(([row, query]) => {
        const matches = products.filter(p => p.stock > 0 && p.name.toLocaleLowerCase('es').includes(query.trim().toLocaleLowerCase('es'))).slice(0, 12);
        return <section key={row} className="glass-panel" style={{ marginTop: '.75rem', padding: '1rem' }}>
          <h3 style={{ fontSize: '.95rem', marginBottom: '.75rem' }}>Productos encontrados ({matches.length})</h3>
          {matches.length ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '.65rem' }}>{matches.map(p => <button type="button" key={p.id} onClick={() => { setItems(prev => prev.map((item, i) => i === Number(row) ? { ...item, productId: p.id } : item)); setProductQueries(prev => ({ ...prev, [row]: '' })); }} className="glass-panel" style={{ padding: '.85rem', textAlign: 'left', color: 'var(--text-main)', cursor: 'pointer' }}><div style={{ fontWeight: 600, marginBottom: '.3rem' }}>{p.name}</div><div style={{ color: 'var(--accent)', fontWeight: 700 }}>{formatCOP(p.sellingPrice)}</div><div style={{ color: 'var(--text-muted)', fontSize: '.78rem', marginTop: '.3rem' }}>Stock: {p.stock}</div></button>)}</div> : <p style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>No hay productos disponibles con un nombre similar.</p>}
        </section>;
      })}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
        <button type="button" className="btn btn-secondary" onClick={() => setItems(prev => [...prev, { productId: '', quantity: 1 }])} disabled={!products.length}><Plus size={16} /> Agregar producto</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><strong>Total: {formatCOP(total)}</strong><button type="submit" className="btn btn-primary" disabled={saving || !selectedLines.length}>{saving ? 'Guardando…' : <><Send size={16} /> Registrar pendiente</>}</button></div>
      </div>
      <p style={{ color: 'var(--text-dim)', fontSize: '.8rem', marginTop: '.75rem' }}>El pedido queda pendiente; las existencias no se descuentan hasta registrar la venta al recogerlo.</p>
    </form>

    <h2 style={{ fontSize: '1.1rem', marginBottom: '.75rem' }}>Seguimiento de pedidos <span className="badge badge-success" style={{ marginLeft: '.4rem' }}>{pendingOrders.length} pendientes</span></h2>
    {loading ? <div className="glass-panel" style={{ padding: '2rem' }}>Cargando pedidos…</div> : orders.length === 0 ? <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Todavía no hay pedidos.</div> : <div style={{ display: 'grid', gap: '1rem' }}>
      {orders.map(order => <article key={order.id} className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div><strong>Pedido #{order.id.slice(-8).toUpperCase()}</strong> <span style={{ color: 'var(--text-muted)' }}>· {order.customerName} · {order.customerPhone}</span><div style={{ marginTop: 6, color: 'var(--text-dim)', fontSize: '.85rem' }}>{new Date(order.createdAt).toLocaleString('es-CO')} · {order.source === 'WHATSAPP' ? <><Smartphone size={13} style={{ verticalAlign: 'middle' }} /> WhatsApp</> : 'Web'} · {order.status}{order.paymentMethod ? ` · ${order.paymentMethod}` : ''}</div></div>
          <strong className="gradient-text">{formatCOP(order.totalAmount)}</strong>
        </div>
        <div style={{ margin: '1rem 0', padding: '.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,.025)' }}>{order.items.map(item => <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '.2rem 0' }}><span>{item.product.name} × {item.quantity}</span><span>{formatCOP(item.subtotal)}</span></div>)}</div>
        <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {order.status === 'PENDIENTE' && <button className="btn btn-primary" onClick={() => void setStatus(order, 'LISTO')}><PackageCheck size={16} /> Marcar listo</button>}
          {order.status === 'LISTO' && <><span style={{ alignSelf: 'center', color: 'var(--text-muted)', marginRight: '.5rem' }}><Clock3 size={15} style={{ verticalAlign: 'middle' }} /> Esperando recogida{order.paymentMethod ? ` · ${order.paymentMethod}` : ''}</span><a className="btn btn-secondary" href={waLink(order.customerPhone, `Hola ${order.customerName}, tu pedido #${order.id.slice(-8).toUpperCase()} de ${businessName} está listo para recoger. Total: ${formatCOP(order.totalAmount)}. Indícanos si pagarás en efectivo o por transferencia.`)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}><MessageCircle size={16} /> Avisar por WhatsApp</a><button className={`btn ${order.paymentMethod === 'EFECTIVO' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => void setPaymentMethod(order, 'EFECTIVO')}>Efectivo</button><button className={`btn ${order.paymentMethod === 'TRANSFERENCIA' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => void setPaymentMethod(order, 'TRANSFERENCIA')}>Transferencia</button><button className="btn btn-secondary" onClick={() => void setStatus(order, 'COMPLETADO')}><CheckCircle2 size={16} /> Marcar recogido</button></>}
          {order.status === 'COMPLETADO' && <button className="btn btn-primary" onClick={() => void setStatus(order, 'COMPLETADO')}><CheckCircle2 size={16} /> Registrar venta y retirar pedido</button>}
          {order.status !== 'COMPLETADO' && order.status !== 'CANCELADO' && <button className="btn btn-secondary" onClick={() => void setStatus(order, 'CANCELADO')}>Cancelar</button>}
          {order.status === 'CANCELADO' && <button className="btn btn-secondary" onClick={() => void deleteCancelledOrder(order)}><Trash2 size={16} /> Eliminar cancelado</button>}
        </div>
      </article>)}
    </div>}
  </div>;
};
