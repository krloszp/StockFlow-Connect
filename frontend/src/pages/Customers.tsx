import React, { useEffect, useState } from 'react';
import {
  Users, UserPlus, Search, Edit2, Trash2, Phone, MapPin, Send,
  Clock, DollarSign, CheckCircle2, 
  FileText, X, Wallet, Mail
} from 'lucide-react';
import { api } from '../services/api';

interface Customer {
  id: string;
  cedula: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  balance: number;
  creditLimit: number;
  pendingOrdersCount: number;
  pendingOrdersTotal: number;
  salesCount: number;
  salesActivity?: { createdAt: string }[];
  recentPayments?: { createdAt: string; amount: number; paymentMethod?: string; note?: string | null }[];
  createdAt: string;
}

export const Customers: React.FC<{ initialFilter?: 'all' | 'with-debt' }> = ({ initialFilter = 'all' }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [businessName, setBusinessName] = useState('la tienda');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [month, setMonth] = useState(currentMonth);
  const [filterType, setFilterType] = useState<'all' | 'with-debt' | 'with-orders'>(initialFilter);
  useEffect(() => { setFilterType(initialFilter); }, [initialFilter]);

  // Modal Crear / Editar
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cedula, setCedula] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [initialBalance, setInitialBalance] = useState<number | ''>('');
  const [creditLimit, setCreditLimit] = useState<number | ''>('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modal Detalle / Estado de Cuenta
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Modal Registrar Abono / Pago
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [paymentError, setPaymentError] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers');
      setCustomers(res.data.customers || []);
    } catch (err: any) {
      console.error('Error al cargar clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => { api.get('/settings/business').then(res => setBusinessName(res.data.settings?.name || 'la tienda')).catch(() => {}); }, []);

  const whatsappHref = (customer: { name: string; phone?: string | null }, message = '') => {
    if (!customer.phone) return undefined;
    let phoneDigits = customer.phone.replace(/\D/g, '');
    if (phoneDigits.length === 10) phoneDigits = `57${phoneDigits}`;
    return `https://wa.me/${phoneDigits}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
  };

  const welcomeMessage = (customer: { name: string }) => `Hola ${customer.name}, gracias por preferir ${businessName}. Te damos la bienvenida. Guarda este número para que podamos atenderte por WhatsApp cuando lo necesites. ¡Estamos para ayudarte!`;
  const debtMessage = (customer: Customer) => `Hola ${customer.name}, te saludamos de ${businessName}. Te recordamos cordialmente que tienes un saldo pendiente de $${customer.balance.toLocaleString('es-CO')}. Cuando realices el abono, con gusto actualizaremos tu estado de cuenta. Si ya pagaste, puedes ignorar este mensaje. ¡Gracias!`;

  const handleOpenModal = (customer?: Customer) => {
    setErrorMsg('');
    if (customer) {
      setEditingId(customer.id);
      setCedula(customer.cedula);
      setName(customer.name);
      setPhone(customer.phone || '');
      setEmail(customer.email || '');
      setAddress(customer.address || '');
      setInitialBalance('');
      setCreditLimit(customer.creditLimit || 0);
    } else {
      setEditingId(null);
      setCedula('');
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setInitialBalance('');
      setCreditLimit(0);
    }
    setShowModal(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cedula.trim()) {
      setErrorMsg('La cédula de ciudadanía es obligatoria.');
      return;
    }
    if (!name.trim()) {
      setErrorMsg('El nombre completo del cliente es obligatorio.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      const payload: any = {
        cedula: cedula.trim(),
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined
        ,creditLimit: Number(creditLimit || 0)
      };

      if (!editingId && initialBalance !== '' && Number(initialBalance) > 0) {
        payload.balance = Number(initialBalance);
      }

      if (editingId) {
        await api.put(`/customers/${editingId}`, payload);
      } else {
        await api.post('/customers', payload);
      }

      setShowModal(false);
      fetchCustomers();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error al guardar los datos del cliente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (customer: Customer) => {
    const hasPending = customer.pendingOrdersCount > 0;
    const hasDebt = (customer.balance || 0) > 0;

    let warningText = `¿Estás seguro de que deseas eliminar al cliente "${customer.name}" (CC: ${customer.cedula})?`;
    if (hasDebt || hasPending) {
      warningText += `\n\n⚠️ Atención: Este cliente tiene ${hasDebt ? `un saldo por pagar de $${customer.balance.toLocaleString()}` : ''} ${hasDebt && hasPending ? 'y ' : ''}${hasPending ? `${customer.pendingOrdersCount} pedidos pendientes` : ''}.`;
    }

    if (!window.confirm(warningText)) return;

    try {
      await api.delete(`/customers/${customer.id}`);
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar cliente.');
    }
  };

  // Abrir detalle / estado de cuenta
  const handleOpenDetail = async (customerId: string) => {
    try {
      setLoadingDetail(true);
      const res = await api.get(`/customers/${customerId}`);
      setSelectedCustomer(res.data.customer);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al cargar detalles del cliente.');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Abrir modal de abono
  const handleOpenPayment = (customer: Customer) => {
    setPaymentCustomer(customer);
    setPaymentAmount(customer.balance > 0 ? customer.balance : '');
    setPaymentNote('');
    setPaymentMethod('EFECTIVO');
    setPaymentError('');
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentCustomer) return;

    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      setPaymentError('Ingresa un monto de abono válido mayor a 0.');
      return;
    }

    try {
      setProcessingPayment(true);
      setPaymentError('');
      await api.post(`/customers/${paymentCustomer.id}/payments`, {
        amount,
        paymentMethod,
        note: paymentNote.trim() || undefined
      });

      setShowPaymentModal(false);
      fetchCustomers();
      if (selectedCustomer && selectedCustomer.id === paymentCustomer.id) {
        handleOpenDetail(paymentCustomer.id);
      }
    } catch (err: any) {
      setPaymentError(err.response?.data?.message || 'Error al procesar el abono.');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Métricas generales
  const totalCustomers = customers.length;
  const customersWithDebt = customers.filter(c => (c.balance || 0) > 0);
  const totalDebt = customers.reduce((sum, c) => sum + (c.balance || 0), 0);
  const customersWithOrders = customers.filter(c => c.pendingOrdersCount > 0);
  const totalPendingOrders = customers.reduce((sum, c) => sum + c.pendingOrdersCount, 0);

  // Filtrado
  const filteredCustomers = customers.filter(c => {
    const activityThisMonth = (c.salesActivity || []).some((s: any) => s.createdAt?.slice(0, 7) === month) || (c.recentPayments || []).some((p: any) => p.createdAt?.slice(0, 7) === month) || c.createdAt?.slice(0, 7) === month;
    if (!activityThisMonth) return false;
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.cedula.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search)) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === 'with-debt') return (c.balance || 0) > 0;
    if (filterType === 'with-orders') return c.pendingOrdersCount > 0;
    return true;
  });

  return (
    <div style={{ padding: '2rem', minHeight: '100vh' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Users color="var(--primary)" />
            Gestión de <span className="gradient-text">Clientes</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Registro oficial, consulta de pedidos pendientes, saldos por pagar y control de cartera
          </p>
        </div>

        <button onClick={() => handleOpenModal()} className="btn btn-primary" style={{ padding: '0.7rem 1.25rem' }}>
          <UserPlus size={18} />
          <span>Registrar Nuevo Cliente</span>
        </button>
      </div>

      {/* ── Métricas Clave ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>Clientes Registrados</span>
            <Users size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.4rem' }}>
            {totalCustomers}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Base total de clientes activos</span>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderColor: totalDebt > 0 ? 'rgba(239, 68, 68, 0.3)' : undefined }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>Total Saldos por Pagar</span>
            <Wallet size={18} color={totalDebt > 0 ? 'var(--danger)' : 'var(--accent)'} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: totalDebt > 0 ? 'var(--danger)' : 'var(--accent)', marginTop: '0.4rem' }}>
            ${totalDebt.toLocaleString('es-CO')}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            {customersWithDebt.length} {customersWithDebt.length === 1 ? 'cliente con saldo pendiente' : 'clientes con saldo pendiente'}
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderColor: totalPendingOrders > 0 ? 'rgba(245, 158, 11, 0.3)' : undefined }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>Pedidos Pendientes</span>
            <Clock size={18} color={totalPendingOrders > 0 ? 'var(--warning)' : 'var(--text-dim)'} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: totalPendingOrders > 0 ? 'var(--warning)' : 'var(--text-main)', marginTop: '0.4rem' }}>
            {totalPendingOrders}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            {customersWithOrders.length} {customersWithOrders.length === 1 ? 'cliente con pedidos por entregar' : 'clientes con pedidos por entregar'}
          </span>
        </div>
      </div>

      {/* ── Buscador y Filtros ── */}
      <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Mes del historial <input aria-label="Mes del historial de clientes" type="month" max={currentMonth} className="form-input" style={{ width: 'auto' }} value={month} onChange={e => setMonth(e.target.value)} /></label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '260px' }}>
          <Search size={18} color="var(--text-dim)" />
          <input
            type="text"
            className="form-input"
            style={{ background: 'transparent', border: 'none' }}
            placeholder="Buscar por cédula de ciudadanía, nombre o teléfono..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Pestañas de filtro rápido */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn ${filterType === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            onClick={() => setFilterType('all')}
          >
            Todos ({customers.length})
          </button>
          <button
            className={`btn ${filterType === 'with-debt' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            onClick={() => setFilterType('with-debt')}
          >
            Con Saldos por Pagar ({customersWithDebt.length})
          </button>
          <button
            className={`btn ${filterType === 'with-orders' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            onClick={() => setFilterType('with-orders')}
          >
            Con Pedidos Pendientes ({customersWithOrders.length})
          </button>
        </div>
      </div>

      {/* ── Listado de Clientes ── */}
      {loadingDetail && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div className="spinner" />
        </div>
      )}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="spinner" />
          <p style={{ marginTop: '1rem', color: 'var(--text-dim)' }}>Cargando catálogo de clientes...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <Users size={48} color="var(--text-dim)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>No se encontraron clientes</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '450px', margin: '0.5rem auto 1.5rem' }}>
            {search || filterType !== 'all'
              ? 'No hay registros que coincidan con los filtros aplicados.'
              : 'Aún no tienes clientes registrados. Puedes registrar uno manualmente o se registrarán automáticamente al vender en Venta Rápida (POS).'}
          </p>
          <button onClick={() => handleOpenModal()} className="btn btn-primary">
            <UserPlus size={16} /> Registrar Primer Cliente
          </button>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--bg-card-border)' }}>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Cédula</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Nombre Completo</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Contacto y Ubicación</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'center' }}>Pedidos Pendientes</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'right' }}>Saldo por Pagar</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(c => {
                const hasDebt = (c.balance || 0) > 0;
                const hasOrders = c.pendingOrdersCount > 0;

                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--bg-card-border)', transition: 'background 0.2s' }}>
                    {/* Cédula */}
                    <td style={{ padding: '1rem', fontWeight: 600 }}>
                      <span style={{
                        background: 'rgba(99, 102, 241, 0.12)',
                        color: 'var(--primary-light)',
                        padding: '0.25rem 0.55rem',
                        borderRadius: 'var(--radius-sm)',
                        fontFamily: 'monospace',
                        fontSize: '0.85rem'
                      }}>
                        {c.cedula}
                      </span>
                    </td>

                    {/* Nombre */}
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                        {c.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {c.salesCount} {c.salesCount === 1 ? 'compra registrada' : 'compras registradas'}
                      </div>
                    </td>

                    {/* Contacto / Dirección */}
                    <td style={{ padding: '1rem' }}>
                      {c.phone ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                          <Phone size={13} color="var(--accent)" />
                          <a
                            href={whatsappHref(c, welcomeMessage(c))}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: 'var(--text-main)', textDecoration: 'none' }}
                            title="Enviar bienvenida por WhatsApp"
                          >
                            {c.phone}
                          </a>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>Sin teléfono</span>
                      )}

                      {c.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem', fontSize: '0.78rem' }}>
                          <Mail size={13} color="var(--accent)" />
                          <a href={`mailto:${c.email}`} style={{ color: 'var(--text-main)', textDecoration: 'none' }}>{c.email}</a>
                        </div>
                      )}

                      {c.address ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                          <MapPin size={12} color="var(--text-dim)" />
                          <span>{c.address}</span>
                        </div>
                      ) : null}
                    </td>

                    {/* Pedidos Pendientes */}
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      {hasOrders ? (
                        <button
                          onClick={() => handleOpenDetail(c.id)}
                          className="badge"
                          style={{
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: 'var(--warning)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.35rem 0.65rem'
                          }}
                          title="Ver pedidos pendientes de este cliente"
                        >
                          <Clock size={12} />
                          <span>{c.pendingOrdersCount} pendiente{c.pendingOrdersCount > 1 ? 's' : ''} (${c.pendingOrdersTotal.toLocaleString('es-CO')})</span>
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Sin pedidos</span>
                      )}
                    </td>

                    {/* Saldo por Pagar */}
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      {hasDebt ? (
                        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                          <span style={{
                            color: 'var(--danger)',
                            fontWeight: 700,
                            fontSize: '1rem'
                          }}>
                            ${c.balance.toLocaleString('es-CO')}
                          </span>
                          <button
                            onClick={() => handleOpenPayment(c)}
                            className="btn btn-secondary"
                            style={{
                              padding: '0.2rem 0.5rem',
                              fontSize: '0.72rem',
                              color: 'var(--accent)',
                              borderColor: 'rgba(16, 185, 129, 0.3)'
                            }}
                          >
                            <DollarSign size={11} /> Abonar / Pagar
                          </button>
                          {c.phone && <a className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', color: 'var(--accent)' }} target="_blank" rel="noreferrer" href={whatsappHref(c, debtMessage(c))}>Enviar recordatorio por WhatsApp</a>}
                        </div>
                      ) : (
                        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CheckCircle2 size={12} /> Al día ($0)
                        </span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                        <button
                          onClick={() => handleOpenDetail(c.id)}
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem' }}
                          title="Ver Historial y Estado de Cuenta"
                        >
                          <FileText size={14} />
                        </button>
                        <a
                          href={whatsappHref(c, welcomeMessage(c)) || '#'}
                          onClick={e => { if (!whatsappHref(c, welcomeMessage(c))) e.preventDefault(); }}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem', opacity: c.phone ? 1 : 0.45, pointerEvents: c.phone ? 'auto' : 'none' }}
                          title={c.phone ? 'Enviar bienvenida por WhatsApp' : 'Agrega un teléfono al cliente para enviarle un mensaje'}
                          aria-label={`Enviar bienvenida a ${c.name} por WhatsApp`}
                        >
                          <Send size={14} />
                        </a>
                        <button
                          onClick={() => handleOpenModal(c)}
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem' }}
                          title="Editar Datos del Cliente"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem', color: 'var(--danger)' }}
                          title="Eliminar Cliente"
                        >
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

      {/* ════════════ Modal: Registrar / Editar Cliente ════════════ */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users color="var(--primary)" />
                {editingId ? 'Actualizar Datos del Cliente' : 'Registrar Nuevo Cliente'}
              </h2>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ padding: '0.35rem' }}>
                <X size={16} />
              </button>
            </div>

            {errorMsg && (
              <div className="form-error" style={{ marginBottom: '1rem' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Cédula */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  Cédula de Ciudadanía <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: 1067894521"
                  value={cedula}
                  onChange={e => setCedula(e.target.value)}
                  autoFocus
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Dato obligatorio único de identificación</span>
              </div>

              {/* Nombre */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  Nombre Completo <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Carlos Alberto Gómez"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Dato obligatorio</span>
              </div>

              {/* Teléfono */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Teléfono / WhatsApp (Opcional)</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="Ej: 300 123 4567"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Correo electrónico (Opcional)</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="cliente@ejemplo.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              {/* Dirección */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Dirección de Residencia / Entrega (Opcional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Calle 30 # 14-25, Barrio Centro"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
              </div>

              {/* Saldo Inicial solo al crear */}
              {!editingId && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Saldo por Pagar Inicial / Deuda Previa ($) (Opcional)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    placeholder="0"
                    value={initialBalance}
                    onChange={e => setInitialBalance(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Solo si tiene una deuda pendiente anterior</span>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Cupo máximo de crédito ($)</label>
                <input type="number" min="0" className="form-input" value={creditLimit} onChange={e => setCreditLimit(e.target.value === '' ? '' : Number(e.target.value))} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Administrado por el responsable. Usa 0 para no autorizar crédito.</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <div className="spinner" /> : (editingId ? 'Guardar Cambios' : 'Registrar Cliente')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════ Modal: Detalle y Estado de Cuenta ════════════ */}
      {selectedCustomer && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            {/* Header Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--bg-card-border)', paddingBottom: '1rem' }}>
              <div>
                <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                  CC: {selectedCustomer.cedula}
                </span>
                <h2 style={{ fontSize: '1.4rem', margin: '0.2rem 0' }}>{selectedCustomer.name}</h2>
                <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                  {selectedCustomer.phone && <span>📞 {selectedCustomer.phone}</span>}
                  {selectedCustomer.email && <span>✉️ {selectedCustomer.email}</span>}
                  {selectedCustomer.address && <span>📍 {selectedCustomer.address}</span>}
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="btn btn-secondary" style={{ padding: '0.35rem' }}>
                <X size={16} />
              </button>
            </div>

            {/* Resumen Financiero del Cliente */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--bg-card-border)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Saldo por Pagar (Cartera)</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: (selectedCustomer.balance || 0) > 0 ? 'var(--danger)' : 'var(--accent)', marginTop: '0.2rem' }}>
                  ${(selectedCustomer.balance || 0).toLocaleString('es-CO')}
                </div>
                {(selectedCustomer.balance || 0) > 0 && (
                  <button
                    onClick={() => handleOpenPayment(selectedCustomer)}
                    className="btn btn-primary"
                    style={{ marginTop: '0.5rem', width: '100%', padding: '0.35rem', fontSize: '0.78rem' }}
                  >
                    <DollarSign size={12} /> Registrar Abono
                  </button>
                )}
              </div>

              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--bg-card-border)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Cupo de crédito disponible</span>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: (selectedCustomer.creditLimit - selectedCustomer.balance) > 0 ? 'var(--accent)' : 'var(--danger)', marginTop: '0.2rem' }}>${Math.max(0, selectedCustomer.creditLimit - selectedCustomer.balance).toLocaleString('es-CO')}</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Límite: ${(selectedCustomer.creditLimit || 0).toLocaleString('es-CO')}</span>
              </div>

              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--bg-card-border)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Pedidos Pendientes</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: (selectedCustomer.pendingOrdersCount || 0) > 0 ? 'var(--warning)' : 'var(--text-main)', marginTop: '0.2rem' }}>
                  {selectedCustomer.pendingOrdersCount || 0}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Total: ${(selectedCustomer.pendingOrdersTotal || 0).toLocaleString('es-CO')}
                </span>
              </div>

              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--bg-card-border)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Historial de Compras</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '0.2rem' }}>
                  {selectedCustomer.sales?.length || 0}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Transacciones realizadas</span>
              </div>
            </div>

            <div style={{ marginBottom: '1.75rem' }}>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '.75rem' }}>Créditos y compras registradas</h3>
              {!selectedCustomer.sales?.length ? <div style={{ color: 'var(--text-dim)', fontSize: '.85rem' }}>No hay ventas registradas.</div> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                  {selectedCustomer.sales.map((sale: any) => {
                    const creditPayments = sale.allocations || [];
                    return <div key={sale.id} style={{ padding: '1rem', border: '1px solid var(--bg-card-border)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '.5rem', flexWrap: 'wrap' }}>
                        <strong>Pedido #{sale.id.slice(-8).toUpperCase()} · {sale.paymentMethod === 'CREDITO' ? 'A crédito' : sale.paymentMethod}</strong>
                        <span>{new Date(sale.createdAt).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                      <div style={{ margin: '.55rem 0', fontSize: '.84rem', color: 'var(--text-muted)' }}>{sale.items?.map((item: any) => <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between' }}><span>{item.product?.name} × {item.quantity} · ${item.unitPrice.toLocaleString('es-CO')} c/u</span><span>${item.subtotal.toLocaleString('es-CO')}</span></div>)}</div>
                      <div style={{ borderTop: '1px dashed var(--bg-card-border)', paddingTop: '.5rem', display: 'grid', gap: '.25rem', fontSize: '.85rem' }}>
                        <span>Total: ${sale.totalAmount.toLocaleString('es-CO')} · Abono inicial: ${Math.max(0, (sale.cashGiven || 0) - (sale.changeGiven || 0)).toLocaleString('es-CO')}</span>
                        <span>Saldo pendiente: <b style={{ color: sale.pendingAmount > 0 ? 'var(--danger)' : 'var(--accent)' }}>${(sale.pendingAmount || 0).toLocaleString('es-CO')}</b></span>
                        {creditPayments.map((allocation: any) => <span key={allocation.id} style={{ color: 'var(--accent)' }}>Abono ${allocation.amount.toLocaleString('es-CO')} · {allocation.payment.paymentMethod} · {new Date(allocation.payment.createdAt).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}{allocation.payment.note ? ` · ${allocation.payment.note}` : ''}</span>)}
                      </div>
                    </div>;
                  })}
                </div>
              )}
            </div>

            {/* SECCIÓN 1: Pedidos Pendientes */}
            <div style={{ marginBottom: '1.75rem' }}>
              <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                <Clock size={16} color="var(--warning)" />
                Pedidos Pendientes de Entrega / Aprobación
              </h3>

              {(!selectedCustomer.pendingOrders || selectedCustomer.pendingOrders.length === 0) ? (
                <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.01)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--bg-card-border)', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                  Este cliente no tiene pedidos en estado pendiente actualmente.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedCustomer.pendingOrders.map((ord: any) => (
                    <div key={ord.id} style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div>
                          <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Pedido #{ord.id.slice(-6).toUpperCase()}</span>
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                            {new Date(ord.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: 'var(--warning)', fontSize: '0.75rem' }}>
                          PENDIENTE
                        </span>
                      </div>

                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        {ord.items?.map((it: any) => (
                          <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>• {it.product?.name || 'Producto'} x{it.quantity}</span>
                            <span>${(it.subtotal || 0).toLocaleString('es-CO')}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed rgba(245, 158, 11, 0.2)', paddingTop: '0.5rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Total del Pedido:</span>
                        <strong style={{ color: 'var(--accent)', fontSize: '0.95rem' }}>
                          ${(ord.totalAmount || 0).toLocaleString('es-CO')}
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECCIÓN 2: Historial de Abonos / Pagos */}
            {selectedCustomer.payments && selectedCustomer.payments.length > 0 && (
              <div style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                  <Wallet size={16} color="var(--accent)" />
                  Historial de Abonos Recibidos
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedCustomer.payments.map((p: any) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--accent)' }}>+ ${p.amount.toLocaleString('es-CO')}</span>
                        <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>· {p.paymentMethod || 'Efectivo'}</span>
                        {p.note && <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>— {p.note}</span>}
                      </div>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                        {new Date(p.createdAt).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botón cerrar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setSelectedCustomer(null)} className="btn btn-secondary">
                Cerrar Detalle
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1.25rem', borderTop: '1px solid var(--bg-card-border)', paddingTop: '1.25rem' }}>
              <a
                href={whatsappHref(selectedCustomer, welcomeMessage(selectedCustomer)) || '#'}
                onClick={e => { if (!selectedCustomer.phone) e.preventDefault(); }}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                aria-disabled={!selectedCustomer.phone}
                style={{ display: 'inline-flex', textDecoration: 'none', opacity: selectedCustomer.phone ? 1 : 0.5, pointerEvents: selectedCustomer.phone ? 'auto' : 'none' }}
              >
                <Send size={16} /> Enviar bienvenida por WhatsApp
              </a>
              {selectedCustomer.phone && <a className="btn btn-secondary" href={whatsappHref(selectedCustomer)} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', textDecoration: 'none' }}><Send size={15} /> Escribir nota personalizada</a>}
              {selectedCustomer.phone && selectedCustomer.balance > 0 && <a className="btn btn-secondary" href={whatsappHref(selectedCustomer, debtMessage(selectedCustomer))} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', textDecoration: 'none', color: 'var(--warning)' }}><Send size={15} /> Recordar saldo pendiente</a>}
            </div>
          </div>
        </div>
      )}

      {/* ════════════ Modal: Registrar Abono de Saldo ════════════ */}
      {showPaymentModal && paymentCustomer && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1001, padding: '1rem'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <DollarSign color="var(--accent)" />
                Registrar Abono / Pago
              </h2>
              <button onClick={() => setShowPaymentModal(false)} className="btn btn-secondary" style={{ padding: '0.35rem' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.85rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div><b>Cliente:</b> {paymentCustomer.name}</div>
              <div><b>Cédula:</b> {paymentCustomer.cedula}</div>
              <div style={{ marginTop: '0.4rem', color: 'var(--danger)', fontWeight: 600 }}>
                Saldo actual por pagar: ${paymentCustomer.balance.toLocaleString('es-CO')}
              </div>
            </div>

            {paymentError && <div className="form-error" style={{ marginBottom: '1rem' }}>{paymentError}</div>}

            <form onSubmit={handleConfirmPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Monto del Abono ($) *</label>
                <input
                  type="number"
                  min="1"
                  max={paymentCustomer.balance > 0 ? paymentCustomer.balance : undefined}
                  className="form-input"
                  placeholder={`Ej: ${paymentCustomer.balance}`}
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  autoFocus
                  required
                />
              </div>

              {paymentCustomer.balance > 0 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}
                  onClick={() => setPaymentAmount(paymentCustomer.balance)}
                >
                  Pagar totalidad (${paymentCustomer.balance.toLocaleString('es-CO')})
                </button>
              )}

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Medio de pago *</label>
                <select className="form-input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} required>
                  <option value="EFECTIVO">Efectivo</option><option value="TRANSFERENCIA">Nequi / Transferencia</option><option value="TARJETA">Tarjeta</option><option value="OTRO">Otro</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Observación / Nota (Opcional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Pago en efectivo en caja / Transferencia Nequi"
                  value={paymentNote}
                  onChange={e => setPaymentNote(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={processingPayment}>
                  {processingPayment ? <div className="spinner" /> : 'Confirmar Abono ($)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Customers;
