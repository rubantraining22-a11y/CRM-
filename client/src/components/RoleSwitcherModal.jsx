import React from 'react';
import { ShieldCheck, Briefcase, User, Check, X, Shield, Lock, Sparkles } from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const RoleSwitcherModal = ({ onClose }) => {
  const { user, switchRole } = useAuthStore();
  const currentRole = user?.role || 'admin';

  const roles = [
    {
      id: 'admin',
      title: 'Admin Control (Full Access)',
      icon: ShieldCheck,
      color: '#10b981',
      bg: 'rgba(16,185,129,0.12)',
      border: 'rgba(16,185,129,0.3)',
      badge: '👑 Master Admin',
      description: 'Unrestricted master access. Configure Meta Webhooks, manage team roles, run bulk CSV broadcasts, and oversee all showroom deals.',
      permissions: [
        'Full CRM & Settings Configuration',
        'Bulk WhatsApp Broadcasts (CSV)',
        'Live Meta Cloud API & Webhook Control',
        'Sales Team Re-assignment & User Management',
        'PageIndex Vectorless RAG Training',
      ],
    },
    {
      id: 'sales',
      title: 'Sales Team Access',
      icon: Briefcase,
      color: '#3b82f6',
      bg: 'rgba(59,130,246,0.12)',
      border: 'rgba(59,130,246,0.3)',
      badge: '💼 Sales Executive',
      description: 'Dedicated showroom sales desk. Follow up with inquiries, schedule test drives, send templates & media attachments on WhatsApp.',
      permissions: [
        'Lead Pipeline & Customer Directory',
        'WhatsApp Live Inbox with Attachment Sending',
        'AI Sales Assistant Co-pilot',
        'Test Drive & Booking Management',
        'Restricted from deleting system credentials',
      ],
    },
    {
      id: 'user',
      title: 'Standard User (Viewer)',
      icon: User,
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.12)',
      border: 'rgba(245,158,11,0.3)',
      badge: '👤 Viewer Access',
      description: 'Read-only viewer access for trainees or audit staff. Can inspect dashboard performance and customer records without write/send actions.',
      permissions: [
        'Showroom Performance Monitoring Dashboard',
        'Read-only Customer Directory & Leads',
        'Read-only WhatsApp Chat Viewer',
        'Blocked from broadcasting & sending messages',
        'No access to backend API configurations',
      ],
    },
  ];

  const handleSelectRole = (roleId) => {
    switchRole(roleId);
    toast.success(`Role switched to ${roleId.toUpperCase()} access!`);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div 
        className="modal-card" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: 580, width: '92vw', padding: 0, overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-card)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-card)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Shield size={19} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800 }}>Role-Based Access Control</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Switch permissions to test Admin, Sales Team, or Viewer controls
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Roles List */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {roles.map((r) => {
            const isSelected = currentRole === r.id;
            const Icon = r.icon;

            return (
              <div
                key={r.id}
                onClick={() => handleSelectRole(r.id)}
                style={{
                  padding: '16px',
                  borderRadius: 12,
                  border: `2px solid ${isSelected ? r.color : 'var(--border-card)'}`,
                  background: isSelected ? r.bg : 'var(--bg-tertiary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: r.bg,
                      color: r.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1px solid ${r.border}`
                    }}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{r.title}</h4>
                      <span style={{ fontSize: 10.5, color: r.color, fontWeight: 700 }}>{r.badge}</span>
                    </div>
                  </div>
                  {isSelected ? (
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: r.color,
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '3px 9px',
                      borderRadius: 99
                    }}>
                      <Check size={12} strokeWidth={3} /> Active
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Click to Switch</span>
                  )}
                </div>

                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {r.description}
                </p>

                {/* Permissions bullets */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {r.permissions.map((p, idx) => (
                    <span key={idx} style={{
                      fontSize: 10.5,
                      padding: '2px 7px',
                      borderRadius: 6,
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-card)',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <span style={{ color: r.color }}>•</span> {p}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border-card)',
          display: 'flex',
          justifyContent: 'flex-end',
          background: 'var(--bg-card)'
        }}>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '7px 18px', fontSize: 12.5 }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSwitcherModal;
