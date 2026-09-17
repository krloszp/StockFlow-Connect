import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { POS } from './pages/POS';
import { Suppliers } from './pages/Suppliers';
import { Catalog } from './pages/Catalog';
import { ShoppingBag, LogOut, Package, ShoppingCart, Users, BarChart3, Globe, CheckCircle } from 'lucide-react';

const AdminLayout: React.FC<{ children: React.ReactNode; currentTab: string; setTab: (t: string) => void }> = ({ children, currentTab, setTab }) => {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('stockflow_user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem('stockflow_token');
    localStorage.removeItem('stockflow_user');
    navigate('/login');
  };

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
              className={`btn ${currentTab === 'suppliers' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start' }}
              onClick={() => setTab('suppliers')}
            >
              <Users size={18} /> Proveedores
            </button>
            <button
              className="btn btn-secondary"
              style={{ justifyContent: 'flex-start', color: 'var(--accent)' }}
              onClick={() => window.open('/catalogo', '_blank')}
            >
              <Globe size={18} /> Portal B2C (Ver Tienda)
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
            <div style={{ color: 'var(--text-dim)' }}>Comercio: Montería Piloto</div>
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

      {/* Main Area — sin header duplicado */}
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

  return (
    <AdminLayout currentTab={tab} setTab={setTab}>
      {tab === 'dashboard' && <Dashboard />}
      {tab === 'inventory' && <Inventory />}
      {tab === 'pos' && <POS />}
      {tab === 'suppliers' && <Suppliers />}
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
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
