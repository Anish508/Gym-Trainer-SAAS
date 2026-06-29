'use client';

import React, { useState, useEffect } from 'react';
import { dbReadAll, dbCreate, dbUpdate, dbDelete, dbReadOne } from '@/lib/db';
import { calculateBMI, exportToCSV } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { 
  Plus, 
  Search, 
  FileSpreadsheet, 
  Eye, 
  Edit3, 
  Trash2, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Dumbbell, 
  Calendar, 
  CreditCard,
  Filter,
  UserCheck
} from 'lucide-react';

export default function MembersView() {
  const { showToast } = useToast();
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  
  // Search, Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive, pt, expired
  const [planFilter, setPlanFilter] = useState('all'); // all, Monthly, etc.
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, name, goal
  
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [gymSettings, setGymSettings] = useState(null);

  // Form step state for mobile multi-step form
  const [formStep, setFormStep] = useState(1);

  // Form Fields State
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'Male',
    age: '',
    bloodGroup: '',
    height: '',
    weight: '',
    bmi: '',
    profilePhoto: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&fit=crop',
    mobileNumber: '',
    email: '',
    address: '',
    emergencyContact: '',
    fitnessGoal: 'General Fitness',
    joinDate: new Date().toISOString().split('T')[0],
    membershipPlan: 'Monthly',
    status: 'active',
    medicalConditions: '',
    trainerNotes: '',
    isPT: false,
    ptFees: '',
    ptSchedule: '',
    ptSessionsCompleted: 0,
    ptSessionsTotal: 10
  });

  useEffect(() => {
    loadData();
    loadGymSettings();
    
    // Hash change handler to check for Quick Actions from dashboard
    const handleHashCheck = () => {
      const hash = window.location.hash;
      if (hash.includes('action=add')) {
        handleOpenAdd();
        // Remove parameter from URL to prevent loop
        window.location.hash = '#members';
      }
    };

    handleHashCheck();
    window.addEventListener('hashchange', handleHashCheck);
    window.addEventListener('db-change', loadData);
    
    return () => {
      window.removeEventListener('hashchange', handleHashCheck);
      window.removeEventListener('db-change', loadData);
    };
  }, []);

  const loadData = async () => {
    const mems = await dbReadAll('members') || [];
    const pays = await dbReadAll('payments') || [];
    const atts = await dbReadAll('attendance') || [];
    
    setMembers(mems);
    setPayments(pays);
    setAttendance(atts);
  };

  const loadGymSettings = async () => {
    const s = await dbReadOne('settings', 'settings');
    setGymSettings(s || {});
  };

  // Sync BMI on height/weight changes
  useEffect(() => {
    const h = parseFloat(formData.height);
    const w = parseFloat(formData.weight);
    const calculated = calculateBMI(w, h);
    setFormData(prev => ({ ...prev, bmi: calculated.bmi }));
  }, [formData.height, formData.weight]);

  const handleSearch = (e) => setSearchTerm(e.target.value);
  
  // Calculate expiry status helper
  const getMemberPaymentStatus = (memberId) => {
    const memPayments = payments.filter(p => p.memberId === memberId);
    if (memPayments.length === 0) return 'pending';
    const latestPayment = memPayments.sort((a,b) => new Date(b.dueDate) - new Date(a.dueDate))[0];
    const today = new Date();
    today.setHours(0,0,0,0);
    const dueDate = new Date(latestPayment.dueDate);
    
    if (latestPayment.status === 'overdue' || dueDate < today) {
      return 'overdue';
    }
    return latestPayment.status; // paid or pending
  };

  const getMemberLastCheckIn = (memberId) => {
    const memAtt = attendance
      .filter(a => a.memberId === memberId && (a.status === 'present' || a.status === 'late'))
      .sort((a,b) => new Date(b.date) - new Date(a.date));
    
    if (memAtt.length === 0) return 'Never';
    return `${memAtt[0].date} (${memAtt[0].checkInTime})`;
  };

  // Filtering and Sorting logic
  const filteredMembers = members.filter(m => {
    const matchesSearch = m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'active') {
      matchesStatus = m.status === 'active';
    } else if (statusFilter === 'inactive') {
      matchesStatus = m.status !== 'active';
    } else if (statusFilter === 'pt') {
      matchesStatus = m.isPT;
    } else if (statusFilter === 'expired') {
      matchesStatus = getMemberPaymentStatus(m.id) === 'overdue';
    }

    let matchesPlan = true;
    if (planFilter !== 'all') {
      matchesPlan = m.membershipPlan === planFilter;
    }

    return matchesSearch && matchesStatus && matchesPlan;
  }).sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.joinDate || b.createdAt) - new Date(a.joinDate || a.createdAt);
    } else if (sortBy === 'oldest') {
      return new Date(a.joinDate || a.createdAt) - new Date(b.joinDate || b.createdAt);
    } else if (sortBy === 'name') {
      return a.fullName.localeCompare(b.fullName);
    } else if (sortBy === 'goal') {
      return (a.fitnessGoal || '').localeCompare(b.fitnessGoal || '');
    }
    return 0;
  });

  const handleOpenAdd = () => {
    setEditingMember(null);
    setFormStep(1);
    setFormData({
      fullName: '',
      gender: 'Male',
      age: '',
      bloodGroup: '',
      height: '',
      weight: '',
      bmi: '',
      profilePhoto: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&fit=crop',
      mobileNumber: '',
      email: '',
      address: '',
      emergencyContact: '',
      fitnessGoal: 'General Fitness',
      joinDate: new Date().toISOString().split('T')[0],
      membershipPlan: gymSettings?.socialLinks?.defaultMembershipPlan || 'Monthly',
      status: 'active',
      medicalConditions: '',
      trainerNotes: '',
      isPT: false,
      ptFees: '',
      ptSchedule: '',
      ptSessionsCompleted: 0,
      ptSessionsTotal: Number(gymSettings?.socialLinks?.defaultPtSessionCount) || 10
    });
    setShowDrawer(true);
  };

  const handleOpenEdit = (m) => {
    setEditingMember(m);
    setFormStep(1);
    setFormData({
      ...formData,
      ...m,
      age: m.age || '',
      height: m.height || '',
      weight: m.weight || '',
      ptFees: m.ptFees || '',
      ptSessionsCompleted: m.ptSessionsCompleted || 0,
      ptSessionsTotal: m.ptSessionsTotal || 10
    });
    setShowDrawer(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMember) {
        // Update
        await dbUpdate('members', editingMember.id, formData);
        showToast('success', `Client ${formData.fullName} details updated successfully!`);
      } else {
        // Create
        const id = `KMF${Math.floor(100 + Math.random() * 900)}`;
        await dbCreate('members', { id, ...formData });
        
        // Trigger welcome notification
        const notifId = `NOTIF-${id}-${Math.floor(1000 + Math.random() * 9000)}`;
        await dbCreate('notifications', {
          id: notifId,
          memberId: id,
          title: "Welcome to Keerthan MindFit!",
          message: `Client ${formData.fullName} registration completed successfully.`,
          type: "system",
          date: new Date().toISOString().split('T')[0],
          read: false
        });
        
        showToast('success', `Registered client ${formData.fullName} with ID: ${id}`);
      }
      setShowDrawer(false);
      loadData();
      window.dispatchEvent(new Event('db-change'));
    } catch (err) {
      console.error(err);
      showToast('error', "An error occurred while saving the member details.");
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name} from the gym roster?`)) {
      await dbDelete('members', id);
      showToast('success', `Member ${name} deleted successfully.`);
      loadData();
      window.dispatchEvent(new Event('db-change'));
    }
  };

  const handleExportCSV = () => {
    const exportData = members.map(m => ({
      ID: m.id,
      Name: m.fullName,
      Gender: m.gender,
      Age: m.age,
      Mobile: m.mobileNumber,
      Email: m.email,
      Plan: m.membershipPlan,
      Goal: m.fitnessGoal,
      Status: m.status,
      JoinDate: m.joinDate,
      PT: m.isPT ? 'Yes' : 'No'
    }));
    exportToCSV(exportData, 'Gym_Members_Roster.csv');
    showToast('info', "Gym roster exported to CSV successfully.");
  };

  return (
    <div className="members-view-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. Search & Actions Panel */}
      <div className="view-actions-bar card-glass" style={{ display: 'flex', gap: '1rem', padding: '1.25rem', borderRadius: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        
        {/* Search */}
        <div className="search-box" style={{ flex: '1 1 250px', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search by name, email or client ID..." 
            value={searchTerm}
            onChange={handleSearch}
            style={{ background: 'none', border: 'none', color: '#fff', outline: 'none', width: '100%' }}
          />
        </div>

        {/* Filters and sorting */}
        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', flex: '0 0 auto' }}>
          
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '0.6rem 1rem', borderRadius: '8px', outline: 'none', minHeight: '40px' }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="pt">PT Enrolled</option>
            <option value="expired">Expired Dues</option>
          </select>

          <select 
            value={planFilter} 
            onChange={(e) => setPlanFilter(e.target.value)}
            style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '0.6rem 1rem', borderRadius: '8px', outline: 'none', minHeight: '40px' }}
          >
            <option value="all">All Plans</option>
            {gymSettings?.membershipPlans?.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>

          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '0.6rem 1rem', borderRadius: '8px', outline: 'none', minHeight: '40px' }}
          >
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="name">Sort: Name (A-Z)</option>
            <option value="goal">Sort: Goal</option>
          </select>

        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '0.8rem', width: '100%', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.8rem', marginTop: '0.4rem' }} className="desktop-row-no-border">
          <button className="btn-secondary" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, justifyContent: 'center' }}>
            <FileSpreadsheet size={18} />
            <span>Export CSV</span>
          </button>

          <button className="btn-primary" onClick={handleOpenAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, justifyContent: 'center' }}>
            <Plus size={18} />
            <span>Add Member</span>
          </button>
        </div>

      </div>

      {/* 2. Roster Display: Tables on Desktop, Stacked Cards on Mobile */}
      
      {/* Desktop Roster Grid Table */}
      <div className="table-responsive card-glass desktop-only" style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <table className="table-custom" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '1rem' }}>Client</th>
              <th style={{ padding: '1rem' }}>ID</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Membership Plan</th>
              <th style={{ padding: '1rem' }}>Fitness Goal</th>
              <th style={{ padding: '1rem' }}>Last Check-In</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No members found.</td>
              </tr>
            ) : (
              filteredMembers.map(m => {
                const payStatus = getMemberPaymentStatus(m.id);
                return (
                  <tr key={m.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }} className="table-row-hover">
                    <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <img src={m.profilePhoto || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&fit=crop'} alt={m.fullName} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{m.fullName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{m.email}</div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{m.id}</td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${m.status === 'active' ? 'badge-success' : 'badge-danger'}`} style={{ marginRight: '6px' }}>
                        {m.status.toUpperCase()}
                      </span>
                      {m.isPT && (
                        <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>PT</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 500 }}>{m.membershipPlan}</div>
                      <span className={`badge ${payStatus === 'paid' ? 'badge-success' : payStatus === 'pending' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', textTransform: 'capitalize' }}>
                        {payStatus}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>{m.fitnessGoal}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{getMemberLastCheckIn(m.id)}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <a href={`#member-profile?id=${m.id}`} className="btn-icon-action" title="View Profile">
                          <Eye size={16} />
                        </a>
                        <button className="btn-icon-action" onClick={() => handleOpenEdit(m)} title="Edit Member">
                          <Edit3 size={16} />
                        </button>
                        <button className="btn-icon-action delete" onClick={() => handleDelete(m.id, m.fullName)} title="Delete Member">
                          <Trash2 size={16} />
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

      {/* Mobile Stacked Card List (Shows on mobile only) */}
      <div className="mobile-card-list mobile-only">
        {filteredMembers.length === 0 ? (
          <div className="card-glass text-center" style={{ padding: '2rem', color: 'var(--text-secondary)' }}>No members found.</div>
        ) : (
          filteredMembers.map(m => {
            const payStatus = getMemberPaymentStatus(m.id);
            return (
              <div key={m.id} className="mobile-card">
                
                {/* Header: Photo and Badges */}
                <div className="mobile-card-header">
                  <img src={m.profilePhoto || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&fit=crop'} alt={m.fullName} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>{m.fullName}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {m.id}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                    <span className={`badge ${m.status === 'active' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.65rem' }}>
                      {m.status.toUpperCase()}
                    </span>
                    {m.isPT && (
                      <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>PT</span>
                    )}
                  </div>
                </div>

                {/* Details grid */}
                <div className="mobile-card-body">
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Fitness Goal:</span>
                    <div style={{ fontWeight: 500, color: '#fff', marginTop: '2px' }}>{m.fitnessGoal}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Membership Plan:</span>
                    <div style={{ fontWeight: 500, color: '#fff', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {m.membershipPlan}
                      <span className={`badge ${payStatus === 'paid' ? 'badge-success' : payStatus === 'pending' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem', textTransform: 'capitalize' }}>
                        {payStatus}
                      </span>
                    </div>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Last Check-In:</span>
                    <div style={{ fontWeight: 500, color: '#fff', marginTop: '2px' }}>{getMemberLastCheckIn(m.id)}</div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mobile-card-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', marginTop: '4px' }}>
                  <a href={`#member-profile?id=${m.id}`} className="btn-secondary" style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '0.5rem', minHeight: '36px', fontSize: '0.8rem' }}>
                    <Eye size={14} />
                    <span>Open</span>
                  </a>
                  <button className="btn-secondary" onClick={() => window.location.hash = '#attendance'} style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '0.5rem', minHeight: '36px', fontSize: '0.8rem' }}>
                    <UserCheck size={14} />
                    <span>Check-in</span>
                  </button>
                  <a href={`#member-profile?id=${m.id}#billing`} className="btn-secondary" style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '0.5rem', minHeight: '36px', fontSize: '0.8rem' }}>
                    <CreditCard size={14} />
                    <span>Payment</span>
                  </a>
                  <a href={`#member-profile?id=${m.id}#workouts`} className="btn-secondary" style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '0.5rem', minHeight: '36px', fontSize: '0.8rem' }}>
                    <Dumbbell size={14} />
                    <span>Workout</span>
                  </a>
                  <button className="btn-secondary" onClick={() => handleOpenEdit(m)} style={{ padding: '0.5rem', minHeight: '36px', maxWidth: '36px' }} title="Edit">
                    <Edit3 size={14} />
                  </button>
                  <button className="btn-secondary" onClick={() => handleDelete(m.id, m.fullName)} style={{ padding: '0.5rem', minHeight: '36px', maxWidth: '36px', color: '#FF2A5F' }} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* 3. Drawer Overlay for Add/Edit Member (Multi-step on Mobile) */}
      {showDrawer && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 2000 }}>
          <div className="drawer card-glass" style={{ display: 'block', width: '100%', maxWidth: '600px', padding: '1.5rem', overflowY: 'auto' }}>
            
            <div className="drawer-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{editingMember ? 'Edit Client Details' : 'Register New Client'}</h2>
              <button className="btn-icon" onClick={() => setShowDrawer(false)}><X size={20} /></button>
            </div>

            {/* Form Progress steps indicator on mobile screen size */}
            <div className="form-step-header" style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                <span>{formStep === 1 ? 'Step 1: Personal Information' : formStep === 2 ? 'Step 2: Contact Details' : 'Step 3: Membership split details'}</span>
                <span>Step {formStep} of 3</span>
              </div>
              <div className="form-step-dots" style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} className={`form-step-dot ${formStep === i ? 'active' : ''}`} style={{ flex: 1, height: '4px', background: formStep >= i ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)', borderRadius: '2px', transition: 'all 0.3s' }}></div>
                ))}
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="responsive-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
              
              {/* STEP 1: PERSONAL INFORMATION */}
              {formStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input type="text" required value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
                  </div>
                  <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Gender</label>
                      <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Age</label>
                      <input type="number" min="10" max="100" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Blood Group</label>
                      <select value={formData.bloodGroup} onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}>
                        <option value="">Select Blood Group</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Profile Image URL</label>
                      <input type="text" value={formData.profilePhoto} onChange={(e) => setFormData({ ...formData, profilePhoto: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
                    <div className="form-group">
                      <label>Height (cm)</label>
                      <input type="number" step="0.1" value={formData.height} onChange={(e) => setFormData({ ...formData, height: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Weight (kg)</label>
                      <input type="number" step="0.1" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>BMI (Auto)</label>
                      <input type="text" readOnly placeholder="Auto" value={formData.bmi} style={{ opacity: 0.7, background: 'rgba(255,255,255,0.01)' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: CONTACT DETAILS */}
              {formStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="form-group">
                    <label>Mobile Number *</label>
                    <input type="tel" required value={formData.mobileNumber} onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Home Address</label>
                    <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Emergency Contact (Name & Phone) *</label>
                    <input type="text" required placeholder="John Doe - 9876543210" value={formData.emergencyContact} onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })} />
                  </div>
                </div>
              )}

              {/* STEP 3: MEMBERSHIP & PT SPLITS */}
              {formStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Fitness Goal</label>
                      <select value={formData.fitnessGoal} onChange={(e) => setFormData({ ...formData, fitnessGoal: e.target.value })}>
                        <option value="General Fitness">General Fitness</option>
                        <option value="Muscle Gain">Muscle Gain</option>
                        <option value="Weight Loss">Weight Loss</option>
                        <option value="Strength Training">Strength Training</option>
                        <option value="Endurance">Endurance Training</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Membership Plan *</label>
                      <select value={formData.membershipPlan} onChange={(e) => setFormData({ ...formData, membershipPlan: e.target.value })}>
                        {gymSettings?.membershipPlans?.map(plan => (
                          <option key={plan.id} value={plan.name}>{plan.name} (₹{plan.price})</option>
                        )) || (
                          <>
                            <option value="Monthly">Monthly</option>
                            <option value="Quarterly">Quarterly</option>
                            <option value="Half-Yearly">Half-Yearly</option>
                            <option value="Yearly">Yearly</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Join Date *</label>
                      <input type="date" required value={formData.joinDate} onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Roster Status</label>
                      <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Medical Conditions / Injuries</label>
                    <textarea rows="2" placeholder="e.g. Asthma, Knee pain, High blood pressure" value={formData.medicalConditions} onChange={(e) => setFormData({ ...formData, medicalConditions: e.target.value })}></textarea>
                  </div>

                  <div className="form-group">
                    <label>Trainer Notes</label>
                    <textarea rows="2" placeholder="Diet goals, custom focus notes..." value={formData.trainerNotes} onChange={(e) => setFormData({ ...formData, trainerNotes: e.target.value })}></textarea>
                  </div>

                  {/* Personal Training Option */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.25rem 0' }}>
                    <input 
                      type="checkbox" 
                      id="isPTCheckboxDrawer"
                      checked={formData.isPT} 
                      onChange={(e) => setFormData({ ...formData, isPT: e.target.checked })} 
                      style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                    <label htmlFor="isPTCheckboxDrawer" style={{ cursor: 'pointer', fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>Enrolled in Personal Training (PT)</label>
                  </div>

                  {formData.isPT && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-glass)', padding: '1rem', borderRadius: '8px' }}>
                      <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                          <label>PT Fees (₹) *</label>
                          <input type="number" placeholder="5000" value={formData.ptFees} onChange={(e) => setFormData({ ...formData, ptFees: e.target.value })} />
                        </div>
                        <div className="form-group">
                          <label>PT Schedule (Slot) *</label>
                          <select value={formData.ptSchedule} onChange={(e) => setFormData({ ...formData, ptSchedule: e.target.value })}>
                            <option value="">Choose slot...</option>
                            {gymSettings?.ptSlots?.map(slot => (
                              <option key={slot} value={slot}>{slot}</option>
                            )) || (
                              <option value="06:00 AM - 07:00 AM">06:00 AM - 07:00 AM</option>
                            )}
                          </select>
                        </div>
                      </div>
                      <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                          <label>PT Sessions Completed</label>
                          <input type="number" min="0" value={formData.ptSessionsCompleted} onChange={(e) => setFormData({ ...formData, ptSessionsCompleted: Number(e.target.value) })} />
                        </div>
                        <div className="form-group">
                          <label>PT Sessions Pack Total</label>
                          <input type="number" min="1" value={formData.ptSessionsTotal} onChange={(e) => setFormData({ ...formData, ptSessionsTotal: Number(e.target.value) })} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Form Navigation Controls */}
              <div style={{ display: 'flex', justifyBetween: 'space-between', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
                {formStep > 1 && (
                  <button type="button" className="btn-secondary" onClick={() => setFormStep(formStep - 1)} style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '120px' }}>
                    <ChevronLeft size={16} />
                    <span>Back</span>
                  </button>
                )}
                
                {formStep < 3 ? (
                  <button type="button" className="btn-primary" onClick={() => setFormStep(formStep + 1)} style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '120px', marginLeft: 'auto' }}>
                    <span>Next</span>
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button type="submit" className="btn-primary" style={{ width: '160px', marginLeft: 'auto' }}>
                    <span>Save Client Details</span>
                  </button>
                )}
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
