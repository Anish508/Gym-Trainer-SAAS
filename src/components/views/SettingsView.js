'use client';

import React, { useState, useEffect } from 'react';
import { dbReadOne, dbUpdate } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Save, Plus, Trash2, ShieldAlert } from 'lucide-react';

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
    defaultPtSessionCount: 10
  });

  const [loading, setLoading] = useState(true);
  
  // Local states for additions
  const [newPlan, setNewPlan] = useState({ name: '', duration: '', price: '' });
  const [newSlot, setNewSlot] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const stored = await dbReadOne('settings', 'settings') || {};
    
    // Fallback standard plans
    const defaultPlans = [
      { id: "p1", name: "Monthly", duration: 1, price: 2000 },
      { id: "p2", name: "Quarterly", duration: 3, price: 5000 },
      { id: "p3", name: "Half-Yearly", duration: 6, price: 8500 },
      { id: "p4", name: "Yearly", duration: 12, price: 15000 }
    ];

    // Fallback standard slots
    const defaultSlots = [
      "05:00 AM - 06:00 AM",
      "06:00 AM - 07:00 AM",
      "07:00 AM - 08:00 AM",
      "08:00 AM - 09:00 AM",
      "05:00 PM - 06:00 PM",
      "06:00 PM - 07:00 PM",
      "07:00 PM - 08:00 PM",
      "08:00 PM - 09:00 PM"
    ];

    // Read defaults from stored socialLinks JSONB fallback
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
      defaultPtSessionCount: Number(savedDefaults.defaultPtSessionCount) || 10
    });
    setLoading(false);
  };

  const handleChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  // Membership plan helpers
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
    showToast('success', `Plan "${planObj.name}" added to list. Click save to persist.`);
  };

  const handleRemovePlan = (planId) => {
    const targetPlan = formData.membershipPlans.find(p => p.id === planId);
    setFormData(prev => ({
      ...prev,
      membershipPlans: prev.membershipPlans.filter(p => p.id !== planId)
    }));
    if (targetPlan) {
      showToast('info', `Removed "${targetPlan.name}" plan.`);
    }
  };

  // PT slots helpers
  const handleAddSlot = (e) => {
    e.preventDefault();
    if (!newSlot.trim()) return;

    if (formData.ptSlots.includes(newSlot.trim())) {
      showToast('error', "This time slot already exists.");
      return;
    }

    setFormData(prev => ({
      ...prev,
      ptSlots: [...prev.ptSlots, newSlot.trim()]
    }));

    setNewSlot('');
    showToast('success', `Slot "${newSlot.trim()}" added to list.`);
  };

  const handleRemoveSlot = (slotVal) => {
    setFormData(prev => ({
      ...prev,
      ptSlots: prev.ptSlots.filter(s => s !== slotVal)
    }));
    showToast('info', `Removed PT slot: ${slotVal}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (user?.role === 'demo') {
        showToast('error', "Demo accounts are restricted from modifying settings.");
        return;
      }

      // Re-map form fields back into database compatible schema variables
      // Store default plan and defaults count in socialLinks JSONB
      const dbPayload = {
        gymName: formData.gymName,
        logo: formData.logo,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        membershipPlans: formData.membershipPlans,
        ptSlots: formData.ptSlots,
        socialLinks: {
          defaultMembershipPlan: formData.defaultMembershipPlan,
          defaultPtSessionCount: formData.defaultPtSessionCount
        }
      };

      await dbUpdate('settings', 'settings', dbPayload);
      showToast('success', "Gym settings and custom rules saved successfully!");
      window.dispatchEvent(new Event('db-change'));
      loadSettings();
    } catch (err) {
      console.error(err);
      showToast('error', "Failed to save settings configurations.");
    }
  };

  if (loading) {
    return <div className="loading-container"><div className="loader-spinner"></div></div>;
  }

  return (
    <div className="settings-view-container card-glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
        <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Trainer Settings Dashboard</h3>
        {user?.role === 'demo' && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-warning)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
            <ShieldAlert size={14} /> Demo Mode
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="responsive-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Gym Profile Info */}
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-primary)', marginBottom: '0.8rem' }}>Gym Profile Details</div>
          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label>Gym Center Name</label>
              <input type="text" required value={formData.gymName} onChange={(e) => handleChange('gymName', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Logo Image URL</label>
              <input type="text" value={formData.logo} onChange={(e) => handleChange('logo', e.target.value)} />
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

        {/* Dynamic Default configs */}
        <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem' }}>
          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-primary)', marginBottom: '0.8rem' }}>Default Roster Values</div>
          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Default Membership Plan</label>
              <select 
                value={formData.defaultMembershipPlan} 
                onChange={(e) => handleChange('defaultMembershipPlan', e.target.value)}
              >
                {formData.membershipPlans.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Default PT Sessions Pack Count</label>
              <input 
                type="number" 
                min="1" 
                max="100" 
                value={formData.defaultPtSessionCount} 
                onChange={(e) => handleChange('defaultPtSessionCount', Number(e.target.value))} 
              />
            </div>
          </div>
        </div>

        {/* Pricing Packages */}
        <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem' }}>
          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Membership Packages Pricing</div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Manage available membership plans and pricing splits.</span>
          
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
                {formData.membershipPlans.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No plans added.</td>
                  </tr>
                ) : (
                  formData.membershipPlans.map(plan => (
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Add Package Form inline */}
          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.8rem', padding: '1rem', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px dashed var(--border-glass)', alignItems: 'flex-end' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.75rem' }}>Plan Name</label>
              <input type="text" placeholder="e.g. Gold plan" value={newPlan.name} onChange={(e) => handlePlanInputChange('name', e.target.value)} style={{ minHeight: '40px' }} />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.75rem' }}>Duration (Months)</label>
              <input type="number" min="1" placeholder="e.g. 3" value={newPlan.duration} onChange={(e) => handlePlanInputChange('duration', e.target.value)} style={{ minHeight: '40px' }} />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.75rem' }}>Price (₹)</label>
              <input type="number" min="0" placeholder="e.g. 4000" value={newPlan.price} onChange={(e) => handlePlanInputChange('price', e.target.value)} style={{ minHeight: '40px' }} />
            </div>
            <button type="button" className="btn-secondary" onClick={handleAddPlan} style={{ minHeight: '40px', padding: '0 1rem', display: 'flex', gap: '4px', alignItems: 'center' }}>
              <Plus size={16} />
              <span>Add Plan</span>
            </button>
          </div>
        </div>

        {/* PT time Slots */}
        <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem' }}>
          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Personal Training Hours Slots</div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Configure standard schedule slots available for PT clients.</span>
          
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', margin: '0.8rem 0', padding: '0.6rem', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
            {formData.ptSlots.length === 0 ? (
              <span style={{ padding: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No training slots configured.</span>
            ) : (
              formData.ptSlots.map(slot => (
                <span key={slot} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.25)', color: '#fff', padding: '0.3rem 0.75rem', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 500 }}>
                  {slot}
                  <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }} onClick={() => handleRemoveSlot(slot)}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold', lineHeight: 1 }}>×</span>
                  </button>
                </span>
              ))
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.8rem', maxWidth: '400px', marginTop: '0.5rem' }}>
            <input 
              type="text" 
              placeholder="e.g. 10:00 AM - 11:00 AM" 
              value={newSlot} 
              onChange={(e) => setNewSlot(e.target.value)} 
              style={{ flex: 1, padding: '0.5rem 0.8rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff', minHeight: '40px' }}
            />
            <button type="button" className="btn-secondary" onClick={handleAddSlot} style={{ padding: '0 1rem', display: 'flex', alignItems: 'center', gap: '4px', minHeight: '40px' }}>
              <Plus size={16} />
              <span>Add Slot</span>
            </button>
          </div>
        </div>

        {/* Save button */}
        <div style={{ display: 'flex', borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem', marginTop: '1rem' }}>
          <button type="submit" className="btn-primary" style={{ marginLeft: 'auto', padding: '0.7rem 2.5rem' }}>
            <Save size={18} style={{ marginRight: '6px' }} />
            <span>Save Configuration Settings</span>
          </button>
        </div>

      </form>
    </div>
  );
}
