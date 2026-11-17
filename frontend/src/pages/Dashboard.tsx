import React, { useEffect, useState } from 'react';
import { 
  Package, Download, Users, ClipboardList,
  TrendingUp, AlertTriangle, ChevronUp, ChevronDown, Sparkles, X 
} from 'lucide-react';
import { api } from '../services/api';

export const Dashboard: React.FC<{ onViewDebtors?: () => void; onViewOrders?: () => void }> = ({ onViewDebtors, onViewOrders }) => {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentMonth = today.slice(0, 7);
  const [filterMode, setFilterMode] = useState<'dates' | 'month'>('dates');
  const [month, setMonth] = useState(currentMonth);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [metrics, setMetrics] = useState({ salesToday: 0, totalCost: 0, totalPurchases: 0, netProfit: 0, marginPercentage: 0, totalCollections: 0, collectionsByMethod: { EFECTIVO: 0, TRANSFERENCIA: 0, TARJETA: 0, CREDITO: 0 }, totalPayables: 0, inventoryValue: 0, totalStock: 0, criticalAlerts: 0 });
  const [debtors, setDebtors] = useState({ count: 0, balance: 0 });
  const [pendingOrders, setPendingOrders] = useState(0);

  // Estado para la Bienvenida Desplegable Animada
  const [showWelcome, setShowWelcome] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const userStr = localStorage.getItem('stockflow_user');
  const user = userStr ? JSON.parse(userStr) : { name: 'Administrador de Prueba' };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [prodRes, alertRes, salesRes, customerRes, ordersRes] = await Promise.all([
          api.get('/products'),
          api.get('/products/alerts'),
          api.get('/sales/metrics', { params: filterMode === 'month' ? { startDate: `${month}-01`, endDate: `${month}-${String(new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate()).padStart(2, '0')}` } : { startDate, endDate } }),
          api.get('/customers'),
          api.get('/orders/admin')
        ]);

        const totalStock = (prodRes.data.products || []).reduce((acc: number, p: any) => acc + p.stock, 0);
        const criticalAlerts = alertRes.data.totalAlerts || 0;
        const salesToday = salesRes.data.totalRevenue || 0;
        const customers = customerRes.data.customers || [];
        const orders = ordersRes.data.orders || [];

        setMetrics({ salesToday, totalCost: salesRes.data.totalCost || 0, totalPurchases: salesRes.data.totalPurchases || 0, netProfit: salesRes.data.netProfit || 0, marginPercentage: Number(salesRes.data.marginPercentage || 0), totalCollections: salesRes.data.totalCollections || 0, collectionsByMethod: salesRes.data.collectionsByMethod || { EFECTIVO: 0, TRANSFERENCIA: 0, TARJETA: 0, CREDITO: 0 }, totalPayables: salesRes.data.totalPayables || 0, inventoryValue: salesRes.data.inventoryValue || 0, totalStock, criticalAlerts });
        setDebtors({ count: customers.filter((c: any) => c.balance > 0).length, balance: customers.reduce((n: number, c: any) => n + (c.balance || 0), 0) });
        setPendingOrders(orders.filter((order: any) => order.status === 'PENDIENTE').length);
      } catch (err) {
        console.error('Error al cargar datos del Dashboard:', err);
      }
    };

    fetchDashboardData();

    // Auto-contraer la bienvenida a los 6 segundos para no invadir la pantalla
    const timer = setTimeout(() => {
      setIsCollapsed(true);
    }, 6000);

    return () => clearTimeout(timer);
  }, [filterMode, month, startDate, endDate]);

  const downloadReport = () => {
    const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const period = filterMode === 'month' ? month : `${startDate} a ${endDate}`;
    const rows = [['Período', 'Ventas', 'Costo de productos vendidos', 'Compras / inversión', 'Ganancia bruta'], [period, metrics.salesToday, metrics.totalCost, metrics.totalPurchases, metrics.netProfit]];
    const csv = '\uFEFF' + rows.map(row => row.map(escape).join(';')).join('\r\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = `reporte-administrativo-${filterMode === 'month' ? month : `${startDate}-${endDate}`}.csv`; link.click(); URL.revokeObjectURL(link.href);
  };

  return (
    <div style={{ padding: '2rem' }}>
      {/* Banner Desplegable de Bienvenida Animado */}
      {showWelcome && (
        <div 
          className="glass-panel"
          style={{
            marginBottom: '2rem',
            padding: isCollapsed ? '0.75rem 1.5rem' : '1.5rem 2rem',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {/* Fila Principal / Header del Desplegable */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-full)' }}>
                <Sparkles size={20} color="var(--primary)" />
              </div>
              <div>
                <h3 style={{ fontSize: isCollapsed ? '1rem' : '1.25rem', transition: 'var(--transition)' }}>
                  ¡Bienvenido de nuevo, <span className="gradient-text">{user.name}</span>!
                </h3>
                {isCollapsed && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Sistema listo para la gestión de tu comercio. Haz clic para expandir.
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {/* Botón Contraer / Desplegar */}
              <button 
                onClick={() => setIsCollapsed(!isCollapsed)} 
                className="btn btn-secondary" 
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                title={isCollapsed ? 'Expandir mensaje de bienvenida' : 'Contraer mensaje'}
              >
                {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                <span>{isCollapsed ? 'Ver detalles' : 'Contraer'}</span>
              </button>

              {/* Botón Cerrar X */}
              <button 
                onClick={() => setShowWelcome(false)} 
                className="btn btn-secondary" 
                style={{ padding: '0.35rem', color: 'var(--text-dim)' }}
                title="Cerrar bienvenida"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Contenido Expandido */}
          {!isCollapsed && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--bg-card-border)', color: 'var(--text-muted)', fontSize: '0.95rem', animation: 'fadeIn 0.3s ease' }}>
              <p style={{ marginBottom: '0.75rem' }}>
                StockFlow Connect se encuentra activo y listo para procesar tus ventas en tiempo real, controlar tus productos y gestionar pedidos.
              </p>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
                <span className="badge badge-success">✓ Autenticación JWT</span>
                <span className="badge badge-success">✓ Módulo POS Activo</span>
                <span className="badge badge-success">✓ Portal B2C En Línea</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid de Métricas Principales */}
      <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <label htmlFor="dashboard-filter-mode">Filtrar por</label>
        <select id="dashboard-filter-mode" className="form-input" value={filterMode} onChange={e => setFilterMode(e.target.value as 'dates' | 'month')} style={{ width: 'auto' }}>
          <option value="dates">Días / rango</option>
          <option value="month">Mes</option>
        </select>
        {filterMode === 'month' ? <>
          <label htmlFor="dashboard-month">Mes del reporte</label>
          <input id="dashboard-month" type="month" className="form-input" value={month} max={currentMonth} onChange={e => setMonth(e.target.value)} style={{ width: 'auto' }} />
        </> : <>
        <label htmlFor="dashboard-start-date">Ventas desde</label>
        <input id="dashboard-start-date" aria-label="Fecha inicial de ventas" type="date" className="form-input" value={startDate} max={today} onChange={e => { const value = e.target.value; setStartDate(value); if (value > endDate) setEndDate(value); }} style={{ width: 'auto' }} />
        <label htmlFor="dashboard-end-date">hasta</label>
        <input id="dashboard-end-date" aria-label="Fecha final de ventas" type="date" className="form-input" value={endDate} min={startDate} max={today} onChange={e => setEndDate(e.target.value)} style={{ width: 'auto' }} />
        </>}
        <button className="btn btn-primary" onClick={downloadReport}><Download size={16} /> Descargar Excel (CSV)</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Tarjeta 1 */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Ventas del período</span>
            <TrendingUp color="var(--accent)" size={20} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>
            ${metrics.salesToday.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{filterMode === 'month' ? `Transacciones POS de ${month}` : startDate === endDate ? `Transacciones POS del ${startDate}` : `Transacciones POS del ${startDate} al ${endDate}`}</span>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Costo de productos vendidos</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '1rem' }}>${metrics.totalCost.toLocaleString('es-CO')}</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Compras / inversión del período</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '1rem', color: 'var(--warning)' }}>${metrics.totalPurchases.toLocaleString('es-CO')}</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Ganancia bruta del período</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '1rem', color: 'var(--accent)' }}>${metrics.netProfit.toLocaleString('es-CO')}</div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Margen bruto: {metrics.marginPercentage}%</span>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Recaudo efectivo del período</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '1rem', color: 'var(--accent)' }}>${metrics.totalCollections.toLocaleString('es-CO')}</div>
          <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>Efectivo ${metrics.collectionsByMethod.EFECTIVO.toLocaleString('es-CO')} · Transferencias/QR ${metrics.collectionsByMethod.TRANSFERENCIA.toLocaleString('es-CO')} · Tarjetas ${metrics.collectionsByMethod.TARJETA.toLocaleString('es-CO')}</span>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Cuentas por pagar a proveedores</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '1rem', color: 'var(--warning)' }}>${metrics.totalPayables.toLocaleString('es-CO')}</div>
        </div>
        <button className="glass-panel" onClick={onViewDebtors} style={{ padding: '1.5rem', textAlign: 'left', cursor: 'pointer', color: 'inherit' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}><Users size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />Clientes con saldo pendiente</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--danger)', marginTop: '0.7rem' }}>${debtors.balance.toLocaleString('es-CO')}</div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{debtors.count} clientes con saldo · Antigüedad: no disponible · Ver clientes</span>
        </button>
        <button className="glass-panel" onClick={onViewOrders} style={{ padding: '1.5rem', textAlign: 'left', cursor: 'pointer', color: 'inherit' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}><ClipboardList size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />Pedidos pendientes</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: pendingOrders > 0 ? 'var(--warning)' : 'var(--text-main)', marginTop: '0.7rem' }}>{pendingOrders}</div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{pendingOrders > 0 ? 'Ver y gestionar pedidos' : 'No hay pedidos pendientes'}</span>
        </button>

        {/* Tarjeta 2 */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Productos en Stock</span>
            <Package color="var(--primary)" size={20} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>
            {metrics.totalStock}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Unidades disponibles en catálogo</span>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '0.65rem' }}>Valor al costo: ${metrics.inventoryValue.toLocaleString('es-CO')}</div>
        </div>

        {/* Tarjeta 3 */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Alertas Stock Crítico</span>
            <AlertTriangle color="var(--warning)" size={20} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: metrics.criticalAlerts > 0 ? 'var(--warning)' : 'var(--text-main)' }}>
            {metrics.criticalAlerts}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            {metrics.criticalAlerts > 0 ? 'Productos en nivel mínimo' : 'Sin productos en nivel crítico'}
          </span>
        </div>
      </div>
    </div>
  );
};
