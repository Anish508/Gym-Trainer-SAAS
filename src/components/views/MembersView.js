'use client';

import React, { useState, useEffect } from 'react';
import { dbReadAll, dbCreate, dbUpdate, dbReadOne } from '@/lib/db';
import { calculateBMI, exportToCSV } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { 
  Plus, 
  Search, 
  FileSpreadsheet, 
  Eye, 
  Edit3, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Dumbbell, 
  CreditCard,
  Filter,
  UserCheck
} from 'lucide-react';

export default function MembersView() {
  const { showToast } = useToast();
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [gymSettings, setGymSettings] = useState(null);
  
  // Search, Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive, pt, expired, payment-due, expiring-soon
  const [planFilter, setPlanFilter] = useState('all'); 
  const [sortBy, setSortBy] = useState('newest'); 
  
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  // Form step state for multi-step wizard (1 to 4)
  const [formStep, setFormStep] = useState(1);

  // Initial Form Fields State
  const initialFormData = {
    // Step 1: Basic Info
    fullName: '',
    mobileNumber: '',
    email: '',
    dob: '',
    gender: 'Male',
    address: '',
    emergencyContact: '',

    // Step 2: Fitness Details
    height: '',
    weight: '',
    fitnessGoal: 'General Fitness',
    experience: 'Beginner', // Beginner, Intermediate, Advanced
    medicalConditions: '',
    bloodGroup: '',
    trainerNotes: '',
    bmi: '',

    // Step 3: Membership
    membershipPlan: 'Monthly',
    joinDate: new Date().toISOString().split('T')[0],
    membershipStart: new Date().toISOString().split('T')[0],
    renewalDate: '',
    membershipFee: 2000,
    discount: 0,
    amountPaid: 2000,
    pendingAmount: 0,
    paymentMethod: 'Cash', // Cash, UPI, Card

    // Step 4: PT
    isPT: false,
    ptSessionsPerWeek: 3,
    ptFees: 5000,
    ptStartDate: new Date().toISOString().split('T')[0]
  };

  const [formData, setFormData] = useState(initialFormData);

  // Sync draft to localStorage on edit
  useEffect(() => {
    if (showDrawer && !editingMember) {
      localStorage.setItem('kmf_wizard_draft', JSON.stringify(formData));
    }
  }, [formData, showDrawer, editingMember]);

  useEffect(() => {
    loadData();
    loadGymSettings();
    
    const handleHashCheck = () => {
      const hash = window.location.hash;
      if (hash.includes('action=add')) {
        handleOpenAdd();
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

  // Sync BMI and Fee Calculations in Step 3/2
  useEffect(() => {
    const h = parseFloat(formData.height);
    const w = parseFloat(formData.weight);
    const calculated = calculateBMI(w, h);
    
    // Auto calculate renewal date based on joinDate and plan duration
    let months = 1;
    if (formData.membershipPlan === 'Quarterly') months = 3;
    else if (formData.membershipPlan === 'Half-Yearly' || formData.membershipPlan === 'Half Yearly') months = 6;
    else if (formData.membershipPlan === 'Yearly') months = 12;

    const start = new Date(formData.membershipStart || formData.joinDate);
    start.setMonth(start.getMonth() + months);
    const renewalStr = start.toISOString().split('T')[0];

    // Plan pricing lookup
    let planPrice = 2000;
    if (gymSettings?.membershipPlans) {
      const matchPlan = gymSettings.membershipPlans.find(p => p.name === formData.membershipPlan);
      if (matchPlan) planPrice = matchPlan.price;
    } else {
      if (formData.membershipPlan === 'Quarterly') planPrice = 5000;
      else if (formData.membershipPlan === 'Half Yearly' || formData.membershipPlan === 'Half-Yearly') planPrice = 8500;
      else if (formData.membershipPlan === 'Yearly') planPrice = 15000;
    }

    const fee = planPrice;
    const disc = Number(formData.discount || 0);
    const paid = Number(formData.amountPaid || 0);
    const pending = Math.max(0, fee - disc - paid);

    setFormData(prev => ({ 
      ...prev, 
      bmi: calculated.bmi,
      renewalDate: renewalStr,
      membershipFee: fee,
      pendingAmount: pending
    }));
  }, [formData.height, formData.weight, formData.membershipPlan, formData.membershipStart, formData.joinDate, formData.discount, formData.amountPaid, gymSettings]);

  // Expiry / Payment Status check
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
    return latestPayment.status;
  };

  // Attendance metrics check
  const getMemberAttendancePct = (memberId) => {
    const memAtt = attendance.filter(a => a.memberId === memberId);
    if (memAtt.length === 0) return 0;
    const presentCount = memAtt.filter(a => a.status === 'present' || a.status === 'late').length;
    return Math.round((presentCount / memAtt.length) * 100);
  };

  const getMemberRenewalDate = (memberId) => {
    const memPayments = payments.filter(p => p.memberId === memberId);
    if (memPayments.length === 0) return '--';
    const latestPayment = memPayments.sort((a,b) => new Date(b.dueDate) - new Date(a.dueDate))[0];
    return latestPayment.dueDate;
  };

  // Search & Filtering Rules
  const filteredMembers = members.filter(m => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = !term || 
                          (m.fullName && m.fullName.toLowerCase().includes(term)) || 
                          (m.id && m.id.toLowerCase().includes(term)) || 
                          (m.email && m.email.toLowerCase().includes(term)) || 
                          (m.mobileNumber && m.mobileNumber.includes(term));
    
    let matchesStatus = true;
    const payStatus = getMemberPaymentStatus(m.id);
    const renewalDate = getMemberRenewalDate(m.id);
    
    if (statusFilter === 'active') {
      matchesStatus = m.status === 'active';
    } else if (statusFilter === 'inactive') {
      matchesStatus = m.status !== 'active';
    } else if (statusFilter === 'pt') {
      matchesStatus = m.isPT;
    } else if (statusFilter === 'expired' || statusFilter === 'payment-due') {
      matchesStatus = payStatus === 'overdue' || payStatus === 'pending';
    } else if (statusFilter === 'expiring-soon') {
      if (renewalDate !== '--') {
        const today = new Date();
        today.setHours(0,0,0,0);
        const due = new Date(renewalDate);
        const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
        matchesStatus = diffDays >= 0 && diffDays <= 7;
      } else {
        matchesStatus = false;
      }
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
    
    // Check if there is an autosaved draft
    const draft = localStorage.getItem('kmf_wizard_draft');
    if (draft) {
      if (window.confirm("Do you want to load the unfinished member registration draft?")) {
        try {
          setFormData(JSON.parse(draft));
        } catch (e) {
          setFormData(initialFormData);
        }
      } else {
        localStorage.removeItem('kmf_wizard_draft');
        setFormData(initialFormData);
      }
    } else {
      setFormData(initialFormData);
    }
    setShowDrawer(true);
  };

  const handleOpenEdit = (m) => {
    setEditingMember(m);
    setFormStep(1);
    setFormData({
      ...initialFormData,
      ...m
    });
    setShowDrawer(true);
  };

  const validateStep = (step) => {
    if (step === 1) {
      if (!formData.fullName.trim()) {
        showToast('error', "Full Name is required.");
        return false;
      }
      if (!formData.mobileNumber.trim()) {
        showToast('error', "Mobile Number is required.");
        return false;
      }
    }
    if (step === 3) {
      if (!formData.joinDate) {
        showToast('error', "Join Date is required.");
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(formStep)) {
      setFormStep(prev => prev + 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formStep < 4) {
      handleNextStep();
      return;
    }

    if (!validateStep(1)) { setFormStep(1); return; }
    if (!validateStep(3)) { setFormStep(3); return; }

    try {
      if (editingMember) {
        await dbUpdate('members', editingMember.id, formData);
        showToast('success', `Updated member ${formData.fullName} successfully!`);
      } else {
        const id = `KMF${Math.floor(100 + Math.random() * 900)}`;
        await dbCreate('members', { id, ...formData });

        // Record Bookkeeping payment
        const payId = `PAY${Math.floor(1000 + Math.random() * 9000)}`;
        await dbCreate('payments', {
          id: payId,
          memberId: id,
          planType: formData.membershipPlan,
          amount: formData.amountPaid,
          paymentDate: formData.joinDate,
          dueDate: formData.renewalDate,
          status: formData.pendingAmount > 0 ? 'pending' : 'paid',
          transactionId: `${formData.paymentMethod.toUpperCase()}-REG`
        });

        // Clear local storage draft
        localStorage.removeItem('kmf_wizard_draft');
        showToast('success', `Successfully registered member ${formData.fullName} with ID: ${id}`);
      }
      setShowDrawer(false);
      loadData();
      window.dispatchEvent(new Event('db-change'));
    } catch (err) {
      console.error(err);
      showToast('error', "Failed to save member details.");
    }
  };

  const handleExportCSV = () => {
    const exportData = members.map(m => ({
      ID: m.id,
      Name: m.fullName,
      Gender: m.gender,
      Age: m.dob || '',
      Mobile: m.mobileNumber,
      Email: m.email,
      Plan: m.membershipPlan,
      Goal: m.fitnessGoal,
      Status: m.status,
      JoinDate: m.joinDate,
      PT: m.isPT ? 'Yes' : 'No'
    }));
    exportToCSV(exportData, 'Gym_Members_Roster.csv');
    showToast('info', "Gym roster exported successfully.");
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
            placeholder="Search members by name or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: 'none', border: 'none', color: '#fff', outline: 'none', width: '100%' }}
          />
        </div>

        {/* Filters and sorting */}
        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', flex: '1 1 auto', justifyContent: 'flex-end' }} className="filters-container-mobile">
          
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '0.6rem 1rem', borderRadius: '8px', outline: 'none', minHeight: '40px' }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="pt">PT Enrolled</option>
            <option value="payment-due">Payment Due</option>
            <option value="expiring-soon">Expiring Soon</option>
          </select>

          <select 
            value={planFilter} 
            onChange={(e) => setPlanFilter(e.target.value)}
            style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '0.6rem 1rem', borderRadius: '8px', outline: 'none', minHeight: '40px' }}
          >
            <option value="all">All Plans</option>
            {gymSettings?.membershipPlans?.map(p => (
              <option key={p.id} value={p.name}>{p.name}</option>
            )) || (
              <>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Half-Yearly">Half-Yearly</option>
                <option value="Yearly">Yearly</option>
              </>
            )}
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

          <button className="btn-secondary" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minHeight: '40px' }}>
            <FileSpreadsheet size={16} />
            <span>Export</span>
          </button>

          <button className="btn-primary" onClick={handleOpenAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minHeight: '40px' }}>
            <Plus size={16} />
            <span>Register Member</span>
          </button>

        </div>

      </div>

      {/* 2. Desktop Roster Custom Table */}
      <div className="table-responsive card-glass desktop-only" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <table className="table-custom" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '1rem' }}>Name</th>
              <th style={{ padding: '1rem' }}>Member ID</th>
              <th style={{ padding: '1rem' }}>Goal</th>
              <th style={{ padding: '1rem' }}>Plan</th>
              <th style={{ padding: '1rem' }}>Renewal Date</th>
              <th style={{ padding: '1rem' }}>Attendance %</th>
              <th style={{ padding: '1rem' }}>Payment Status</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No members found matching the active filters.</td>
              </tr>
            ) : (
              filteredMembers.map(m => {
                const payStatus = getMemberPaymentStatus(m.id);
                const attPct = getMemberAttendancePct(m.id);
                const renewDate = getMemberRenewalDate(m.id);
                
                return (
                  <tr key={m.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }} className="table-row-hover">
                    <td style={{ padding: '1rem', fontWeight: 600, color: '#fff' }}>{m.fullName}</td>
                    <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{m.id}</td>
                    <td style={{ padding: '1rem' }}>{m.fitnessGoal}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ fontWeight: 500 }}>{m.membershipPlan}</span>
                      {m.isPT && (
                        <span className="badge badge-info" style={{ fontSize: '0.65rem', marginLeft: '6px' }}>PT</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>{renewDate}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '40px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${attPct}%`, height: '100%', background: attPct >= 70 ? 'var(--color-success)' : attPct >= 40 ? 'var(--color-warning)' : 'var(--color-danger)' }}></div>
                        </div>
                        <span>{attPct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${payStatus === 'paid' ? 'badge-success' : payStatus === 'pending' ? 'badge-warning' : 'badge-danger'}`} style={{ textTransform: 'capitalize' }}>
                        {payStatus}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <a href={`#member-profile?id=${m.id}`} className="btn-icon-action" title="View Profile">
                          <Eye size={16} />
                        </a>
                        <button className="btn-icon-action" onClick={() => handleOpenEdit(m)} title="Edit Member">
                          <Edit3 size={16} />
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

      {/* Mobile Stacked Card List (Shows on mobile only instead of tables) */}
      <div className="mobile-card-list mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredMembers.length === 0 ? (
          <div className="card-glass text-center" style={{ padding: '3rem', color: 'var(--text-secondary)' }}>No members found.</div>
        ) : (
          filteredMembers.map(m => {
            const payStatus = getMemberPaymentStatus(m.id);
            const attPct = getMemberAttendancePct(m.id);
            const renewDate = getMemberRenewalDate(m.id);
            
            return (
              <div key={m.id} className="mobile-card card-glass" style={{ padding: '1rem', borderRadius: '14px', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.75rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    {m.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', margin: 0 }}>{m.fullName}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>ID: {m.id}</span>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem', padding: '0.5rem 0', borderTop: '1px solid rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Goal:</span>
                    <div style={{ fontWeight: 500, color: '#fff', marginTop: '2px' }}>{m.fitnessGoal}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Renewal Date:</span>
                    <div style={{ fontWeight: 500, color: '#fff', marginTop: '2px' }}>{renewDate}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Plan:</span>
                    <div style={{ fontWeight: 500, color: '#fff', marginTop: '2px' }}>{m.membershipPlan}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Attendance:</span>
                    <div style={{ fontWeight: 500, color: '#fff', marginTop: '2px' }}>{attPct}%</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '0.75rem' }}>
                  <a href={`#member-profile?id=${m.id}`} className="btn-secondary" style={{ flex: 1, display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', fontSize: '0.8rem' }}>
                    <Eye size={14} />
                    <span>View Profile</span>
                  </a>
                  <button className="btn-secondary" onClick={() => handleOpenEdit(m)} style={{ display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', width: '80px', fontSize: '0.8rem' }}>
                    <Edit3 size={14} />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 3. Drawer Overlay for Add/Edit Member (Multi-step Wizard) */}
      {showDrawer && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 2000 }}>
          <div className="drawer card-glass" style={{ display: 'block', width: '100%', maxWidth: '620px', padding: '1.5rem', overflowY: 'auto' }}>
            
            <div className="drawer-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{editingMember ? 'Edit Member Details' : 'Register Member Wizard'}</h2>
              <button className="btn-icon" onClick={() => setShowDrawer(false)}><X size={20} /></button>
            </div>

            {/* Stepper progress indicator */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' }}>
                <span>
                  {formStep === 1 && 'Step 1: Basic Information'}
                  {formStep === 2 && 'Step 2: Fitness Details'}
                  {formStep === 3 && 'Step 3: Membership Details'}
                  {formStep === 4 && 'Step 4: Personal Training (PT)'}
                </span>
                <span>Step {formStep} of 4</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ flex: 1, height: '4px', background: formStep >= i ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)', borderRadius: '2px', transition: 'all 0.3s' }}></div>
                ))}
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="responsive-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              
              {/* STEP 1: BASIC INFORMATION */}
              {formStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input 
                      type="text" 
                      placeholder="Rahul Kumar" 
                      required 
                      value={formData.fullName} 
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} 
                    />
                  </div>
                  <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Mobile Number *</label>
                      <input 
                        type="tel" 
                        placeholder="+91 99887 76655" 
                        required 
                        value={formData.mobileNumber} 
                        onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })} 
                      />
                    </div>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input 
                        type="email" 
                        placeholder="rahul@example.com" 
                        value={formData.email} 
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                      />
                    </div>
                  </div>
                  <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Date of Birth</label>
                      <input 
                        type="date" 
                        value={formData.dob} 
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })} 
                      />
                    </div>
                    <div className="form-group">
                      <label>Gender</label>
                      <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Home Address</label>
                    <input 
                      type="text" 
                      placeholder="12, Cross Rd, Bengaluru" 
                      value={formData.address} 
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Emergency Contact (Name & Phone) *</label>
                    <input 
                      type="text" 
                      placeholder="Father: Ramesh - +91 90000 11111" 
                      required 
                      value={formData.emergencyContact} 
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })} 
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: FITNESS DETAILS */}
              {formStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Height (cm)</label>
                      <input 
                        type="number" 
                        placeholder="175" 
                        value={formData.height} 
                        onChange={(e) => setFormData({ ...formData, height: e.target.value })} 
                      />
                    </div>
                    <div className="form-group">
                      <label>Weight (kg)</label>
                      <input 
                        type="number" 
                        placeholder="70" 
                        value={formData.weight} 
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })} 
                      />
                    </div>
                    <div className="form-group">
                      <label>BMI (Auto)</label>
                      <input 
                        type="text" 
                        readOnly 
                        value={formData.bmi || '--'} 
                        style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text-secondary)' }} 
                      />
                    </div>
                  </div>
                  <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Fitness Goal</label>
                      <select value={formData.fitnessGoal} onChange={(e) => setFormData({ ...formData, fitnessGoal: e.target.value })}>
                        <option value="Weight Loss">Weight Loss</option>
                        <option value="Muscle Gain">Muscle Gain</option>
                        <option value="General Fitness">General Fitness</option>
                        <option value="Strength Training">Strength</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Experience Level</label>
                      <select value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: e.target.value })}>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Blood Group</label>
                      <select value={formData.bloodGroup} onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}>
                        <option value="">Choose...</option>
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
                      <label>Medical Conditions</label>
                      <input 
                        type="text" 
                        placeholder="None, back injury, asthma, etc." 
                        value={formData.medicalConditions} 
                        onChange={(e) => setFormData({ ...formData, medicalConditions: e.target.value })} 
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Trainer Notes</label>
                    <textarea 
                      rows="3" 
                      placeholder="Additional remarks on strength or workout habits..." 
                      value={formData.trainerNotes} 
                      onChange={(e) => setFormData({ ...formData, trainerNotes: e.target.value })} 
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: MEMBERSHIP & PAYMENT */}
              {formStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Membership Plan</label>
                      <select value={formData.membershipPlan} onChange={(e) => setFormData({ ...formData, membershipPlan: e.target.value })}>
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Half-Yearly">Half Yearly</option>
                        <option value="Yearly">Yearly</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Join Date *</label>
                      <input 
                        type="date" 
                        required 
                        value={formData.joinDate} 
                        onChange={(e) => setFormData({ ...formData, joinDate: e.target.value, membershipStart: e.target.value })} 
                      />
                    </div>
                  </div>
                  <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Membership Start Date</label>
                      <input 
                        type="date" 
                        value={formData.membershipStart} 
                        onChange={(e) => setFormData({ ...formData, membershipStart: e.target.value })} 
                      />
                    </div>
                    <div className="form-group">
                      <label>Renewal Date (Calculated)</label>
                      <input 
                        type="date" 
                        readOnly 
                        value={formData.renewalDate} 
                        style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text-secondary)' }} 
                      />
                    </div>
                  </div>
                  <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Plan Fee (₹)</label>
                      <input 
                        type="number" 
                        readOnly 
                        value={formData.membershipFee} 
                        style={{ background: 'rgba(255,255,255,0.02)' }} 
                      />
                    </div>
                    <div className="form-group">
                      <label>Discount Discount (₹)</label>
                      <input 
                        type="number" 
                        value={formData.discount} 
                        onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })} 
                      />
                    </div>
                    <div className="form-group">
                      <label>Amount Paid (₹)</label>
                      <input 
                        type="number" 
                        value={formData.amountPaid} 
                        onChange={(e) => setFormData({ ...formData, amountPaid: Number(e.target.value) })} 
                      />
                    </div>
                  </div>
                  <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Pending Amount (₹)</label>
                      <input 
                        type="number" 
                        readOnly 
                        value={formData.pendingAmount} 
                        style={{ background: 'rgba(255,255,255,0.02)', color: formData.pendingAmount > 0 ? '#EF4444' : '#10B981' }} 
                      />
                    </div>
                    <div className="form-group">
                      <label>Payment Method</label>
                      <select value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}>
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="Card">Card</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: PERSONAL TRAINING (PT) */}
              {formStep === 4 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', padding: '1rem', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input 
                        type="checkbox" 
                        id="isPTCheck" 
                        checked={formData.isPT} 
                        onChange={(e) => setFormData({ ...formData, isPT: e.target.checked })} 
                        style={{ width: '22px', height: '22px', cursor: 'pointer' }}
                      />
                      <label htmlFor="isPTCheck" style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' }}>
                        Enable Personal Training (PT) for this member
                      </label>
                    </div>
                  </div>

                  {formData.isPT && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.3s ease' }}>
                      <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                          <label>Sessions Per Week *</label>
                          <select value={formData.ptSessionsPerWeek} onChange={(e) => setFormData({ ...formData, ptSessionsPerWeek: Number(e.target.value) })}>
                            <option value="2">2 sessions/week</option>
                            <option value="3">3 sessions/week</option>
                            <option value="4">4 sessions/week</option>
                            <option value="5">5 sessions/week</option>
                            <option value="6">6 sessions/week</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>PT Fee (₹) *</label>
                          <input 
                            type="number" 
                            placeholder="5000" 
                            required={formData.isPT} 
                            value={formData.ptFees} 
                            onChange={(e) => setFormData({ ...formData, ptFees: Number(e.target.value) })} 
                          />
                        </div>
                      </div>
                      <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                          <label>PT Start Date *</label>
                          <input 
                            type="date" 
                            required={formData.isPT} 
                            value={formData.ptStartDate} 
                            onChange={(e) => setFormData({ ...formData, ptStartDate: e.target.value })} 
                          />
                        </div>
                        <div className="form-group">
                          <label>Choose PT Slot</label>
                          <select value={formData.ptSchedule} onChange={(e) => setFormData({ ...formData, ptSchedule: e.target.value })}>
                            <option value="">Select a slot...</option>
                            {gymSettings?.ptSlots?.map(slot => (
                              <option key={slot} value={slot}>{slot}</option>
                            )) || (
                              <>
                                <option value="06:00 AM - 07:00 AM">06:00 AM - 07:00 AM</option>
                                <option value="07:00 AM - 08:00 AM">07:00 AM - 08:00 AM</option>
                                <option value="06:00 PM - 07:00 PM">06:00 PM - 07:00 PM</option>
                              </>
                            )}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Form Actions footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
                {formStep > 1 && (
                  <button type="button" className="btn-secondary" onClick={() => setFormStep(formStep - 1)} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ChevronLeft size={16} />
                    <span>Back</span>
                  </button>
                )}
                
                {formStep < 4 ? (
                  <button type="button" className="btn-primary" onClick={handleNextStep} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Next Step</span>
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button type="submit" className="btn-primary" style={{ marginLeft: 'auto' }}>
                    Finish Registration
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
