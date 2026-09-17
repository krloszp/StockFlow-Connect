import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, AlertCircle, CheckCircle2, ShoppingBag, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  // Validaciones en tiempo real (HU-001 Escenario 3)
  const isMinLength = password.length >= 8;
  const isMatching = password !== '' && password === confirmPassword;
  const isValidForm = name.trim() !== '' && email.trim() !== '' && isMinLength && isMatching;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidForm) return;

    try {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      const response = await api.post('/auth/register', { name, email, password });
      setSuccessMsg(response.data.message || 'Cuenta creada exitosamente. Redirigiendo al inicio de sesión...');

      setTimeout(() => {
        navigate('/login');
      }, 1800);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al crear la cuenta. Inténtalo de nuevo.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-panel auth-card">
        {/* Header con Marca */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '1rem', background: 'var(--primary-light)', marginBottom: '0.75rem' }}>
            <ShoppingBag size={32} color="var(--primary)" />
          </div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '0.25rem' }}>
            Crear Cuenta de <span className="gradient-text">Administrador</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Comienza a gestionar tu tienda con StockFlow Connect
          </p>
        </div>

        {/* Mensajes de Estado */}
        {errorMsg && (
          <div className="form-error" style={{ padding: '0.75rem 1rem', background: 'var(--danger-bg)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="form-error" style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre Completo del Administrador</label>
            <div style={{ position: 'relative' }}>
              <User size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.75rem' }}
                placeholder="Carlos Mendoza"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Correo Electrónico del Comercio</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: '2.75rem' }}
                placeholder="administrador@mi-tienda.com"
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
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem' }}
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirmar Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem' }}
                title={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Reglas de Robustez Visuales */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px solid var(--bg-card-border)', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isMinLength ? 'var(--accent)' : 'var(--text-dim)', marginBottom: '0.25rem' }}>
              <CheckCircle2 size={14} color={isMinLength ? 'var(--accent)' : 'var(--text-dim)'} />
              <span>Al menos 8 caracteres ({password.length}/8)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isMatching ? 'var(--accent)' : 'var(--text-dim)' }}>
              <CheckCircle2 size={14} color={isMatching ? 'var(--accent)' : 'var(--text-dim)'} />
              <span>Las contraseñas coinciden exactamente</span>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={!isValidForm || loading}>
            {loading ? (
              <>
                <div className="spinner" />
                <span>Creando cuenta...</span>
              </>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Crear Cuenta</span>
              </>
            )}
          </button>
        </form>

        {/* Link a Login */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>
            Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  );
};
