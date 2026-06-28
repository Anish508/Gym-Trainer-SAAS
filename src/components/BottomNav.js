'use client';

import React from 'react';
import { LayoutDashboard, Users, Dumbbell, CheckSquare, Settings } from 'lucide-react';

const MENU_ITEMS = [
  { hash: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { hash: 'members', name: 'Members', icon: Users },
  { hash: 'pt', name: 'PT', icon: Dumbbell },
  { hash: 'attendance', name: 'Attendance', icon: CheckSquare },
  { hash: 'settings', name: 'Settings', icon: Settings }
];

export default function BottomNav({ activeTab }) {
  return (
    <nav id="mobile-navigation" className="mobile-navigation">
      {MENU_ITEMS.map((item) => {
        const IconComponent = item.icon;
        const isActive = activeTab === item.hash || (item.hash === 'members' && activeTab === 'member-profile');
        return (
          <a 
            key={item.hash}
            href={`#${item.hash}`} 
            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <IconComponent size={20} />
            <span>{item.name}</span>
          </a>
        );
      })}
    </nav>
  );
}
