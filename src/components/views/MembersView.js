'use client';

import React, { useState, useEffect } from 'react';
import { dbReadAll, dbCreate, dbUpdate, dbDelete } from '@/lib/db';
import { calculateBMI, exportToCSV } from '@/lib/utils';
import { Plus, Search, FileSpreadsheet, Eye, Edit3, Trash2, X } from 'lucide-react';

export default function MembersView() {
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [gymSettings, setGymSettings] = useState(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'Male',
    age: '',
    bloodGroup: '',
    height: '',
    weight: '',
    bmi: '',
    profilePhoto: '',
    mobileNumber: '',
    email: '',
    address: '',
    emergencyContact: '',
    fitnessGoal: 'Muscle Gain',
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
    loadMembers();
    loadGymSettings();
    const handleDbChange = () => {
      loadMembers();
      loadGymSettings();
    };
    window.addEventListener('db-change', handleDbChange);
    return () => window.removeEventListener('db-change', handleDbChange);
  }, []);

  const loadMembers = async () => {
    const data = await dbReadAll('members');
    setMembers(data || []);
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
  const handleFilterStatus = (e) => setStatusFilter(e.target.value);

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? true : m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenAdd = () => {
    setEditingMember(null);
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
      fitnessGoal: 'Muscle Gain',
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
    setShowDrawer(true);
  };

  const handleOpenEdit = (m) => {
    setEditingMember(m);
    setFormData({
      ...formData,
      ...m,
      // Fallbacks
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
        alert("Member updated successfully!");
      } else {
        // Create
        const id = `KMF${Math.floor(100 + Math.random() * 900)}`;
        await dbCreate('members', { id, ...formData });
        
        // Also trigger an automatic welcome notification
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
        
        alert(`Member registered successfully with ID: ${id}`);
      }
      setShowDrawer(false);
      loadMembers();
      window.dispatchEvent(new Event('db-change'));
    } catch (err) {
      console.error(err);
      alert("An error occurred while saving the member.");
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name} from the gym roster?`)) {
      await dbDelete('members', id);
      alert("Member deleted.");
      loadMembers();
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
  };

  return (
    <div className="members-view-container">
      {/* Search & Actions Bar */}
      <div className="view-actions-bar card-glass" style={{ display: 'flex', gap: '1rem', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-box" style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by name, email or ID..." 
            value={searchTerm}
            onChange={handleSearch}
            style={{ background: 'none', border: 'none', color: '#fff', outline: 'none', width: '100%' }}
          />
        </div>

        <select 
          value={statusFilter} 
          onChange={handleFilterStatus}
          style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '0.6rem 1rem', borderRadius: '8px', outline: 'none' }}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="suspended">Suspended Only</option>
        </select>

        <button className="btn-secondary" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem' }}>
          <FileSpreadsheet size={18} />
          <span>Export CSV</span>
        </button>

        <button className="btn-primary" onClick={handleOpenAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem' }}>
          <Plus size={18} />
          <span>Add Member</span>
        </button>
      </div>

      {/* Roster Table */}
      <div className="table-responsive card-glass" style={{ overflowX: 'auto', borderRadius: '12px' }}>
        <table className="table-custom" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '1rem' }}>Client</th>
              <th style={{ padding: '1rem' }}>ID</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Plan</th>
              <th style={{ padding: '1rem' }}>Goal</th>
              <th style={{ padding: '1rem' }}>PT Status</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No members found.</td>
              </tr>
            ) : (
              filteredMembers.map(m => (
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
                    <span className={`badge ${m.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                      {m.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>{m.membershipPlan}</td>
                  <td style={{ padding: '1rem' }}>{m.fitnessGoal}</td>
                  <td style={{ padding: '1rem' }}>
                    {m.isPT ? (
                      <span style={{ color: 'var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        🏋️ PT Enrolled
                      </span>
                    ) : 'Regular'}
                  </td>
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Drawer Overlay for Add/Edit Member */}
      {showDrawer && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 2000 }}>
          <div className="drawer card-glass" style={{ display: 'block', width: '100%', maxWidth: '600px', padding: '1.5rem', overflowY: 'auto' }}>
            <div className="drawer-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2>{editingMember ? 'Edit Client Details' : 'Register New Client'}</h2>
              <button className="btn-icon" onClick={() => setShowDrawer(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="responsive-form">
              <div className="form-section-title">Personal Information</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input type="text" required value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
                </div>
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
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Height (cm)</label>
                  <input type="number" step="0.1" value={formData.height} onChange={(e) => setFormData({ ...formData, height: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Weight (kg)</label>
                  <input type="number" step="0.1" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>BMI (Auto-calculated)</label>
                  <input type="text" readOnly placeholder="Auto" value={formData.bmi} style={{ opacity: 0.7 }} />
                </div>

              </div>

              <div className="form-section-title" style={{ marginTop: '1.5rem' }}>Contact details</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Mobile Number *</label>
                  <input type="tel" required value={formData.mobileNumber} onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="form-group colspan-2">
                  <label>Home Address</label>
                  <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                </div>
                <div className="form-group colspan-2">
                  <label>Emergency Contact (Name & Phone) *</label>
                  <input type="text" required placeholder="John Doe - 9876543210" value={formData.emergencyContact} onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })} />
                </div>
              </div>

              <div className="form-section-title" style={{ marginTop: '1.5rem' }}>Client Roster Details</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Fitness Goal</label>
                  <select value={formData.fitnessGoal} onChange={(e) => setFormData({ ...formData, fitnessGoal: e.target.value })}>
                    <option value="Muscle Gain">Muscle Gain</option>
                    <option value="Weight Loss">Weight Loss</option>
                    <option value="Strength Training">Strength Training</option>
                    <option value="General Fitness">General Fitness</option>
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
                <div className="form-group">
                  <label>Join Date *</label>
                  <input type="date" required value={formData.joinDate} onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Initial Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Medical Conditions</label>
                <textarea rows="2" placeholder="e.g. Asthma, Knee injury, High blood pressure" value={formData.medicalConditions} onChange={(e) => setFormData({ ...formData, medicalConditions: e.target.value })}></textarea>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Trainer Notes</label>
                <textarea rows="2" placeholder="Add specific preferences or custom coaching details." value={formData.trainerNotes} onChange={(e) => setFormData({ ...formData, trainerNotes: e.target.value })}></textarea>
              </div>

              {/* Personal Training Toggle */}
              <div className="form-group" style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <input 
                  type="checkbox" 
                  id="isPTCheckboxMembers"
                  checked={formData.isPT} 
                  onChange={(e) => setFormData({ ...formData, isPT: e.target.checked })} 
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <label htmlFor="isPTCheckboxMembers" style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem', color: '#fff', userSelect: 'none' }}>
                  Personal Training (PT) Member
                </label>
              </div>

              {formData.isPT && (
                <div className="form-grid" style={{ marginTop: '0.5rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
                  <div className="form-group">
                    <label>PT Fees (₹) *</label>
                    <input type="number" placeholder="e.g. 5000" value={formData.ptFees} onChange={(e) => setFormData({ ...formData, ptFees: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>PT Schedule (Timings) *</label>
                    <select 
                      value={formData.ptSchedule} 
                      onChange={(e) => setFormData({ ...formData, ptSchedule: e.target.value })}
                    >
                      <option value="">Select PT Slot</option>
                      {gymSettings?.ptSlots?.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      )) || (
                        <>
                          <option value="05:00 AM - 06:00 AM">05:00 AM - 06:00 AM</option>
                          <option value="06:00 AM - 07:00 AM">06:00 AM - 07:00 AM</option>
                          <option value="07:00 AM - 08:00 AM">07:00 AM - 08:00 AM</option>
                          <option value="08:00 AM - 09:00 AM">08:00 AM - 09:00 AM</option>
                          <option value="05:00 PM - 06:00 PM">05:00 PM - 06:00 PM</option>
                          <option value="06:00 PM - 07:00 PM">06:00 PM - 07:00 PM</option>
                          <option value="07:00 PM - 08:00 PM">07:00 PM - 08:00 PM</option>
                          <option value="08:00 PM - 09:00 PM">08:00 PM - 09:00 PM</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Completed Sessions</label>
                    <input type="number" min="0" value={formData.ptSessionsCompleted} onChange={(e) => setFormData({ ...formData, ptSessionsCompleted: Number(e.target.value) })} />
                  </div>
                  <div className="form-group">
                    <label>Total Sessions in Pack</label>
                    <input type="number" min="1" value={formData.ptSessionsTotal} onChange={(e) => setFormData({ ...formData, ptSessionsTotal: Number(e.target.value) })} />
                  </div>
                </div>
              )}

              <div className="drawer-actions" style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowDrawer(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
