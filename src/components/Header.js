'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Sun, Moon } from 'lucide-react';

export default function Header({ viewTitle, currentTheme, toggleTheme }) {
  const { user } = useAuth();

  return (
    <header className="app-header">
      <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
        {/* Gym Logo for Mobile Sticky Header */}
        <div className="header-logo-mobile" style={{ display: 'flex', alignItems: 'center' }}>
          <span className="logo-spark" style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '0.5px' }}>K</span>
          <span className="logo-fit" style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-primary)' }}>M</span>
        </div>
        <div style={{ height: '18px', width: '1px', background: 'rgba(255,255,255,0.15)', margin: '0 0.1rem' }} className="header-divider-mobile"></div>
        <h1 className="view-title" style={{ fontSize: '1.15rem', fontWeight: 700 }}>{viewTitle}</h1>
      </div>
      <div className="header-right">
        {/* Theme Toggle Button */}
        <button className="btn-icon" aria-label="Toggle Theme" onClick={toggleTheme}>
          <Sun className="sun-icon" size={20} />
          <Moon className="moon-icon" size={20} />
        </button>

        {/* User Profile Brief */}
        {user && (
          <div className="user-profile-badge">
            <div className="avatar-sm" style={{ background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem', borderRadius: '50%', width: '32px', height: '32px', marginRight: '8px' }}>
              {user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'TR'}
            </div>
            <div className="profile-info-brief">
              <span className="user-name">{user.name}</span>
              <span className="user-role">
                {user.role === 'developer' ? 'Developer' : user.role === 'demo' ? 'Demo Mode' : 'Trainer'}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
