import React, { useEffect, useState } from 'react';
import { ShoppingBag, ShoppingCart, Send, CheckCircle2, Phone, User, Search } from 'lucide-react';
import { api } from '../services/api';

export const Catalog: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<{ product: any; quantity: number }[]>([]);
  const [search, setSearch] = useState('');
  
  // Checkout Form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await api.get('/orders/catalog');
        setProducts(res.data.products || []);
      } catch (err) {
        console.error('Error cargando catálogo público:', err);
      }
    };
    fetchCatalog();
  }, []);

  const totalAmount = cart.reduce((acc, item) => acc + (item.product.sellingPrice * item.quantity), 0);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleSendOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) {
      setErrorMsg('Ingresa tu nombre y teléfono para enviar el pedido.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      const payload = {
        customerName,
        customerPhone,
        items: cart.map(i => ({ productId: i.product.id, quantity: i.quantity }))
      };

      const res = await api.post('/orders/checkout', payload);
      setOrderSuccess(res.data);
      setCart([]);
      setShowCheckoutModal(false);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error al enviar el pedido.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)' }}>
      {/* Header Portal Cliente */}
      <header className="glass-panel" style={{ borderRadius: 0, padding: '1rem 2rem', borderBottom: '1px solid var(--bg-card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-md)' }}>
            <ShoppingBag color="var(--primary)" size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem' }}>
              Catálogo <span className="gradient-text">Comercial B2C</span>
            </h1>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Explora nuestros productos y realiza tu pedido directo</span>
          </div>
        </div>

        <button onClick={() => setShowCheckoutModal(true)} className="btn btn-primary" disabled={cart.length === 0}>
          <ShoppingCart size={18} />
          <span>Carrito ({cart.length}) — ${totalAmount.toLocaleString()}</span>
        </button>
      </header>

      {/* Hero / Búsqueda */}
      <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Search size={20} color="var(--text-dim)" />
          <input
            type="text"
            className="form-input"
            style={{ background: 'transparent', border: 'none', fontSize: '1rem' }}
            placeholder="¿Qué producto buscas hoy?..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Grid de Productos Catálogo */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
          {filtered.map(p => (
            <div key={p.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{p.name}</div>
                {p.description && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{p.description}</div>}
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)', marginBottom: '1rem' }}>
                  ${p.sellingPrice.toLocaleString()}
                </div>
              </div>
              <button onClick={() => addToCart(p)} className="btn btn-secondary" style={{ width: '100%' }}>
                <ShoppingCart size={16} /> Agregar al Carrito
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Checkout / Enviar Pedido (HU-016) */}
      {showCheckoutModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '460px', padding: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Enviar Pedido a la Tienda</h2>
            {errorMsg && <div className="form-error" style={{ marginBottom: '1rem' }}>{errorMsg}</div>}

            <form onSubmit={handleSendOrder}>
              <div className="form-group">
                <label className="form-label">Tu Nombre Completo *</label>
                <input type="text" className="form-input" placeholder="Ej: María Gómez" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Teléfono / WhatsApp de Contacto *</label>
                <input type="text" className="form-input" placeholder="Ej: +57 301 987 6543" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required />
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Resumen de productos ({cart.length}):</div>
                {cart.map(i => (
                  <div key={i.product.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    <span>{i.product.name} x {i.quantity}</span>
                    <strong>${(i.product.sellingPrice * i.quantity).toLocaleString()}</strong>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid var(--bg-card-border)', paddingTop: '0.5rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span>Total Pedido:</span>
                  <span className="gradient-text">${totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => setShowCheckoutModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Volver</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                  {loading ? <div className="spinner" /> : <><Send size={16} /> Enviar Pedido</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Éxito Pedido */}
      {orderSuccess && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '2rem', textAlign: 'center' }}>
            <CheckCircle2 size={48} color="var(--accent)" style={{ marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>¡Pedido Enviado!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              {orderSuccess.message}
            </p>
            <button onClick={() => setOrderSuccess(null)} className="btn btn-primary" style={{ width: '100%' }}>
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
