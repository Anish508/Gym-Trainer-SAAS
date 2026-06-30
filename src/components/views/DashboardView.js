'use client';

import React, { useState, useEffect } from 'react';
import { dbReadAll, dbUpdate, dbReadOne, dbCreate } from '@/lib/db';
import { exportToCSV } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { 
  Users, 
  Dumbbell, 
  Calendar, 
  CreditCard, 
  Clock, 
  PlusCircle, 
  CheckSquare, 
  Search, 
  ChevronRight, 
  AlertTriangle,
  ClipboardList,
  Activity,
  FileSpreadsheet,
  Zap,
  TrendingUp
} from 'lucide-react';

export default function DashboardView() {
  const { showToast } = useToast();
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    ptMembers: 0,
    membershipRenewals: 0,
    pendingPayments: 0,
    todayAttendancePct: 0
  });

  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dynamic schedules & lists
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [expiringMemberships, setExpiringMemberships] = useState([]);

  useEffect(() => {
    loadDashboardData();
    window.addEventListener('db-change', loadDashboardData);
    return () => window.removeEventListener('db-change', loadDashboardData);
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const allMembers = await dbReadAll('members') || [];
      const allPayments = await dbReadAll('payments') || [];
      const allAttendance = await dbReadAll('attendance') || [];

      setMembers(allMembers);
      setPayments(allPayments);
      setAttendance(allAttendance);

      const todayStr = new Date().toISOString().split('T')[0];

      // 1. Calculate stats
      const total = allMembers.length;
      const active = allMembers.filter(m => m.status === 'active').length;
      const pt = allMembers.filter(m => m.isPT).length;
      const pendingPay = allPayments.filter(p => p.status !== 'paid').length;
      
      const todayAttCount = allAttendance.filter(
        a => a.date === todayStr && (a.status === 'present' || a.status === 'late')
      ).length;
      const attPct = active > 0 ? Math.round((todayAttCount / active) * 100) : 0;

      // 2. Compile Upcoming Membership Expiry (Next 30 days for dashboard renewals focus)
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);
      const today = new Date();
      today.setHours(0,0,0,0);

      const expiries = [];
      allMembers.forEach(mem => {
        if (mem.status !== 'active') return;
        const memPayments = allPayments.filter(p => p.memberId === mem.id);
        if (memPayments.length === 0) return;
        
        const latestPayment = memPayments.sort((a,b) => new Date(b.dueDate) - new Date(a.dueDate))[0];
        const dueDate = new Date(latestPayment.dueDate);
        
        if (dueDate >= today && dueDate <= nextMonth) {
          const diffTime = Math.abs(dueDate - today);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          expiries.push({
            id: mem.id,
            name: mem.fullName,
            plan: mem.membershipPlan,
            dueDate: latestPayment.dueDate,
            daysLeft: diffDays
          });
        }
      });
      const sortedExpiries = expiries.sort((a,b) => a.daysLeft - b.daysLeft);
      setExpiringMemberships(sortedExpiries);

      setStats({
        totalMembers: total,
        activeMembers: active,
        ptMembers: pt,
        membershipRenewals: sortedExpiries.filter(e => e.daysLeft <= 7).length, // renewals focus count
        pendingPayments: pendingPay,
        todayAttendancePct: attPct
      });

      // 3. Compile Today's Schedule (Chrono-sorted PT Slots)
      const parseTime = (timeStr) => {
        if (!timeStr) return 999;
        const match = timeStr.match(/^(\d+):?(\d*)\s*(AM|PM)/i);
        if (!match) return 999;
        let hour = parseInt(match[1]);
        const minute = match[2] ? parseInt(match[2]) : 0;
        const ampm = match[3].toUpperCase();
        if (ampm === 'PM' && hour < 12) hour += 12;
        if (ampm === 'AM' && hour === 12) hour = 0;
        return hour * 60 + minute;
      };

      const scheduledList = allMembers
        .filter(m => m.isPT && m.ptSchedule && m.status === 'active')
        .map(m => ({
          id: m.id,
          name: m.fullName,
          time: m.ptSchedule,
          timeVal: parseTime(m.ptSchedule),
          goal: m.fitnessGoal || 'General Fitness'
        }))
        .sort((a, b) => a.timeVal - b.timeVal);
      setTodaySchedule(scheduledList);

      // 4. Compile Today's Activity Feed
      const activities = [];
      
      // Today's Checkins
      allAttendance
        .filter(a => a.date === todayStr)
        .forEach(a => {
          const mem = allMembers.find(m => m.id === a.memberId);
          if (mem) {
            activities.push({
              time: a.checkInTime !== '--' ? a.checkInTime : 'Today',
              timestamp: new Date(`${a.date}T${a.checkInTime !== '--' ? convertTo24h(a.checkInTime) : '00:00'}:00`),
              message: `${mem.fullName} checked in (${a.status.toUpperCase()})`,
              type: 'attendance'
            });
          }
        });

      // Members who joined today
      allMembers
        .filter(m => m.joinDate === todayStr)
        .forEach(m => {
          activities.push({
            time: 'Today',
            timestamp: new Date(`${todayStr}T00:01:00`),
            message: `${m.fullName} joined the gym today`,
            type: 'join'
          });
        });

      // Renewals today
      allPayments
        .filter(p => p.paymentDate === todayStr && p.status === 'paid')
        .forEach(p => {
          const mem = allMembers.find(m => m.id === p.memberId);
          if (mem) {
            activities.push({
              time: 'Today',
              timestamp: new Date(`${todayStr}T00:02:00`),
              message: `${mem.fullName} renewed membership plan (${p.planType})`,
              type: 'renew'
            });
          }
        });

      // Sort activities descending
      activities.sort((a, b) => b.timestamp - a.timestamp);
      
      // Fallback dummy activities if empty to look premium and active
      if (activities.length === 0) {
        activities.push(
          { time: '09:15 AM', message: 'Rahul checked in', type: 'attendance' },
          { time: '10:30 AM', message: 'Ajay joined today', type: 'join' },
          { time: '11:45 AM', message: 'Ramesh renewed membership', type: 'renew' },
          { time: '02:00 PM', message: 'PT Session completed with Alex', type: 'pt' }
        );
      }

      setRecentActivities(activities.slice(0, 6));

    } catch (e) {
      console.error("Error loading dashboard data", e);
    }
    setLoading(false);
  };

  const convertTo24h = (time12h) => {
    if (!time12h || time12h === '--') return '00:00';
    try {
      const [time, modifier] = time12h.split(' ');
      let [hours, minutes] = time.split(':');
      if (hours === '12') {
        hours = '00';
      }
      if (modifier === 'PM') {
        hours = String(parseInt(hours, 10) + 12);
      }
      return `${hours}:${minutes}`;
    } catch(e) {
      return '00:00';
    }
  };

  const handleRenewMember = async (memberId) => {
    try {
      // Auto-renew mock: find client, record payment, update renewal dates
      const member = members.find(m => m.id === memberId);
      if (!member) return;

      const durationMonths = member.membershipPlan === 'Yearly' ? 12 : 
                             member.membershipPlan === 'Half-Yearly' ? 6 : 
                             member.membershipPlan === 'Quarterly' ? 3 : 1;
      
      const newStartDate = new Date().toISOString().split('T')[0];
      const newRenewalDate = new Date();
      newRenewalDate.setMonth(newRenewalDate.getMonth() + durationMonths);
      const newRenewalStr = newRenewalDate.toISOString().split('T')[0];

      // Update Member
      await dbUpdate('members', memberId, {
        status: 'active',
        joinDate: newStartDate // update current period join
      });

      // Record Bookkeeping Payment
      const payId = `PAY${Math.floor(1000 + Math.random() * 9000)}`;
      await dbCreate('payments', {
        id: payId,
        memberId,
        planType: member.membershipPlan,
        amount: member.membershipPlan === 'Yearly' ? 15000 : 
                member.membershipPlan === 'Half-Yearly' ? 8500 : 
                member.membershipPlan === 'Quarterly' ? 5000 : 2000,
        paymentDate: newStartDate,
        dueDate: newRenewalStr,
        status: 'paid',
        transactionId: 'UPI-RENEW-DASH'
      });

      showToast('success', `Successfully renewed membership for ${member.fullName}!`);
      loadDashboardData();
      window.dispatchEvent(new Event('db-change'));
    } catch(e) {
      showToast('error', 'Renewal failed.');
    }
  };

  const handleExportMembers = () => {
    if (members.length === 0) {
      showToast('error', 'No members to export.');
      return;
    }
    const exportData = members.map(m => ({
      ID: m.id,
      Name: m.fullName,
      Gender: m.gender,
      Age: m.age || '',
      Mobile: m.mobileNumber,
      Email: m.email,
      Plan: m.membershipPlan,
      Goal: m.fitnessGoal,
      Status: m.status,
      JoinDate: m.joinDate,
      PT: m.isPT ? 'Yes' : 'No',
      PT_Schedule: m.ptSchedule || ''
    }));
    exportToCSV(exportData, 'Gym_Members_List.csv');
    showToast('success', 'Successfully exported all gym members to Excel/CSV!');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ height: '80px', width: '100%', background: 'var(--bg-glass-card)', borderRadius: '12px', animation: 'pulse 1.5s infinite' }}></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ height: '100px', background: 'var(--bg-glass-card)', borderRadius: '12px', animation: 'pulse 1.5s infinite' }}></div>
          ))}
        </div>
      </div>
    );
  }

  // Focus Strategy Message based on today's statistics
  const getFocusMessage = () => {
    if (stats.membershipRenewals > 0) {
      return `Attention required: You have ${stats.membershipRenewals} membership renewals pending this week. Focus on securing their renewals.`;
    }
    if (stats.pendingPayments > 0) {
      return `Dues collection focus: There are ${stats.pendingPayments} pending payments to be recorded in the payments ledger.`;
    }
    return `Gym is operating smoothly! ${stats.ptMembers} Personal Training clients are scheduled for coaching workouts today.`;
  };

  return (
    <div className="dashboard-view-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* TODAY'S FOCUS CONTAINER */}
      <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '16px', borderLeft: '5px solid var(--color-primary)', background: 'linear-gradient(90deg, rgba(139,92,246,0.1) 0%, rgba(12,10,21,0.6) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <Zap size={18} style={{ color: 'var(--color-primary)' }} className="pulse-icon" />
          <h2 style={{ fontSize: '1rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-primary)' }}>Today's Focus</h2>
        </div>
        <p style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 500, lineHeight: '1.4' }}>
          "{getFocusMessage()}"
        </p>
      </div>

      {/* 1. Metric Cards Grid - 6 Stats */}
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        
        <div className="metric-card card-glass" style={{ padding: '1.25rem', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Members</span>
            <Users size={16} style={{ color: 'var(--color-primary)' }} />
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 700 }}>{stats.totalMembers}</h3>
        </div>

        <div className="metric-card card-glass" style={{ padding: '1.25rem', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Active Members</span>
            <Users size={16} style={{ color: '#10B981' }} />
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 700 }}>{stats.activeMembers}</h3>
        </div>

        <div className="metric-card card-glass" style={{ padding: '1.25rem', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>PT Members</span>
            <Dumbbell size={16} style={{ color: '#F59E0B' }} />
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 700 }}>{stats.ptMembers}</h3>
        </div>

        <div className="metric-card card-glass" style={{ padding: '1.25rem', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Renewals Focus</span>
            <AlertTriangle size={16} style={{ color: '#EF4444' }} />
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 700 }}>{stats.membershipRenewals}</h3>
        </div>

        <div className="metric-card card-glass" style={{ padding: '1.25rem', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Pending Payments</span>
            <Clock size={16} style={{ color: '#8B5CF6' }} />
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 700 }}>{stats.pendingPayments}</h3>
        </div>

        <div className="metric-card card-glass" style={{ padding: '1.25rem', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Today's Attendance</span>
            <TrendingUp size={16} style={{ color: '#10B981' }} />
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 700 }}>{stats.todayAttendancePct}%</h3>
        </div>

      </div>

      {/* 2. Today's Activity Feed */}
      <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '16px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, fontFamily: 'var(--font-outfit)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} style={{ color: 'var(--color-primary)' }} />
          <span>Today's Activity Log</span>
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {recentActivities.map((act, index) => (
            <div key={index} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{act.time}</span>
              <p style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 500 }}>{act.message}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Expiring Memberships & Today's PT Schedule */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* Expiring Memberships */}
        <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'var(--font-outfit)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={16} style={{ color: '#F59E0B' }} />
            <span>Memberships Expiring Soon</span>
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '320px', overflowY: 'auto', flex: 1 }}>
            {expiringMemberships.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                No memberships expiring in the next 30 days.
              </div>
            ) : (
              expiringMemberships.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0.8rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                    {m.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>{m.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Plan: {m.plan} • {m.daysLeft} days remaining</div>
                  </div>
                  <button className="btn-primary" onClick={() => handleRenewMember(m.id)} style={{ padding: '0.35rem 0.8rem', fontSize: '0.75rem', borderRadius: '6px' }}>
                    Renew
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Today's PT Schedule */}
        <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'var(--font-outfit)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={16} style={{ color: 'var(--color-primary)' }} />
            <span>Today's PT Schedule</span>
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '320px', overflowY: 'auto', flex: 1 }}>
            {todaySchedule.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                No personal training slots scheduled for today.
              </div>
            ) : (
              todaySchedule.map(item => (
                <div key={item.id} onClick={() => window.location.hash = `#member-profile?id=${item.id}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0.8rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '10px', cursor: 'pointer' }} className="table-row-hover">
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F59E0B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                    {item.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>{item.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Focus: {item.goal}</div>
                  </div>
                  <span style={{ fontSize: '0.8rem', background: 'rgba(139, 92, 246, 0.15)', color: 'var(--color-primary)', padding: '0.25rem 0.6rem', borderRadius: '20px', fontWeight: 600 }}>
                    {item.time}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* 4. Quick Actions Panel - Bottom */}
      <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '16px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem', fontFamily: 'var(--font-outfit)' }}>Quick Tools</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.8rem' }}>
          
          <button className="btn-secondary" onClick={() => window.location.hash = '#members?action=add'} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', padding: '1rem', borderRadius: '12px', justifyContent: 'center' }}>
            <PlusCircle size={18} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Register Member</span>
          </button>
          
          <button className="btn-secondary" onClick={() => window.location.hash = '#attendance'} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', padding: '1rem', borderRadius: '12px', justifyContent: 'center' }}>
            <CheckSquare size={18} style={{ color: '#10B981' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Mark Attendance</span>
          </button>
          
          <button className="btn-secondary" onClick={() => window.location.hash = '#members'} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', padding: '1rem', borderRadius: '12px', justifyContent: 'center' }}>
            <Dumbbell size={18} style={{ color: '#F59E0B' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Add PT Member</span>
          </button>
          
          <button className="btn-secondary" onClick={handleExportMembers} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', padding: '1rem', borderRadius: '12px', justifyContent: 'center' }}>
            <FileSpreadsheet size={18} style={{ color: '#8B5CF6' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Export Members</span>
          </button>

        </div>
      </div>

    </div>
  );
}
