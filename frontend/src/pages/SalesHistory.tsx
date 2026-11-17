import React, { useEffect, useState, useCallback } from 'react';
import {
  History, RefreshCw, Download, ChevronDown, ChevronUp, User, Phone,
  Banknote, CreditCard, MessageSquare, Search, X, PackagePlus
} from 'lucide-react';
import { api } from '../services/api';
import { downloadReceiptPdf, sendReceiptByWhatsApp } from '../utils/receiptPdf';
import { ReceiptActions } from '../components/ReceiptActions';

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
  isPurchase?: boolean;
  supplierName?: string;
  invoiceNumber?: string | null;
  amountPaid?: number;
  purchasePaymentMethod?: string;
  purchasePayments?: { id: string; amount: number; paymentMethod: string; note?: string | null; createdAt: string }[];
  pendingAmount?: number;
  allocations?: { id: string; amount: number; createdAt: string; payment: { paymentMethod: string; createdAt: string; note?: string | null } }[];
}

/* ─────────────────── helpers ─────────────────── */
const METHOD_LABEL: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Nequi / Transferencia',
  COMPRA: 'Compra',
  CREDITO: 'Crédito',
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

export const SalesHistory: React.FC = () => {
  const [sales, setSales] = useState<SaleData[]>([]);
  const [filtered, setFiltered] = useState<SaleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const today = new Date();
  const currentDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const currentMonth = currentDate.slice(0, 7);
  const [filterMode, setFilterMode] = useState<'dates' | 'month'>('dates');
  const [month, setMonth] = useState(currentMonth);
  const [startDate, setStartDate] = useState(currentDate);
  const [endDate, setEndDate] = useState(currentDate);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [business, setBusiness] = useState<any>(null);
  const [adminName, setAdminName] = useState('');
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({});
  const [paymentMethods, setPaymentMethods] = useState<Record<string, string>>({});
  const [movementFilter, setMovementFilter] = useState<'ALL' | 'SALES' | 'PURCHASES' | 'CREDIT'>('ALL');

  /* nombre del comercio guardado en base de datos o localStorage */
  const storeName = business?.name || localStorage.getItem('stockflow_business_name') || 'StockFlow Connect';

  const range = filterMode === 'month'
    ? { startDate: `${month}-01`, endDate: `${month}-${String(new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate()).padStart(2, '0')}` }
    : { startDate, endDate };

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const [salesRes, purchasesRes, bizRes, userRes] = await Promise.all([
        api.get('/sales', { params: range }),
        api.get('/suppliers/purchases', { params: range }),
        api.get('/settings/business').catch(() => null),
        api.get('/auth/me').catch(() => null)
      ]);
      const sales: SaleData[] = salesRes.data.sales || [];
      const purchases: SaleData[] = (purchasesRes.data.purchases || []).map((purchase: any) => ({
        id: `purchase-${purchase.id}`,
        totalAmount: purchase.totalAmount,
        paymentMethod: 'COMPRA',
        purchasePaymentMethod: purchase.paymentMethod,
        purchasePayments: purchase.payments || [],
        cashGiven: null,
        changeGiven: null,
        customerName: null,
        customerPhone: null,
        customerNote: purchase.note,
        createdAt: purchase.purchaseDate || purchase.createdAt,
        isPurchase: true,
        supplierName: purchase.supplierName,
        invoiceNumber: purchase.invoiceNumber,
        amountPaid: purchase.amountPaid,
        items: purchase.items.map((item: any) => ({ id: item.id, quantity: item.quantity, unitPrice: item.unitCost, subtotal: item.subtotal, product: { name: item.productName }, costPriceAtSale: item.unitCost, sellingPriceAtPurchase: item.sellingPriceAtPurchase }))
      }));
      const data = [...sales, ...purchases].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSales(data);
      setFiltered(data);
      if (bizRes?.data?.settings) {
        setBusiness(bizRes.data.settings);
      }
      if (userRes?.data?.user?.name) setAdminName(userRes.data.user.name);
    } catch (err) {
      console.error('Error cargando historial:', err);
    } finally {
      setLoading(false);
    }
  }, [range.startDate, range.endDate]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  /* filtrado por texto */
  useEffect(() => {
    let result = sales;
    if (movementFilter === 'SALES') result = result.filter(s => !s.isPurchase);
    if (movementFilter === 'PURCHASES') result = result.filter(s => s.isPurchase);
    if (movementFilter === 'CREDIT') result = result.filter(s => !s.isPurchase && (s.pendingAmount || 0) > 0);
    if (!search.trim()) { setFiltered(result); return; }
    const q = search.toLowerCase();
    setFiltered(result.filter(s =>
      s.customerName?.toLowerCase().includes(q) ||
      s.supplierName?.toLowerCase().includes(q) ||
      s.invoiceNumber?.toLowerCase().includes(q) ||
      s.customerPhone?.toLowerCase().includes(q) ||
      s.items.some(it => it.product.name.toLowerCase().includes(q)) ||
      formatDate(s.createdAt).toLowerCase().includes(q)
    ));
  }, [search, sales, movementFilter]);

  const currency = (value: number) => `$${Math.round(value).toLocaleString('es-CO')}`;
  const grossSales = sales.filter(s => !s.isPurchase).reduce((sum, s) => sum + s.totalAmount, 0);
  const paidPurchases = sales.filter(s => s.isPurchase).reduce((sum, s) => sum + (s.amountPaid ?? s.totalAmount), 0);
  const receivable = sales.filter(s => !s.isPurchase).reduce((sum, s) => sum + (s.pendingAmount || 0), 0);
  const collectedSales = sales.filter(s => !s.isPurchase).reduce((sum, s) => sum + Math.max(0, s.totalAmount - (s.pendingAmount || 0)), 0);

  const downloadMonthCsv = () => {
    const rows = [['Fecha', 'Tipo', 'Cliente / proveedor', 'Factura', 'Medio de pago', 'Total', 'Pagado', 'Pendiente', 'Ganancia potencial', 'Productos'], ...filtered.map(s => [formatDate(s.createdAt), s.isPurchase ? 'Compra' : 'Venta', s.isPurchase ? s.supplierName : (s.customerName || 'Venta mostrador'), s.invoiceNumber || '', s.isPurchase ? (s.purchasePaymentMethod || '') : s.paymentMethod, s.totalAmount, s.isPurchase ? (s.amountPaid ?? s.totalAmount) : '', s.isPurchase ? Math.max(0, s.totalAmount - (s.amountPaid ?? s.totalAmount)) : '', s.isPurchase ? s.items.reduce((sum, item: any) => sum + (item.sellingPriceAtPurchase - item.unitPrice) * item.quantity, 0) : '', s.items.map(i => `${i.product.name} x${i.quantity}`).join(', ')])];
    const csv = '\uFEFF' + rows.map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `historial-ventas-${filterMode === 'month' ? month : `${startDate}-${endDate}`}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const registerPurchasePayment = async (sale: SaleData) => {
    const purchaseId = sale.id.replace(/^purchase-/, '');
    const amount = Number(paymentAmounts[purchaseId]);
    if (!Number.isFinite(amount) || amount <= 0) return;
    try {
      await api.post(`/suppliers/purchases/${purchaseId}/payments`, { amount, paymentMethod: paymentMethods[purchaseId] || 'EFECTIVO' });
      setPaymentAmounts(prev => ({ ...prev, [purchaseId]: '' }));
      await fetchSales();
    } catch (err: any) {
      window.alert(err.response?.data?.message || 'No se pudo registrar el abono.');
    }
  };

  /* ── WhatsApp share ── */
  const handleSendWhatsApp = (sale: SaleData) => {
    sendReceiptByWhatsApp(sale, business, adminName);
  };

  const handleDownloadPdf = (sale: SaleData) => {
    downloadReceiptPdf(sale, business, adminName);
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
      <h2>Factura Electrónica de Venta</h2>
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
            Historial de Ventas y Compras
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Consulta ventas y compras del negocio, filtra períodos y revisa la inversión
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchSales} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <RefreshCw size={16} className={loading ? 'spinner' : ''} />
          Actualizar
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <label>Filtrar por <select aria-label="Tipo de filtro del historial" className="form-input" value={filterMode} onChange={e => setFilterMode(e.target.value as 'dates' | 'month')} style={{ width: 'auto', display: 'inline-block', marginLeft: '0.5rem' }}><option value="dates">Días / rango</option><option value="month">Mes</option></select></label>
        {filterMode === 'month' ? <label>Mes <input aria-label="Mes del historial" type="month" className="form-input" style={{ width: 'auto', display: 'inline-block', marginLeft: '0.5rem' }} max={currentMonth} value={month} onChange={e => setMonth(e.target.value)} /></label> : <>
        <label>Desde <input aria-label="Fecha inicial del historial" type="date" className="form-input" style={{ width: 'auto', display: 'inline-block', marginLeft: '0.5rem' }} max={currentDate} value={startDate} onChange={e => { const value = e.target.value; setStartDate(value); if (value > endDate) setEndDate(value); }} /></label>
        <label>Hasta <input aria-label="Fecha final del historial" type="date" className="form-input" style={{ width: 'auto', display: 'inline-block', marginLeft: '0.5rem' }} min={startDate} max={currentDate} value={endDate} onChange={e => setEndDate(e.target.value)} /></label>
        </>}
        <button className="btn btn-primary" onClick={downloadMonthCsv}><Download size={16} /> Exportar período para Excel</button>
      </div>
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

      {/* Resumen financiero del período */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '.75rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Ventas brutas', value: currency(grossSales), color: 'var(--accent)' },
          { label: 'Compras pagadas', value: `−${currency(paidPurchases)}`, color: 'var(--warning)' },
          { label: 'Flujo neto de movimientos', value: currency(collectedSales - paidPurchases), color: collectedSales - paidPurchases >= 0 ? 'var(--accent)' : 'var(--danger)' },
          { label: 'Cuentas por cobrar', value: currency(receivable), color: 'var(--danger)' }
        ].map(card => <div key={card.label} className="glass-panel" style={{ padding: '1rem 1.1rem' }}><div style={{ color: 'var(--text-dim)', fontSize: '.8rem', marginBottom: '.35rem' }}>{card.label}</div><strong style={{ color: card.color, fontSize: '1.25rem' }}>{card.value}</strong></div>)}
      </div>
      <p style={{ color: 'var(--text-dim)', fontSize: '.75rem', margin: '-.75rem 0 1rem' }}>Cifras de los movimientos del período. Los abonos de ventas se reflejan en cartera; compras pagadas usa los pagos registrados.</p>

      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {([['ALL', 'Todos'], ['SALES', 'Solo ventas'], ['PURCHASES', 'Solo compras'], ['CREDIT', 'Créditos pendientes']] as const).map(([value, label]) => <button key={value} type="button" className={`btn ${movementFilter === value ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMovementFilter(value)}>{label}</button>)}
      </div>

      {/* Contador */}
      <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '1rem' }}>
        {filtered.length} {filtered.length === 1 ? 'movimiento encontrado' : 'movimientos encontrados'}
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
          <p>No hay ventas ni compras que coincidan con tu búsqueda.</p>
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
                      {sale.isPurchase ? 'COMPRA' : 'VENTA'} · 
                      #{sale.id.slice(-8).toUpperCase()}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{formatDate(sale.createdAt)}</div>
                  </div>

                  {/* Cliente (si existe) */}
                  <div style={{ flex: '1 1 160px' }}>
                    {sale.isPurchase ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.88rem' }}><PackagePlus size={13} color="var(--warning)" /><span>Compra a {sale.supplierName}</span></div>
                    ) : sale.customerName ? (
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
                    <span className={`badge ${sale.isPurchase ? '' : 'badge-success'}`}
                      style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.3rem', ...(sale.isPurchase ? { background: 'rgba(245, 158, 11, 0.16)', color: 'var(--warning)' } : {}) }}>
                      {sale.isPurchase ? <PackagePlus size={14} /> : METHOD_ICON[sale.paymentMethod]}
                      {sale.isPurchase ? (METHOD_LABEL[sale.purchasePaymentMethod || ''] || sale.purchasePaymentMethod || 'Compra') : (METHOD_LABEL[sale.paymentMethod] ?? sale.paymentMethod)}
                    </span>
                  </div>
                  <span className="badge" style={{ fontSize: '.7rem', background: (sale.isPurchase ? (sale.totalAmount > (sale.amountPaid ?? sale.totalAmount)) : (sale.pendingAmount || 0) > 0) ? 'rgba(245,158,11,.16)' : 'rgba(16,185,129,.14)', color: (sale.isPurchase ? (sale.totalAmount > (sale.amountPaid ?? sale.totalAmount)) : (sale.pendingAmount || 0) > 0) ? 'var(--warning)' : 'var(--success)' }}>
                    {sale.isPurchase ? (sale.totalAmount > (sale.amountPaid ?? sale.totalAmount) ? 'Pendiente' : 'Pagado') : ((sale.pendingAmount || 0) > 0 ? 'Pendiente · Crédito' : 'Pagado')}
                  </span>

                  {/* Total */}
                  <div style={{ flex: '0 0 auto', textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: sale.isPurchase ? 'var(--warning)' : 'var(--accent)' }}>
                        {sale.isPurchase ? '−' : ''}${sale.totalAmount.toLocaleString('es-CO')}
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
                        {sale.isPurchase ? 'Productos comprados' : 'Productos vendidos'}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {sale.items.map(it => (
                          <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>{it.product.name} × {it.quantity}{sale.isPurchase && <small style={{ display: 'block', color: 'var(--text-dim)' }}>Costo ${it.unitPrice.toLocaleString('es-CO')} c/u · Venta estimada ${Number((it as any).sellingPriceAtPurchase || 0).toLocaleString('es-CO')} c/u · Ganancia potencial ${((Number((it as any).sellingPriceAtPurchase || 0) - it.unitPrice) * it.quantity).toLocaleString('es-CO')}</small>}</span>
                            <span style={{ fontWeight: 600 }}>${it.subtotal.toLocaleString('es-CO')}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Resumen financiero */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', fontSize: '0.88rem', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem' }}>
                        <span>{sale.isPurchase ? 'Total invertido' : 'Total cobrado'}</span>
                        <span style={{ color: sale.isPurchase ? 'var(--warning)' : 'var(--accent)' }}>{sale.isPurchase ? '−' : ''}${sale.totalAmount.toLocaleString('es-CO')}</span>
                      </div>
                      {sale.isPurchase && <>
                        {sale.invoiceNumber && <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.35rem', color: 'var(--text-muted)' }}><span>Factura</span><span>{sale.invoiceNumber}</span></div>}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.35rem', color: 'var(--text-muted)' }}><span>Pagado · {METHOD_LABEL[sale.purchasePaymentMethod || ''] || sale.purchasePaymentMethod || 'Pago registrado'}</span><span>${(sale.amountPaid ?? sale.totalAmount).toLocaleString('es-CO')}</span></div>
                        {sale.totalAmount > (sale.amountPaid ?? sale.totalAmount) && <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.35rem', color: 'var(--danger)' }}><span>Saldo pendiente</span><span>${(sale.totalAmount - (sale.amountPaid ?? sale.totalAmount)).toLocaleString('es-CO')}</span></div>}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.35rem', color: 'var(--accent)' }}><span>Ganancia potencial al vender</span><span>${sale.items.reduce((sum, item: any) => sum + (Number(item.sellingPriceAtPurchase || 0) - item.unitPrice) * item.quantity, 0).toLocaleString('es-CO')}</span></div>
                        {!!sale.purchasePayments?.length && <div style={{ marginTop: '.7rem', borderTop: '1px solid var(--bg-card-border)', paddingTop: '.55rem' }}><strong style={{ fontSize: '.8rem' }}>Constancias de pago</strong>{sale.purchasePayments.map(payment => <div key={payment.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '.5rem', marginTop: '.3rem', color: 'var(--text-muted)', fontSize: '.8rem' }}><span>{new Date(payment.createdAt).toLocaleString('es-CO')} · {METHOD_LABEL[payment.paymentMethod] || payment.paymentMethod}{payment.note ? ` · ${payment.note}` : ''}</span><span>${payment.amount.toLocaleString('es-CO')}</span></div>)}</div>}
                        {sale.totalAmount > (sale.amountPaid ?? sale.totalAmount) && <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '.75rem' }}><input aria-label="Valor del abono a compra" className="form-input" type="number" min="1" max={sale.totalAmount - (sale.amountPaid ?? 0)} placeholder="Valor del abono" value={paymentAmounts[sale.id.replace(/^purchase-/, '')] || ''} onChange={e => setPaymentAmounts(prev => ({ ...prev, [sale.id.replace(/^purchase-/, '')]: e.target.value }))} style={{ width: 150 }} /><select aria-label="Medio de pago del abono" className="form-input" value={paymentMethods[sale.id.replace(/^purchase-/, '')] || 'EFECTIVO'} onChange={e => setPaymentMethods(prev => ({ ...prev, [sale.id.replace(/^purchase-/, '')]: e.target.value }))} style={{ width: 'auto' }}><option value="EFECTIVO">Efectivo</option><option value="TRANSFERENCIA">Transferencia</option><option value="TARJETA">Tarjeta</option></select><button type="button" className="btn btn-secondary" onClick={() => void registerPurchasePayment(sale)}>Registrar abono</button></div>}
                      </>}
                      {!sale.isPurchase && <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.35rem', color: 'var(--text-muted)' }}><span>Estado de pago</span><span>{(sale.pendingAmount || 0) > 0 ? `Abonado ${currency(sale.totalAmount - (sale.pendingAmount || 0))} · Saldo ${currency(sale.pendingAmount || 0)}` : 'Pagado'}</span></div>
                        {!!sale.allocations?.length && <div style={{ marginTop: '.7rem', borderTop: '1px solid var(--bg-card-border)', paddingTop: '.55rem' }}><strong style={{ fontSize: '.8rem' }}>Abonos recibidos</strong>{sale.allocations.map(allocation => <div key={allocation.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '.5rem', marginTop: '.3rem', color: 'var(--text-muted)', fontSize: '.8rem' }}><span>{new Date(allocation.payment.createdAt || allocation.createdAt).toLocaleString('es-CO')} · {METHOD_LABEL[allocation.payment.paymentMethod] || allocation.payment.paymentMethod}</span><span>{currency(allocation.amount)}</span></div>)}</div>}
                      </>}
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
                      {!sale.isPurchase && <ReceiptActions
                        onWhatsApp={() => handleSendWhatsApp(sale)}
                        onDownloadPdf={() => handleDownloadPdf(sale)}
                        onPrint={() => printReceipt(sale)}
                      />}
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
