import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle, ShoppingBag, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      // Guardar token JWT y datos de usuario en localStorage
      localStorage.setItem('stockflow_token', token);
      localStorage.setItem('stockflow_user', JSON.stringify(user));

      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error en Login:', err);
      const message = err.response?.data?.message || 'No se pudo conectar con el servidor backend (Puerto 5000). Asegúrate de iniciar Iniciar-StockFlow.bat.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-panel auth-card">
        {/* Header con Marca */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '1rem', background: 'var(--primary-light)', marginBottom: '1rem' }}>
            <ShoppingBag size={36} color="var(--primary)" />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
            StockFlow <span className="gradient-text">Connect</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Ingresa a tu panel de control y gestión de ventas
          </p>
        </div>

        {/* Alerta de Error */}
        {errorMsg && (
          <div className="form-error" style={{ padding: '0.75rem 1rem', background: 'var(--danger-bg)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--danger)' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: '2.75rem' }}
                placeholder="admin@stockflow.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                placeholder="admin1234"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {/* Botón de Ojo (Mostrar/Ocultar contraseña) */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.25rem'
                }}
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? (
              <>
                <div className="spinner" />
                <span>Iniciando sesión...</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Iniciar Sesión</span>
              </>
            )}
          </button>
        </form>

        {/* Link a Registro */}
        <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          ¿No tienes una cuenta aún?{' '}
          <Link to="/registro" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>
            Regístrate aquí
          </Link>
        </div>
      </div>
    </div>
  );
};
