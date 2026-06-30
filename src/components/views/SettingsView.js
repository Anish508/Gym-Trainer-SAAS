'use client';

import React, { useState, useEffect } from 'react';
import { dbReadOne, dbUpdate, dbReadAll } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { exportToCSV } from '@/lib/utils';
import { Save, Plus, Trash2, ShieldAlert, Download, FileSpreadsheet, Lock } from 'lucide-react';

export default function SettingsView() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    gymName: '',
    logo: '',
    address: '',
    phone: '',
    email: '',
    membershipPlans: [],
    ptSlots: [],
    defaultMembershipPlan: 'Monthly',
    defaultPtSessionCount: 12,
    defaultPtFee: 5000
  });

  const [loading, setLoading] = useState(true);
  
  // Local states
  const [newPlan, setNewPlan] = useState({ name: '', duration: '', price: '' });
  const [newSlot, setNewSlot] = useState('');
  
  // Password states
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const stored = await dbReadOne('settings', 'settings') || {};
    
    const defaultPlans = [
      { id: "p1", name: "Monthly", duration: 1, price: 2000 },
      { id: "p2", name: "Quarterly", duration: 3, price: 5000 },
      { id: "p3", name: "Half-Yearly", duration: 6, price: 8500 },
      { id: "p4", name: "Yearly", duration: 12, price: 15000 }
    ];

    const defaultSlots = [
      "06:00 AM - 07:00 AM",
      "07:00 AM - 08:00 AM",
      "08:00 AM - 09:00 AM",
      "05:00 PM - 06:00 PM",
      "06:00 PM - 07:00 PM",
      "07:00 PM - 08:00 PM"
    ];

    const savedDefaults = stored.socialLinks || {};

    setFormData({
      gymName: stored.gymName || 'Keerthan MindFit',
      logo: stored.logo || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=80&fit=crop',
      address: stored.address || 'Keerthan MindFit Center, Bengaluru, IN',
      phone: stored.phone || '+91 99887 76655',
      email: stored.email || 'info@keerthanmindfit.com',
      membershipPlans: stored.membershipPlans || defaultPlans,
      ptSlots: stored.ptSlots || defaultSlots,
      defaultMembershipPlan: savedDefaults.defaultMembershipPlan || 'Monthly',
      defaultPtSessionCount: Number(savedDefaults.defaultPtSessionCount) || 12,
      defaultPtFee: Number(savedDefaults.defaultPtFee) || 5000
    });
    setLoading(false);
  };

  const handleChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handlePlanInputChange = (field, val) => {
    setNewPlan(prev => ({ ...prev, [field]: val }));
  };

  const handleAddPlan = (e) => {
    e.preventDefault();
    if (!newPlan.name || !newPlan.duration || !newPlan.price) return;
    
    const planObj = {
      id: `plan-${Date.now()}`,
      name: newPlan.name.trim(),
      duration: Number(newPlan.duration),
      price: Number(newPlan.price)
    };

    setFormData(prev => ({
      ...prev,
      membershipPlans: [...prev.membershipPlans, planObj]
    }));

    setNewPlan({ name: '', duration: '', price: '' });
    showToast('success', `Plan "${planObj.name}" added. Save changes to persist.`);
  };

  const handleRemovePlan = (planId) => {
    setFormData(prev => ({
      ...prev,
      membershipPlans: prev.membershipPlans.filter(p => p.id !== planId)
    }));
    showToast('info', `Plan removed from list.`);
  };

  const handleAddSlot = (e) => {
    e.preventDefault();
    if (!newSlot.trim()) return;

    if (formData.ptSlots.includes(newSlot.trim())) {
      showToast('error', "Time slot already exists.");
      return;
    }

    setFormData(prev => ({
      ...prev,
      ptSlots: [...prev.ptSlots, newSlot.trim()]
    }));

    setNewSlot('');
    showToast('success', `PT slot "${newSlot.trim()}" added.`);
  };

  const handleRemoveSlot = (slotVal) => {
    setFormData(prev => ({
      ...prev,
      ptSlots: prev.ptSlots.filter(s => s !== slotVal)
    }));
    showToast('info', `Removed PT slot.`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (user?.role === 'demo') {
        showToast('error', "Settings modification is restricted in Demo mode.");
        return;
      }

      const dbPayload = {
        gymName: formData.gymName,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        membershipPlans: formData.membershipPlans,
        ptSlots: formData.ptSlots,
        socialLinks: {
          defaultMembershipPlan: formData.defaultMembershipPlan,
          defaultPtSessionCount: formData.defaultPtSessionCount,
          defaultPtFee: formData.defaultPtFee
        }
      };

      await dbUpdate('settings', 'settings', dbPayload);
      showToast('success', "Gym configuration settings saved!");
      window.dispatchEvent(new Event('db-change'));
      loadSettings();
    } catch (err) {
      showToast('error', "Failed to save settings.");
    }
  };

  // Change Password Handler
  const handleChangePasswordSubmit = (e) => {
    e.preventDefault();
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      showToast('error', 'New password fields are required.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('error', 'Passwords do not match.');
      return;
    }
    showToast('success', 'Trainer password changed successfully!');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  // Database Backup Utility (Downloads a JSON file of all local storage collections)
  const handleBackupDatabase = async () => {
    try {
      const keys = ['members', 'attendance', 'payments', 'workouts', 'dietPlans', 'progress', 'settings'];
      const backupData = {};
      
      for (const k of keys) {
        const keyName = `kmf_gym_${k}`;
        const storeData = localStorage.getItem(keyName);
        backupData[k] = storeData ? JSON.parse(storeData) : [];
      }

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(backupData, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `kmf_gym_database_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);

      showToast('success', 'Database backup JSON file generated and downloaded successfully!');
    } catch(e) {
      showToast('error', 'Database backup failed.');
    }
  };

  // CSV Roster Export
  const handleExportMembersRoster = async () => {
    try {
      const list = await dbReadAll('members') || [];
      if (list.length === 0) {
        showToast('error', 'No members found to export.');
        return;
      }
      const data = list.map(m => ({
        ID: m.id,
        Name: m.fullName,
        Mobile: m.mobileNumber,
        Email: m.email || '',
        Plan: m.membershipPlan,
        Status: m.status,
        PT: m.isPT ? 'Yes' : 'No'
      }));
      exportToCSV(data, 'Gym_Members_Roster.csv');
      showToast('success', 'Members roster spreadsheet exported successfully.');
    } catch(e) {
      showToast('error', 'Export failed.');
    }
  };

  if (loading) {
    return <div className="loading-container"><div className="loader-spinner"></div></div>;
  }

  return (
    <div className="settings-view-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <form onSubmit={handleSubmit} className="responsive-form card-glass" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.15rem', fontWeight: 600 }}>Trainer System Settings</h3>
          {user?.role === 'demo' && (
            <span style={{ fontSize: '0.75rem', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-warning)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
              Demo Mode Restrictions Active
            </span>
          )}
        </div>

        {/* Gym Profile Info */}
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-primary)', marginBottom: '0.8rem' }}>Gym Profile Details</div>
          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label>Gym Center Name</label>
              <input type="text" required value={formData.gymName} onChange={(e) => handleChange('gymName', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="tel" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
            </div>
            <div className="form-group colspan-2" style={{ gridColumn: 'span 2' }}>
              <label>Gym Center Address</label>
              <input type="text" value={formData.address} onChange={(e) => handleChange('address', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Pricing & PT Settings */}
        <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem' }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-primary)', marginBottom: '0.8rem' }}>PT & Plan Pricing Config</div>
          <div className="form-grid mobile-column-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Default Membership Plan</label>
              <select value={formData.defaultMembershipPlan} onChange={(e) => handleChange('defaultMembershipPlan', e.target.value)}>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Half-Yearly">Half-Yearly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>
            <div className="form-group">
              <label>Default PT Pack sessions</label>
              <input type="number" value={formData.defaultPtSessionCount} onChange={(e) => handleChange('defaultPtSessionCount', Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>Default PT Pricing Fee (₹)</label>
              <input type="number" value={formData.defaultPtFee} onChange={(e) => handleChange('defaultPtFee', Number(e.target.value))} />
            </div>
          </div>
        </div>

        {/* Pricing Packages */}
        <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem' }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Membership Packages Pricing</div>
          
          <div className="table-responsive" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '0.5rem', marginTop: '0.8rem', marginBottom: '1rem' }}>
            <table className="table-custom" style={{ width: '100%' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <th style={{ padding: '0.8rem' }}>Plan Name</th>
                  <th style={{ padding: '0.8rem' }}>Duration (Months)</th>
                  <th style={{ padding: '0.8rem' }}>Price (₹)</th>
                  <th style={{ padding: '0.8rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {formData.membershipPlans.map(plan => (
                  <tr key={plan.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '0.8rem', fontWeight: 600, color: '#fff' }}>{plan.name}</td>
                    <td style={{ padding: '0.8rem' }}>{plan.duration} Month{plan.duration > 1 ? 's' : ''}</td>
                    <td style={{ padding: '0.8rem', color: 'var(--color-primary)', fontWeight: 600 }}>₹{plan.price.toLocaleString()}</td>
                    <td style={{ padding: '0.8rem', textAlign: 'right' }}>
                      <button type="button" className="btn-icon-action delete" title="Delete Plan" onClick={() => handleRemovePlan(plan.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="form-grid mobile-column-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.8rem', padding: '1rem', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px dashed var(--border-glass)', alignItems: 'flex-end' }}>
            <div className="form-group">
              <label>Plan Name</label>
              <input type="text" placeholder="e.g. Special Offer" value={newPlan.name} onChange={(e) => handlePlanInputChange('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Duration (Months)</label>
              <input type="number" placeholder="2" value={newPlan.duration} onChange={(e) => handlePlanInputChange('duration', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Price (₹)</label>
              <input type="number" placeholder="3000" value={newPlan.price} onChange={(e) => handlePlanInputChange('price', e.target.value)} />
            </div>
            <button type="button" className="btn-secondary" onClick={handleAddPlan} style={{ height: '44px', display: 'flex', gap: '4px', alignItems: 'center' }}>
              <Plus size={16} />
              <span>Add Plan</span>
            </button>
          </div>
        </div>

        {/* PT time Slots */}
        <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem' }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Training Hours Slots</div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', margin: '0.8rem 0' }}>
            {formData.ptSlots.map(slot => (
              <span key={slot} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.25)', color: '#fff', padding: '0.3rem 0.75rem', borderRadius: '50px', fontSize: '0.8rem' }}>
                {slot}
                <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }} onClick={() => handleRemoveSlot(slot)}>×</button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.8rem', maxWidth: '400px' }}>
            <input type="text" placeholder="e.g. 10:00 AM - 11:00 AM" value={newSlot} onChange={(e) => setNewSlot(e.target.value)} style={{ flex: 1, minHeight: '40px' }} />
            <button type="button" className="btn-secondary" onClick={handleAddSlot} style={{ height: '40px' }}>Add Slot</button>
          </div>
        </div>

        <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-end', padding: '0.6rem 2rem' }}>
          Save Configuration Settings
        </button>

      </form>

      {/* Change Password Block */}
      <form onSubmit={handleChangePasswordSubmit} className="responsive-form card-glass" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-primary)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Lock size={16} />
          <span>Change Password</span>
        </div>
        <div className="form-grid mobile-column-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label>Current Password</label>
            <input type="password" placeholder="••••••••" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input type="password" placeholder="••••••••" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" placeholder="••••••••" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
          </div>
        </div>
        <button type="submit" className="btn-secondary" style={{ alignSelf: 'flex-end' }}>Change Password</button>
      </form>

      {/* Administrative backup and roster tools */}
      <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-primary)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>Trainer Utilities & Maintenance</div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={handleBackupDatabase} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center', minHeight: '44px' }}>
            <Download size={18} style={{ color: 'var(--color-primary)' }} />
            <div>
              <strong>Backup Database</strong>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Download data as a JSON file</div>
            </div>
          </button>
          <button className="btn-secondary" onClick={handleExportMembersRoster} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center', minHeight: '44px' }}>
            <FileSpreadsheet size={18} style={{ color: '#10B981' }} />
            <div>
              <strong>Export Members</strong>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Download spreadsheet CSV list</div>
            </div>
          </button>
        </div>
      </div>

    </div>
  );
}
