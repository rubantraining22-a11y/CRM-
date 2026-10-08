import React from 'react';

const Settings = () => {
  return (
    <div className="page-body" style={{ maxWidth: 960 }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
          Settings
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13.5 }}>
          Showroom and system preferences
        </p>
      </div>
    </div>
  );
};

export default Settings;
