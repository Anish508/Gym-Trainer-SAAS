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
import { Users, Dumbbell, Calendar, CreditCard, Clock, Activity } from 'lucide-react';

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
    totalMembers: 0,
    activeMembers: 0,
    ptMembers: 0,
    attendanceToday: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    dueAmount: 0
  });

  const [chartsData, setChartsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    window.addEventListener('db-change', loadDashboardData);
    return () => window.removeEventListener('db-change', loadDashboardData);
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const members = await dbReadAll('members') || [];
      const payments = await dbReadAll('payments') || [];
      const attendance = await dbReadAll('attendance') || [];

      // Calculate Stats
      const total = members.length;
      const active = members.filter(m => m.status === 'active').length;
      const pt = members.filter(m => m.isPT).length;

      const todayStr = new Date().toISOString().split('T')[0];
      const todayAtt = attendance.filter(a => a.date === todayStr && (a.status === 'present' || a.status === 'late')).length;

      // Calculate Revenue this month
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      let revenue = 0;
      let pendingCount = 0;
      let due = 0;

      payments.forEach(p => {
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
        totalMembers: total,
        activeMembers: active,
        ptMembers: pt,
        attendanceToday: todayAtt,
        monthlyRevenue: revenue,
        pendingPayments: pendingCount,
        dueAmount: due
      });

      // Prepare Goal Split Doughnut Data
      const goalCounts = {};
      members.forEach(m => {
        const goal = m.fitnessGoal || 'General Fitness';
        goalCounts[goal] = (goalCounts[goal] || 0) + 1;
      });

      // Prepare Revenue Over Time Data (past 6 months)
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

        // Monthly revenue
        const mRev = payments
          .filter(p => {
            const pDate = new Date(p.paymentDate);
            return pDate.getMonth() === mIdx && pDate.getFullYear() === year && p.status === 'paid';
          })
          .reduce((sum, p) => sum + Number(p.amount || 0), 0);
        revenueTrend.push(mRev);

        // Member signups in that month
        const mCount = members.filter(m => {
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
            backgroundColor: ['#FF2A5F', '#6366F1', '#10B981', '#F59E0B', '#8B5CF6'],
            borderWidth: 0
          }]
        },
        revenue: {
          labels: last6MonthsLabels,
          datasets: [{
            label: 'Revenue (₹)',
            data: revenueTrend,
            borderColor: '#FF2A5F',
            backgroundColor: 'rgba(255, 42, 95, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        growth: {
          labels: last6MonthsLabels,
          datasets: [{
            label: 'New Signups',
            data: memberGrowthTrend,
            backgroundColor: '#6366F1',
            borderRadius: 4
          }]
        }
      });
    } catch (e) {
      console.error("Error loading dashboard data", e);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="loading-container"><div className="loader-spinner"></div></div>;
  }

  return (
    <div className="dashboard-view-wrapper">
      {/* Metrics Row */}
      <div className="dashboard-grid">
        <div className="metric-card card-glass info">
          <div className="metric-info">
            <span className="metric-label">Active Clients</span>
            <h3 className="metric-value">
              {stats.activeMembers} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>/ {stats.totalMembers}</span>
            </h3>
          </div>
          <div className="metric-icon-wrapper">
            <Users size={22} />
          </div>
        </div>

        <div className="metric-card card-glass success">
          <div className="metric-info">
            <span className="metric-label">PT Members</span>
            <h3 className="metric-value">{stats.ptMembers}</h3>
          </div>
          <div className="metric-icon-wrapper">
            <Dumbbell size={22} />
          </div>
        </div>

        <div className="metric-card card-glass warning">
          <div className="metric-info">
            <span className="metric-label">Checked In Today</span>
            <h3 className="metric-value">{stats.attendanceToday}</h3>
          </div>
          <div className="metric-icon-wrapper">
            <Calendar size={22} />
          </div>
        </div>

        <div className="metric-card card-glass">
          <div className="metric-info">
            <span className="metric-label">Monthly Revenue</span>
            <h3 className="metric-value">₹{stats.monthlyRevenue.toLocaleString()}</h3>
          </div>
          <div className="metric-icon-wrapper">
            <CreditCard size={22} />
          </div>
        </div>

        <div className="metric-card card-glass danger">
          <div className="metric-info">
            <span className="metric-label">Pending Dues</span>
            <h3 className="metric-value">
              {stats.pendingPayments} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>(₹{stats.dueAmount.toLocaleString()})</span>
            </h3>
          </div>
          <div className="metric-icon-wrapper">
            <Clock size={22} />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      {chartsData && (
        <div className="charts-grid" style={{ marginTop: '1.5rem' }}>
          
          <div className="chart-card card-glass">
            <div className="chart-header">
              <h3>Revenue Flow (Past 6 Months)</h3>
            </div>
            <div className="chart-container">
              <Line 
                data={chartsData.revenue} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: { 
                    y: { 
                      beginAtZero: true,
                      grid: { color: 'rgba(255,255,255,0.05)' },
                      ticks: { color: 'var(--text-secondary)' }
                    },
                    x: {
                      grid: { display: false },
                      ticks: { color: 'var(--text-secondary)' }
                    }
                  },
                  plugins: { 
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: 'var(--bg-secondary)',
                      titleColor: 'var(--text-primary)',
                      bodyColor: 'var(--text-secondary)',
                      borderColor: 'var(--border-glass)',
                      borderWidth: 1,
                      padding: 10,
                      cornerRadius: 8
                    }
                  }
                }} 
              />
            </div>
          </div>

          <div className="chart-card card-glass">
            <div className="chart-header">
              <h3>Client Growth Trend</h3>
            </div>
            <div className="chart-container">
              <Bar 
                data={chartsData.growth} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: { 
                    y: { 
                      beginAtZero: true,
                      grid: { color: 'rgba(255,255,255,0.05)' },
                      ticks: { color: 'var(--text-secondary)' }
                    },
                    x: {
                      grid: { display: false },
                      ticks: { color: 'var(--text-secondary)' }
                    }
                  },
                  plugins: { 
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: 'var(--bg-secondary)',
                      titleColor: 'var(--text-primary)',
                      bodyColor: 'var(--text-secondary)',
                      borderColor: 'var(--border-glass)',
                      borderWidth: 1,
                      padding: 10,
                      cornerRadius: 8
                    }
                  }
                }} 
              />
            </div>
          </div>

          <div className="chart-card card-glass">
            <div className="chart-header">
              <h3>Fitness Goals Distribution</h3>
            </div>
            <div className="chart-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ width: '180px', height: '180px', position: 'relative' }}>
                <Doughnut 
                  data={chartsData.goals} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                      legend: { 
                        position: 'bottom', 
                        labels: { 
                          boxWidth: 12, 
                          color: 'var(--text-secondary)',
                          font: { family: 'Inter', size: 11 }
                        } 
                      } 
                    }
                  }} 
                />
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
