'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { initLocalStorageSeeding } from '@/lib/db';
import { initSupabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
// Views
import DashboardView from '@/components/views/DashboardView';
import MembersView from '@/components/views/MembersView';
import PTMembersView from '@/components/views/PTMembersView';
import AttendanceView from '@/components/views/AttendanceView';
import SettingsView from '@/components/views/SettingsView';
import MemberProfileView from '@/components/views/MemberProfileView';

import { Mail, Lock, ArrowRight, Menu, Eye, EyeOff } from 'lucide-react';


export default function Home() {
  const { user, login, loading, isDemo } = useAuth();
  
  // Navigation Routing States
  const [currentView, setCurrentView] = useState('dashboard');
  const [memberIdParam, setMemberIdParam] = useState(null);
  
  // Theme state
  const [theme, setTheme] = useState('dark');

  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Sidebar collapse
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Initialize DB and Theme on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Initial local seeding
      initLocalStorageSeeding();
      
      // 2. Initialize theme from localStorage
      const storedTheme = localStorage.getItem('kmf_gym_theme') || 'dark';
      setTheme(storedTheme);
      document.documentElement.setAttribute('data-theme', storedTheme);
      
      // 3. Initialize Supabase
      initSupabase();
    }
  }, []);

  // Central Router listener for Anchor Links hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'dashboard';
      // If there is a trailing tab hash fragment (e.g. #workouts), strip it for clean query parsing
      const cleanHash = hash.includes('#') ? hash.split('#')[0] : hash;
      const [baseRoute, queryString] = cleanHash.split('?');
      const params = new URLSearchParams(queryString || '');
      
      // Handle setting restrictions for Demo users
      if (baseRoute === 'settings' && isDemo) {
        alert("Access restricted: Gym settings are blocked in Demo Mode.");
        window.location.hash = '#dashboard';
        return;
      }

      setCurrentView(baseRoute);
      if (baseRoute === 'member-profile') {
        setMemberIdParam(params.get('id'));
      }
    };

    handleHashChange(); // Run on mount

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isDemo]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('kmf_gym_theme', newTheme);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      await login(email, password, rememberMe);
    } catch (err) {
      setLoginError(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoginLoading(false);
    }
  };

  // Helper to map route hash to header readable title
  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Dashboard';
      case 'members': return 'Members';
      case 'pt': return 'PT Members';
      case 'attendance': return 'Attendance Today';
      case 'settings': return 'Trainer Settings';
      case 'member-profile': return 'Member Profile Details';
      default: return 'Trainer System';
    }
  };

  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'members':
        return <MembersView />;
      case 'pt':
        return <PTMembersView />;
      case 'attendance':
        return <AttendanceView />;
      case 'settings':
        return <SettingsView />;
      case 'member-profile':
        return <MemberProfileView memberId={memberIdParam} onBack={() => { window.location.hash = '#members'; }} />;
      default:
        return <DashboardView />;
    }
  };

  if (loading) {
    return (
      <div className="app-loader" style={{ opacity: 1 }}>
        <div className="loader-content">
          <div className="loader-logo">
            <span className="logo-spark">KEERTHAN</span>
            <span className="logo-fit">MINDFIT</span>
          </div>
          <div className="loader-spinner"></div>
        </div>
      </div>
    );
  }

  // RENDER LOGIN SCREEN IF NOT AUTHENTICATED
  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card card-glass">
          <div className="auth-header">
            <h2 className="auth-logo">
              <span className="logo-spark">KEERTHAN</span>
              <span className="logo-fit">MINDFIT</span>
            </h2>
            <p className="auth-subtitle">Trainer Client Portal</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="auth-form">
            {loginError && (
              <div style={{ background: 'rgba(255, 42, 95, 0.15)', border: '1px solid rgba(255, 42, 95, 0.3)', color: '#FF477E', padding: '0.8rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>
                {loginError}
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="admin-email">Email Address</label>
              <div className="input-with-icon">
                <Mail size={18} />
                <input 
                  type="email" 
                  id="admin-email" 
                  placeholder="trainer@keerthanmindfit.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="admin-password">Password</label>
              <div className="input-with-icon" style={{ position: 'relative' }}>
                <Lock size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="admin-password" 
                  placeholder="••••••••" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: '2.8rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.2rem',
                    outline: 'none'
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <label className="checkbox-container">
                <input 
                  type="checkbox" 
                  id="admin-remember" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="checkmark"></span>
                Remember Me
              </label>
            </div>

            <button type="submit" className="btn-primary w-100" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }} disabled={loginLoading}>
              <span>{loginLoading ? 'Signing In...' : 'Sign In as Trainer'}</span>
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // RENDER APP CORE IF AUTHENTICATED
  return (
    <>
      {/* Demo Banner */}
      {user.role === 'demo' && (
        <div className="demo-banner" style={{ background: 'var(--color-primary)', color: '#fff', textAlign: 'center', padding: '0.5rem', fontWeight: 600, fontSize: '0.85rem', zIndex: 1100 }}>
          ⚡ DEMO MODE ACTIVE (LocalStorage Mock Database)
        </div>
      )}

      <div 
        className={`app-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
        style={{ 
          height: user.role === 'demo' ? 'calc(100vh - 38px)' : '100vh', 
          overflow: 'hidden' 
        }}
      >
        {/* Left Sidebar */}
        <Sidebar activeTab={currentView} onSignOut={() => { window.location.hash = ''; }} />

        {/* Right Content Frame */}
        <div className="main-layout" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          
          {/* Header */}
          <Header 
            viewTitle={getViewTitle()} 
            currentTheme={theme} 
            toggleTheme={toggleTheme} 
          />

          {/* Central dynamic viewport */}
          <main className="app-view" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
            {renderActiveView()}
          </main>
        </div>
      </div>



      {/* Mobile navigation bottom bar */}
      <BottomNav activeTab={currentView} />
    </>
  );
}
