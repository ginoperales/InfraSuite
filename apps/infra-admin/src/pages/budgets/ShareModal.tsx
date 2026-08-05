import React, { useState } from 'react';
import { Modal } from '@infrasuite/shared';
import type { Budget } from './types';
import { LiteIcon, type LiteIconName } from './BudgetEditorLite';

type ShareRole = 'EDITOR' | 'VIEWER' | 'COMMENTER';
type PermissionRole = 'OWNER' | ShareRole;

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget: Budget | null;
  onUpdatePermissions: (budgetId: string, permissions: Record<string, PermissionRole>) => void;
  onUpdateLinkAccess?: (budgetId: string, linkAccess: 'RESTRICTED' | 'ANYONE_WITH_LINK', linkRole?: ShareRole) => void;
  currentUserUid: string;
}

const roleLabel: Record<PermissionRole, string> = {
  OWNER: 'Propietario',
  EDITOR: 'Editor',
  COMMENTER: 'Comentador',
  VIEWER: 'Lector'
};

const AvatarIcon: React.FC<{
  icon: LiteIconName;
  active?: boolean;
}> = ({ icon, active = false }) => (
  <div
    style={{
      width: 42,
      height: 42,
      borderRadius: '12px',
      background: active ? 'rgba(37, 99, 235, 0.12)' : 'var(--modal-panel-bg)',
      border: active ? '1px solid rgba(37, 99, 235, 0.28)' : '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: active ? 'var(--color-primary)' : 'var(--text-secondary)',
      flexShrink: 0
    }}
  >
    <LiteIcon name={icon} size={19} />
  </div>
);

