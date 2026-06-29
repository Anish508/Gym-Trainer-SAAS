'use client';

import React, { useState, useEffect } from 'react';
import { dbReadAll, dbCreate, dbUpdate, dbDelete } from '@/lib/db';
import { exportToCSV } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { FileText, Calendar, CheckSquare, Clock, AlertCircle, X, HelpCircle } from 'lucide-react';

export default function AttendanceView() {
  const { showToast } = useToast();
  const [members, setMembers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const todayStr = new Date().toISOString().split('T')[0];

  // Rescheduling Modal State
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({
    memberId: '',
    memberName: '',
    workoutName: 'Daily Workout',
    rescheduledTo: new Date(Date.now() + 86400000).toISOString().split('T')[0], // defaults to tomorrow
    note: ''
  });

  useEffect(() => {
    loadAttendanceData();
    window.addEventListener('db-change', loadAttendanceData);
    return () => window.removeEventListener('db-change', loadAttendanceData);
  }, []);

  const loadAttendanceData = async () => {
    const mems = await dbReadAll('members') || [];
    const atts = await dbReadAll('attendance') || [];
    const wrks = await dbReadAll('workouts') || [];
    
    // Only display active members for today's checklist
    setMembers(mems.filter(m => m.status === 'active') || []);
    setAttendance(atts.filter(a => a.date === todayStr) || []);
    setWorkouts(wrks);
  };

  const handleStatusChange = async (memberId, newStatus) => {
    const existing = attendance.find(a => a.memberId === memberId);
    
    // Check if attendance is already marked with this exact status
    if (existing && existing.status === newStatus) {
      showToast('info', `Attendance already marked as ${newStatus}.`);
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
      
      // If changing from absent to present/late, clean up today's rescheduling record if any exists
      if (newStatus !== 'absent') {
        const resList = await dbReadAll('rescheduledWorkouts') || [];
        const existingRes = resList.find(r => r.memberId === memberId && r.date === todayStr);
        if (existingRes) {
          await dbDelete('rescheduledWorkouts', existingRes.id);
          showToast('info', "Removed rescheduled workout entry because member is present.");
        }
      }

      showToast('success', `Attendance marked: ${newStatus.toUpperCase()}`);
      loadAttendanceData();
      window.dispatchEvent(new Event('db-change'));

      // Missed Workout Rescheduling popup triggers on "Absent"
      if (newStatus === 'absent') {
        const memberObj = members.find(m => m.id === memberId);
        
        // Find member's active workout for today
        const workoutObj = workouts.find(w => w.memberId === memberId);
        let todayWorkoutName = 'Daily Workout';
        if (workoutObj?.schedule) {
          const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const todayName = daysOfWeek[new Date().getDay()];
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
        
        // Wait brief delay for attendance toast to show, then open popup
        setTimeout(() => {
          setShowReschedule(true);
        }, 600);
      }
    } catch (e) {
      showToast('error', "Failed to save attendance record.");
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
      
      // Auto trigger a system notification about this reschedule
      const notifId = `NOTIF-${rescheduleData.memberId}-${Math.floor(1000 + Math.random() * 9000)}`;
      await dbCreate('notifications', {
        id: notifId,
        memberId: rescheduleData.memberId,
        title: "Workout Rescheduled",
        message: `${rescheduleData.workoutName} workout rescheduled to ${rescheduleData.rescheduledTo}. Reason: ${rescheduleData.note || 'None'}`,
        type: "workout",
        date: todayStr,
        read: false
      });

      showToast('success', `Workout rescheduled successfully to ${rescheduleData.rescheduledTo}!`);
      setShowReschedule(false);
      window.dispatchEvent(new Event('db-change'));
    } catch (err) {
      console.error(err);
      showToast('error', "Failed to reschedule workout split.");
    }
  };

  const getMemberStatus = (memberId) => {
    const record = attendance.find(a => a.memberId === memberId);
    return record ? record.status : null; // returns null if not marked yet
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
    exportToCSV(exportData, `Attendance_Sheet_${todayStr}.csv`);
    showToast('info', "Attendance sheet exported to CSV.");
  };

  return (
    <div className="attendance-view-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Action Bar */}
      <div className="view-actions-bar card-glass" style={{ display: 'flex', gap: '1rem', padding: '1.25rem', borderRadius: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.05rem', fontWeight: 600 }}>
          Today's Date: <span style={{ color: 'var(--color-primary)' }}>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </h3>

        <button className="btn-secondary" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', marginLeft: 'auto', width: 'auto' }}>
          <FileText size={18} />
          <span>Export Sheet</span>
        </button>
      </div>

      {/* Roster Table on Desktop */}
      <div className="table-responsive card-glass desktop-only" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <table className="table-custom" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '1rem' }}>Client</th>
              <th style={{ padding: '1rem' }}>ID</th>
              <th style={{ padding: '1rem' }}>Check-in Time</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Attendance Status Selection</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No active members registered.</td>
              </tr>
            ) : (
              members.map(m => {
                const currentStatus = getMemberStatus(m.id);
                const checkInTime = getMemberCheckInTime(m.id);

                return (
                  <tr key={m.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }} className="table-row-hover">
                    <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                        {m.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <span style={{ fontWeight: 600, color: '#fff' }}>{m.fullName}</span>
                    </td>
                    <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{m.id}</td>
                    <td style={{ padding: '1rem' }}>
                      <span className={checkInTime !== '--' ? 'text-success' : 'text-muted'} style={{ fontWeight: 500 }}>
                        {checkInTime}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div className="status-pill-group" style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button 
                          type="button"
                          disabled={currentStatus === 'present'}
                          onClick={() => handleStatusChange(m.id, 'present')}
                          style={{
                            padding: '0.4rem 1rem',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            background: currentStatus === 'present' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                            border: currentStatus === 'present' ? '1px solid #10B981' : '1px solid var(--border-glass)',
                            color: currentStatus === 'present' ? '#10B981' : 'var(--text-secondary)',
                            cursor: currentStatus === 'present' ? 'not-allowed' : 'pointer',
                            opacity: currentStatus === 'present' ? 1 : 0.6,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          Present
                        </button>
                        <button 
                          type="button"
                          disabled={currentStatus === 'late'}
                          onClick={() => handleStatusChange(m.id, 'late')}
                          style={{
                            padding: '0.4rem 1rem',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            background: currentStatus === 'late' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                            border: currentStatus === 'late' ? '1px solid #F59E0B' : '1px solid var(--border-glass)',
                            color: currentStatus === 'late' ? '#F59E0B' : 'var(--text-secondary)',
                            cursor: currentStatus === 'late' ? 'not-allowed' : 'pointer',
                            opacity: currentStatus === 'late' ? 1 : 0.6,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          Late
                        </button>
                        <button 
                          type="button"
                          disabled={currentStatus === 'absent'}
                          onClick={() => handleStatusChange(m.id, 'absent')}
                          style={{
                            padding: '0.4rem 1rem',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            background: currentStatus === 'absent' ? 'rgba(255, 42, 95, 0.15)' : 'transparent',
                            border: currentStatus === 'absent' ? '1px solid #FF2A5F' : '1px solid var(--border-glass)',
                            color: currentStatus === 'absent' ? '#FF477E' : 'var(--text-secondary)',
                            cursor: currentStatus === 'absent' ? 'not-allowed' : 'pointer',
                            opacity: currentStatus === 'absent' ? 1 : 0.6,
                            transition: 'all 0.2s ease'
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

      {/* Roster Cards on Mobile */}
      <div className="mobile-card-list mobile-only">
        {members.length === 0 ? (
          <div className="card-glass text-center" style={{ padding: '2rem', color: 'var(--text-secondary)' }}>No active members registered.</div>
        ) : (
          members.map(m => {
            const currentStatus = getMemberStatus(m.id);
            const checkInTime = getMemberCheckInTime(m.id);
            const isMarked = currentStatus !== null;

            return (
              <div key={m.id} className="mobile-card" style={{ gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                    {m.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>{m.fullName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {m.id}</div>
                  </div>
                  <div>
                    {isMarked ? (
                      <span className={`badge ${currentStatus === 'present' ? 'badge-success' : currentStatus === 'late' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
                        {currentStatus.toUpperCase()}
                      </span>
                    ) : (
                      <span className="badge badge-info" style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>UNMARKED</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Check-in time:</span>
                  <strong style={{ color: checkInTime !== '--' ? '#10B981' : 'var(--text-muted)' }}>{checkInTime}</strong>
                </div>

                {/* Quick mark buttons */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  <button 
                    className="btn-secondary" 
                    disabled={currentStatus === 'present'}
                    onClick={() => handleStatusChange(m.id, 'present')}
                    style={{
                      flex: 1,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      minHeight: '40px',
                      background: currentStatus === 'present' ? 'rgba(16, 185, 129, 0.2)' : 'none',
                      border: currentStatus === 'present' ? '1px solid #10B981' : '1px solid var(--border-glass)',
                      color: currentStatus === 'present' ? '#10B981' : '#fff',
                      opacity: currentStatus === 'present' ? 1 : 0.6
                    }}
                  >
                    Present
                  </button>
                  <button 
                    className="btn-secondary" 
                    disabled={currentStatus === 'late'}
                    onClick={() => handleStatusChange(m.id, 'late')}
                    style={{
                      flex: 1,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      minHeight: '40px',
                      background: currentStatus === 'late' ? 'rgba(245, 158, 11, 0.2)' : 'none',
                      border: currentStatus === 'late' ? '1px solid #F59E0B' : '1px solid var(--border-glass)',
                      color: currentStatus === 'late' ? '#F59E0B' : '#fff',
                      opacity: currentStatus === 'late' ? 1 : 0.6
                    }}
                  >
                    Late
                  </button>
                  <button 
                    className="btn-secondary" 
                    disabled={currentStatus === 'absent'}
                    onClick={() => handleStatusChange(m.id, 'absent')}
                    style={{
                      flex: 1,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      minHeight: '40px',
                      background: currentStatus === 'absent' ? 'rgba(255, 42, 95, 0.15)' : 'none',
                      border: currentStatus === 'absent' ? '1px solid #FF2A5F' : '1px solid var(--border-glass)',
                      color: currentStatus === 'absent' ? '#FF477E' : '#fff',
                      opacity: currentStatus === 'absent' ? 1 : 0.6
                    }}
                  >
                    Absent
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* FEATURE 1: WORKOUT RESCHEDULING POPUP MODAL */}
      {showReschedule && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 2000 }}>
          <div className="modal-card card-glass" style={{ display: 'block', maxWidth: '440px', width: '90%', padding: '1.5rem', borderRadius: '12px' }}>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '1rem' }}>
              <HelpCircle size={22} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>Reschedule Missed Workout?</h3>
            </div>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              You marked <strong>{rescheduleData.memberName}</strong> as Absent. Would you like to reschedule today's workout <strong>({rescheduleData.workoutName})</strong>?
            </p>

            <form onSubmit={handleSaveReschedule} className="responsive-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div className="form-group">
                <label>Workout to Reschedule</label>
                <input 
                  type="text" 
                  required 
                  value={rescheduleData.workoutName} 
                  onChange={(e) => setRescheduleData({ ...rescheduleData, workoutName: e.target.value })}
                  style={{ minHeight: '40px' }}
                />
              </div>

              <div className="form-group">
                <label>Reschedule Date *</label>
                <input 
                  type="date" 
                  required 
                  value={rescheduleData.rescheduledTo} 
                  onChange={(e) => setRescheduleData({ ...rescheduleData, rescheduledTo: e.target.value })}
                  style={{ minHeight: '40px' }}
                />
              </div>

              <div className="form-group">
                <label>Reschedule Reason / Trainer Note</label>
                <input 
                  type="text" 
                  placeholder="e.g. Travel, Sick, Extended Rest" 
                  value={rescheduleData.note} 
                  onChange={(e) => setRescheduleData({ ...rescheduleData, note: e.target.value })}
                  style={{ minHeight: '40px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => {
                    setShowReschedule(false);
                    showToast('info', "Workout rescheduling skipped.");
                  }}
                  style={{ minHeight: '40px', width: '90px' }}
                >
                  Skip
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  style={{ minHeight: '40px', width: '130px' }}
                >
                  Reschedule
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
