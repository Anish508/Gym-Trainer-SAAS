'use client';

import React, { useState, useEffect } from 'react';
import { dbReadAll, dbCreate, dbUpdate } from '@/lib/db';
import { exportToCSV } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { FileText, Calendar, CheckSquare, Clock, Search, X } from 'lucide-react';

export default function AttendanceView() {
  const { showToast } = useToast();
  const [members, setMembers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Rescheduling Modal State
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({
    memberId: '',
    memberName: '',
    workoutName: 'Daily Workout',
    rescheduledTo: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
    note: ''
  });

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadAttendanceData();
    window.addEventListener('db-change', loadAttendanceData);
    return () => window.removeEventListener('db-change', loadAttendanceData);
  }, []);

  const loadAttendanceData = async () => {
    const mems = await dbReadAll('members') || [];
    const atts = await dbReadAll('attendance') || [];
    const wrks = await dbReadAll('workouts') || [];
    
    // Only display active members for checklist
    setMembers(mems.filter(m => m.status === 'active') || []);
    setAttendance(atts.filter(a => a.date === todayStr) || []);
    setWorkouts(wrks);
  };

  const handleStatusChange = async (memberId, newStatus) => {
    const existing = attendance.find(a => a.memberId === memberId);
    
    if (existing && existing.status === newStatus) {
      showToast('info', `Attendance already marked as ${newStatus}`);
      return;
    }

    const now = new Date();
    const timeStr = newStatus === 'absent' ? '--' : now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    try {
      if (existing) {
        await dbUpdate('attendance', existing.id, { 
          status: newStatus, 
          checkInTime: timeStr 
        });
      } else {
        await dbCreate('attendance', {
          id: `ATT-${memberId}-${todayStr}`,
          memberId: memberId,
          date: todayStr,
          status: newStatus,
          checkInTime: timeStr
        });
      }
      
      showToast('success', `Marked attendance as ${newStatus.toUpperCase()}`);
      loadAttendanceData();
      window.dispatchEvent(new Event('db-change'));

      // If marked absent, trigger workout rescheduling dialog
      if (newStatus === 'absent') {
        const memberObj = members.find(m => m.id === memberId);
        const workoutObj = workouts.find(w => w.memberId === memberId);
        
        let todayWorkoutName = 'Daily Workout';
        if (workoutObj?.schedule) {
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const todayName = days[new Date().getDay()];
          const dayPlan = workoutObj.schedule[todayName];
          if (dayPlan) {
            if (typeof dayPlan === 'string') {
              todayWorkoutName = dayPlan;
            } else if (dayPlan.name) {
              todayWorkoutName = dayPlan.name;
            }
          }
        }

        setRescheduleData({
          memberId,
          memberName: memberObj ? memberObj.fullName : 'Client',
          workoutName: todayWorkoutName,
          rescheduledTo: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          note: ''
        });
        
        // Wait brief delay to show modal
        setTimeout(() => {
          setShowReschedule(true);
        }, 500);
      }

    } catch (e) {
      showToast('error', "Failed to record check-in.");
    }
  };

  const handleSaveReschedule = async (e) => {
    e.preventDefault();
    try {
      const resId = `RES-${rescheduleData.memberId}-${Math.floor(1000 + Math.random() * 9000)}`;
      await dbCreate('rescheduledWorkouts', {
        id: resId,
        memberId: rescheduleData.memberId,
        date: todayStr,
        workoutName: rescheduleData.workoutName,
        status: 'rescheduled',
        rescheduledTo: rescheduleData.rescheduledTo,
        note: rescheduleData.note
      });
      showToast('success', `Workout rescheduled to ${rescheduleData.rescheduledTo} successfully!`);
      setShowReschedule(false);
      window.dispatchEvent(new Event('db-change'));
    } catch(err) {
      showToast('error', "Failed to reschedule workout.");
    }
  };

  const getMemberStatus = (memberId) => {
    const record = attendance.find(a => a.memberId === memberId);
    return record ? record.status : null; // unmarked
  };

  const getMemberCheckInTime = (memberId) => {
    const record = attendance.find(a => a.memberId === memberId);
    return record ? record.checkInTime : '--';
  };

  const handleExportCSV = () => {
    const exportData = members.map(m => ({
      Date: todayStr,
      ID: m.id,
      Name: m.fullName,
      Status: (getMemberStatus(m.id) || 'unmarked').toUpperCase(),
      Time: getMemberCheckInTime(m.id)
    }));
    exportToCSV(exportData, `Gym_Attendance_${todayStr}.csv`);
    showToast('success', `Attendance sheet exported for ${todayStr}`);
  };

  // Metrics summary
  const presentCount = attendance.filter(a => a.status === 'present').length;
  const lateCount = attendance.filter(a => a.status === 'late').length;
  const absentCount = attendance.filter(a => a.status === 'absent').length;

  const filteredMembers = members.filter(m => 
    m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="attendance-view-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. Header Toolbar */}
      <div className="view-actions-bar card-glass" style={{ display: 'flex', gap: '1rem', padding: '1.25rem', borderRadius: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.05rem', fontWeight: 600 }}>
            Today's Date: <span style={{ color: 'var(--color-primary)' }}>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Quickly check-in members or review attendance records.</span>
        </div>

        <button className="btn-secondary" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
          <FileText size={16} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* 2. Today's Checkins summary metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div className="card-glass" style={{ padding: '1rem', borderLeft: '4px solid #10B981', background: 'rgba(16,185,129,0.02)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>PRESENT CHECKINS</span>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: '4px', color: '#10B981' }}>{presentCount} Members</h3>
        </div>
        <div className="card-glass" style={{ padding: '1rem', borderLeft: '4px solid #F59E0B', background: 'rgba(245,158,11,0.02)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>LATE CHECKINS</span>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: '4px', color: '#F59E0B' }}>{lateCount} Members</h3>
        </div>
        <div className="card-glass" style={{ padding: '1rem', borderLeft: '4px solid #EF4444', background: 'rgba(239,68,68,0.02)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ABSENT CHECKINS</span>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: '4px', color: '#EF4444' }}>{absentCount} Members</h3>
        </div>
      </div>

      {/* 3. Search Member Bar */}
      <div className="card-glass" style={{ display: 'flex', gap: '0.5rem', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border-glass)', alignItems: 'center' }}>
        <Search size={18} style={{ color: 'var(--text-muted)' }} />
        <input 
          type="text" 
          placeholder="Filter members checklist by name or ID..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ background: 'none', border: 'none', color: '#fff', outline: 'none', width: '100%', fontSize: '0.9rem' }}
        />
      </div>

      {/* 4. Attendance checklist table */}
      <div className="table-responsive card-glass desktop-only" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <table className="table-custom" style={{ width: '100%' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '1rem' }}>Client</th>
              <th style={{ padding: '1rem' }}>ID</th>
              <th style={{ padding: '1rem' }}>Check-in Time</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Mark Attendance</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No members matched search criteria.</td>
              </tr>
            ) : (
              filteredMembers.map(m => {
                const currentStatus = getMemberStatus(m.id);
                const checkInTime = getMemberCheckInTime(m.id);

                return (
                  <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                        {m.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <strong style={{ color: '#fff' }}>{m.fullName}</strong>
                    </td>
                    <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{m.id}</td>
                    <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{checkInTime}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button 
                          className="btn-secondary" 
                          onClick={() => handleStatusChange(m.id, 'present')}
                          style={{
                            padding: '0.35rem 0.8rem',
                            fontSize: '0.75rem',
                            borderRadius: '16px',
                            background: currentStatus === 'present' ? 'rgba(16, 185, 129, 0.2)' : 'none',
                            border: currentStatus === 'present' ? '1px solid #10B981' : '1px solid var(--border-glass)',
                            color: currentStatus === 'present' ? '#10B981' : '#fff'
                          }}
                        >
                          Present
                        </button>
                        <button 
                          className="btn-secondary" 
                          onClick={() => handleStatusChange(m.id, 'late')}
                          style={{
                            padding: '0.35rem 0.8rem',
                            fontSize: '0.75rem',
                            borderRadius: '16px',
                            background: currentStatus === 'late' ? 'rgba(245, 158, 11, 0.2)' : 'none',
                            border: currentStatus === 'late' ? '1px solid #F59E0B' : '1px solid var(--border-glass)',
                            color: currentStatus === 'late' ? '#F59E0B' : '#fff'
                          }}
                        >
                          Late
                        </button>
                        <button 
                          className="btn-secondary" 
                          onClick={() => handleStatusChange(m.id, 'absent')}
                          style={{
                            padding: '0.35rem 0.8rem',
                            fontSize: '0.75rem',
                            borderRadius: '16px',
                            background: currentStatus === 'absent' ? 'rgba(239, 68, 68, 0.15)' : 'none',
                            border: currentStatus === 'absent' ? '1px solid #EF4444' : '1px solid var(--border-glass)',
                            color: currentStatus === 'absent' ? '#EF4444' : '#fff'
                          }}
                        >
                          Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Attendance Stacked list on Mobile viewport */}
      <div className="mobile-card-list mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        {filteredMembers.map(m => {
          const currentStatus = getMemberStatus(m.id);
          const checkInTime = getMemberCheckInTime(m.id);

          return (
            <div key={m.id} className="mobile-card card-glass" style={{ padding: '1rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                  {m.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', margin: 0 }}>{m.fullName}</h4>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>ID: {m.id}</span>
                </div>
                {checkInTime !== '--' && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>Checked In: {checkInTime}</span>
                )}
              </div>

              {/* Status Action Buttons */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                <button 
                  className="btn-secondary" 
                  onClick={() => handleStatusChange(m.id, 'present')}
                  style={{
                    flex: 1,
                    fontSize: '0.75rem',
                    padding: '0.4rem',
                    background: currentStatus === 'present' ? 'rgba(16, 185, 129, 0.2)' : 'none',
                    border: currentStatus === 'present' ? '1px solid #10B981' : '1px solid var(--border-glass)',
                    color: currentStatus === 'present' ? '#10B981' : '#fff'
                  }}
                >
                  Present
                </button>
                <button 
                  className="btn-secondary" 
                  onClick={() => handleStatusChange(m.id, 'late')}
                  style={{
                    flex: 1,
                    fontSize: '0.75rem',
                    padding: '0.4rem',
                    background: currentStatus === 'late' ? 'rgba(245, 158, 11, 0.2)' : 'none',
                    border: currentStatus === 'late' ? '1px solid #F59E0B' : '1px solid var(--border-glass)',
                    color: currentStatus === 'late' ? '#F59E0B' : '#fff'
                  }}
                >
                  Late
                </button>
                <button 
                  className="btn-secondary" 
                  onClick={() => handleStatusChange(m.id, 'absent')}
                  style={{
                    flex: 1,
                    fontSize: '0.75rem',
                    padding: '0.4rem',
                    background: currentStatus === 'absent' ? 'rgba(239, 68, 68, 0.15)' : 'none',
                    border: currentStatus === 'absent' ? '1px solid #EF4444' : '1px solid var(--border-glass)',
                    color: currentStatus === 'absent' ? '#EF4444' : '#fff'
                  }}
                >
                  Absent
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* RESCHEDULE WORKOUT BOTTOM-SHEET / MODAL */}
      {showReschedule && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 2000 }}>
          <div className="modal-card card-glass" style={{ display: 'block', maxWidth: '440px', width: '90%', padding: '1.5rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>Reschedule Missed Workout</h3>
              <button className="btn-icon" onClick={() => setShowReschedule(false)}><X size={18} /></button>
            </div>
            
            <form onSubmit={handleSaveReschedule} className="responsive-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Member <strong>{rescheduleData.memberName}</strong> was marked absent. Reschedule today's workout split (<strong>{rescheduleData.workoutName}</strong>) to another day?
              </div>

              <div className="form-group">
                <label>Reschedule Workout Target</label>
                <input 
                  type="text" 
                  value={rescheduleData.workoutName} 
                  onChange={(e) => setRescheduleData({ ...rescheduleData, workoutName: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label>New Reschedule Date</label>
                <input 
                  type="date" 
                  value={rescheduleData.rescheduledTo} 
                  onChange={(e) => setRescheduleData({ ...rescheduleData, rescheduledTo: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label>Trainer Notes / Remarks</label>
                <input 
                  type="text" 
                  placeholder="e.g. Missed session due to travel" 
                  value={rescheduleData.note} 
                  onChange={(e) => setRescheduleData({ ...rescheduleData, note: e.target.value })} 
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowReschedule(false)}>Skip</button>
                <button type="submit" className="btn-primary">Save Reschedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
