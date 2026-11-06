import React, { useEffect, useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Building, 
  User, 
  Lock, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Sparkles, 
  Printer, 
  Coins
} from 'lucide-react';
import { api } from '../services/api';

interface SettingsProps {
  onBusinessUpdated?: (name: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ onBusinessUpdated }) => {
  const [activeTab, setActiveTab] = useState<'business' | 'admin' | 'preview'>('business');
  const [loading, setLoading] = useState(true);

  // Estados del Formulario de Negocio
  const [businessName, setBusinessName] = useState('');
  const [documentType, setDocumentType] = useState('NIT');
  const [documentNumber, setDocumentNumber] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessCity, setBusinessCity] = useState('');
  const [receiptMessage, setReceiptMessage] = useState('');
  const [currency, setCurrency] = useState('COP');

  const [savingBusiness, setSavingBusiness] = useState(false);
  const [businessSuccess, setBusinessSuccess] = useState('');
  const [businessError, setBusinessError] = useState('');

  // Estados del Formulario de Administrador
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminDocument, setAdminDocument] = useState('');
  const [adminRole, setAdminRole] = useState('ADMIN');
  const [adminCreatedAt, setAdminCreatedAt] = useState('');

  // Estados de Cambio de Contraseña
  const [changePassword, setChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  const [savingAdmin, setSavingAdmin] = useState(false);
  const [adminSuccess, setAdminSuccess] = useState('');
  const [adminError, setAdminError] = useState('');

  // Cargar datos al montar
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [bizRes, meRes] = await Promise.all([
        api.get('/settings/business').catch(() => null),
        api.get('/auth/me').catch(() => null)
      ]);

      if (bizRes && bizRes.data?.settings) {
        const b = bizRes.data.settings;
        setBusinessName(b.name || '');
        setDocumentType(b.documentType || 'NIT');
        setDocumentNumber(b.documentNumber || '');
        setBusinessPhone(b.phone || '');
        setBusinessEmail(b.email || '');
        setBusinessAddress(b.address || '');
        setBusinessCity(b.city || '');
        setReceiptMessage(b.receiptMessage || '¡Gracias por su compra! Vuelva pronto.');
        setCurrency(b.currency || 'COP');
      }

      if (meRes && meRes.data?.user) {
        const u = meRes.data.user;
        setAdminName(u.name || '');
        setAdminEmail(u.email || '');
        setAdminPhone(u.phone || '');
        setAdminDocument(u.documentId || '');
        setAdminRole(u.role || 'ADMIN');
        if (u.createdAt) {
          const d = new Date(u.createdAt);
          setAdminCreatedAt(d.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }));
        }
      }
    } catch (err) {
      console.error('Error cargando configuración:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Guardar datos del Negocio
  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusinessError('');
    setBusinessSuccess('');

    if (!businessName.trim()) {
      setBusinessError('El nombre del comercio o negocio es obligatorio.');
      return;
    }

    try {
      setSavingBusiness(true);
      const payload = {
        name: businessName.trim(),
        documentType,
        documentNumber: documentNumber.trim(),
        phone: businessPhone.trim(),
        email: businessEmail.trim(),
        address: businessAddress.trim(),
        city: businessCity.trim(),
        receiptMessage: receiptMessage.trim(),
        currency
      };

      const res = await api.put('/settings/business', payload);
      setBusinessSuccess(res.data.message || 'Datos del negocio actualizados exitosamente.');

      // Notificar al Layout y guardar en localStorage para sincronización instantánea
      if (onBusinessUpdated) {
        onBusinessUpdated(payload.name);
      }
      localStorage.setItem('stockflow_business_name', payload.name);
      window.dispatchEvent(new CustomEvent('stockflow_business_changed', { detail: payload }));

      setTimeout(() => setBusinessSuccess(''), 4000);
    } catch (err: any) {
      setBusinessError(err.response?.data?.message || 'Error al guardar los datos del negocio.');
    } finally {
      setSavingBusiness(false);
    }
  };

  // Guardar datos del Administrador
  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setAdminSuccess('');

    if (!adminName.trim()) {
      setAdminError('El nombre del administrador es obligatorio.');
      return;
    }

    if (!adminEmail.trim()) {
      setAdminError('El correo electrónico es obligatorio.');
      return;
    }

    if (changePassword) {
      if (!currentPassword) {
        setAdminError('Debes ingresar tu contraseña actual.');
        return;
      }
      if (newPassword.length < 8) {
        setAdminError('La nueva contraseña debe tener al menos 8 caracteres.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setAdminError('La confirmación de la contraseña no coincide.');
        return;
      }
    }

    try {
      setSavingAdmin(true);
      const payload: any = {
        name: adminName.trim(),
        email: adminEmail.trim(),
        phone: adminPhone.trim(),
        documentId: adminDocument.trim()
      };

      if (changePassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await api.put('/auth/profile', payload);
      setAdminSuccess(res.data.message || 'Datos del administrador actualizados con éxito.');

      // Actualizar localStorage
      const currentUser = JSON.parse(localStorage.getItem('stockflow_user') || '{}');
      const updatedUser = { ...currentUser, ...res.data.user };
      localStorage.setItem('stockflow_user', JSON.stringify(updatedUser));
      window.dispatchEvent(new CustomEvent('stockflow_user_changed', { detail: updatedUser }));

      // Limpiar campos de contraseña
      if (changePassword) {
        setChangePassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }

      setTimeout(() => setAdminSuccess(''), 4000);
    } catch (err: any) {
      setAdminError(err.response?.data?.message || 'Error al actualizar los datos del administrador.');
    } finally {
      setSavingAdmin(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem', width: '32px', height: '32px' }}></div>
        <p>Cargando información de configuración...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Cabecera Principal */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ padding: '0.5rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-md)' }}>
            <SettingsIcon size={26} color="var(--primary)" />
          </div>
          <h1 style={{ fontSize: '1.8rem' }}>
            Configuración <span className="gradient-text">del Sistema</span>
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Administra la identidad comercial de tu negocio y actualiza tus datos personales y de acceso.
        </p>
      </div>

      {/* Navegación por Pestañas */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', borderBottom: '1px solid var(--bg-card-border)', paddingBottom: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('business')}
          className={`btn ${activeTab === 'business' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: 'var(--radius-full)' }}
        >
          <Building size={18} />
          <span>Datos del Negocio</span>
        </button>

        <button
          onClick={() => setActiveTab('admin')}
          className={`btn ${activeTab === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: 'var(--radius-full)' }}
        >
          <User size={18} />
          <span>Datos del Administrador</span>
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={`btn ${activeTab === 'preview' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: 'var(--radius-full)' }}
        >
          <Printer size={18} />
          <span>Vista Previa del Recibo</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 1: DATOS DEL NEGOCIO                                              */}
      {/* ========================================================================= */}
      {activeTab === 'business' && (
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building color="var(--primary)" size={22} /> Perfil Comercial de la Empresa
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                Estos datos se reflejarán en el panel, en el Punto de Venta (POS) y en los recibos impresos y enviados a los clientes.
              </p>
            </div>
            <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Sparkles size={13} /> Sincronizado en tiempo real
            </span>
          </div>

          {businessSuccess && (
            <div style={{ padding: '0.9rem 1.2rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-md)', color: 'var(--accent)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <CheckCircle2 size={18} />
              <span>{businessSuccess}</span>
            </div>
          )}

          {businessError && (
            <div style={{ padding: '0.9rem 1.2rem', background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <AlertCircle size={18} />
              <span>{businessError}</span>
            </div>
          )}

          <form onSubmit={handleSaveBusiness}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {/* Nombre del Negocio */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Building size={15} color="var(--primary)" /> Nombre del Negocio o Comercio *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. StockFlow Minimarket Montería"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                />
              </div>

              {/* Tipo y Documento Tributario */}
              <div className="form-group">
                <label className="form-label">Tipo de Identificación Tributaria</label>
                <select
                  className="form-input"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                >
                  <option value="NIT">NIT (Número de Identificación Tributaria)</option>
                  <option value="RUT">RUT (Registro Único Tributario)</option>
                  <option value="CC">Cédula de Ciudadanía (Persona Natural)</option>
                  <option value="RUC">RUC / Cédula Jurídica</option>
                  <option value="OTRO">Otro documento</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileText size={15} color="var(--primary)" /> Número de Identificación Tributaria (NIT/RUT)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. 900.876.543-1"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                />
              </div>

              {/* Teléfono de Atención */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Phone size={15} color="var(--primary)" /> Teléfono / WhatsApp de Atención Comercial
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. +57 301 234 5678"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                />
              </div>

              {/* Correo Electrónico */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Mail size={15} color="var(--primary)" /> Correo Electrónico de Contacto
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="Ej. contacto@mitienda.com"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                />
              </div>

              {/* Dirección Física */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={15} color="var(--primary)" /> Dirección Física del Establecimiento
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. Calle 24 # 5-30, Barrio Centro"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                />
              </div>

              {/* Ciudad / Municipio */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={15} color="var(--primary)" /> Ciudad / Municipio
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. Montería, Córdoba"
                  value={businessCity}
                  onChange={(e) => setBusinessCity(e.target.value)}
                />
              </div>

              {/* Moneda Principal */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Coins size={15} color="var(--primary)" /> Moneda Principal
                </label>
                <select
                  className="form-input"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="COP">COP - Peso Colombiano ($)</option>
                  <option value="USD">USD - Dólar Estadounidense ($)</option>
                  <option value="EUR">EUR - Euro (€)</option>
                  <option value="MXN">MXN - Peso Mexicano ($)</option>
                </select>
              </div>

              {/* Mensaje de Recibo */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Printer size={15} color="var(--primary)" /> Mensaje al Pie de los Recibos / Tickets de Venta
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. ¡Gracias por preferirnos! Garantía de cambio en 30 días."
                  value={receiptMessage}
                  onChange={(e) => setReceiptMessage(e.target.value)}
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                  Este lema o agradecimiento aparecerá al final de cada tirilla de venta impresa o enviada por WhatsApp en el POS.
                </span>
              </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={savingBusiness}
                style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}
              >
                {savingBusiness ? (
                  <>
                    <div className="spinner"></div> Guardando Cambios...
                  </>
                ) : (
                  <>
                    <Save size={18} /> Guardar Datos del Negocio
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: DATOS DEL ADMINISTRADOR                                        */}
      {/* ========================================================================= */}
      {activeTab === 'admin' && (
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User color="var(--primary)" size={22} /> Perfil Personal del Administrador
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                Gestiona tus datos personales de contacto, rol en el sistema y credenciales de acceso.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ShieldCheck size={13} /> {adminRole}
              </span>
              {adminCreatedAt && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  Miembro desde: {adminCreatedAt}
                </span>
              )}
            </div>
          </div>

          {adminSuccess && (
            <div style={{ padding: '0.9rem 1.2rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-md)', color: 'var(--accent)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <CheckCircle2 size={18} />
              <span>{adminSuccess}</span>
            </div>
          )}

          {adminError && (
            <div style={{ padding: '0.9rem 1.2rem', background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <AlertCircle size={18} />
              <span>{adminError}</span>
            </div>
          )}

          <form onSubmit={handleSaveAdmin}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {/* Nombre Completo */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <User size={15} color="var(--primary)" /> Nombre Completo *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. Carlos Mendoza"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  required
                />
              </div>

              {/* Correo Electrónico */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Mail size={15} color="var(--primary)" /> Correo Electrónico de Acceso *
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="Ej. admin@stockflow.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                />
              </div>

              {/* Teléfono Personal */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Phone size={15} color="var(--primary)" /> Teléfono Móvil / WhatsApp Personal
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. +57 300 555 7788"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                />
              </div>

              {/* Documento de Identidad */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileText size={15} color="var(--primary)" /> Documento de Identidad (Cédula / DNI)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. 1067891234"
                  value={adminDocument}
                  onChange={(e) => setAdminDocument(e.target.value)}
                />
              </div>
            </div>

            {/* SECCIÓN OPCIONAL: SEGURIDAD Y CAMBIO DE CONTRASEÑA */}
            <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--bg-card-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: changePassword ? '1.5rem' : '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Lock size={18} color="var(--warning)" />
                  <div>
                    <h3 style={{ fontSize: '1rem' }}>Seguridad y Contraseña</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      Mantén protegida tu cuenta actualizando periódicamente tu clave de acceso.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setChangePassword(!changePassword)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}
                >
                  {changePassword ? 'Cancelar Cambio' : 'Modificar Contraseña'}
                </button>
              </div>

              {changePassword && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--bg-card-border)' }}>
                  <div className="form-group">
                    <label className="form-label">Contraseña Actual *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        className="form-input"
                        placeholder="Ingresa tu clave actual"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required={changePassword}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      >
                        {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nueva Contraseña (mínimo 8 caracteres) *</label>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Nueva contraseña segura"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required={changePassword}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirmar Nueva Contraseña *</label>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Repite la nueva contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required={changePassword}
                    />
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={savingAdmin}
                style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}
              >
                {savingAdmin ? (
                  <>
                    <div className="spinner"></div> Guardando Datos...
                  </>
                ) : (
                  <>
                    <Save size={18} /> Guardar Datos del Administrador
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 3: VISTA PREVIA DEL RECIBO (TICKET POS)                          */}
      {/* ========================================================================= */}
      {activeTab === 'preview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>
          {/* Tarjeta Explicativa */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Printer color="var(--primary)" size={20} /> Imagen Corporativa en Ventas
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              En la pestaña <b>Datos del Negocio</b> defines el nombre, identificación tributaria, dirección y teléfono que aparecerán en la cabecera de tus recibos impresos y tirillas de WhatsApp al realizar ventas desde el módulo de <b>Venta Rápida (POS)</b>.
            </p>
            <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>💡 Tip de Negocio</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                Incluir tu número de WhatsApp y dirección física genera confianza inmediata y fideliza a tus compradores para futuras compras en tu catálogo en línea.
              </p>
            </div>
          </div>

          {/* Simulación del Ticket Térmico */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              background: '#ffffff',
              color: '#111827',
              width: '320px',
              padding: '1.5rem 1.25rem',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: '12px'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '15px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  {businessName || 'STOCKFLOW CONNECT'}
                </div>
                {documentNumber && (
                  <div style={{ fontSize: '11px', color: '#4b5563' }}>
                    {documentType}: {documentNumber}
                  </div>
                )}
                {businessAddress && (
                  <div style={{ fontSize: '11px', color: '#4b5563' }}>
                    {businessAddress}
                  </div>
                )}
                {businessCity && (
                  <div style={{ fontSize: '11px', color: '#4b5563' }}>
                    {businessCity}
                  </div>
                )}
                {businessPhone && (
                  <div style={{ fontSize: '11px', color: '#4b5563' }}>
                    Tel: {businessPhone}
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px dashed #9ca3af', margin: '0.5rem 0' }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#4b5563' }}>
                <span>FECHA: {new Date().toLocaleDateString('es-CO')}</span>
                <span>RECIBO #SF-0042</span>
              </div>
              <div style={{ fontSize: '11px', color: '#4b5563' }}>
                ATENDIDO POR: {adminName || 'Administrador'}
              </div>

              <div style={{ borderTop: '1px dashed #9ca3af', margin: '0.5rem 0' }}></div>

              <div style={{ fontWeight: 'bold', marginBottom: '0.35rem' }}>DETALLE DE PRODUCTOS:</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span>1x Arroz Diana 1Kg</span>
                <span>$4.000</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span>2x Aceite Gourmet 900ml</span>
                <span>$22.000</span>
              </div>

              <div style={{ borderTop: '1px dashed #9ca3af', margin: '0.5rem 0' }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
                <span>TOTAL A PAGAR:</span>
                <span>$26.000 {currency}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#4b5563', marginTop: '0.2rem' }}>
                <span>PAGO (EFECTIVO):</span>
                <span>$30.000</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#4b5563' }}>
                <span>CAMBIO / VUELTO:</span>
                <span>$4.000</span>
              </div>

              <div style={{ borderTop: '1px dashed #9ca3af', margin: '0.75rem 0' }}></div>

              <div style={{ textAlign: 'center', fontSize: '11px', fontStyle: 'italic', color: '#374151' }}>
                {receiptMessage || '¡Gracias por su compra! Vuelva pronto.'}
              </div>
              <div style={{ textAlign: 'center', fontSize: '10px', color: '#9ca3af', marginTop: '0.5rem' }}>
                StockFlow Connect POS • Software de Gestión
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
