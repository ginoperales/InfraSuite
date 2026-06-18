import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from '@infrasuite/shared';
import { useAuth } from '@infrasuite/auth';

export const ProfileSettings: React.FC = () => {
  const { user } = useAuth();
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  
  // System preference state (gridlines)
  const [showGridlines, setShowGridlines] = useState<boolean>(() => {
    const saved = localStorage.getItem('infrasuite_show_gridlines');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('infrasuite_show_gridlines', showGridlines.toString());
  }, [showGridlines]);

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Por favor complete todos los campos de contraseña.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }
    alert('Contraseña modificada con éxito.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode) return;
    alert(`Código promocional "${promoCode.toUpperCase()}" aplicado correctamente.`);
    setPromoCode('');
  };

  return (
    <div className="content-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* 1. Account Summary Card */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--grad-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            boxShadow: '0 4px 15px rgba(0, 240, 255, 0.2)'
          }}>
            {user?.nombre?.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-primary)' }}>{user?.nombre}</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Rol asignado: <strong style={{ color: 'var(--color-primary)' }}>{user?.role}</strong> • Correo: <strong>{user?.email}</strong>
            </p>
          </div>
        </div>
      </Card>

      {/* Grid Layout for settings sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Side: Security Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Card>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔑</span> Seguridad & Contraseña
            </h3>
            <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Input
                type="password"
                label="Contraseña Actual"
                placeholder="Contraseña actual"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <Input
                type="password"
                label="Nueva Contraseña"
                placeholder="Nueva contraseña"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Input
                type="password"
                label="Confirmar Nueva Contraseña"
                placeholder="Confirmar nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Button type="submit" style={{ marginTop: '6px' }}>
                Actualizar Contraseña
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Side: Subscription & Custom System preferences */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Subscription Settings */}
          <Card>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📅</span> Suscripción y Licencias
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                background: 'rgba(255,69,0,0.06)',
                border: '1px solid rgba(255,69,0,0.25)',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Licencia Presupuestos.pe</span>
                  <span style={{ fontSize: '0.72rem', background: '#dc3545', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>VENCIDA</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Tu suscripción venció el: <strong>05-05-2020</strong>.
                </div>
              </div>

              {/* Promo section */}
              <div style={{
                background: 'rgba(0, 240, 255, 0.04)',
                border: '1px solid rgba(0, 240, 255, 0.15)',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🎁</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Tenemos una oferta exclusiva para ti</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Obtén un 30% de descuento en la renovación anual de tu licencia corporativa usando el código promocional.
                </div>
              </div>

              <form onSubmit={handleApplyPromo} style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flexGrow: 1 }}>
                  <Input
                    placeholder="Código Promocional"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '4px' }}>
                  <Button type="submit" variant="secondary">
                    Aplicar
                  </Button>
                </div>
              </form>

              <Button onClick={() => alert('Abriendo pasarela de pago para ampliar suscripción...')} style={{ background: 'linear-gradient(135deg, #198754 0%, #157347 100%)', boxShadow: 'none' }}>
                Ampliar mi suscripción
              </Button>
            </div>
          </Card>

          {/* Preferences Settings */}
          <Card>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚙️</span> Preferencias de Interfaz
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '10px 0' }}>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>Mostrar cuadrículas por defecto</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Muestra las líneas divisorias en la tabla de presupuestos y en la tabla de APU.</div>
              </div>
              <label className="switch-container" style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', flexShrink: 0 }}>
                <input
                  type="checkbox"
                  checked={showGridlines}
                  onChange={(e) => setShowGridlines(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span className="switch-slider" style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: showGridlines ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                  transition: '0.3s',
                  borderRadius: '24px',
                  border: '1px solid var(--border-color)'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '""',
                    height: '16px',
                    width: '16px',
                    left: showGridlines ? '22px' : '4px',
                    bottom: '3px',
                    backgroundColor: '#ffffff',
                    transition: '0.3s',
                    borderRadius: '50%',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} />
                </span>
              </label>
            </div>
          </Card>

        </div>

      </div>

    </div>
  );
};
