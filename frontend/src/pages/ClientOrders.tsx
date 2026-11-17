import React, { useState } from 'react';
import { ShoppingBag, Search, Package, Clock, CheckCircle2, XCircle, ArrowLeft, Phone, ShoppingCart } from 'lucide-react';
import { api } from '../services/api';

type OrderStatus = 'PENDIENTE' | 'LISTO' | 'COMPLETADO' | 'CANCELADO';

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product: { id: string; name: string; description: string | null };
}

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  paymentMethod?: string | null;
  status: OrderStatus;
  createdAt: string;
  items: OrderItem[];
}

const statusConfig: Record<OrderStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PENDIENTE:   { label: 'Pendiente',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',   icon: <Clock size={14} /> },
  LISTO:       { label: 'Listo para entregar', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)', icon: <CheckCircle2 size={14} /> },
  COMPLETADO:  { label: 'Completado',  color: '#10b981', bg: 'rgba(16,185,129,0.12)',   icon: <CheckCircle2 size={14} /> },
  CANCELADO:   { label: 'Cancelado',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)',    icon: <XCircle size={14} /> },
};

export const ClientOrders: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError('Ingresa tu número de teléfono o WhatsApp.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/orders/my-orders?phone=${encodeURIComponent(phone.trim())}`);
      setOrders(res.data.orders || []);
      setSearched(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al consultar pedidos. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)' }}>

      {/* ── HEADER ── */}
      <header
        className="glass-panel"
        style={{
          borderRadius: 0,
          padding: '1rem 2rem',
          borderBottom: '1px solid var(--bg-card-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-md)' }}>
            <ShoppingBag color="var(--primary)" size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem' }}>
              Mis <span className="gradient-text">Pedidos</span>
            </h1>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Consulta el estado de tus pedidos por número de teléfono
            </span>
          </div>
        </div>

        <a
          href="/catalogo"
          className="btn btn-secondary"
          style={{ gap: '0.5rem', textDecoration: 'none', fontSize: '0.9rem' }}
        >
          <ShoppingCart size={16} />
          Ir a la Tienda
        </a>
      </header>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>

        {/* Search Card */}
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'var(--primary-light)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
            }}>
              <Phone size={28} color="var(--primary)" />
            </div>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '0.4rem' }}>Busca tus pedidos</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Ingresa el número de teléfono que usaste al realizar tu pedido
            </p>
          </div>

          <form onSubmit={handleSearch}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                type="text"
                id="client-phone-input"
                className="form-input"
                placeholder="Ej: +57 301 987 6543"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setError(''); }}
                style={{ flex: 1, fontSize: '1rem' }}
              />
              <button
                id="btn-search-orders"
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ whiteSpace: 'nowrap' }}
              >
                {loading ? <div className="spinner" /> : <><Search size={17} /> Consultar</>}
              </button>
            </div>
            {error && (
              <div className="form-error" style={{ marginTop: '0.5rem' }}>{error}</div>
            )}
          </form>
        </div>

        {/* Results */}
        {searched && orders !== null && (
          <>
            {orders.length === 0 ? (
              <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                <Package size={48} color="var(--text-dim)" style={{ marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No encontramos pedidos</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  No hay pedidos registrados con el número{' '}
                  <strong style={{ color: 'var(--text-main)' }}>{phone}</strong>.
                  Verifica que sea el mismo que usaste al hacer el pedido.
                </p>
                <a href="/catalogo" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                  <ShoppingCart size={16} /> Hacer mi primer pedido
                </a>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Se encontraron{' '}
                    <strong style={{ color: 'var(--text-main)' }}>{orders.length}</strong>{' '}
                    pedido{orders.length !== 1 ? 's' : ''}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    Del más reciente al más antiguo
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {orders.map((order, idx) => {
                    const cfg = statusConfig[order.status];
                    return (
                      <div
                        key={order.id}
                        id={`order-card-${idx}`}
                        className="glass-panel"
                        style={{
                          padding: '1.5rem',
                          borderLeft: `3px solid ${cfg.color}`,
                          transition: 'transform 0.2s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                      >
                        {/* Order header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.2rem' }}>
                              Pedido #{order.id.slice(-8).toUpperCase()}
                            </div>
                            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{order.customerName}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                              {formatDate(order.createdAt)}
                            </div>
                          </div>

                          {/* Status badge */}
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                            padding: '0.35rem 0.9rem', borderRadius: 'var(--radius-full)',
                            background: cfg.bg, color: cfg.color,
                            fontSize: '0.78rem', fontWeight: 700,
                            border: `1px solid ${cfg.color}44`,
                          }}>
                            {cfg.icon} {cfg.label}
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            {(['PENDIENTE', 'LISTO', 'COMPLETADO'] as OrderStatus[]).map((step, si) => (
                              <span key={step} style={{
                                fontSize: '0.7rem', fontWeight: 600,
                                color: order.status === 'CANCELADO'
                                  ? 'var(--text-dim)'
                                  : (si === 0 || (si === 1 && ['LISTO', 'COMPLETADO'].includes(order.status)) || order.status === 'COMPLETADO') ? cfg.color : 'var(--text-dim)',
                              }}>
                                {step === 'PENDIENTE' ? '📋 Recibido' : step === 'LISTO' ? '📦 Listo' : '✅ Entregado'}
                              </span>
                            ))}
                          </div>
                          <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', borderRadius: '4px',
                              background: cfg.color,
                              width: order.status === 'PENDIENTE' ? '33%' : order.status === 'LISTO' ? '66%' : order.status === 'COMPLETADO' ? '100%' : '15%',
                              transition: 'width 0.6s ease',
                            }} />
                          </div>
                        </div>

                        {/* Items */}
                        <div style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid var(--bg-card-border)',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.75rem 1rem',
                          marginBottom: '1rem',
                        }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Productos ({order.items.length})
                          </div>
                          {order.items.map(item => (
                            <div
                              key={item.id}
                              style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '0.4rem 0',
                                borderBottom: '1px solid rgba(255,255,255,0.04)',
                                fontSize: '0.88rem',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Package size={14} color="var(--text-dim)" />
                                <span>{item.product.name}</span>
                                <span style={{
                                  fontSize: '0.72rem', padding: '2px 8px',
                                  background: 'rgba(255,255,255,0.05)',
                                  borderRadius: 'var(--radius-full)',
                                  color: 'var(--text-muted)',
                                }}>x{item.quantity}</span>
                              </div>
                              <strong style={{ color: 'var(--accent)' }}>
                                ${item.subtotal.toLocaleString('es-CO')}
                              </strong>
                            </div>
                          ))}
                        </div>

                        {/* Total */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total del pedido:</span>
                          <span className="gradient-text" style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                            ${order.totalAmount.toLocaleString('es-CO')}
                          </span>
                        </div>
                        {order.paymentMethod && <div style={{ marginTop: '0.5rem', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Medio de pago elegido: {order.paymentMethod === 'EFECTIVO' ? 'Efectivo' : 'Transferencia'}</div>}

                        {order.status === 'CANCELADO' && (
                          <div style={{
                            marginTop: '0.75rem', padding: '0.65rem 1rem',
                            background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-sm)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            fontSize: '0.82rem', color: '#fca5a5',
                          }}>
                            ⚠️ Este pedido fue cancelado. Si tienes dudas, comunícate con la tienda.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                  <a href="/catalogo" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                    <ArrowLeft size={16} /> Volver al Catálogo
                  </a>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
