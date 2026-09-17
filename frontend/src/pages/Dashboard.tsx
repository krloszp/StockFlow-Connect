import React, { useEffect, useState } from 'react';
import { 
  Package, ShoppingCart, 
  Users, BarChart3, TrendingUp, AlertTriangle, ChevronUp, ChevronDown, Sparkles, X 
} from 'lucide-react';
import { api } from '../services/api';

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState({ salesToday: 0, totalStock: 0, criticalAlerts: 0 });
  const [loading, setLoading] = useState(true);

  // Estado para la Bienvenida Desplegable Animada
  const [showWelcome, setShowWelcome] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const userStr = localStorage.getItem('stockflow_user');
  const user = userStr ? JSON.parse(userStr) : { name: 'Administrador de Prueba' };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [prodRes, alertRes, salesRes] = await Promise.all([
          api.get('/products'),
          api.get('/products/alerts'),
          api.get('/sales/metrics')
        ]);

        const totalStock = (prodRes.data.products || []).reduce((acc: number, p: any) => acc + p.stock, 0);
        const criticalAlerts = alertRes.data.totalAlerts || 0;
        const salesToday = salesRes.data.totalRevenue || 0;

        setMetrics({ salesToday, totalStock, criticalAlerts });
      } catch (err) {
        console.error('Error al cargar datos del Dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Auto-contraer la bienvenida a los 6 segundos para no invadir la pantalla
    const timer = setTimeout(() => {
      setIsCollapsed(true);
    }, 6000);

    return () => clearTimeout(timer);
  }, []);

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Tarjeta 1 */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Ventas Totales</span>
            <TrendingUp color="var(--accent)" size={20} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>
            ${metrics.salesToday.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Transacciones POS registradas</span>
        </div>

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
