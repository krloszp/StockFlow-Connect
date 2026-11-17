import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { POS } from './pages/POS';
import { Suppliers } from './pages/Suppliers';
import { Catalog } from './pages/Catalog';
import { ClientOrders } from './pages/ClientOrders';
import { SalesHistory } from './pages/SalesHistory';
import { Customers } from './pages/Customers';
import { Settings } from './pages/Settings';
import { AdminOrders } from './pages/AdminOrders';
import { api } from './services/api';
import { 
  ShoppingBag, 
  LogOut, 
  Package, 
  ShoppingCart, 
  Users, 
  Truck,
  BarChart3, 
  Globe, 
  CheckCircle, 
  ClipboardList, 
  History,
  Settings as SettingsIcon 
} from 'lucide-react';

const AdminLayout: React.FC<{ 
  children: React.ReactNode; 
  currentTab: string; 
  setTab: (t: string) => void;
  businessName: string;
  setBusinessName: (name: string) => void;
}> = ({ children, currentTab, setTab, businessName, setBusinessName }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('stockflow_token');
    localStorage.removeItem('stockflow_user');
    navigate('/login');
  };

  useEffect(() => {
    const handleBizChanged = (e: any) => {
      if (e.detail?.name) {
        setBusinessName(e.detail.name);
      }
    };
    window.addEventListener('stockflow_business_changed', handleBizChanged);
    return () => window.removeEventListener('stockflow_business_changed', handleBizChanged);
  }, [setBusinessName]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-dark)' }}>
      {/* Sidebar */}
      <aside style={{ width: '260px', background: 'rgba(15, 23, 42, 0.95)', borderRight: '1px solid var(--bg-card-border)', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', background: 'var(--primary-light)' }}>
              <ShoppingBag size={24} color="var(--primary)" />
            </div>
            <h2 style={{ fontSize: '1.2rem' }}>
              StockFlow <span className="gradient-text">Connect</span>
            </h2>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              className={`btn ${currentTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start' }}
              onClick={() => setTab('dashboard')}
            >
              <BarChart3 size={18} /> Dashboard
            </button>
            <button
              className={`btn ${currentTab === 'inventory' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start' }}
              onClick={() => setTab('inventory')}
            >
              <Package size={18} /> Inventario
            </button>
            <button
              className={`btn ${currentTab === 'pos' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start' }}
              onClick={() => setTab('pos')}
            >
              <ShoppingCart size={18} /> Venta Rápida (POS)
            </button>
            <button
              className={`btn ${currentTab === 'sales-history' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start' }}
              onClick={() => setTab('sales-history')}
            >
              <History size={18} /> Historial de Ventas
            </button>
            <button
              className={`btn ${currentTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start' }}
              onClick={() => setTab('orders')}
            >
              <ClipboardList size={18} /> Pedidos
            </button>
            <button
              className={`btn ${currentTab === 'customers' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start' }}
              onClick={() => setTab('customers')}
            >
              <Users size={18} /> Clientes
            </button>
            <button
              className={`btn ${currentTab === 'suppliers' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start' }}
              onClick={() => setTab('suppliers')}
            >
              <Truck size={18} /> Proveedores
            </button>
            <button
              className={`btn ${currentTab === 'settings' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start' }}
              onClick={() => setTab('settings')}
            >
              <SettingsIcon size={18} /> Configuración
            </button>
            <button
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', color: 'var(--accent)' }}
              onClick={() => window.open('/catalogo', '_blank')}
            >
              <Globe size={18} /> Portal B2C (Ver Tienda)
            </button>
            <button
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', color: 'var(--primary-light)' }}
              onClick={() => window.open('/mis-pedidos', '_blank')}
            >
              <ClipboardList size={18} /> Pedidos del Cliente
            </button>
          </nav>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--bg-card-border)', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
              <CheckCircle size={12} color="var(--accent)" />
              <span style={{ fontWeight: 600, color: 'var(--accent)' }}>En Línea</span>
            </div>
            <div style={{ fontWeight: 600, color: 'var(--text-muted)' }}>StockFlow v1.0.0</div>
            <div 
              style={{ color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              title={businessName}
            >
              Comercio: {businessName}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.2)' }}
          >
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <main style={{ flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
};

const AdminDashboardContainer: React.FC = () => {
  const [tab, setTab] = useState('dashboard');
  const [customerFilter, setCustomerFilter] = useState<'all' | 'with-debt'>('all');
  const [businessName, setBusinessName] = useState(() => localStorage.getItem('stockflow_business_name') || 'StockFlow Connect');

  useEffect(() => {
    api.get('/settings/business')
      .then(res => {
        if (res.data?.settings?.name) {
          setBusinessName(res.data.settings.name);
          localStorage.setItem('stockflow_business_name', res.data.settings.name);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <AdminLayout 
      currentTab={tab} 
      setTab={setTab} 
      businessName={businessName} 
      setBusinessName={setBusinessName}
    >
      {tab === 'dashboard' && <Dashboard onViewDebtors={() => { setCustomerFilter('with-debt'); setTab('customers'); }} onViewOrders={() => setTab('orders')} />}
      {tab === 'inventory' && <Inventory />}
      {tab === 'pos' && <POS />}
      {tab === 'sales-history' && <SalesHistory />}
      {tab === 'orders' && <AdminOrders />}
      {tab === 'customers' && <Customers initialFilter={customerFilter} />}
      {tab === 'suppliers' && <Suppliers />}
      {tab === 'settings' && <Settings onBusinessUpdated={setBusinessName} />}
    </AdminLayout>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/dashboard" element={<AdminDashboardContainer />} />
        <Route path="/catalogo" element={<Catalog />} />
        <Route path="/mis-pedidos" element={<ClientOrders />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
