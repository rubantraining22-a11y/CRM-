import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Car, 
  Lock, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  CheckCircle2 
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('admin@tatamotors-crm.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      toast.success('🎉 Welcome back to Tata Motors CRM Pro!');
      navigate('/dashboard');
    }
  };

  const handleQuickDemo = () => {
    setEmail('rajesh.kumar@tatamotors.com');
    setPassword('admin123');
    toast('Demo credentials auto-filled', { icon: '⚡' });
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      padding: '20px',
      background: 'var(--bg-primary)',
      overflow: 'hidden'
    }}>
      {/* Background Blobs */}
      <div className="animated-bg-blobs">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <div 
        className="card-glass" 
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '36px 32px',
          position: 'relative',
          zIndex: 10,
          boxShadow: 'var(--shadow-lg)',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.45)'
          }}>
            <Car size={30} strokeWidth={2.4} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
            TATA MOTORS <span style={{ color: '#10b981' }}>CRM PRO</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
            Showroom Lead & Meta Cloud API Portal
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              OFFICIAL EMAIL ADDRESS
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rajesh@tatamotors.com" 
                className="input-field"
                style={{ paddingLeft: '38px' }}
              />
              <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              PORTAL PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="input-field"
                style={{ paddingLeft: '38px' }}
              />
              <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary" 
            style={{ width: '100%', padding: '12px', marginTop: '6px', fontSize: '14px' }}
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* One Click Demo Access */}
        <div style={{ marginTop: '20px', paddingTop: '18px', borderTop: '1px solid var(--border-card)', textAlign: 'center' }}>
          <button 
            type="button"
            onClick={handleQuickDemo}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#10b981',
              fontWeight: 700,
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Zap size={14} /> One-Click Fill Showroom Specialist Credentials
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
