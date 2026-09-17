import React, { useEffect, useState } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle2, DollarSign, CreditCard, Banknote, Search } from 'lucide-react';
import { api } from '../services/api';

export const POS: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<{ product: any; quantity: number }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA'>('EFECTIVO');
  const [cashGiven, setCashGiven] = useState<number | ''>('');
  const [search, setSearch] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [saleSuccess, setSaleSuccess] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products?limit=100');
      setProducts(res.data.products || []);
    } catch (err) {
      console.error('Error cargando productos para POS:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // HU-011: Cálculo de Total en Tiempo Real
  const totalAmount = cart.reduce((acc, item) => acc + (item.product.sellingPrice * item.quantity), 0);
  const changeGiven = paymentMethod === 'EFECTIVO' && cashGiven !== '' && Number(cashGiven) >= totalAmount
    ? Number(cashGiven) - totalAmount
    : 0;

  const addToCart = (product: any) => {
    if (product.stock <= 0) {
      alert(`El producto "${product.name}" no tiene stock disponible.`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity + 1 > product.stock) {
          alert(`Solo quedan ${product.stock} unidades de "${product.name}" en stock.`);
          return prev;
        }
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        if (newQty > item.product.stock) {
          alert(`No hay suficiente stock. Disponible: ${item.product.stock}`);
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean) as any);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // HU-010: Registrar Venta Rápida
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setErrorMsg('El carrito está vacío.');
      return;
    }

    if (paymentMethod === 'EFECTIVO') {
      if (cashGiven === '' || Number(cashGiven) < totalAmount) {
        setErrorMsg(`En pago con efectivo, el dinero recibido ($${cashGiven || 0}) debe ser mayor o igual al total ($${totalAmount}).`);
        return;
      }
    }

    try {
      setLoading(true);
      setErrorMsg('');

      const payload = {
        paymentMethod,
        cashGiven: paymentMethod === 'EFECTIVO' ? Number(cashGiven) : totalAmount,
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity
        }))
      };

      const res = await api.post('/sales', payload);
      setSaleSuccess(res.data);
      setCart([]);
      setCashGiven('');
      fetchProducts(); // Actualizar catálogo de productos con el nuevo stock descontado
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error al procesar la venta.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ padding: '2rem', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShoppingCart color="var(--primary)" /> Venta Rápida <span className="gradient-text">(Punto de Venta POS)</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Selecciona productos para armar la venta y procesar el cobro al instante
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem' }}>
        {/* Catálogo para Selección */}
        <div>
          <div className="glass-panel" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={18} color="var(--text-dim)" />
            <input
              type="text"
              className="form-input"
              style={{ background: 'transparent', border: 'none' }}
              placeholder="Buscar producto para agregar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
            {filteredProducts.map(p => (
              <div
                key={p.id}
                className="glass-panel"
                style={{ padding: '1rem', cursor: p.stock > 0 ? 'pointer' : 'not-allowed', opacity: p.stock > 0 ? 1 : 0.5, transition: 'var(--transition)' }}
                onClick={() => p.stock > 0 && addToCart(p)}
              >
                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>{p.name}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent)' }}>${p.sellingPrice.toLocaleString()}</div>
                <div style={{ fontSize: '0.75rem', color: p.stock > 0 ? 'var(--text-muted)' : 'var(--danger)', marginTop: '0.5rem' }}>
                  {p.stock > 0 ? `Stock: ${p.stock}` : '¡Agotado!'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel lateral de Carrito (HU-011) */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 'fit-content' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Carrito POS</span>
              <span className="badge badge-success">{cart.length} ítems</span>
            </h2>

            {errorMsg && <div className="form-error" style={{ marginBottom: '1rem' }}>{errorMsg}</div>}

            {/* Ítems del carrito */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                  Haz clic en cualquier producto para agregarlo a la venta.
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.product.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--accent)' }}>
                        ${item.product.sellingPrice.toLocaleString()} x {item.quantity} = ${(item.product.sellingPrice * item.quantity).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <button onClick={() => updateQuantity(item.product.id, -1)} className="btn btn-secondary" style={{ padding: '0.2rem 0.4rem' }}><Minus size={12} /></button>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, 1)} className="btn btn-secondary" style={{ padding: '0.2rem 0.4rem' }}><Plus size={12} /></button>
                      <button onClick={() => removeFromCart(item.product.id)} className="btn btn-secondary" style={{ padding: '0.2rem 0.4rem', color: 'var(--danger)' }}><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Métodos de Pago */}
            <div style={{ borderTop: '1px solid var(--bg-card-border)', paddingTop: '1rem', marginBottom: '1rem' }}>
              <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Método de Pago</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                <button
                  type="button"
                  className={`btn ${paymentMethod === 'EFECTIVO' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.5rem', fontSize: '0.75rem' }}
                  onClick={() => setPaymentMethod('EFECTIVO')}
                >
                  <Banknote size={14} /> Efectivo
                </button>
                <button
                  type="button"
                  className={`btn ${paymentMethod === 'TRANSFERENCIA' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.5rem', fontSize: '0.75rem' }}
                  onClick={() => setPaymentMethod('TRANSFERENCIA')}
                >
                  <CreditCard size={14} /> Nequi/Trans.
                </button>
                <button
                  type="button"
                  className={`btn ${paymentMethod === 'TARJETA' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.5rem', fontSize: '0.75rem' }}
                  onClick={() => setPaymentMethod('TARJETA')}
                >
                  <CreditCard size={14} /> Tarjeta
                </button>
              </div>
            </div>

            {/* Vuelto / Cambio en Efectivo (HU-010) */}
            {paymentMethod === 'EFECTIVO' && (
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Dinero Recibido ($)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder={`Ej: ${totalAmount}`}
                  value={cashGiven}
                  onChange={(e) => setCashGiven(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            )}
          </div>

          {/* Resumen Total */}
          <div style={{ borderTop: '1px solid var(--bg-card-border)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              <span>Total a Cobrar:</span>
              <span className="gradient-text">${totalAmount.toLocaleString()}</span>
            </div>

            {paymentMethod === 'EFECTIVO' && cashGiven !== '' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: changeGiven >= 0 ? 'var(--accent)' : 'var(--danger)', marginBottom: '1rem' }}>
                <span>Vuelto / Cambio:</span>
                <strong>${changeGiven.toLocaleString()}</strong>
              </div>
            )}

            <button
              onClick={handleCheckout}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem' }}
              disabled={cart.length === 0 || loading}
            >
              {loading ? <div className="spinner" /> : <><DollarSign size={18} /> Registrar Venta ($)</>}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Éxito de Venta */}
      {saleSuccess && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '2rem', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '50%', marginBottom: '1rem' }}>
              <CheckCircle2 size={48} color="var(--accent)" />
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>¡Venta Exitosa!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Transacción guardada correctamente en el historial.
            </p>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'left', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Total Venta:</span>
                <strong>${saleSuccess.metrics.totalAmount.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Ganancia Neta (HU-013):</span>
                <strong style={{ color: 'var(--accent)' }}>+${saleSuccess.metrics.netProfit.toLocaleString()}</strong>
              </div>
              {saleSuccess.sale.changeGiven > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--bg-card-border)', paddingTop: '0.5rem' }}>
                  <span>Vuelto Entregado:</span>
                  <strong style={{ color: 'var(--warning)' }}>${saleSuccess.sale.changeGiven.toLocaleString()}</strong>
                </div>
              )}
            </div>

            <button onClick={() => setSaleSuccess(null)} className="btn btn-primary" style={{ width: '100%' }}>
              Continuar Vendiendo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