const SelectBox: React.FC<{
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ value, onChange, disabled = false, children }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    style={{
      height: 44,
      padding: '0 14px',
      borderRadius: '9px',
      border: '1px solid var(--border-color)',
      background: 'var(--modal-input-bg)',
      color: 'var(--text-primary)',
      fontSize: '0.9rem',
      cursor: disabled ? 'default' : 'pointer',
      outline: 'none',
      boxSizing: 'border-box',
      fontFamily: 'var(--font-sans)',
      minWidth: 124,
      opacity: disabled ? 0.62 : 1
    }}
  >
    {children}
  </select>
);

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  budget,
  onUpdatePermissions,
  onUpdateLinkAccess,
  currentUserUid
}) => {
  const [emailToInvite, setEmailToInvite] = useState('');
  const [roleToInvite, setRoleToInvite] = useState<ShareRole>('VIEWER');

  if (!budget) return null;

  const permissions = budget.permissions || {};
  const isPublicLink = budget.linkAccess === 'ANYONE_WITH_LINK';
  const publicLink = `https://infrasuitee.web.app/budgets/${budget.id}`;

  const getUserEmail = (uid: string) => {
    if (uid === currentUserUid) return 'tu (propietario)';
    return `${uid}@example.com`;
  };

  const handleInvite = () => {
    if (!emailToInvite.trim()) return;
    const newUid = emailToInvite.trim().split('@')[0];
    onUpdatePermissions(budget.id, { ...permissions, [newUid]: roleToInvite });
    setEmailToInvite('');
  };

  const handleRoleChange = (uid: string, newRole: ShareRole | 'REMOVE') => {
    const newPermissions = { ...permissions };
    if (newRole === 'REMOVE') {
      delete newPermissions[uid];
    } else {
      newPermissions[uid] = newRole;
    }
    onUpdatePermissions(budget.id, newPermissions);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(publicLink);
    alert('Enlace copiado al portapapeles');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Compartir Presupuesto">
      <style>{`
        @media (max-width: 720px) {
          .share-modal-content {
            width: 100% !important;
          }

          .share-invite-row,
          .share-general-row,
          .share-person-row {
            grid-template-columns: 1fr !important;
          }

          .share-person-row {
            display: grid !important;
          }

          .share-general-role {
            align-items: stretch !important;
          }

          .share-modal-content select,
          .share-modal-content button,
          .share-modal-content input {
            width: 100%;
          }
        }
      `}</style>
      <div className="share-modal-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: 'min(720px, 100%)', padding: '8px 0 2px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '18px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0, lineHeight: '1.55', maxWidth: 500 }}>
            Comparte <strong style={{ color: 'var(--text-primary)' }}>"{budget.nombre}"</strong> con tu equipo o habilita acceso por enlace con inicio de sesion Google.
          </p>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              minHeight: 30,
              padding: '5px 10px',
              borderRadius: '999px',
              background: isPublicLink ? 'rgba(16, 185, 129, 0.10)' : 'var(--modal-panel-bg)',
              border: isPublicLink ? '1px solid rgba(16, 185, 129, 0.24)' : '1px solid var(--border-color)',
              color: isPublicLink ? 'var(--color-success)' : 'var(--text-secondary)',
              fontSize: '0.78rem',
              fontWeight: 800,
              whiteSpace: 'nowrap'
            }}
          >
            <LiteIcon name={isPublicLink ? 'globe' : 'lock'} size={14} />
            {isPublicLink ? 'Lectura publica activa' : 'Acceso restringido'}
          </span>
        </div>

        <div className="share-invite-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) auto auto', gap: '12px', alignItems: 'center' }}>
          <input
            type="email"
            placeholder="Anadir personas (ej. correo@empresa.com)"
            value={emailToInvite}
            onChange={(e) => setEmailToInvite(e.target.value)}
            style={{
              width: '100%',
              minHeight: 46,
              padding: '12px 16px',
              borderRadius: '9px',
              border: '1px solid var(--border-color)',
              background: 'var(--modal-input-bg)',
              color: 'var(--text-primary)',
              fontSize: '0.95rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
          />
          <SelectBox value={roleToInvite} onChange={(value) => setRoleToInvite(value as ShareRole)}>
            <option value="VIEWER">Lector</option>
            <option value="COMMENTER">Comentador</option>
            <option value="EDITOR">Editor</option>
          </SelectBox>
          <button
            type="button"
            onClick={handleInvite}
            disabled={!emailToInvite.trim()}
            style={{
              background: emailToInvite.trim() ? 'var(--color-primary)' : 'var(--bg-surface-hover)',
              color: emailToInvite.trim() ? '#fff' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '9px',
              minHeight: 46,
              padding: '0 24px',
              cursor: emailToInvite.trim() ? 'pointer' : 'default',
              fontWeight: 800,
              fontSize: '0.94rem',
              transition: 'background 0.2s',
              boxSizing: 'border-box',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <LiteIcon name="share" size={16} />
            Enviar
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Personas con acceso</h4>

          <div className="share-person-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--modal-panel-bg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
              <AvatarIcon icon="user" active />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {getUserEmail(budget.ownerId || currentUserUid)}
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '3px' }}>Propietario</div>
              </div>
            </div>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 700 }}>{roleLabel.OWNER}</span>
          </div>

          {Object.entries(permissions).map(([uid, role]) => {
            if (uid === budget.ownerId) return null;
            return (
              <div key={uid} className="share-person-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--modal-panel-bg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                  <AvatarIcon icon="users" />
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {getUserEmail(uid)}
                  </div>
                </div>
                <SelectBox value={role} onChange={(value) => handleRoleChange(uid, value as ShareRole | 'REMOVE')}>
                  <option value="VIEWER">Lector</option>
                  <option value="COMMENTER">Comentador</option>
                  <option value="EDITOR">Editor</option>
                  <option value="REMOVE">Quitar acceso</option>
                </SelectBox>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Acceso general</h4>
          <div className="share-general-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '16px', alignItems: 'center', padding: '14px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--modal-panel-bg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
              <AvatarIcon icon={isPublicLink ? 'globe' : 'lock'} active={isPublicLink} />
              <div style={{ minWidth: 0 }}>
                <SelectBox
                  value={budget.linkAccess || 'RESTRICTED'}
                  onChange={(value) => {
                    const newAccess = value as 'RESTRICTED' | 'ANYONE_WITH_LINK';
                    onUpdateLinkAccess?.(budget.id, newAccess, newAccess === 'ANYONE_WITH_LINK' ? (budget.linkRole || 'VIEWER') : budget.linkRole);
                  }}
                >
                  <option value="RESTRICTED">Restringido</option>
                  <option value="ANYONE_WITH_LINK">Cualquier persona con el enlace</option>
                </SelectBox>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.45 }}>
                  {isPublicLink
                    ? 'Cualquier persona con el enlace puede solicitar acceso con Google. El permiso aplicado es el de la derecha.'
                    : 'Solo las personas agregadas pueden abrir el enlace.'}
                </div>
              </div>
            </div>

            <div className="share-general-role" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
              <SelectBox
                value={budget.linkRole || 'VIEWER'}
                disabled={!isPublicLink}
                onChange={(value) => onUpdateLinkAccess?.(budget.id, 'ANYONE_WITH_LINK', value as ShareRole)}
              >
                <option value="VIEWER">Lector</option>
                <option value="COMMENTER">Comentador</option>
                <option value="EDITOR">Editor</option>
              </SelectBox>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textAlign: 'right', maxWidth: 150 }}>
                {isPublicLink ? 'Permiso del enlace' : 'Activa el enlace publico'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={copyLink}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--color-primary)',
              padding: '11px 18px',
              borderRadius: '999px',
              fontSize: '0.94rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              boxSizing: 'border-box'
            }}
            onMouseOver={(e) => (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-surface-hover)'}
            onMouseOut={(e) => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}
          >
            <LiteIcon name="link" size={16} />
            Copiar enlace
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              padding: '12px 30px',
              borderRadius: '999px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: 800,
              transition: 'all 0.2s',
              boxSizing: 'border-box',
              boxShadow: '0 8px 18px rgba(0,0,0,0.16)'
            }}
            onMouseOver={(e) => (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'}
            onMouseOut={(e) => (e.currentTarget as HTMLButtonElement).style.transform = 'none'}
          >
            Hecho
          </button>
        </div>
      </div>
    </Modal>
  );
};
