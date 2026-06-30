'use client';

import React, { useState, useEffect } from 'react';
import { dbReadAll, dbUpdate, dbReadOne } from '@/lib/db';
import { Search, Dumbbell, Calendar, CreditCard, ChevronRight, Plus, Minus } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export default function PTMembersView() {
  const { showToast } = useToast();
  const [ptMembers, setPtMembers] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [gymSettings, setGymSettings] = useState(null);

  useEffect(() => {
    loadPTData();
    const handleDbChange = () => loadPTData();
    window.addEventListener('db-change', handleDbChange);
    return () => window.removeEventListener('db-change', handleDbChange);
  }, []);

  const loadPTData = async () => {
    try {
      const list = await dbReadAll('members') || [];
      const wrks = await dbReadAll('workouts') || [];
      const pays = await dbReadAll('payments') || [];
      const s = await dbReadOne('settings', 'settings');

      setPtMembers(list.filter(m => m.isPT && m.status === 'active') || []);
      setWorkouts(wrks);
      setPayments(pays);
      setGymSettings(s || {});
    } catch(e) {
      console.error(e);
    }
  };

  const handleIncrement = async (member) => {
    const completed = Number(member.ptSessionsCompleted || 0);
    const total = Number(member.ptSessionsTotal || 10);
    if (completed < total) {
      const updated = completed + 1;
      await dbUpdate('members', member.id, { ptSessionsCompleted: updated });
      showToast('success', `Session logged for ${member.fullName} (${updated}/${total})`);
      loadPTData();
      window.dispatchEvent(new Event('db-change'));
    } else {
      showToast('info', 'All sessions in this pack have been completed.');
    }
  };

  const handleDecrement = async (member) => {
    const completed = Number(member.ptSessionsCompleted || 0);
    if (completed > 0) {
      const updated = completed - 1;
      await dbUpdate('members', member.id, { ptSessionsCompleted: updated });
      showToast('info', `Decremented session count (${updated}/${member.ptSessionsTotal})`);
      loadPTData();
      window.dispatchEvent(new Event('db-change'));
    }
  };

  const getTodayWorkout = (memberId) => {
    const workoutObj = workouts.find(w => w.memberId === memberId);
    if (!workoutObj || !workoutObj.schedule) return 'No Workout split assigned';
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = days[new Date().getDay()];
    const dayPlan = workoutObj.schedule[todayName];
    
    if (!dayPlan) return 'Rest Day';
    if (typeof dayPlan === 'string') return dayPlan;
    return dayPlan.name || dayPlan.workoutName || 'Rest Day';
  };

  const getPtRenewalDate = (memberId) => {
    const memPayments = payments.filter(p => p.memberId === memberId);
    if (memPayments.length === 0) return '--';
    const latestPayment = memPayments.sort((a,b) => new Date(b.dueDate) - new Date(a.dueDate))[0];
    return latestPayment.dueDate;
  };

  const filteredPT = ptMembers.filter(m => 
    m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pt-members-view-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Search Header */}
      <div className="view-actions-bar card-glass" style={{ display: 'flex', gap: '1rem', padding: '1rem', borderRadius: '12px', alignItems: 'center' }}>
        <div className="search-box" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search active PT clients by name or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: 'none', border: 'none', color: '#fff', outline: 'none', width: '100%' }}
          />
        </div>
      </div>

      {/* PT Members Cards Grid */}
      <div className="pt-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {filteredPT.length === 0 ? (
          <div className="card-glass text-center" style={{ gridColumn: '1/-1', padding: '3rem', color: 'var(--text-secondary)' }}>
            No active Personal Training clients found.
          </div>
        ) : (
          filteredPT.map(m => {
            const completed = Number(m.ptSessionsCompleted || 0);
            const total = Number(m.ptSessionsTotal || 10);
            const progressPercent = Math.min((completed / total) * 100, 100);
            const todayWorkout = getTodayWorkout(m.id);
            const ptRenewal = getPtRenewalDate(m.id);

            return (
              <div key={m.id} className="pt-client-card card-glass" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* 1. Header Information */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#F59E0B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.95rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {m.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>{m.fullName}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>ID: {m.id}</span>
                  </div>
                </div>

                {/* 2. Goal & Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '0.75rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Fitness Goal</span>
                    <div style={{ fontWeight: 600, color: '#fff', marginTop: '2px' }}>{m.fitnessGoal || 'General Fitness'}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>PT Price Fee</span>
                    <div style={{ fontWeight: 600, color: '#fff', marginTop: '2px' }}>₹{(m.ptFees || 0).toLocaleString()}</div>
                  </div>
                </div>

                {/* 3. PT Session Counter Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Sessions Remaining</span>
                    <strong style={{ color: '#fff' }}>{total - completed} of {total} left</strong>
                  </div>
                  
                  {/* Progress bar */}
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${progressPercent}%`, height: '100%', background: progressPercent >= 90 ? '#EF4444' : progressPercent >= 60 ? '#F59E0B' : 'var(--color-primary)', transition: 'all 0.3s ease' }}></div>
                  </div>

                  {/* Incrementor/Decrementor Buttons */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button className="btn-secondary" onClick={() => handleDecrement(m)} style={{ flex: 1, height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.8rem' }}>
                      <Minus size={14} />
                      <span>Void Session</span>
                    </button>
                    <button className="btn-primary" onClick={() => handleIncrement(m)} style={{ flex: 1, height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.8rem' }}>
                      <Plus size={14} />
                      <span>Log Session</span>
                    </button>
                  </div>
                </div>

                {/* 4. Workout split & Renewal info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Today's Workout:</span>
                    <strong style={{ color: '#fff', marginLeft: 'auto' }}>{todayWorkout}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>PT Start / Renewal:</span>
                    <span style={{ color: 'var(--text-secondary)', marginLeft: 'auto' }}>{ptRenewal}</span>
                  </div>
                </div>

                {/* 5. Open Profile Button */}
                <a href={`#member-profile?id=${m.id}`} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', padding: '0.6rem', borderRadius: '10px', fontSize: '0.85rem' }}>
                  <span>Open Client Profile</span>
                  <ChevronRight size={14} />
                </a>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
