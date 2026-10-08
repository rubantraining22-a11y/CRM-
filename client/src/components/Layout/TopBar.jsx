import React from 'react';
import { Search, Sun, Moon } from 'lucide-react';
import useThemeStore from '../../store/themeStore';

const TopBar = () => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header className="topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 36px' }}>
      {/* Global Quick Search Bar */}
      <div className="topbar-search-box" style={{ flex: 1, maxWidth: 480 }}>
        <Search size={16} color="var(--text-muted)" />
        <input 
          type="text" 
          placeholder="Search leads, models, phones..." 
          className="topbar-search-input"
          style={{ width: '100%' }}
        />
        <span className="search-kbd-chip">Ctrl + K</span>
      </div>

      {/* Moon / Sun Theme Toggle */}
      <button 
        onClick={toggleTheme} 
        className="btn-theme-toggle" 
        title="Toggle Light / Dark Mode"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </header>
  );
};

export default TopBar;
