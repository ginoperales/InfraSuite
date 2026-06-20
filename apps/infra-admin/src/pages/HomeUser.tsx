import React, { useEffect, useState } from 'react';
import { useAuth } from '@infrasuite/auth';
import { db } from '@infrasuite/firebase';
import { getCompanyModules } from '@infrasuite/license-service';
import { getSQLiteDatabase } from '@infrasuite/sqlite';
import { motion } from 'framer-motion';

interface HomeUserProps {
  onNavigate: (tab: string) => void;
  installedModules: string[];
  theme: 'dark' | 'light';
}

const HOUR = new Date().getHours();
const getGreeting = () => {
  if (HOUR < 12) return 'Buenos días';
  if (HOUR < 18) return 'Buenas tardes';
  return 'Buenas noches';
};

const formatTimeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora mismo';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
};

const ALL_APPS = [
  {
    key: 'INFRACOST',
    tab: 'budgets_lite',
    icon: '💰',
    name: 'InfraCost Lite',
    description: 'Gestión de presupuestos de obra ligera y rápida.',
    color: 'var(--color-primary)',
    badge: 'LITE',
  },
  {
    key: 'INFRACOST_PRO',
    tab: 'budgets_pro',
    icon: '📊',
    name: 'InfraCost Pro',
    description: 'Editor profesional de presupuestos con análisis completo.',
    color: '#a78bfa',
    badge: 'PRO',
  },
  {
    key: 'INFRAGEO',
    tab: 'applications',
    icon: '🗺️',
    name: 'InfraGeo',
    description: 'Análisis geotécnico y sondeos de suelo.',
    color: '#34d399',
    badge: 'PRÓXIMO',
    comingSoon: true,
  },
  {
    key: 'INFRAPLAN',
    tab: 'applications',
    icon: '📅',
    name: 'InfraPlan',
    description: 'Cronograma de obra y programación de recursos.',
    color: '#fb923c',
    badge: 'PRÓXIMO',
    comingSoon: true,
  },
];

const QUICK_ACTIONS = [
  { icon: '➕', label: 'Nuevo Presupuesto', tab: 'budgets_lite', desc: 'Crear presupuesto en InfraCost Lite' },
  { icon: '📂', label: 'Mis Presupuestos', tab: 'budgets_lite', desc: 'Ver lista de presupuestos' },
  { icon: '📱', label: 'Aplicaciones', tab: 'applications', desc: 'Gestionar apps instaladas' },
];

