'use client';

import React, { useState, useEffect } from 'react';
import { dbReadAll, dbUpdate, dbDelete, dbReadOne } from '@/lib/db';
import { calculateBMI } from '@/lib/utils';
import { Search, Dumbbell, Apple, Plus, Minus, AlertTriangle, CheckCircle2, Edit3, Trash2, X } from 'lucide-react';

export default function PTMembersView() {
  const [ptMembers, setPtMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [gymSettings, setGymSettings] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

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
    loadPTMembers();
    loadGymSettings();
    const handleDbChange = () => {
      loadPTMembers();
      loadGymSettings();
    };
    window.addEventListener('db-change', handleDbChange);
    return () => window.removeEventListener('db-change', handleDbChange);
  }, []);

  // Sync BMI on height/weight changes
  useEffect(() => {
    const h = parseFloat(formData.height);
    const w = parseFloat(formData.weight);
    const calculated = calculateBMI(w, h);
    setFormData(prev => ({ ...prev, bmi: calculated.bmi }));
  }, [formData.height, formData.weight]);

  const loadPTMembers = async () => {
    const list = await dbReadAll('members') || [];
    setPtMembers(list.filter(m => m.isPT) || []);
  };

  const loadGymSettings = async () => {
    const s = await dbReadOne('settings', 'settings');
    setGymSettings(s || {});
  };

  const handleIncrement = async (member) => {
    const currentCompleted = Number(member.ptSessionsCompleted || 0);
    const total = Number(member.ptSessionsTotal || 10);
    if (currentCompleted < total) {
      const updated = currentCompleted + 1;
      await dbUpdate('members', member.id, { ptSessionsCompleted: updated });
      loadPTMembers();
      window.dispatchEvent(new Event('db-change'));
    }
  };

  const handleDecrement = async (member) => {
    const currentCompleted = Number(member.ptSessionsCompleted || 0);
    if (currentCompleted > 0) {
      const updated = currentCompleted - 1;
      await dbUpdate('members', member.id, { ptSessionsCompleted: updated });
      loadPTMembers();
      window.dispatchEvent(new Event('db-change'));
    }
  };

  const handleResetCounter = async (id, total) => {
    if (window.confirm("Do you want to renew/reset this client's PT session pack?")) {
      const newTotal = prompt("Enter total sessions for the new pack:", total);
      if (newTotal !== null) {
        await dbUpdate('members', id, { 
          ptSessionsCompleted: 0, 
          ptSessionsTotal: Number(newTotal) || 10 
        });
        loadPTMembers();
        window.dispatchEvent(new Event('db-change'));
      }
    }
  };

  const handleOpenEdit = (m) => {
    setEditingMember(m);
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

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name} from the gym roster?`)) {
      await dbDelete('members', id);
      alert("Member deleted successfully.");
      loadPTMembers();
      window.dispatchEvent(new Event('db-change'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMember) {
        await dbUpdate('members', editingMember.id, formData);
        alert("Member updated successfully!");
        setShowDrawer(false);
        loadPTMembers();
        window.dispatchEvent(new Event('db-change'));
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while saving the member.");
    }
  };

  const filteredPT = ptMembers.filter(m => 
    m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pt-members-view-container">
      {/* Search Header */}
      <div className="view-actions-bar card-glass" style={{ display: 'flex', gap: '1rem', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div className="search-box" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search PT Clients by name or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: 'none', border: 'none', color: '#fff', outline: 'none', width: '100%' }}
          />
        </div>
      </div>

      {/* Roster Cards Grid */}
      <div className="pt-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {filteredPT.length === 0 ? (
          <div className="card-glass text-center" style={{ gridColumn: '1/-1', padding: '3rem', color: 'var(--text-secondary)' }}>
            No Personal Training clients found matching your search.
          </div>
        ) : (
          filteredPT.map(m => {
            const completed = Number(m.ptSessionsCompleted || 0);
            const total = Number(m.ptSessionsTotal || 10);
            const isCompleted = completed >= total;
            const progressPercent = Math.min((completed / total) * 100, 100);

            return (
              <div key={m.id} className="pt-client-card card-glass" style={{ padding: '1.5rem', borderRadius: '12px', position: 'relative' }}>
                
                {/* Header Information */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                  <img src={m.profilePhoto || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&fit=crop'} alt={m.fullName} style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>{m.fullName}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Client ID: {m.id}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button className="btn-icon-action" title="Edit Client" onClick={() => handleOpenEdit(m)}>
                      <Edit3 size={15} />
                    </button>
                    <button className="btn-icon-action delete" title="Delete Client" onClick={() => handleDelete(m.id, m.fullName)}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* PT Schedule Timings & Details */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.8rem', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Schedule Slot:</span>
                    <strong style={{ color: '#fff' }}>{m.ptSchedule || 'Not set'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Monthly PT Fee:</span>
                    <strong style={{ color: 'var(--color-primary)' }}>₹{(Number(m.ptFees) || 0).toLocaleString()}</strong>
                  </div>
                </div>

                {/* Session Counter Sub-feature */}
                <div style={{ marginBottom: '1.2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Sessions Count:</span>
                    <strong style={{ fontSize: '1.1rem', color: isCompleted ? '#FF2A5F' : '#fff' }}>
                      {completed} / {total}
                    </strong>
                  </div>

                  {/* Progress Line Bar */}
                  <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.8rem' }}>
                    <div style={{ width: `${progressPercent}%`, height: '100%', background: isCompleted ? 'var(--color-primary)' : '#10B981', transition: 'width 0.3s ease' }}></div>
                  </div>

                  {/* Controls Row */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button className="btn-icon-action" onClick={() => handleDecrement(m)} disabled={completed === 0}>
                      <Minus size={16} />
                    </button>
                    <button className="btn-icon-action" onClick={() => handleIncrement(m)} disabled={isCompleted}>
                      <Plus size={16} />
                    </button>
                    <button className="btn-text" style={{ marginLeft: 'auto', fontSize: '0.8rem' }} onClick={() => handleResetCounter(m.id, total)}>
                      Renew Pack
                    </button>
                  </div>
                </div>

                {/* Renewal Alert Messages */}
                {isCompleted ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem', background: 'rgba(255, 42, 95, 0.15)', border: '1px solid rgba(255, 42, 95, 0.3)', borderRadius: '6px', color: '#FF477E', fontSize: '0.8rem', marginBottom: '1rem' }}>
                    <AlertTriangle size={16} />
                    <span><strong>Pack Expired!</strong> Please renew membership.</span>
                  </div>
                ) : total - completed <= 2 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '6px', color: '#F59E0B', fontSize: '0.8rem', marginBottom: '1rem' }}>
                    <AlertTriangle size={16} />
                    <span><strong>Only {total - completed} left!</strong> Renew soon.</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '6px', color: '#10B981', fontSize: '0.8rem', marginBottom: '1rem' }}>
                    <CheckCircle2 size={16} />
                    <span>Session schedule active.</span>
                  </div>
                )}

                {/* Quick Profile Nav Links */}
                <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.8rem' }}>
                  <a href={`#member-profile?id=${m.id}#workouts`} className="btn-secondary text-center" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '0.3rem', padding: '0.4rem', fontSize: '0.8rem' }}>
                    <Dumbbell size={14} />
                    <span>Workout</span>
                  </a>
                  <a href={`#member-profile?id=${m.id}#diet`} className="btn-secondary text-center" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '0.3rem', padding: '0.4rem', fontSize: '0.8rem' }}>
                    <Apple size={14} />
                    <span>Diet Plan</span>
                  </a>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Drawer Overlay for Edit Member */}
      {showDrawer && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 2000 }}>
          <div className="drawer card-glass" style={{ display: 'block', width: '100%', maxWidth: '600px', padding: '1.5rem', overflowY: 'auto' }}>
            <div className="drawer-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2>Edit Client Details</h2>
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
                <textarea rows="2" placeholder="Asthma, Knee injury, etc." value={formData.medicalConditions} onChange={(e) => setFormData({ ...formData, medicalConditions: e.target.value })}></textarea>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Trainer Notes</label>
                <textarea rows="2" placeholder="Add specific notes." value={formData.trainerNotes} onChange={(e) => setFormData({ ...formData, trainerNotes: e.target.value })}></textarea>
              </div>

              {/* Personal Training Toggle */}
              <div className="form-group" style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <input 
                  type="checkbox" 
                  id="isPTCheckboxPT"
                  checked={formData.isPT} 
                  onChange={(e) => setFormData({ ...formData, isPT: e.target.checked })} 
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <label htmlFor="isPTCheckboxPT" style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem', color: '#fff', userSelect: 'none' }}>
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
