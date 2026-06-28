'use client';

import React, { useState, useEffect } from 'react';
import { dbReadOne, dbUpdate } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import { Save, Plus, Trash2, ShieldAlert } from 'lucide-react';

export default function SettingsView() {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    gymName: '',
    logo: '',
    address: '',
    phone: '',
    email: '',
    membershipPlans: [],
    ptSlots: []
  });

  const [loading, setLoading] = useState(true);
  
  // Local states for new item additions
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

    setFormData({
      gymName: stored.gymName || 'Keerthan MindFit',
      logo: stored.logo || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=80&fit=crop',
      address: stored.address || 'Keerthan MindFit Center, Bengaluru, IN',
      phone: stored.phone || '+91 99887 76655',
      email: stored.email || 'info@keerthanmindfit.com',
      membershipPlans: stored.membershipPlans || defaultPlans,
      ptSlots: stored.ptSlots || defaultSlots
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
  };

  const handleRemovePlan = (planId) => {
    setFormData(prev => ({
      ...prev,
      membershipPlans: prev.membershipPlans.filter(p => p.id !== planId)
    }));
  };

  // PT slots helpers
  const handleAddSlot = (e) => {
    e.preventDefault();
    if (!newSlot.trim()) return;

    if (formData.ptSlots.includes(newSlot.trim())) {
      alert("This time slot already exists.");
      return;
    }

    setFormData(prev => ({
      ...prev,
      ptSlots: [...prev.ptSlots, newSlot.trim()]
    }));

    setNewSlot('');
  };

  const handleRemoveSlot = (slotVal) => {
    setFormData(prev => ({
      ...prev,
      ptSlots: prev.ptSlots.filter(s => s !== slotVal)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (user?.role === 'demo') {
        alert("Action restricted: Demo accounts cannot update gym configurations.");
        return;
      }

      await dbUpdate('settings', 'settings', formData);

      alert("Gym Profile and Custom Plans updated successfully!");
      window.dispatchEvent(new Event('db-change'));
      loadSettings();
    } catch (err) {
      console.error(err);
      alert("Failed to save settings.");
    }
  };

  if (loading) {
    return <div className="loading-container"><div className="loader-spinner"></div></div>;
  }

  return (
    <div className="settings-view-container card-glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.3rem', fontWeight: 600, margin: 0 }}>Gym Owner Control Settings</h3>
        {user?.role === 'demo' && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-warning)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
            <ShieldAlert size={14} /> Read-only Demo Mode
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="responsive-form">
        
        {/* Gym General Profile info */}
        <div className="form-section-title">Gym Profile Info</div>
        <div className="form-grid">
          <div className="form-group">
            <label>Gym Name</label>
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
          <div className="form-group colspan-2">
            <label>Gym Center Address</label>
            <input type="text" value={formData.address} onChange={(e) => handleChange('address', e.target.value)} />
          </div>
        </div>

        {/* Membership Plans custom features */}
        <div className="form-section-title" style={{ marginTop: '2rem' }}>Membership Pricing & Packages</div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Define the packages you offer to gym members. These plans will display in registration and payments menus.
        </p>
        
        <div className="table-responsive" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '0.5rem', marginBottom: '1rem' }}>
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
                  <td colSpan="4" style={{ padding: '1rem', textCenter: 'center', color: 'var(--text-muted)' }}>No pricing packages configured. Add one below.</td>
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

        {/* Add membership plan inline form */}
        <div className="form-grid" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed var(--border-glass)' }}>
          <div className="form-group">
            <label>Plan Name</label>
            <input type="text" placeholder="e.g. Couples Gold" value={newPlan.name} onChange={(e) => handlePlanInputChange('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Duration (Months)</label>
            <input type="number" min="1" max="60" placeholder="e.g. 3" value={newPlan.duration} onChange={(e) => handlePlanInputChange('duration', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Price (₹)</label>
            <input type="number" min="0" placeholder="e.g. 4500" value={newPlan.price} onChange={(e) => handlePlanInputChange('price', e.target.value)} />
          </div>
          <div className="form-group" style={{ justifyContent: 'flex-end', minHeight: '100%' }}>
            <button type="button" className="btn-secondary" style={{ height: '42px', display: 'flex', alignItems: 'center', gap: '0.3rem', width: '100%' }} onClick={handleAddPlan}>
              <Plus size={16} />
              <span>Add Package</span>
            </button>
          </div>
        </div>

        {/* Trainer PT Hours Slots */}
        <div className="form-section-title" style={{ marginTop: '2rem' }}>Personal Training Slots</div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Configure standard training schedule hours available for personal training clients.
        </p>

        {/* Chip list selection */}
        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '1.2rem', padding: '0.5rem', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
          {formData.ptSlots.length === 0 ? (
            <span style={{ padding: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No training slots configured.</span>
          ) : (
            formData.ptSlots.map(slot => (
              <span key={slot} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.25)', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 500 }}>
                {slot}
                <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }} onClick={() => handleRemoveSlot(slot)}>
                  <span style={{ fontSize: '1rem', fontWeight: 'bold', lineHeight: 1 }}>×</span>
                </button>
              </span>
            ))
          )}
        </div>

        {/* Add slot entry inline input */}
        <div style={{ display: 'flex', gap: '0.8rem', maxWidth: '400px' }}>
          <input 
            type="text" 
            placeholder="e.g. 10:00 AM - 11:00 AM" 
            value={newSlot} 
            onChange={(e) => setNewSlot(e.target.value)} 
            style={{ flex: 1, padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}
          />
          <button type="button" className="btn-secondary" style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }} onClick={handleAddSlot}>
            <Plus size={16} />
            <span>Add Slot</span>
          </button>
        </div>

        {/* Actions Button */}
        <div style={{ display: 'flex', marginTop: '2.5rem' }}>
          <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto', padding: '0.7rem 2rem' }}>
            <Save size={18} />
            <span>Save Settings</span>
          </button>
        </div>

      </form>
    </div>
  );
}