export const HomeUser: React.FC<HomeUserProps> = ({ onNavigate, installedModules, theme }) => {
  const { user } = useAuth();
  const [recentBudgets, setRecentBudgets] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, totalMonto: 0 });

  useEffect(() => {
    try {
      const localDb = getSQLiteDatabase('InfraCost.db');
      localDb.createTable('budgets', ['nombre', 'monto']);
      const rows = localDb.query('budgets');
      setRecentBudgets(rows.slice(-5).reverse());
      setStats({
        total: rows.length,
        totalMonto: rows.reduce((sum: number, r: any) => sum + (r.monto || 0), 0),
      });
    } catch {
      setRecentBudgets([]);
    }
  }, []);

  const installedApps = ALL_APPS.filter(
    (a) => a.comingSoon || installedModules.includes(a.key)
  );

  const quickActions = [];
  if (installedModules.includes('INFRACOST')) {
    quickActions.push({
      icon: '➕',
      label: 'Nuevo Presupuesto (Lite)',
      tab: 'budgets_lite',
      desc: 'Crear presupuesto en InfraCost Lite'
    });
    quickActions.push({
      icon: '📂',
      label: 'Presupuestos Lite',
      tab: 'budgets_lite',
      desc: 'Ver lista de presupuestos Lite'
    });
  }
  if (installedModules.includes('INFRACOST_PRO')) {
    quickActions.push({
      icon: '📊',
      label: 'Presupuestos Pro',
      tab: 'budgets_pro',
      desc: 'Ver lista de presupuestos Pro'
    });
  }
  quickActions.push({
    icon: '📱',
    label: 'Aplicaciones',
    tab: 'applications',
    desc: 'Ver mis aplicaciones instaladas'
  });

  const cardBase: React.CSSProperties = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    borderRadius: '14px',
    padding: '24px',
    transition: 'box-shadow 0.2s, border-color 0.2s',
  };

  return (
    <div
      style={{
        padding: '28px 32px',
        maxWidth: '1200px',
        margin: '0 auto',
        fontFamily: 'var(--font-sans)',
        color: 'var(--text-primary)',
        overflowY: 'auto',
        height: '100%',
      }}
    >
      {/* ── GREETING ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: '32px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              fontWeight: 900,
              color: '#111',
              flexShrink: 0,
              boxShadow: '0 0 0 4px var(--color-primary-glow)',
            }}
          >
            {user?.nombre?.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: '1.55rem',
                fontWeight: 800,
                lineHeight: 1.2,
                background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {getGreeting()}, {user?.nombre?.split(' ')[0]} 👋
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • InfraSuite Control Center
            </p>
          </div>
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
        {/* ── QUICK ACTIONS ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          style={cardBase}
        >
          <h2 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚡</span> Acciones rápidas
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {quickActions.map((qa) => (
              <button
                key={qa.label}
                onClick={() => onNavigate(qa.tab)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '12px 16px',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-sans)',
                  transition: 'all 0.18s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.style.background = 'var(--color-primary-glow)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.background = 'var(--bg-main)';
                }}
              >
                <span style={{ fontSize: '1.4rem', width: '32px', textAlign: 'center' }}>{qa.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{qa.label}</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{qa.desc}</div>
                </div>
                <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.85rem' }}>›</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── RECENT ACTIVITY ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          style={cardBase}
        >
          <h2 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🕒</span> Última actividad
          </h2>
          {recentBudgets.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '32px 16px',
                color: 'var(--text-muted)',
                fontSize: '0.84rem',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📭</div>
              <div>Sin actividad reciente.</div>
              <div style={{ marginTop: '6px', fontSize: '0.76rem' }}>Crea tu primer presupuesto en InfraCost.</div>
              <button
                onClick={() => onNavigate('budgets_lite')}
                style={{
                  marginTop: '14px',
                  padding: '8px 18px',
                  background: 'var(--color-primary)',
                  color: '#111',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Crear presupuesto
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentBudgets.map((b, i) => (
                <div
                  key={b.id ?? i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    background: 'var(--bg-main)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                  onClick={() => onNavigate('budgets_lite')}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                >
                  <span style={{ fontSize: '1.1rem' }}>💰</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: '0.84rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {b.nombre || 'Presupuesto sin nombre'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {b.monto ? `S/ ${Number(b.monto).toLocaleString('es-PE')}` : '—'} •{' '}
                      {b.createdAt ? formatTimeAgo(b.createdAt) : 'Fecha desconocida'}
                    </div>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>›</span>
                </div>
              ))}
              <button
                onClick={() => onNavigate('budgets_lite')}
                style={{
                  marginTop: '4px',
                  padding: '8px',
                  background: 'none',
                  border: '1px dashed var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--color-primary)',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Ver todos los presupuestos →
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── INSTALLED APPLICATIONS ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        style={cardBase}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📱</span> Aplicaciones
          </h2>
          <button
            onClick={() => onNavigate('applications')}
            style={{
              background: 'none',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '5px 12px',
              fontSize: '0.76rem',
              color: 'var(--color-primary)',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
            }}
          >
            Administrar →
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          {installedApps.map((app) => {
            const isInstalled = installedModules.includes(app.key);
            return (
              <button
                key={app.key}
                onClick={() => !app.comingSoon && onNavigate(app.tab)}
                disabled={app.comingSoon}
                style={{
                  background: isInstalled ? `${app.color}0d` : 'var(--bg-main)',
                  border: `1px solid ${isInstalled ? app.color + '44' : 'var(--border-color)'}`,
                  borderRadius: '12px',
                  padding: '20px 16px',
                  cursor: app.comingSoon ? 'default' : 'pointer',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.2s',
                  opacity: app.comingSoon ? 0.55 : 1,
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--text-primary)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  if (!app.comingSoon) {
                    e.currentTarget.style.borderColor = app.color;
                    e.currentTarget.style.boxShadow = `0 4px 24px ${app.color}22`;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!app.comingSoon) {
                    e.currentTarget.style.borderColor = isInstalled ? app.color + '44' : 'var(--border-color)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {/* Badge */}
                <span
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    fontSize: '0.58rem',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '999px',
                    background: isInstalled ? app.color : 'var(--border-color)',
                    color: isInstalled ? '#111' : 'var(--text-muted)',
                    letterSpacing: '0.3px',
                  }}
                >
                  {isInstalled ? app.badge : 'NO INSTALADO'}
                </span>
                <span style={{ fontSize: '2rem' }}>{app.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{app.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.3 }}>
                    {app.description}
                  </div>
                </div>
                {isInstalled && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: app.color,
                      fontWeight: 700,
                      padding: '3px 10px',
                      background: `${app.color}18`,
                      borderRadius: '6px',
                    }}
                  >
                    Abrir app →
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
