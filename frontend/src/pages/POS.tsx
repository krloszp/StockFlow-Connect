import React, { useEffect, useState, useRef } from 'react';
import {
  ShoppingCart, Plus, Minus, Trash2, CheckCircle2, DollarSign,
  CreditCard, Banknote, Search, User, Phone, X,
  Clock, Wallet, Check, Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { downloadReceiptPdf, sendReceiptByWhatsApp } from '../utils/receiptPdf';
import { ReceiptActions } from '../components/ReceiptActions';

/* ─────────── tipos ─────────── */
type PaymentMethod = 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'CREDITO';

interface CustomerSearchResult {
  id: string;
  cedula: string;
  name: string;
  phone: string | null;
  whatsappOptIn: boolean;
  email: string | null;
  address: string | null;
  balance: number;
  creditLimit: number;
  pendingOrdersCount: number;
  pendingOrdersTotal: number;
}

interface SaleResult {
  whatsappWelcome?: { name: string; phone: string } | null;
  sale: {
    id: string;
    totalAmount: number;
    paymentMethod: PaymentMethod;
    cashGiven: number | null;
    changeGiven: number | null;
    pendingAmount?: number | null;
    customerId?: string | null;
    customerCedula?: string | null;
    customerName: string | null;
    customerPhone: string | null;
    customerEmail?: string | null;
    customerNote: string | null;
    createdAt?: string;
    items: { product: { name: string }; quantity: number; unitPrice: number; subtotal: number }[];
    customer?: { id: string; cedula: string; name: string; email?: string | null; balance: number; creditLimit: number } | null;
  };
  metrics: { totalAmount: number; totalCost: number; netProfit: number };
}

/* ─────────── helpers ─────────── */
const METHOD_LABEL: Record<PaymentMethod, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Nequi / Transferencia',
  TARJETA: 'Tarjeta',
  CREDITO: 'A Crédito / Fiado'
};

const initialWhatsAppMessageUrl = (phone: string, name: string, business: string) => {
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 10) digits = `57${digits}`;
  const message = `Hola ${name}, gracias por preferir ${business}. Te damos la bienvenida. Guarda este número para que podamos atenderte por WhatsApp cuando lo necesites. ¡Estamos para ayudarte!`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
};

