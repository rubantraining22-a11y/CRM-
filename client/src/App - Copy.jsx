import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import { useSocket } from './hooks/useSocket';
import Sidebar from './components/Layout/Sidebar';
import TopBar from './components/Layout/TopBar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Contacts from './pages/Contacts';
import WhatsAppInbox from './pages/WhatsAppInbox';
import Settings from './pages/Settings';

// 3D Tilt effect on hover for stat cards
const use3DTilt = () => {
  useEffect(() => {
    const handleMouseMove = (e) => {
      const cards = document.querySelectorAll('.stat-card');
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const isInside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
        if (isInside) {
          const cx = rect.width / 2;
          const cy = rect.height / 2;
          const dx = (x - cx) / cx;
          const dy = (y - cy) / cy;
          card.style.transform = `perspective(600px) rotateX(${-dy * 6}deg) rotateY(${dx * 6}deg) translateY(-4px) scale(1.01)`;
        }
      });
    };
    const handleMouseLeave = (e) => {
      if (!e.target.classList.contains('stat-card')) return;
      e.target.style.transform = '';
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.querySelectorAll('.stat-card').forEach((c) => c.addEventListener('mouseleave', handleMouseLeave));
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
};

// Protected layout wrapper
const AppLayout = ({ children }) => {
  const location = useLocation();
  useSocket(); // Initialize WebSocket
  use3DTilt();

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <TopBar pathname={location.pathname} />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
};

// Route guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <div className="loading-overlay"><div className="loading-spinner" /></div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <div className="loading-overlay"><div className="loading-spinner" /></div>;
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

const AppRoutes = () => {
  const { checkAuth } = useAuthStore();
  useEffect(() => { checkAuth(); }, []);

  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

      <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/leads" element={<ProtectedRoute><AppLayout><Leads /></AppLayout></ProtectedRoute>} />
      <Route path="/contacts" element={<ProtectedRoute><AppLayout><Contacts /></AppLayout></ProtectedRoute>} />
      <Route path="/inbox" element={<ProtectedRoute><AppLayout><WhatsAppInbox /></AppLayout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(12px)',
            color: 'var(--text-primary)',
            border: '1px solid rgba(37,99,235,0.12)',
            borderRadius: '12px',
            fontSize: '14px',
            boxShadow: '0 8px 24px rgba(37,99,235,0.12), 0 2px 8px rgba(0,0,0,0.06)',
          },
          success: { iconTheme: { primary: '#059669', secondary: 'white' } },
          error: { iconTheme: { primary: '#dc2626', secondary: 'white' } },
        }}
      />
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;

