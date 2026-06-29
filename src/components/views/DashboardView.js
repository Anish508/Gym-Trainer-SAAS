'use client';

import React, { useState, useEffect } from 'react';
import { dbReadAll } from '@/lib/db';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  Users, 
  Dumbbell, 
  Calendar, 
  CreditCard, 
  Clock, 
  PlusCircle, 
  CheckSquare, 
  Bell, 
  Search, 
  ChevronRight, 
  AlertTriangle,
  ClipboardList,
  Activity,
  X
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DashboardView() {
  const [stats, setStats] = useState({
    todayCheckIns: 0,
    activeMembers: 0,
    todayPTSessions: 0,
    pendingPayments: 0,
    monthlyRevenue: 0,
    dueAmount: 0
  });

  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [rescheduledWorkouts, setRescheduledWorkouts] = useState([]);
  const [chartsData, setChartsData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Quick Action Modal states
  const [searchQuery, setSearchQuery] = useState('');
  const [showMemberPicker, setShowMemberPicker] = useState(null); // 'workout' or 'diet'

  // Dynamic schedules & feeds
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [expiringMemberships, setExpiringMemberships] = useState([]);
  const [upcomingRescheduled, setUpcomingRescheduled] = useState([]);

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
      const allRescheduled = await dbReadAll('rescheduledWorkouts') || [];

      setMembers(allMembers);
      setPayments(allPayments);
      setAttendance(allAttendance);
      setRescheduledWorkouts(allRescheduled);

      const todayStr = new Date().toISOString().split('T')[0];

      // 1. Calculate Core Statistics
      const active = allMembers.filter(m => m.status === 'active').length;
      const todayAtt = allAttendance.filter(a => a.date === todayStr && (a.status === 'present' || a.status === 'late')).length;
      const ptSessionsCount = allMembers.filter(m => m.isPT && m.ptSchedule).length;

      // Calculate revenue this month and pending payments
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      let revenue = 0;
      let pendingCount = 0;
      let due = 0;

      allPayments.forEach(p => {
        const pDate = new Date(p.paymentDate);
        if (pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear && p.status === 'paid') {
          revenue += Number(p.amount || 0);
        }
        if (p.status !== 'paid') {
          pendingCount++;
          due += Number(p.amount || 0);
        }
      });

      setStats({
        todayCheckIns: todayAtt,
        activeMembers: active,
        todayPTSessions: ptSessionsCount,
        pendingPayments: pendingCount,
        monthlyRevenue: revenue,
        dueAmount: due
      });

      // 2. Compile Today's Schedule (Chrono-sorted PT Slots)
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
          photo: m.profilePhoto
        }))
        .sort((a, b) => a.timeVal - b.timeVal);
      setTodaySchedule(scheduledList);

      // 3. Compile Recent Activity Feed (Merge attendance check-ins and payments)
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

      // Recent payments (past 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      allPayments
        .filter(p => new Date(p.paymentDate) >= sevenDaysAgo && p.status === 'paid')
        .forEach(p => {
          const mem = allMembers.find(m => m.id === p.memberId);
          if (mem) {
            activities.push({
              time: p.paymentDate,
              timestamp: new Date(p.paymentDate),
              message: `${mem.fullName} payment of ₹${Number(p.amount).toLocaleString()} completed`,
              type: 'payment'
            });
          }
        });

      // Sort activities descending
      activities.sort((a, b) => b.timestamp - a.timestamp);
      setRecentActivities(activities.slice(0, 6));

      // 4. Compile Upcoming Membership Expiry (Next 7 days)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const today = new Date();
      today.setHours(0,0,0,0);

      const expiries = [];
      // Map members to their latest payments
      allMembers.forEach(mem => {
        if (mem.status !== 'active') return;
        const memPayments = allPayments.filter(p => p.memberId === mem.id);
        if (memPayments.length === 0) return;
        
        // Find latest payment record
        const latestPayment = memPayments.sort((a,b) => new Date(b.dueDate) - new Date(a.dueDate))[0];
        const dueDate = new Date(latestPayment.dueDate);
        
        if (dueDate >= today && dueDate <= nextWeek) {
          const diffTime = Math.abs(dueDate - today);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          expiries.push({
            id: mem.id,
            name: mem.fullName,
            photo: mem.profilePhoto,
            plan: mem.membershipPlan,
            dueDate: latestPayment.dueDate,
            daysLeft: diffDays
          });
        }
      });
      setExpiringMemberships(expiries.sort((a,b) => a.daysLeft - b.daysLeft));

      // 5. Compile Upcoming Rescheduled Workouts
      const upcomingRes = allRescheduled
        .filter(r => new Date(r.rescheduledTo) >= today)
        .map(r => {
          const mem = allMembers.find(m => m.id === r.memberId);
          return {
            ...r,
            memberName: mem ? mem.fullName : 'Unknown Member',
            memberPhoto: mem ? mem.profilePhoto : null
          };
        })
        .sort((a,b) => new Date(a.rescheduledTo) - new Date(b.rescheduledTo));
      setUpcomingRescheduled(upcomingRes);

      // 6. Set Chart Data if there's enough data
      if (allMembers.length > 0) {
        const goalCounts = {};
        allMembers.forEach(m => {
          const goal = m.fitnessGoal || 'General Fitness';
          goalCounts[goal] = (goalCounts[goal] || 0) + 1;
        });

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const last6MonthsLabels = [];
        const revenueTrend = [];
        const memberGrowthTrend = [];

        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const mIdx = d.getMonth();
          const year = d.getFullYear();
          last6MonthsLabels.push(`${months[mIdx]} ${year}`);

          const mRev = allPayments
            .filter(p => {
              const pDate = new Date(p.paymentDate);
              return pDate.getMonth() === mIdx && pDate.getFullYear() === year && p.status === 'paid';
            })
            .reduce((sum, p) => sum + Number(p.amount || 0), 0);
          revenueTrend.push(mRev);

          const mCount = allMembers.filter(m => {
            const jDate = new Date(m.joinDate);
            return jDate.getMonth() === mIdx && jDate.getFullYear() === year;
          }).length;
          memberGrowthTrend.push(mCount);
        }

        setChartsData({
          goals: {
            labels: Object.keys(goalCounts),
            datasets: [{
              data: Object.values(goalCounts),
              backgroundColor: ['#6366F1', '#FF2A5F', '#10B981', '#F59E0B', '#8B5CF6'],
              borderWidth: 0
            }]
          },
          revenue: {
            labels: last6MonthsLabels,
            datasets: [{
              label: 'Revenue (₹)',
              data: revenueTrend,
              borderColor: '#6366F1',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              tension: 0.4,
              fill: true
            }]
          },
          growth: {
            labels: last6MonthsLabels,
            datasets: [{
              label: 'New Signups',
              data: memberGrowthTrend,
              backgroundColor: '#FF2A5F',
              borderRadius: 4
            }]
          }
        });
      } else {
        setChartsData(null);
      }
    } catch (e) {
      console.error("Error loading dashboard data", e);
    }
    setLoading(false);
  };

  // Helper helper to convert 12h to 24h for timestamps
  const convertTo24h = (time12h) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
      hours = '00';
    }
    if (modifier === 'PM') {
      hours = parseInt(hours, 10) + 12;
    }
    return `${hours}:${minutes}`;
  };

  const handleQuickActionSelectMember = (member) => {
    const targetTab = showMemberPicker === 'workout' ? '#workouts' : '#diet';
    window.location.hash = `#member-profile?id=${member.id}${targetTab}`;
    setShowMemberPicker(null);
    setSearchQuery('');
  };

  const filteredPickerMembers = members.filter(m => 
    m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ height: '80px', width: '100%', background: 'var(--bg-glass-card)', borderRadius: '12px', animation: 'pulse 1.5s infinite' }}></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ height: '100px', background: 'var(--bg-glass-card)', borderRadius: '12px', animation: 'pulse 1.5s infinite' }}></div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div style={{ height: '250px', background: 'var(--bg-glass-card)', borderRadius: '12px', animation: 'pulse 1.5s infinite' }}></div>
          <div style={{ height: '250px', background: 'var(--bg-glass-card)', borderRadius: '12px', animation: 'pulse 1.5s infinite' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-view-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. Metric Cards Grid */}
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        
        <div className="metric-card card-glass" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid var(--color-primary)' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Today's Check-ins</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '4px' }}>{stats.todayCheckIns}</h3>
          </div>
          <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--color-primary)', padding: '0.6rem', borderRadius: '50%' }}>
            <CheckSquare size={22} />
          </div>
        </div>

        <div className="metric-card card-glass" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid #10B981' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Active Members</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '4px' }}>{stats.activeMembers}</h3>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '0.6rem', borderRadius: '50%' }}>
            <Users size={22} />
          </div>
        </div>

        <div className="metric-card card-glass" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid #F59E0B' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Today's PT Sessions</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '4px' }}>{stats.todayPTSessions}</h3>
          </div>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', padding: '0.6rem', borderRadius: '50%' }}>
            <Dumbbell size={22} />
          </div>
        </div>

        <div className="metric-card card-glass" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid #EF4444' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Pending Payments</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '4px' }}>{stats.pendingPayments}</h3>
          </div>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '0.6rem', borderRadius: '50%' }}>
            <Clock size={22} />
          </div>
        </div>

        <div className="metric-card card-glass" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid #8B5CF6' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Monthly Revenue</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '4px' }}>₹{stats.monthlyRevenue.toLocaleString()}</h3>
          </div>
          <div style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6', padding: '0.6rem', borderRadius: '50%' }}>
            <CreditCard size={22} />
          </div>
        </div>

      </div>

      {/* 2. Quick Actions Row */}
      <div className="card-glass" style={{ padding: '1.25rem', borderRadius: '12px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem', fontFamily: 'var(--font-outfit)' }}>Quick Actions</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.8rem' }}>
          <button className="btn-secondary" onClick={() => window.location.hash = '#members?action=add'} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '1rem', borderRadius: '10px', height: 'auto', minHeight: '80px', width: '100%' }}>
            <PlusCircle size={20} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Add Member</span>
          </button>
          <button className="btn-secondary" onClick={() => window.location.hash = '#attendance'} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '1rem', borderRadius: '10px', height: 'auto', minHeight: '80px', width: '100%' }}>
            <CheckSquare size={20} style={{ color: '#10B981' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Take Attendance</span>
          </button>
          <button className="btn-secondary" onClick={() => setShowMemberPicker('workout')} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '1rem', borderRadius: '10px', height: 'auto', minHeight: '80px', width: '100%' }}>
            <Dumbbell size={20} style={{ color: '#F59E0B' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Assign Workout</span>
          </button>
          <button className="btn-secondary" onClick={() => setShowMemberPicker('diet')} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '1rem', borderRadius: '10px', height: 'auto', minHeight: '80px', width: '100%' }}>
            <ClipboardList size={20} style={{ color: '#8B5CF6' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Assign Diet</span>
          </button>
          <button className="btn-secondary" onClick={() => window.location.hash = '#notifications'} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '1rem', borderRadius: '10px', height: 'auto', minHeight: '80px', width: '100%' }}>
            <Bell size={20} style={{ color: '#EF4444' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Send Notification</span>
          </button>
        </div>
      </div>

      {/* 3. Schedule, Activities, and Expiries Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* Today's Schedule */}
        <div className="card-glass" style={{ padding: '1.25rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'var(--font-outfit)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>Today's PT Schedule</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', flex: 1 }}>
            {todaySchedule.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                No training sessions scheduled for today.
              </div>
            ) : (
              todaySchedule.map(item => (
                <div key={item.id} onClick={() => window.location.hash = `#member-profile?id=${item.id}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '8px', cursor: 'pointer' }}>
                  <img src={item.photo || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&fit=crop'} alt={item.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>{item.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>PT Client</div>
                  </div>
                  <span style={{ fontSize: '0.8rem', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--color-primary)', padding: '0.25rem 0.6rem', borderRadius: '30px', fontWeight: 600 }}>
                    {item.time}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="card-glass" style={{ padding: '1.25rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'var(--font-outfit)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>Recent Activity</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', flex: 1 }}>
            {recentActivities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                No recent activity logged.
              </div>
            ) : (
              recentActivities.map((act, index) => (
                <div key={index} style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px' }}>
                  <div style={{ marginTop: '2px' }}>
                    {act.type === 'attendance' ? <Activity size={14} style={{ color: '#10B981' }} /> : <CreditCard size={14} style={{ color: '#8B5CF6' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#fff', fontWeight: 500 }}>{act.message}</p>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{act.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Membership Expiries & Rescheduled */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Membership Expiry */}
          <div className="card-glass" style={{ padding: '1.25rem', borderRadius: '12px', flex: 1 }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, fontFamily: 'var(--font-outfit)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={15} style={{ color: '#F59E0B' }} />
              <span>Membership Expiries (Next 7 Days)</span>
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '140px', overflowY: 'auto' }}>
              {expiringMemberships.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.5rem', fontStyle: 'italic' }}>No expiries soon.</div>
              ) : (
                expiringMemberships.map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.6rem', background: 'rgba(245, 158, 11, 0.04)', border: '1px solid rgba(245, 158, 11, 0.1)', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{m.name}</span>
                    <span style={{ fontSize: '0.75rem', background: m.daysLeft <= 2 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: m.daysLeft <= 2 ? '#EF4444' : '#F59E0B', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                      {m.daysLeft === 1 ? 'Expires tomorrow' : `Expires in ${m.daysLeft} days`}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Rescheduled Workouts */}
          <div className="card-glass" style={{ padding: '1.25rem', borderRadius: '12px', flex: 1 }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, fontFamily: 'var(--font-outfit)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={15} style={{ color: 'var(--color-primary)' }} />
              <span>Upcoming Rescheduled Workouts</span>
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '140px', overflowY: 'auto' }}>
              {upcomingRescheduled.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.5rem', fontStyle: 'italic' }}>No rescheduled workouts.</div>
              ) : (
                upcomingRescheduled.map(r => (
                  <div key={r.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0.5rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.85rem', color: '#fff' }}>{r.memberName}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>{r.rescheduledTo}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Workout: <strong>{r.workoutName}</strong> {r.note && `(${r.note})`}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* 4. Analytics Section (Swipeable on Mobile) */}
      {chartsData ? (
        <div className="card-glass" style={{ padding: '1.25rem', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'var(--font-outfit)' }}>Gym Analytics</h4>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }} className="mobile-only-label">← Swipe to navigate charts →</span>
          </div>

          {/* Swipe container for charts */}
          <div className="swipe-container">
            
            <div className="swipe-item chart-card" style={{ background: 'none', border: 'none', minWidth: '100%' }}>
              <h5 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Revenue Flow (Past 6 Months)</h5>
              <div style={{ height: '220px', position: 'relative' }}>
                <Line 
                  data={chartsData.revenue} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { 
                      y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'var(--text-secondary)' } },
                      x: { grid: { display: false }, ticks: { color: 'var(--text-secondary)' } }
                    },
                    plugins: { legend: { display: false } }
                  }} 
                />
              </div>
            </div>

            <div className="swipe-item chart-card" style={{ background: 'none', border: 'none', minWidth: '100%' }}>
              <h5 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Client Growth (Signups)</h5>
              <div style={{ height: '220px', position: 'relative' }}>
                <Bar 
                  data={chartsData.growth} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { 
                      y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'var(--text-secondary)' } },
                      x: { grid: { display: false }, ticks: { color: 'var(--text-secondary)' } }
                    },
                    plugins: { legend: { display: false } }
                  }} 
                />
              </div>
            </div>

            <div className="swipe-item chart-card" style={{ background: 'none', border: 'none', minWidth: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h5 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', alignSelf: 'flex-start' }}>Fitness Goals Distribution</h5>
              <div style={{ width: '160px', height: '160px', position: 'relative', marginTop: '10px' }}>
                <Doughnut 
                  data={chartsData.goals} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                      legend: { 
                        position: 'bottom', 
                        labels: { boxWidth: 8, color: 'var(--text-secondary)', font: { size: 9 } } 
                      } 
                    }
                  }} 
                />
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="card-glass text-center" style={{ padding: '3rem 1.5rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <Users size={32} style={{ color: 'var(--text-muted)' }} />
          <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>No Analytics Data Available</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '300px' }}>Register members and record subscription payments to view performance reports.</p>
        </div>
      )}

      {/* QUICK ACTION MEMBER PICKER MODAL */}
      {showMemberPicker && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 2000 }}>
          <div className="modal-card card-glass" style={{ display: 'block', maxWidth: '400px', width: '90%', padding: '1.5rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Assign {showMemberPicker === 'workout' ? 'Workout' : 'Diet'}</h3>
              <button className="btn-icon" onClick={() => { setShowMemberPicker(null); setSearchQuery(''); }}><X size={18} /></button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '0.4rem 0.8rem', marginBottom: '1rem' }}>
              <Search size={16} style={{ color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search member name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ background: 'none', border: 'none', width: '100%', fontSize: '0.85rem', outline: 'none', height: '32px', minHeight: '32px' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
              {filteredPickerMembers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No members found.</div>
              ) : (
                filteredPickerMembers.map(m => (
                  <button 
                    key={m.id} 
                    onClick={() => handleQuickActionSelectMember(m)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '0.6rem', borderRadius: '6px', textAlign: 'left', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)' }}
                    className="table-row-hover"
                  >
                    <img src={m.profilePhoto || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=80&fit=crop'} alt={m.fullName} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{m.fullName}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ID: {m.id}</div>
                    </div>
                    <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
