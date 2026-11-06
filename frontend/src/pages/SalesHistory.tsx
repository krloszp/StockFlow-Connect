import React, { useEffect, useState, useCallback } from 'react';
import {
  History, RefreshCw, ChevronDown, ChevronUp, User, Phone,
  Banknote, CreditCard, MessageSquare, Share2, Printer, Search, X
} from 'lucide-react';
import { api } from '../services/api';

/* ─────────────────── tipos ─────────────────── */
interface SaleItemData {
  id: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product: { name: string };
}

interface SaleData {
  id: string;
  totalAmount: number;
  paymentMethod: string;
  cashGiven: number | null;
  changeGiven: number | null;
  customerName: string | null;
  customerPhone: string | null;
  customerNote: string | null;
  createdAt: string;
  items: SaleItemData[];
}

/* ─────────────────── helpers ─────────────────── */
const METHOD_LABEL: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Nequi / Transferencia',
  TARJETA: 'Tarjeta'
};

const METHOD_ICON: Record<string, React.ReactNode> = {
  EFECTIVO: <Banknote size={14} />,
  TRANSFERENCIA: <CreditCard size={14} />,
  TARJETA: <CreditCard size={14} />
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-CO', {
    dateStyle: 'medium', timeStyle: 'short'
  });
}

function buildWhatsappText(sale: SaleData, storeName: string): string {
  const lines: string[] = [
    `🧾 *Recibo de Venta — ${storeName}*`,
    `📅 ${formatDate(sale.createdAt)}`,
    ``,
  ];
  if (sale.customerName) lines.push(`👤 Cliente: *${sale.customerName}*`);
  lines.push(`💳 Método: ${METHOD_LABEL[sale.paymentMethod] ?? sale.paymentMethod}`);
  lines.push(``);
  lines.push(`*Productos:*`);
  sale.items.forEach(it => {
    lines.push(`  • ${it.product.name} x${it.quantity} → $${it.subtotal.toLocaleString('es-CO')}`);
  });
  lines.push(``);
  lines.push(`*Total: $${sale.totalAmount.toLocaleString('es-CO')}*`);
  if (sale.changeGiven && sale.changeGiven > 0) {
    lines.push(`Vuelto: $${sale.changeGiven.toLocaleString('es-CO')}`);
  }
  if (sale.customerNote) lines.push(`\n📝 Nota: ${sale.customerNote}`);
  lines.push(`\n¡Gracias por su compra! 🙏`);
  return lines.join('\n');
}

