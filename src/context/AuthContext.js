'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSupabaseRef } from '@/lib/supabase';

const AuthContext = createContext(null);
const SESSION_KEY = 'kmf_session_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session state on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedSession = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
      if (storedSession) {
        try {
          setUser(JSON.parse(storedSession));
        } catch (e) {
          console.error("Invalid session parsed from storage", e);
        }
      }
      setLoading(false);
    }
  }, []);

  // Login handler
  const login = async (email, password, rememberMe = false) => {
    const normalizedEmail = email.trim();
    const { active, supabase } = getSupabaseRef();

    // 1. Supabase Cloud DB Auth if active
    if (active && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: password
        });

        if (error) throw error;

        const sessionUser = {
          uid: data.user.id,
          email: data.user.email,
          role: data.user.user_metadata?.role || 'owner',
          name: data.user.user_metadata?.name || 'Gym Owner'
        };

        saveSession(sessionUser, rememberMe);
        setUser(sessionUser);
        return sessionUser;
      } catch (error) {
        console.error("Supabase Authentication failed:", error);
        throw new Error(error.message || "Invalid credentials.");
      }
    }

    // 2. Demo Local Fallback logins (Safe demo accounts)
    const DEMO_TRAINERS = [
      { email: 'keerthanofficial@gmail.com', password: 'keerthan123', name: 'Keerthan' },
      { email: 'dhanush@gmail.com', password: 'dhanush123', name: 'Dhanush' }
    ];

    const matched = DEMO_TRAINERS.find(
      t => t.email.toLowerCase() === normalizedEmail.toLowerCase() && t.password === password
    );

    if (matched) {
      const sessionUser = {
        uid: `MOCK_${matched.email}`,
        email: matched.email,
        role: 'demo',
        name: matched.name
      };

      saveSession(sessionUser, rememberMe);
      setUser(sessionUser);
      return sessionUser;
    } else {
      throw new Error("Invalid admin email or password credentials.");
    }
  };

  // Logout handler
  const logout = async () => {
    const { active, supabase } = getSupabaseRef();
    if (active && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error("Supabase sign out failed", e);
      }
    }

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_KEY);
    }
    setUser(null);
  };

  const saveSession = (userData, rememberMe) => {
    if (typeof window === 'undefined') return;
    const value = JSON.stringify(userData);
    if (rememberMe) {
      localStorage.setItem(SESSION_KEY, value);
    } else {
      sessionStorage.setItem(SESSION_KEY, value);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isDemo: user?.role === 'demo' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
