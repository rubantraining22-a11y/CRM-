import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Kanban, 
  Users, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Car, 
  Zap, 
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div>
        {/* Logo Section */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Car size={24} strokeWidth={2.4} />
          </div>
          <div className="sidebar-logo-text">
            <h2>
              TATA CRM
              <span className="badge-pro-tag">PRO</span>
            </h2>
            <span>Motors Hub & Cloud API</span>
          </div>
        </div>

        {/* Live Status Card */}
        <div className="sidebar-status-card">
          <div className="status-live-indicator">
            <span className="pulse-ping-emerald">
              <span className="ping-wave"></span>
              <span className="ping-center"></span>
            </span>
            <span className="status-title">Meta Cloud API</span>
          </div>
          <span className="status-badge-live">LIVE SYNC</span>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">Showroom Core</div>

          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon"><LayoutDashboard size={18} /></span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink 
            to="/leads" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon"><Kanban size={18} /></span>
            <span>Lead Pipeline</span>
            <span className="nav-badge">12</span>
          </NavLink>

          <NavLink 
            to="/contacts" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon"><Users size={18} /></span>
            <span>Customer Directory</span>
          </NavLink>

          <div className="nav-section-label" style={{ marginTop: '16px' }}>Communications</div>

          <NavLink 
            to="/inbox" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon"><MessageSquare size={18} /></span>
            <span>WhatsApp Inbox</span>
            <span className="nav-badge-pill">3 New</span>
          </NavLink>

          <NavLink 
            to="/settings" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon"><Settings size={18} /></span>
            <span>Settings</span>
          </NavLink>
        </nav>
      </div>

      {/* User Footer Profile */}
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', fontWeight: 800 }}>
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'RU'}
          </div>
          <div className="user-details">
            <h4 style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--text-primary)' }}>{user?.name || 'Ruban'}</h4>
            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, textTransform: 'capitalize' }}>
              {user?.role === 'admin' ? 'Administrator' : user?.role === 'sales' ? 'Sales Executive' : 'Standard User'}
            </span>
          </div>
          <button 
            onClick={handleLogout}
            className="btn-sidebar-logout" 
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
