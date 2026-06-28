'use client';

import React, { useState, useEffect } from 'react';
import { dbReadAll, dbCreate, dbUpdate } from '@/lib/db';
import { exportToCSV } from '@/lib/utils';
import { FileText } from 'lucide-react';

export default function AttendanceView() {
  const [members, setMembers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadAttendanceData();
    window.addEventListener('db-change', loadAttendanceData);
    return () => window.removeEventListener('db-change', loadAttendanceData);
  }, []);

  const loadAttendanceData = async () => {
    const mems = await dbReadAll('members') || [];
    const atts = await dbReadAll('attendance') || [];
    
    // Only display active members for today's checklist
    setMembers(mems.filter(m => m.status === 'active') || []);
    setAttendance(atts.filter(a => a.date === todayStr) || []);
  };

  const handleStatusChange = async (memberId, newStatus) => {
    const existing = attendance.find(a => a.memberId === memberId);
    const now = new Date();
    const timeStr = newStatus === 'absent' ? '--' : now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
    
    loadAttendanceData();
    window.dispatchEvent(new Event('db-change'));
  };

  const getMemberStatus = (memberId) => {
    const record = attendance.find(a => a.memberId === memberId);
    return record ? record.status : 'absent'; // default is absent
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
      Status: getMemberStatus(m.id).toUpperCase(),
      Time: getMemberCheckInTime(m.id)
    }));
    exportToCSV(exportData, `Attendance_Sheet_${todayStr}.csv`);
  };

  return (
    <div className="attendance-view-container">
      {/* Action Bar */}
      <div className="view-actions-bar card-glass" style={{ display: 'flex', gap: '1rem', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.1rem', fontWeight: 600 }}>
          Today's Date: <span style={{ color: 'var(--color-primary)' }}>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </h3>

        <button className="btn-secondary" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', marginLeft: 'auto' }}>
          <FileText size={18} />
          <span>Export Sheet</span>
        </button>
      </div>

      {/* Checklist Table */}
      <div className="table-responsive card-glass" style={{ borderRadius: '12px', overflowX: 'auto' }}>
        <table className="table-custom" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '1rem' }}>Client</th>
              <th style={{ padding: '1rem' }}>ID</th>
              <th style={{ padding: '1rem' }}>Check-in Time</th>
              <th style={{ padding: '1rem' }}>Attendance Status Selection</th>
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
                      <img src={m.profilePhoto || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&fit=crop'} alt={m.fullName} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                      <span style={{ fontWeight: 600, color: '#fff' }}>{m.fullName}</span>
                    </td>
                    <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{m.id}</td>
                    <td style={{ padding: '1rem' }}>
                      <span className={checkInTime !== '--' ? 'text-success' : 'text-muted'} style={{ fontWeight: 500 }}>
                        {checkInTime}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div className="status-pill-group" style={{ display: 'flex', gap: '0.4rem' }}>
                        <button 
                          type="button"
                          onClick={() => handleStatusChange(m.id, 'present')}
                          style={{
                            padding: '0.35rem 0.85rem',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            background: currentStatus === 'present' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                            border: currentStatus === 'present' ? '1px solid #10B981' : '1px solid var(--border-glass)',
                            color: currentStatus === 'present' ? '#10B981' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            outline: 'none'
                          }}
                        >
                          Present
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleStatusChange(m.id, 'late')}
                          style={{
                            padding: '0.35rem 0.85rem',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            background: currentStatus === 'late' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                            border: currentStatus === 'late' ? '1px solid #F59E0B' : '1px solid var(--border-glass)',
                            color: currentStatus === 'late' ? '#F59E0B' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            outline: 'none'
                          }}
                        >
                          Late
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleStatusChange(m.id, 'absent')}
                          style={{
                            padding: '0.35rem 0.85rem',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            background: currentStatus === 'absent' ? 'rgba(255, 42, 95, 0.15)' : 'transparent',
                            border: currentStatus === 'absent' ? '1px solid #FF2A5F' : '1px solid var(--border-glass)',
                            color: currentStatus === 'absent' ? '#FF477E' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            outline: 'none'
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
    </div>
  );
}
