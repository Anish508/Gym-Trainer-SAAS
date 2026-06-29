'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { dbReadAll, dbUpdate, dbDelete } from '@/lib/db';
import { Sun, Moon, Bell, Trash2 } from 'lucide-react';

export default function Header({ viewTitle, currentTheme, toggleTheme }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadNotifications();
    
    // Refresh notifications when database changes
    const handleRefresh = () => loadNotifications();
    window.addEventListener('hashchange', handleRefresh);
    window.addEventListener('db-change', handleRefresh);
    return () => {
      window.removeEventListener('hashchange', handleRefresh);
      window.removeEventListener('db-change', handleRefresh);
    };
  }, []);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.notifications-bell-wrapper')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const loadNotifications = async () => {
    const list = await dbReadAll('notifications');
    setNotifications(list || []);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleClearAll = async () => {
    for (const notif of notifications) {
      await dbDelete('notifications', notif.id);
    }
    loadNotifications();
    window.dispatchEvent(new Event('db-change'));
  };

  const handleToggleRead = async (id, currentRead) => {
    await dbUpdate('notifications', id, { read: !currentRead });
    loadNotifications();
    window.dispatchEvent(new Event('db-change'));
  };

  const handleDeleteNotif = async (e, id) => {
    e.stopPropagation();
    await dbDelete('notifications', id);
    loadNotifications();
    window.dispatchEvent(new Event('db-change'));
  };

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
        {/* Theme Toggle Button (Renders both for CSS display rules to toggle) */}
        <button className="btn-icon" aria-label="Toggle Theme" onClick={toggleTheme}>
          <Sun className="sun-icon" size={20} />
          <Moon className="moon-icon" size={20} />
        </button>

        {/* Notifications Dropdown Wrapper */}
        <div className="notifications-bell-wrapper" style={{ position: 'relative' }}>
          <button 
            className="btn-icon" 
            aria-label="Notifications" 
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>

          {showDropdown && (
            <div className="notifications-dropdown card-glass" style={{ display: 'block', zIndex: 1000 }}>
              <div className="dropdown-header">
                <h3>Notifications</h3>
                <button className="btn-text" onClick={handleClearAll}>Clear All</button>
              </div>
              <div className="dropdown-list">
                {notifications.length === 0 ? (
                  <div className="dropdown-empty-state">No notifications.</div>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      className={`dropdown-item ${notif.read ? 'read' : 'unread'}`}
                      onClick={() => handleToggleRead(notif.id, notif.read)}
                      style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                    >
                      <div className="dropdown-item-content" style={{ flex: 1 }}>
                        <h4>{notif.title}</h4>
                        <p>{notif.message}</p>
                        <span className="notif-date">{notif.date}</span>
                      </div>
                      <button 
                        className="btn-icon" 
                        style={{ padding: '0.2rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}
                        onClick={(e) => handleDeleteNotif(e, notif.id)}
                        title="Delete notification"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Brief */}
        {user && (
          <div className="user-profile-badge">
            <img 
              src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&fit=crop" 
              alt="Profile" 
              className="avatar-sm" 
            />
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
