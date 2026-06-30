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
  TrendingUp,
  X
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
  const [rescheduledToday, setRescheduledToday] = useState([]);
  const [missedWorkouts, setMissedWorkouts] = useState([]);

  // Smart Reschedule Modal States
  const [showSmartReschedule, setShowSmartReschedule] = useState(false);
  const [targetRescheduleLog, setTargetRescheduleLog] = useState(null);
  const [rescheduleOption, setRescheduleOption] = useState('tomorrow'); // tomorrow, custom-date, end-of-week, next-workout-day
  const [customRescheduleDate, setCustomRescheduleDate] = useState(new Date().toISOString().split('T')[0]);

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
      const allWorkouts = await dbReadAll('workouts') || [];
      const allRescheduled = await dbReadAll('rescheduledWorkouts') || [];

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

      // 2. Compile Upcoming Membership Expiry
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
        membershipRenewals: sortedExpiries.filter(e => e.daysLeft <= 7).length,
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

      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayDayName = days[new Date().getDay()];

      const scheduledList = allMembers
        .filter(m => m.status === 'active')
        .map(m => {
          const workoutPlan = allWorkouts.find(w => w.memberId === m.id);
          let todaySplitVal = 'Rest';
          let hasActiveWorkout = false;
          if (workoutPlan && workoutPlan.schedule) {
            const dayVal = workoutPlan.schedule[todayDayName];
            if (dayVal) {
              if (typeof dayVal === 'object') {
                if (dayVal.isRestDay) {
                  todaySplitVal = 'Rest';
                } else {
                  todaySplitVal = dayVal.workoutName || 'Active Workout';
                  hasActiveWorkout = true;
                }
              } else if (typeof dayVal === 'string') {
                todaySplitVal = dayVal;
                hasActiveWorkout = dayVal.toLowerCase() !== 'rest' && dayVal.toLowerCase() !== 'rest day';
              }
            }
          }
          return {
            id: m.id,
            name: m.fullName,
            time: m.ptSchedule || 'General Session',
            timeVal: m.ptSchedule ? parseTime(m.ptSchedule) : 999,
            goal: m.fitnessGoal || 'General Fitness',
            todaySplit: todaySplitVal,
            isPT: m.isPT || false,
            hasActiveWorkout
          };
        })
        .filter(item => item.isPT || item.hasActiveWorkout)
        .sort((a, b) => a.timeVal - b.timeVal);
      setTodaySchedule(scheduledList);

      // 4. Compile Today's Activity Feed
      const activities = [];
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

      activities.sort((a, b) => b.timestamp - a.timestamp);
      setRecentActivities(activities.slice(0, 6));

      // 5. Compile Rescheduled Workouts Today
      const resToday = allRescheduled
        .filter(r => r.rescheduledTo === todayStr)
        .map(r => {
          const mem = allMembers.find(m => m.id === r.memberId);
          return {
            ...r,
            memberName: mem ? mem.fullName : 'Unknown Member'
          };
        });
      setRescheduledToday(resToday);

      // 6. Compile Missed Workouts Pending Rescheduling
      const missedPending = allRescheduled
        .filter(r => r.status?.toLowerCase() === 'missed')
        .map(r => {
          const mem = allMembers.find(m => m.id === r.memberId);
          return {
            ...r,
            memberName: mem ? mem.fullName : 'Unknown Member'
          };
        });
      setMissedWorkouts(missedPending);

    } catch (e) {
      console.error("Error loading dashboard data", e);
    }
    setLoading(false);
  };

  const convertTo24h = (time12h) => {
    if (!time12h || time12h === '--') return '00:00';
    const match = time12h.match(/^(\d+):?(\d*)\s*(AM|PM)/i);
    if (!match) return '00:00';
    let hour = parseInt(match[1]);
    const minute = match[2] ? parseInt(match[2]) : 0;
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && hour < 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  };

  const handleRenewMember = async (memberId) => {
    try {
      const mem = await dbReadOne('members', memberId);
      if (!mem) return;
      
      const settingsObj = await dbReadOne('settings', 'settings');
      const planPrice = settingsObj?.membershipPlans?.find(p => p.name === mem.membershipPlan)?.price || 2000;
      const duration = settingsObj?.membershipPlans?.find(p => p.name === mem.membershipPlan)?.duration || 1;

      const newRenewal = new Date();
      newRenewal.setMonth(newRenewal.getMonth() + duration);
      const renewalStr = newRenewal.toISOString().split('T')[0];

      await dbUpdate('members', memberId, { status: 'active' });

      await dbCreate('payments', {
        id: `PAY-${memberId}-${Math.floor(1000 + Math.random() * 9000)}`,
        memberId,
        planType: mem.membershipPlan,
        amount: planPrice,
        paymentDate: new Date().toISOString().split('T')[0],
        dueDate: renewalStr,
        status: 'paid',
        transactionId: 'UPI-RENEW-DASH'
      });

      showToast('success', `${mem.fullName}'s membership renewed successfully!`);
      loadDashboardData();
    } catch(e) {
      showToast('error', 'Renewal failed.');
    }
  };

  const handleExportMembers = () => {
    const data = members.map(m => ({
      ID: m.id,
      Name: m.fullName,
      Phone: m.mobileNumber,
      Plan: m.membershipPlan,
      PT: m.isPT ? 'Yes' : 'No',
      Status: m.status.toUpperCase()
    }));
    exportToCSV(data, 'Keerthan_MindFit_Members.csv');
    showToast('success', 'Members exported to CSV successfully.');
  };

  // Smart Reschedule Logic from Dashboard
  const handleOpenReschedule = (log) => {
    setTargetRescheduleLog(log);
    setShowSmartReschedule(true);
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!targetRescheduleLog) return;
    
    try {
      const baseDate = targetRescheduleLog.date;
      let targetDate = customRescheduleDate;
      
      if (rescheduleOption === 'tomorrow') {
        const nextDay = new Date(baseDate);
        nextDay.setDate(nextDay.getDate() + 1);
        targetDate = nextDay.toISOString().split('T')[0];
      } else if (rescheduleOption === 'end-of-week') {
        const base = new Date(baseDate);
        const day = base.getDay();
        const diff = (day === 0 ? 0 : 7 - day); // next Sunday
        base.setDate(base.getDate() + diff);
        targetDate = base.toISOString().split('T')[0];
      } else if (rescheduleOption === 'next-workout-day') {
        const wList = await dbReadAll('workouts') || [];
        const wPlan = wList.find(w => w.memberId === targetRescheduleLog.memberId);
        const schedule = wPlan?.schedule || {};
        
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        let found = false;
        for (let i = 1; i <= 7; i++) {
          const nextDate = new Date(baseDate);
          nextDate.setDate(nextDate.getDate() + i);
          const nextDayName = daysOfWeek[nextDate.getDay()];
          if (!schedule[nextDayName]?.isRestDay) {
            targetDate = nextDate.toISOString().split('T')[0];
            found = true;
            break;
          }
        }
        if (!found) {
          const nextDay = new Date(baseDate);
          nextDay.setDate(nextDay.getDate() + 1);
          targetDate = nextDay.toISOString().split('T')[0];
        }
      }

      // Update Rescheduled log status
      await dbUpdate('rescheduledWorkouts', targetRescheduleLog.id, {
        status: 'rescheduled',
        rescheduledTo: targetDate,
        note: `Rescheduled to ${targetDate} using dashboard smart shift.`
      });

      // Shift the workout schedule for that member
      const wList = await dbReadAll('workouts') || [];
      const wPlan = wList.find(w => w.memberId === targetRescheduleLog.memberId);
      if (wPlan && wPlan.schedule) {
        const schedule = wPlan.schedule;
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const targetDayName = daysOfWeek[new Date(targetDate).getDay()];
        const missedDayName = daysOfWeek[new Date(baseDate).getDay()];
        
        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        let targetIdx = dayOrder.indexOf(targetDayName);
        let missedIdx = dayOrder.indexOf(missedDayName);

        if (targetIdx !== -1 && missedIdx !== -1) {
          const shifted = { ...schedule };
          const originalValues = dayOrder.map(d => ({ ...schedule[d] }));
          
          const missedWorkout = { ...schedule[missedDayName] };
          shifted[targetDayName] = missedWorkout;
          
          for (let i = targetIdx + 1; i < dayOrder.length; i++) {
            shifted[dayOrder[i]] = originalValues[i - 1];
          }
          shifted[missedDayName] = { isRestDay: true, workoutName: 'Rest Day (Missed)', exercises: [] };

          await dbUpdate('workouts', wPlan.id, { schedule: shifted });
        }
      }

      showToast('success', `Workout rescheduled to ${targetDate} & schedule shifted!`);
      setShowSmartReschedule(false);
      loadDashboardData();
      window.dispatchEvent(new Event('db-change'));
    } catch(err) {
      showToast('error', "Failed to reschedule workout.");
    }
  };

  if (loading) {
    return <div className="card-glass text-center" style={{ padding: '3rem' }}>Loading Gym Owner Dashboard...</div>;
  }

  return (
    <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Today's Focus Action Alerts banner */}
      <div className="card-glass" style={{ padding: '1.25rem', borderRadius: '16px', borderLeft: '5px solid var(--color-primary)', background: 'rgba(139, 92, 246, 0.03)' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Zap size={22} style={{ color: 'var(--color-primary)' }} />
          <div>
            <strong style={{ fontSize: '1rem', color: '#fff', fontFamily: 'var(--font-outfit)' }}>Today's Coaching Focus</strong>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
              {stats.membershipRenewals > 0 
                ? `You have ${stats.membershipRenewals} active members due for renewal this week. Prioritize renewals.`
                : 'All memberships are up to date! Continue active training sessions.'
              }
              {missedWorkouts.length > 0 && ` • You have ${missedWorkouts.length} missed workouts that require rescheduling.`}
            </p>
          </div>
        </div>
      </div>

      {/* 1. Stat cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.2rem' }}>
        
        <div className="card-glass" style={{ padding: '1.25rem', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '12px', top: '12px', opacity: 0.1, color: 'var(--color-primary)' }}><Users size={32} /></div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>ACTIVE MEMBERS</span>
          <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#fff', marginTop: '6px' }}>{stats.activeMembers} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ {stats.totalMembers}</span></h3>
        </div>

        <div className="card-glass" style={{ padding: '1.25rem', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '12px', top: '12px', opacity: 0.1, color: 'var(--color-primary)' }}><Dumbbell size={32} /></div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>PT ENROLMENTS</span>
          <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#fff', marginTop: '6px' }}>{stats.ptMembers} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Clients</span></h3>
        </div>

        <div className="card-glass" style={{ padding: '1.25rem', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '12px', top: '12px', opacity: 0.1, color: 'var(--color-primary)' }}><CheckSquare size={32} /></div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TODAY'S VISIT RATE</span>
          <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#fff', marginTop: '6px' }}>{stats.todayAttendancePct}%</h3>
        </div>

        <div className="card-glass" style={{ padding: '1.25rem', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '12px', top: '12px', opacity: 0.1, color: 'var(--color-primary)' }}><AlertTriangle size={32} /></div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>RENEWALS PENDING</span>
          <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#fff', marginTop: '6px' }}>{stats.membershipRenewals} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Due</span></h3>
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

      {/* 3. Schedules & Reschedules sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* Memberships Expiring Soon */}
        <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'var(--font-outfit)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} style={{ color: '#F59E0B' }} />
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

        {/* Today's Workouts & PT Schedule */}
        <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'var(--font-outfit)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={16} style={{ color: 'var(--color-primary)' }} />
            <span>Today's Workouts & PT Schedule</span>
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '320px', overflowY: 'auto', flex: 1 }}>
            {todaySchedule.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                No personal training slots or active workouts scheduled for today.
              </div>
            ) : (
              todaySchedule.map(item => (
                <div key={item.id} onClick={() => window.location.hash = `#member-profile?id=${item.id}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0.8rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '10px', cursor: 'pointer' }} className="table-row-hover">
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F59E0B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                    {item.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>{item.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Today's Split: <strong style={{ color: 'var(--color-primary)' }}>{item.todaySplit}</strong></div>
                  </div>
                  <span style={{ fontSize: '0.8rem', background: 'rgba(139, 92, 246, 0.15)', color: 'var(--color-primary)', padding: '0.25rem 0.6rem', borderRadius: '20px', fontWeight: 600 }}>
                    {item.time}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Missed Workouts Pending */}
        <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'var(--font-outfit)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ClipboardList size={16} style={{ color: '#EF4444' }} />
            <span>Missed Workouts Pending</span>
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '320px', overflowY: 'auto', flex: 1 }}>
            {missedWorkouts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                No missed workouts currently pending rescheduling.
              </div>
            ) : (
              missedWorkouts.map(log => (
                <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0.8rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#EF4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                    {log.memberName ? log.memberName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'M'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>{log.memberName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Workout: <strong style={{ color: '#EF4444' }}>{log.workoutName}</strong></div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Missed on: {log.date}</div>
                  </div>
                  <button className="btn-primary" onClick={() => handleOpenReschedule(log)} style={{ padding: '0.35rem 0.8rem', fontSize: '0.75rem', borderRadius: '6px', background: '#EF4444' }}>
                    Reschedule
                  </button>
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

      {/* SMART RESCHEDULE MODAL (MOBILE BOTTOM SHEET DETAILED SLIDER OVERLAY) */}
      {showSmartReschedule && (
        <div className="bottom-sheet-overlay">
          <div className="bottom-sheet-card">
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>Reschedule Missed Workout</h3>
              <button className="btn-icon" onClick={() => setShowSmartReschedule(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="responsive-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Rescheduling missed workout for:</span>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-glass)', marginTop: '4px' }}>
                  <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{targetRescheduleLog?.memberName}</strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>Workout: {targetRescheduleLog?.workoutName} | Original date: {targetRescheduleLog?.date}</p>
                </div>
              </div>

              <div className="form-group">
                <label>Choose Rescheduling strategy</label>
                <select value={rescheduleOption} onChange={(e) => setRescheduleOption(e.target.value)}>
                  <option value="tomorrow">Move to Tomorrow (Shift Week)</option>
                  <option value="next-workout-day">Next Available Workout Day (Shift Week)</option>
                  <option value="end-of-week">Move to End of Week (Sunday/Weekend)</option>
                  <option value="custom-date">Pick Custom Date...</option>
                </select>
              </div>

              {rescheduleOption === 'custom-date' && (
                <div className="form-group">
                  <label>Select Target Reschedule Date</label>
                  <input 
                    type="date" 
                    required 
                    value={customRescheduleDate} 
                    onChange={(e) => setCustomRescheduleDate(e.target.value)} 
                  />
                </div>
              )}

              <div style={{ background: 'rgba(139,92,246,0.05)', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(139,92,246,0.15)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600 }}>ℹ️ Smart Shift Strategy</span>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.35' }}>
                  The system will automatically shift subsequent workout splits forward to maintain muscle groups recovery balances and preserve the workout order context.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowSmartReschedule(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: 'var(--color-primary)' }}>Apply Rescheduling</button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
