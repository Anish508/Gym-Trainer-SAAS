'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, Users, Dumbbell, CheckSquare, Settings, LogOut } from 'lucide-react';

const MENU_ITEMS = [
  { hash: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { hash: 'members', name: 'Members', icon: Users },
  { hash: 'pt', name: 'PT Members', icon: Dumbbell },
  { hash: 'attendance', name: 'Attendance Today', icon: CheckSquare },
  { hash: 'settings', name: 'Trainer Settings', icon: Settings }
];

export default function Sidebar({ activeTab, onSignOut }) {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    if (onSignOut) onSignOut();
  };

  return (
    <aside id="app-sidebar" className="app-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-full">
            <span className="logo-spark">KEERTHAN</span>
            <span className="logo-fit">MINDFIT</span>
          </span>
          <span className="logo-compact">
            <span className="logo-spark">K</span>
            <span className="logo-fit">M</span>
          </span>
        </div>
      </div>
      <nav className="sidebar-menu">
        {MENU_ITEMS.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.hash || (item.hash === 'members' && activeTab === 'member-profile');
          return (
            <a 
              key={item.hash}
              href={`#${item.hash}`} 
              className={`menu-item ${isActive ? 'active' : ''}`}
            >
              <IconComponent size={20} />
              <span>{item.name}</span>
            </a>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <button className="btn-logout" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