export const POS: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<{ product: any; quantity: number }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFECTIVO');
  const [cashGiven, setCashGiven] = useState<number | ''>('');
  const [search, setSearch] = useState('');

  /* datos del cliente */
  const [showCustomer, setShowCustomer] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerCedula, setCustomerCedula] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [customerBalance, setCustomerBalance] = useState<number>(0);
  const [customerCreditLimit, setCustomerCreditLimit] = useState<number>(0);
  const [customerPendingOrders, setCustomerPendingOrders] = useState<number>(0);

  /* búsqueda / autocomplete de cliente */
  const [customerSuggestions, setCustomerSuggestions] = useState<CustomerSearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<any>(null);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [saleSuccess, setSaleSuccess] = useState<SaleResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [business, setBusiness] = useState<any>(null);
  const [adminName, setAdminName] = useState('');

  /* nombre del comercio configurado */
  const storeName = business?.name || localStorage.getItem('stockflow_business_name') || 'StockFlow Connect';

  const fetchProducts = async () => {
    try {
      const [prodRes, bizRes, userRes] = await Promise.all([
        api.get('/products?limit=100'),
        api.get('/settings/business').catch(() => null),
        api.get('/auth/me').catch(() => null)
      ]);
      setProducts(prodRes.data.products || []);
      if (bizRes?.data?.settings) {
        setBusiness(bizRes.data.settings);
      }
      if (userRes?.data?.user?.name) setAdminName(userRes.data.user.name);
    } catch (err) {
      console.error('Error cargando datos para POS:', err);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  // Cerrar sugerencias al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* Búsqueda en vivo de clientes registrados */
  const handleCustomerQueryChange = (type: 'cedula' | 'name', value: string) => {
    if (type === 'cedula') setCustomerCedula(value);
    if (type === 'name') setCustomerName(value);

    // Si ya había un cliente seleccionado y el usuario modifica el campo, deseleccionar ID
    if (selectedCustomerId) {
      setSelectedCustomerId(null);
      setCustomerBalance(0);
      setCustomerCreditLimit(0);
      setCustomerPendingOrders(0);
    }

    if (searchTimeout) clearTimeout(searchTimeout);

    if (!value || value.trim().length < 2) {
      setCustomerSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/customers/search?query=${encodeURIComponent(value.trim())}`);
        setCustomerSuggestions(res.data.customers || []);
        setShowSuggestions(true);
      } catch (err) {
        console.error('Error buscando clientes:', err);
      }
    }, 250);

    setSearchTimeout(timer);
  };

  /* Seleccionar cliente sugerido */
  const handleSelectCustomer = (c: CustomerSearchResult) => {
    setSelectedCustomerId(c.id);
    setCustomerCedula(c.cedula);
    setCustomerName(c.name);
    setCustomerPhone(c.phone || '');
    setWhatsappOptIn(c.whatsappOptIn || false);
    setCustomerEmail(c.email || '');
    setCustomerAddress(c.address || '');
    setCustomerBalance(c.balance || 0);
    setCustomerCreditLimit(c.creditLimit || 0);
    setCustomerPendingOrders(c.pendingOrdersCount || 0);
    setShowSuggestions(false);
  };

  /* Limpiar cliente seleccionado */
  const handleClearCustomer = () => {
    setSelectedCustomerId(null);
    setCustomerCedula('');
    setCustomerName('');
    setCustomerPhone('');
    setWhatsappOptIn(false);
    setCustomerEmail('');
    setCustomerAddress('');
    setCustomerNote('');
    setCustomerBalance(0);
    setCustomerCreditLimit(0);
    setCustomerPendingOrders(0);
    setShowSuggestions(false);
  };

  /* Cálculo de Total en Tiempo Real */
  const totalAmount = cart.reduce((acc, item) => acc + item.product.sellingPrice * item.quantity, 0);

  // Vuelto o cambio
  const changeGiven =
    paymentMethod === 'EFECTIVO' && cashGiven !== '' && Number(cashGiven) >= totalAmount
      ? Number(cashGiven) - totalAmount
      : 0;

  // Saldo por pagar si es a crédito
  const creditPendingAmount =
    paymentMethod === 'CREDITO'
      ? Math.max(0, totalAmount - (cashGiven !== '' ? Number(cashGiven) : 0))
      : 0;

  const addToCart = (product: any) => {
    if (product.stock <= 0) { alert(`"${product.name}" no tiene stock disponible.`); return; }
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        if (existing.quantity + 1 > product.stock) {
          alert(`Solo quedan ${product.stock} unidades de "${product.name}".`);
          return prev;
        }
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id !== productId) return item;
      const newQty = item.quantity + delta;
      if (newQty <= 0) return null as any;
      if (newQty > item.product.stock) { alert(`Stock máximo: ${item.product.stock}`); return item; }
      return { ...item, quantity: newQty };
    }).filter(Boolean) as any);
  };

  const removeFromCart = (productId: string) =>
    setCart(prev => prev.filter(i => i.product.id !== productId));

  /* HU-010: Registrar Venta Rápida */
  const handleCheckout = async () => {
    if (cart.length === 0) { setErrorMsg('El carrito está vacío.'); return; }

    if (paymentMethod === 'EFECTIVO' && (cashGiven === '' || Number(cashGiven) < totalAmount)) {
      setErrorMsg(`Dinero recibido ($${cashGiven || 0}) debe ser ≥ al total ($${totalAmount}).`);
      return;
    }

    // Validación de venta a crédito
    if (paymentMethod === 'CREDITO') {
      if (!customerCedula.trim() || !customerName.trim()) {
        setShowCustomer(true);
        setErrorMsg('Para vender a crédito (fiado), debes registrar la Cédula y Nombre del cliente.');
        return;
      }
      if (creditPendingAmount > Math.max(0, customerCreditLimit - customerBalance)) {
        setErrorMsg(`Cupo de crédito alcanzado. Disponible: $${Math.max(0, customerCreditLimit - customerBalance).toLocaleString('es-CO')}. Registra un abono o solicita al administrador ampliar el cupo.`);
        return;
      }
    }

    // Si se llenó algún dato de cliente, la cédula y el nombre son obligatorios
    const hasAnyCustomerData = customerCedula.trim() || customerName.trim() || customerPhone.trim() || customerEmail.trim();
    if (hasAnyCustomerData && (!customerCedula.trim() || !customerName.trim())) {
      setShowCustomer(true);
      setErrorMsg('La cédula de ciudadanía y el nombre son obligatorios para identificar o registrar al cliente.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      const payload = {
        paymentMethod,
        cashGiven:
          paymentMethod === 'EFECTIVO'
            ? Number(cashGiven)
            : paymentMethod === 'CREDITO'
            ? (cashGiven !== '' ? Number(cashGiven) : 0)
            : totalAmount,
        customerId: selectedCustomerId || undefined,
        customerCedula: customerCedula.trim() || undefined,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        whatsappOptIn,
        customerEmail: customerEmail.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        customerNote: customerNote.trim() || undefined,
        items: cart.map(i => ({ productId: i.product.id, quantity: i.quantity }))
      };

      const res = await api.post('/sales', payload);
      setSaleSuccess(res.data);
      setCart([]);
      setCashGiven('');
      handleClearCustomer();
      setShowCustomer(false);
      fetchProducts();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error al procesar la venta.');
    } finally {
      setLoading(false);
    }
  };

  /* acciones del modal de éxito */
  const handleShareWhatsapp = () => {
    if (!saleSuccess) return;
    sendReceiptByWhatsApp(saleSuccess.sale, business, adminName);
  };

  const handleDownloadPdf = () => {
    if (saleSuccess) downloadReceiptPdf(saleSuccess.sale, business, adminName);
  };

  const handlePrint = () => {
    if (!saleSuccess) return;
    const sale = saleSuccess.sale;
    const docInfo = business?.documentNumber ? `${business.documentType || 'NIT'}: ${business.documentNumber}` : '';
    const addressInfo = [business?.address, business?.city].filter(Boolean).join(' - ');
    const phoneInfo = business?.phone ? `Tel: ${business.phone}` : '';
    const footerMsg = business?.receiptMessage || '¡Gracias por su compra! 🙏';

    const html = `
      <html><head><title>Recibo #${sale.id.slice(-8).toUpperCase()}</title>
      <style>
        body{font-family:Arial,sans-serif;max-width:320px;margin:0 auto;padding:1rem;font-size:13px}
        h2{text-align:center;font-size:1rem;margin-bottom:0.2rem}
        p{margin:0.2rem 0}.divider{border-top:1px dashed #999;margin:0.6rem 0}
        .row{display:flex;justify-content:space-between}.total{font-weight:700;font-size:1rem}
        .center{text-align:center}
      </style></head><body>
      <h2>Factura Electrónica de Venta</h2>
      <p class="center" style="font-weight:700;font-size:12px">${storeName}</p>
      ${docInfo ? `<p class="center" style="font-size:11px;color:#666">${docInfo}</p>` : ''}
      ${addressInfo ? `<p class="center" style="font-size:11px;color:#666">${addressInfo}</p>` : ''}
      ${phoneInfo ? `<p class="center" style="font-size:11px;color:#666">${phoneInfo}</p>` : ''}
      <p class="center" style="font-size:11px;color:#888">Ref: #${sale.id.slice(-8).toUpperCase()}</p>
      <div class="divider"></div>
      ${sale.customerName ? `<p><b>Cliente:</b> ${sale.customerName} ${sale.customerCedula ? `(CC: ${sale.customerCedula})` : ''}</p>` : ''}
      ${sale.customerPhone ? `<p><b>Teléfono:</b> ${sale.customerPhone}</p>` : ''}
      <p><b>Pago:</b> ${METHOD_LABEL[sale.paymentMethod]}</p>
      ${sale.paymentMethod === 'CREDITO' && sale.pendingAmount ? `<p style="color:#d9534f"><b>Saldo por pagar:</b> $${sale.pendingAmount.toLocaleString('es-CO')}</p>` : ''}
      <div class="divider"></div>
      <b>Productos:</b>
      ${sale.items.map(it => `<div class="row"><span>${it.product.name} x${it.quantity}</span><span>$${it.subtotal.toLocaleString('es-CO')}</span></div>`).join('')}
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

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  // Identificar si los datos ingresados corresponden a un cliente nuevo
  const isEnteringNewCustomer =
    !selectedCustomerId &&
    customerCedula.trim().length >= 3 &&
    customerName.trim().length >= 2;

  return (
    <div style={{ padding: '2rem', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShoppingCart color="var(--primary)" />
          Venta Rápida <span className="gradient-text">(Punto de Venta POS)</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Selecciona productos para armar la venta y procesar el cobro al instante
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '1.5rem' }}>
        {/* ── Catálogo ── */}
        <div>
          <div className="glass-panel" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={18} color="var(--text-dim)" />
            <input type="text" className="form-input"
              style={{ background: 'transparent', border: 'none' }}
              placeholder="Buscar producto para agregar..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
            {filteredProducts.map(p => (
              <div key={p.id} className="glass-panel"
                style={{ padding: '1rem', cursor: p.stock > 0 ? 'pointer' : 'not-allowed', opacity: p.stock > 0 ? 1 : 0.5, transition: 'var(--transition)' }}
                onClick={() => p.stock > 0 && addToCart(p)}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>{p.name}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent)' }}>${p.sellingPrice.toLocaleString()}</div>
                <div style={{ fontSize: '0.75rem', color: p.stock > 0 ? 'var(--text-muted)' : 'var(--danger)', marginTop: '0.5rem' }}>
                  {p.stock > 0 ? `Stock: ${p.stock}` : '¡Agotado!'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Panel lateral Carrito & Cobro ── */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Carrito POS</span>
            <span className="badge badge-success">{cart.length} ítems</span>
          </h2>

          {errorMsg && <div className="form-error">{errorMsg}</div>}

          {/* Ítems del carrito */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '220px', overflowY: 'auto' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                Haz clic en cualquier producto para agregarlo.
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.product.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--accent)' }}>
                      ${item.product.sellingPrice.toLocaleString()} × {item.quantity} = ${(item.product.sellingPrice * item.quantity).toLocaleString()}
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

          {/* ── Datos del Cliente (Identificación y Autocomplete) ── */}
          <div style={{ borderTop: '1px solid var(--bg-card-border)', paddingTop: '1rem' }} ref={customerDropdownRef}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{
                width: '100%',
                justifyContent: 'space-between',
                fontSize: '0.85rem',
                padding: '0.55rem 0.75rem',
                marginBottom: showCustomer ? '0.75rem' : 0,
                borderColor: selectedCustomerId ? 'var(--accent)' : undefined
              }}
              onClick={() => setShowCustomer(v => !v)}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={15} color={selectedCustomerId ? 'var(--accent)' : 'inherit'} />
                {selectedCustomerId ? (
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                    Cliente: {customerName} (CC: {customerCedula})
                  </span>
                ) : (
                  <span>Datos del cliente {paymentMethod === 'CREDITO' ? '(Obligatorio)' : '(Opcional)'}</span>
                )}
              </span>
              {showCustomer ? <X size={14} /> : <Plus size={14} />}
            </button>

            {showCustomer && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', animation: 'fadeIn 0.2s ease', position: 'relative' }}>
                
                {/* Banner de Cliente Seleccionado */}
                {selectedCustomerId ? (
                  <div style={{
                    padding: '0.75rem',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.3rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Check size={14} /> Cliente Registrado
                      </span>
                      <button
                        type="button"
                        onClick={handleClearCustomer}
                        className="btn btn-secondary"
                        style={{ padding: '0.15rem 0.45rem', fontSize: '0.72rem', color: 'var(--danger)' }}
                      >
                        Cambiar / Limpiar
                      </button>
                    </div>
                    <div style={{ fontWeight: 600 }}>{customerName} — CC: {customerCedula}</div>
                    {customerPhone && <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Tel: {customerPhone}</div>}

                    {/* Alertas de saldo o pedidos */}
                    {customerBalance > 0 && (
                      <div style={{ color: 'var(--danger)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                        <Wallet size={12} /> Saldo por pagar acumulado: <b>${customerBalance.toLocaleString('es-CO')}</b>
                      </div>
                    )}
                    {customerPendingOrders > 0 && (
                      <div style={{ color: 'var(--warning)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={12} /> Tiene <b>{customerPendingOrders} pedido(s) pendiente(s)</b>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Campo Cédula con búsqueda en vivo */}
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                    Cédula de Ciudadanía {paymentMethod === 'CREDITO' && '*'}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                    placeholder="Escribe cédula para buscar o registrar..."
                    value={customerCedula}
                    onChange={e => handleCustomerQueryChange('cedula', e.target.value)}
                  />
                </div>

                {/* Campo Nombre con búsqueda en vivo */}
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                    Nombre del Cliente {paymentMethod === 'CREDITO' && '*'}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                    placeholder="Escribe nombre para buscar o registrar..."
                    value={customerName}
                    onChange={e => handleCustomerQueryChange('name', e.target.value)}
                  />
                </div>

                {/* Dropdown de Sugerencias de Autocomplete */}
                {showSuggestions && customerSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '120px',
                    left: 0,
                    right: 0,
                    background: '#0f172a',
                    border: '1px solid var(--primary)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    zIndex: 50,
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    <div style={{ padding: '0.4rem 0.6rem', fontSize: '0.72rem', color: 'var(--text-dim)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      Clientes registrados encontrados (haz clic para autocompletar):
                    </div>
                    {customerSuggestions.map(s => (
                      <div
                        key={s.id}
                        onClick={() => handleSelectCustomer(s)}
                        style={{
                          padding: '0.6rem 0.8rem',
                          cursor: 'pointer',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.name}</span>
                          <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--primary-light)' }}>
                            CC: {s.cedula}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                          {s.phone && <span>📞 {s.phone}</span>}
                          {s.balance > 0 && <span style={{ color: 'var(--danger)' }}>Debe: ${s.balance.toLocaleString('es-CO')}</span>}
                          {s.pendingOrdersCount > 0 && <span style={{ color: 'var(--warning)' }}>{s.pendingOrdersCount} ped. pend.</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Notificación de Auto-registro para cliente nuevo */}
                {isEnteringNewCustomer && (
                  <div style={{
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(99, 102, 241, 0.08)',
                    border: '1px dashed rgba(99, 102, 241, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.76rem',
                    color: 'var(--primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}>
                    <Sparkles size={14} style={{ flexShrink: 0 }} />
                    <span>
                      <b>Nuevo cliente:</b> Se registrará automáticamente en la sección <b>Clientes</b> al completar la venta.
                    </span>
                  </div>
                )}

                {/* Teléfono */}
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                    Teléfono / WhatsApp (Opcional)
                  </label>
                  <input
                    type="tel"
                    className="form-input"
                    style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                    placeholder="Teléfono para enviar recibo..."
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                  />
                  {customerPhone.trim() && <label style={{ display: 'flex', alignItems: 'flex-start', gap: '.55rem', marginTop: '.5rem', color: 'var(--text-muted)', fontSize: '.78rem', lineHeight: 1.4 }}>
                    <input type="checkbox" checked={whatsappOptIn} onChange={e => setWhatsappOptIn(e.target.checked)} style={{ marginTop: 2 }} />
                    El cliente autoriza recibir un mensaje de bienvenida por WhatsApp para guardar nuestro contacto.
                  </label>}
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                    Correo electrónico (Opcional)
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                    placeholder="correo@ejemplo.com"
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                  />
                </div>

                {/* Dirección */}
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                    Dirección (Opcional)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                    placeholder="Dirección del cliente..."
                    value={customerAddress}
                    onChange={e => setCustomerAddress(e.target.value)}
                  />
                </div>

                {/* Nota */}
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                    Nota u observación (Opcional)
                  </label>
                  <textarea
                    className="form-input"
                    style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem', resize: 'none', minHeight: '48px' }}
                    placeholder="Nota sobre la entrega o cliente..."
                    value={customerNote}
                    onChange={e => setCustomerNote(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Método de Pago */}
          <div style={{ borderTop: '1px solid var(--bg-card-border)', paddingTop: '1rem' }}>
            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Método de Pago</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '0.5rem' }}>
              {(['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'CREDITO'] as PaymentMethod[]).map(m => (
                <button key={m} type="button"
                  className={`btn ${paymentMethod === m ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    padding: '0.55rem',
                    fontSize: '0.78rem',
                    borderColor: m === 'CREDITO' && paymentMethod === 'CREDITO' ? 'var(--warning)' : undefined
                  }}
                  onClick={() => {
                    setPaymentMethod(m);
                    if (m === 'CREDITO' && !showCustomer) setShowCustomer(true);
                  }}>
                  {m === 'EFECTIVO' ? <Banknote size={14} /> : m === 'TRANSFERENCIA' ? <DollarSign size={14} /> : m === 'TARJETA' ? <CreditCard size={14} /> : <Wallet size={14} />}
                  {m === 'EFECTIVO' ? 'Efectivo' : m === 'TRANSFERENCIA' ? 'Nequi / Transf.' : m === 'TARJETA' ? 'Tarjeta' : 'A Crédito / Fiado'}
                </button>
              ))}
            </div>
          </div>

          {/* Campo de efectivo recibido */}
          {paymentMethod === 'EFECTIVO' && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Dinero Recibido ($)</label>
              <input type="number" className="form-input"
                placeholder={`Ej: ${totalAmount}`}
                value={cashGiven}
                onChange={e => setCashGiven(e.target.value === '' ? '' : Number(e.target.value))} />
            </div>
          )}

          {/* Opciones cuando es A Crédito (Fiado) */}
          {paymentMethod === 'CREDITO' && (
            <div style={{
              padding: '0.75rem',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.82rem'
            }}>
              <div style={{ fontWeight: 600, color: 'var(--warning)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Wallet size={14} /> Venta a Crédito / Fiado
              </div>
              <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                El valor pendiente se registrará como <b>Saldo por Pagar</b> en la ficha del cliente.
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Abono inicial en caja ($) (Opcional)</label>
                <input
                  type="number"
                  min="0"
                  max={totalAmount}
                  className="form-input"
                  placeholder="0 (si no abona nada)"
                  value={cashGiven}
                  onChange={e => setCashGiven(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontWeight: 600, color: 'var(--danger)' }}>
                <span>Saldo por pagar:</span>
                <span>${creditPendingAmount.toLocaleString('es-CO')}</span>
              </div>
            </div>
          )}

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

            <button onClick={handleCheckout} className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem' }}
              disabled={cart.length === 0 || loading}>
              {loading ? <div className="spinner" /> : <><DollarSign size={18} /> Registrar Venta ($)</>}
            </button>
          </div>
        </div>
      </div>

      {/* ═══════ Modal de Éxito con Acciones ═══════ */}
      {saleSuccess && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '460px', padding: '2rem' }}>

            {/* Icono éxito */}
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(16,185,129,0.15)', borderRadius: '50%', marginBottom: '0.75rem' }}>
                <CheckCircle2 size={48} color="var(--accent)" />
              </div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>¡Venta Exitosa!</h2>
              {saleSuccess.sale.paymentMethod === 'CREDITO' && saleSuccess.sale.customer && saleSuccess.sale.customer.creditLimit > 0 && saleSuccess.sale.customer.balance >= saleSuccess.sale.customer.creditLimit && (
                <p style={{ color: 'var(--danger)', fontWeight: 600, padding: '.6rem', background: 'rgba(239,68,68,.08)', borderRadius: 'var(--radius-md)' }}>Alerta: el cliente alcanzó el tope de su cupo de crédito. No se autorizarán nuevos créditos hasta registrar abonos o ampliar el cupo.</p>
              )}
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Ref: #{saleSuccess.sale.id.slice(-8).toUpperCase()}
              </p>
            </div>

            {/* Datos del cliente */}
            {(saleSuccess.sale.customerName || saleSuccess.sale.customerCedula || saleSuccess.sale.customerPhone) && (
              <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.88rem' }}>
                {saleSuccess.sale.customerName && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem', fontWeight: 600 }}>
                    <User size={13} color="var(--primary)" />
                    <span>{saleSuccess.sale.customerName}</span>
                    {saleSuccess.sale.customerCedula && (
                      <span style={{ color: 'var(--primary-light)', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                        (CC: {saleSuccess.sale.customerCedula})
                      </span>
                    )}
                  </div>
                )}
                {saleSuccess.sale.customerPhone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    <Phone size={13} color="var(--primary)" />
                    <span>{saleSuccess.sale.customerPhone}</span>
                  </div>
                )}
                <div style={{ marginTop: '0.4rem', fontSize: '0.76rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Check size={12} /> Cliente guardado en sección Clientes
                </div>
              </div>
            )}

            {/* Alerta si fue a Crédito */}
            {saleSuccess.sale.paymentMethod === 'CREDITO' && (saleSuccess.sale.pendingAmount ?? 0) > 0 && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-md)', padding: '0.65rem 0.85rem', marginBottom: '1rem', fontSize: '0.84rem', color: 'var(--danger)' }}>
                <div style={{ fontWeight: 600 }}>⚠️ Venta a Crédito / Fiado</div>
                <div>Saldo por pagar asignado al cliente: <b>${(saleSuccess.sale.pendingAmount ?? 0).toLocaleString('es-CO')}</b></div>
              </div>
            )}

            {/* Resumen financiero */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              {saleSuccess.sale.items.map((it, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', color: 'var(--text-muted)' }}>
                  <span>{it.product.name} × {it.quantity}</span>
                  <span>${it.subtotal.toLocaleString('es-CO')}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--bg-card-border)', paddingTop: '0.5rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>Total</span>
                <span style={{ color: 'var(--accent)' }}>${saleSuccess.metrics.totalAmount.toLocaleString('es-CO')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem', fontSize: '0.85rem', color: 'var(--accent)' }}>
                <span>Ganancia neta</span>
                <span>+${saleSuccess.metrics.netProfit.toLocaleString('es-CO')}</span>
              </div>
              {saleSuccess.sale.changeGiven != null && saleSuccess.sale.changeGiven > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem', color: 'var(--warning)' }}>
                  <span>Vuelto entregado</span>
                  <span>${saleSuccess.sale.changeGiven.toLocaleString('es-CO')}</span>
                </div>
              )}
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {saleSuccess.whatsappWelcome && <a
                className="btn btn-secondary"
                href={initialWhatsAppMessageUrl(saleSuccess.whatsappWelcome.phone, saleSuccess.whatsappWelcome.name, storeName)}
                target="_blank" rel="noreferrer" style={{ textDecoration: 'none', justifyContent: 'center' }}
              ><Phone size={16} /> Preparar mensaje inicial por WhatsApp</a>}
              <ReceiptActions
                onWhatsApp={handleShareWhatsapp}
                onDownloadPdf={handleDownloadPdf}
                onPrint={handlePrint}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <button className="btn btn-secondary" style={{ justifyContent: 'center' }} onClick={() => setSaleSuccess(null)}>
                  Nueva Venta
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