/* ─────────────────── componente ─────────────────── */
export const SalesHistory: React.FC = () => {
  const [sales, setSales] = useState<SaleData[]>([]);
  const [filtered, setFiltered] = useState<SaleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [business, setBusiness] = useState<any>(null);

  /* nombre del comercio guardado en base de datos o localStorage */
  const storeName = business?.name || localStorage.getItem('stockflow_business_name') || 'StockFlow Connect';

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const [salesRes, bizRes] = await Promise.all([
        api.get('/sales'),
        api.get('/settings/business').catch(() => null)
      ]);
      const data: SaleData[] = salesRes.data.sales || [];
      setSales(data);
      setFiltered(data);
      if (bizRes?.data?.settings) {
        setBusiness(bizRes.data.settings);
      }
    } catch (err) {
      console.error('Error cargando historial:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  /* filtrado por texto */
  useEffect(() => {
    if (!search.trim()) { setFiltered(sales); return; }
    const q = search.toLowerCase();
    setFiltered(sales.filter(s =>
      s.customerName?.toLowerCase().includes(q) ||
      s.customerPhone?.toLowerCase().includes(q) ||
      s.items.some(it => it.product.name.toLowerCase().includes(q)) ||
      formatDate(s.createdAt).toLowerCase().includes(q)
    ));
  }, [search, sales]);

  /* ── WhatsApp share ── */
  const shareWhatsApp = (sale: SaleData) => {
    const text = encodeURIComponent(buildWhatsappText(sale, storeName));
    const phone = sale.customerPhone?.replace(/\D/g, '') ?? '';
    const url = phone
      ? `https://wa.me/${phone.startsWith('57') ? phone : '57' + phone}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  /* ── Print receipt ── */
  const printReceipt = (sale: SaleData) => {
    const docInfo = business?.documentNumber ? `${business.documentType || 'NIT'}: ${business.documentNumber}` : '';
    const addressInfo = [business?.address, business?.city].filter(Boolean).join(' - ');
    const phoneInfo = business?.phone ? `Tel: ${business.phone}` : '';
    const footerMsg = business?.receiptMessage || '¡Gracias por su compra! 🙏';

    const html = `
      <html><head><title>Recibo #${sale.id.slice(-8).toUpperCase()}</title>
      <style>
        body{font-family:Arial,sans-serif;max-width:320px;margin:0 auto;padding:1rem;font-size:13px}
        h2{text-align:center;font-size:1rem;margin-bottom:0.5rem}
        p{margin:0.2rem 0} .divider{border-top:1px dashed #999;margin:0.6rem 0}
        .row{display:flex;justify-content:space-between} .total{font-weight:700;font-size:1rem}
        .center{text-align:center}
      </style></head><body>
      <h2>🧾 Recibo de Venta</h2>
      <p class="center" style="font-weight:700;font-size:12px">${storeName}</p>
      ${docInfo ? `<p class="center" style="font-size:11px;color:#666">${docInfo}</p>` : ''}
      ${addressInfo ? `<p class="center" style="font-size:11px;color:#666">${addressInfo}</p>` : ''}
      ${phoneInfo ? `<p class="center" style="font-size:11px;color:#666">${phoneInfo}</p>` : ''}
      <p class="center" style="font-size:11px">${formatDate(sale.createdAt)}</p>
      <p class="center" style="font-size:11px;color:#888">Ref: #${sale.id.slice(-8).toUpperCase()}</p>
      <div class="divider"></div>
      ${sale.customerName ? `<p><b>Cliente:</b> ${sale.customerName}</p>` : ''}
      ${sale.customerPhone ? `<p><b>Teléfono:</b> ${sale.customerPhone}</p>` : ''}
      <p><b>Pago:</b> ${METHOD_LABEL[sale.paymentMethod] ?? sale.paymentMethod}</p>
      <div class="divider"></div>
      <b>Productos:</b>
      ${sale.items.map(it => `
        <div class="row"><span>${it.product.name} x${it.quantity}</span>
        <span>$${it.subtotal.toLocaleString('es-CO')}</span></div>`).join('')}
      <div class="divider"></div>
      <div class="row total"><span>TOTAL</span><span>$${sale.totalAmount.toLocaleString('es-CO')}</span></div>
      ${sale.changeGiven && sale.changeGiven > 0 ? `<div class="row"><span>Vuelto</span><span>$${sale.changeGiven.toLocaleString('es-CO')}</span></div>` : ''}
      ${sale.customerNote ? `<div class="divider"></div><p><b>Nota:</b> ${sale.customerNote}</p>` : ''}
      <div class="divider"></div>
      <p class="center">${footerMsg}</p>
      </body></html>
    `;
    const win = window.open('', '_blank', 'width=400,height=600');
    win?.document.write(html);
    win?.document.close();
    win?.print();
  };

  /* ─── render ─── */
  return (
    <div style={{ padding: '2rem', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History color="var(--primary)" />
            Historial de Ventas
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Consulta, filtra y envía los recibos de cada venta registrada
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchSales} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <RefreshCw size={16} className={loading ? 'spinner' : ''} />
          Actualizar
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="glass-panel" style={{ padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Search size={18} color="var(--text-dim)" />
        <input type="text" className="form-input"
          style={{ background: 'transparent', border: 'none', flex: 1 }}
          placeholder="Buscar por cliente, teléfono, producto o fecha…"
          value={search} onChange={e => setSearch(e.target.value)} />
        {search && (
          <button className="btn btn-secondary" style={{ padding: '0.3rem 0.5rem' }}
            onClick={() => setSearch('')}><X size={14} /></button>
        )}
      </div>

      {/* Contador */}
      <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '1rem' }}>
        {filtered.length} {filtered.length === 1 ? 'venta encontrada' : 'ventas encontradas'}
        {sales.length !== filtered.length && ` (de ${sales.length} en total)`}
      </p>

      {/* Lista de ventas */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-dim)' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem', width: 32, height: 32 }} />
          Cargando historial…
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
          <History size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p>No hay ventas que coincidan con tu búsqueda.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(sale => {
            const isOpen = expanded === sale.id;
            return (
              <div key={sale.id} className="glass-panel"
                style={{ overflow: 'hidden', transition: 'var(--transition)' }}>

                {/* Fila principal (siempre visible) */}
                <div
                  style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', flexWrap: 'wrap' }}
                  onClick={() => setExpanded(isOpen ? null : sale.id)}
                >
                  {/* Fecha + Ref */}
                  <div style={{ flex: '1 1 180px' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.15rem' }}>
                      #{sale.id.slice(-8).toUpperCase()}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{formatDate(sale.createdAt)}</div>
                  </div>

                  {/* Cliente (si existe) */}
                  <div style={{ flex: '1 1 160px' }}>
                    {sale.customerName ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.88rem' }}>
                        <User size={13} color="var(--primary)" />
                        <span>{sale.customerName}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Sin datos de cliente</span>
                    )}
                    {sale.customerPhone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
                        <Phone size={11} />{sale.customerPhone}
                      </div>
                    )}
                  </div>

                  {/* Método de pago */}
                  <div style={{ flex: '0 0 auto' }}>
                    <span className="badge badge-success"
                      style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      {METHOD_ICON[sale.paymentMethod]}
                      {METHOD_LABEL[sale.paymentMethod] ?? sale.paymentMethod}
                    </span>
                  </div>

                  {/* Total */}
                  <div style={{ flex: '0 0 auto', textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent)' }}>
                      ${sale.totalAmount.toLocaleString('es-CO')}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {sale.items.length} {sale.items.length === 1 ? 'ítem' : 'ítems'}
                    </div>
                  </div>

                  {/* Chevron */}
                  <div style={{ color: 'var(--text-dim)' }}>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {/* Detalle expandido */}
                {isOpen && (
                  <div style={{
                    borderTop: '1px solid var(--bg-card-border)',
                    padding: '1rem 1.25rem',
                    background: 'rgba(0,0,0,0.15)',
                    animation: 'fadeIn 0.2s ease'
                  }}>
                    {/* Productos */}
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Productos vendidos
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {sale.items.map(it => (
                          <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>{it.product.name} × {it.quantity}</span>
                            <span style={{ fontWeight: 600 }}>${it.subtotal.toLocaleString('es-CO')}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Resumen financiero */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', fontSize: '0.88rem', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem' }}>
                        <span>Total cobrado</span>
                        <span style={{ color: 'var(--accent)' }}>${sale.totalAmount.toLocaleString('es-CO')}</span>
                      </div>
                      {sale.cashGiven != null && sale.paymentMethod === 'EFECTIVO' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem', color: 'var(--text-muted)' }}>
                          <span>Efectivo recibido</span>
                          <span>${sale.cashGiven.toLocaleString('es-CO')}</span>
                        </div>
                      )}
                      {sale.changeGiven != null && sale.changeGiven > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem', color: 'var(--warning)' }}>
                          <span>Vuelto entregado</span>
                          <span>${sale.changeGiven.toLocaleString('es-CO')}</span>
                        </div>
                      )}
                    </div>

                    {/* Nota del cliente */}
                    {sale.customerNote && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        <MessageSquare size={14} style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                        <span>{sale.customerNote}</span>
                      </div>
                    )}

                    {/* Acciones */}
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-primary"
                        style={{ flex: '1 1 auto', fontSize: '0.85rem', padding: '0.6rem 1rem', background: 'linear-gradient(135deg,#25d366,#128c7e)' }}
                        onClick={() => shareWhatsApp(sale)}
                      >
                        <Share2 size={15} /> Enviar por WhatsApp
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ flex: '1 1 auto', fontSize: '0.85rem', padding: '0.6rem 1rem' }}
                        onClick={() => printReceipt(sale)}
                      >
                        <Printer size={15} /> Imprimir Recibo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
