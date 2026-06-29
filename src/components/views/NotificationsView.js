'use client';

import React, { useState, useEffect } from 'react';
import { dbReadAll, dbCreate, dbDelete } from '@/lib/db';
import { useToast } from '@/context/ToastContext';
import { Send, Users, Bell, Trash2, BookOpen, Clock, X } from 'lucide-react';

export default function NotificationsView() {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Fields State
  const [recipientType, setRecipientType] = useState('All'); // 'All' or 'single'
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [notifType, setNotifType] = useState('system'); // system, workout, diet, fee
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  // Selected Preset Template state
  const [selectedTemplate, setSelectedTemplate] = useState('');

  // Presets Templates definitions
  const TEMPLATE_PRESETS = {
    workout: {
      title: "Workout Session Reminder",
      message: "Hey! Don't forget to check your updated training routine for today. Let's crash the targets!"
    },
    payment: {
      title: "Membership Renewal Notice",
      message: "Friendly reminder: Your membership dues are expiring soon. Please renew your package at the reception counter."
    },
    diet: {
      title: "Nutrition & Diet Checklist",
      message: "Remember to complete your daily meal logs and maintain water intake. Clean nutrition yields best results!"
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('db-change', loadData);
    return () => window.removeEventListener('db-change', loadData);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const allNotifs = await dbReadAll('notifications') || [];
      const allMembers = await dbReadAll('members') || [];
      
      setNotifications(allNotifs.sort((a,b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)));
      setMembers(allMembers.filter(m => m.status === 'active') || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleTemplateChange = (val) => {
    setSelectedTemplate(val);
    if (!val) {
      setTitle('');
      setMessage('');
      return;
    }

    const preset = TEMPLATE_PRESETS[val];
    if (preset) {
      setTitle(preset.title);
      setMessage(preset.message);
      // Automatically map type
      if (val === 'workout') setNotifType('workout');
      else if (val === 'payment') setNotifType('fee');
      else if (val === 'diet') setNotifType('diet');
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (recipientType === 'single' && !selectedMemberId) {
      showToast('error', "Please select a member to send the notification to.");
      return;
    }

    try {
      const id = `NOTIF-${Date.now()}`;
      const newNotif = {
        id,
        memberId: recipientType === 'All' ? 'All' : selectedMemberId,
        title: title.trim(),
        message: message.trim(),
        type: notifType,
        date: new Date().toISOString().split('T')[0],
        read: false
      };

      await dbCreate('notifications', newNotif);
      showToast('success', "Notification sent successfully!");
      
      // Reset compose state
      setTitle('');
      setMessage('');
      setSelectedTemplate('');
      setSelectedMemberId('');
      
      loadData();
      window.dispatchEvent(new Event('db-change'));
    } catch (err) {
      console.error(err);
      showToast('error', "Failed to send notification.");
    }
  };

  const handleDeleteNotif = async (id) => {
    if (window.confirm("Delete this notification log entry?")) {
      await dbDelete('notifications', id);
      showToast('success', "Notification log removed.");
      loadData();
      window.dispatchEvent(new Event('db-change'));
    }
  };

  const getRecipientName = (memberId) => {
    if (memberId === 'All') return 'Broadcast to All';
    const mem = members.find(m => m.id === memberId);
    return mem ? mem.fullName : `Client ID: ${memberId}`;
  };

  if (loading) {
    return <div className="card-glass text-center" style={{ padding: '3rem' }}>Loading Notifications Center...</div>;
  }

  return (
    <div className="notifications-view-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
      
      {/* 1. COMPOSE NOTIFICATION PANEL */}
      <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '12px', height: 'fit-content' }}>
        <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>Compose Announcement</h3>
        
        <form onSubmit={handleSendNotification} className="responsive-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          
          <div className="form-group">
            <label>Recipient Mode</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                type="button" 
                className={recipientType === 'All' ? 'btn-primary' : 'btn-secondary'} 
                onClick={() => setRecipientType('All')}
                style={{ flex: 1, minHeight: '40px' }}
              >
                Broadcast to All
              </button>
              <button 
                type="button" 
                className={recipientType === 'single' ? 'btn-primary' : 'btn-secondary'} 
                onClick={() => setRecipientType('single')}
                style={{ flex: 1, minHeight: '40px' }}
              >
                Send to Member
              </button>
            </div>
          </div>

          {recipientType === 'single' && (
            <div className="form-group">
              <label>Select Member *</label>
              <select 
                required 
                value={selectedMemberId} 
                onChange={(e) => setSelectedMemberId(e.target.value)}
              >
                <option value="">Choose member...</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.fullName} ({m.id})</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Template Presets</label>
            <select 
              value={selectedTemplate} 
              onChange={(e) => handleTemplateChange(e.target.value)}
            >
              <option value="">Apply quick template...</option>
              <option value="workout">Workout Session Reminder</option>
              <option value="payment">Membership Payment Reminder</option>
              <option value="diet">Nutrition Diet Reminder</option>
            </select>
          </div>

          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Title *</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Schedule Update" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                style={{ minHeight: '40px' }}
              />
            </div>
            <div className="form-group">
              <label>Alert Category</label>
              <select value={notifType} onChange={(e) => setNotifType(e.target.value)}>
                <option value="system">System Alert</option>
                <option value="workout">Workout Routine</option>
                <option value="diet">Diet & Meals</option>
                <option value="fee">Billing & Payments</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Message Content *</label>
            <textarea 
              rows="4" 
              required 
              placeholder="Type notification text..." 
              value={message} 
              onChange={(e) => setMessage(e.target.value)}
            ></textarea>
          </div>

          <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', marginTop: '0.5rem' }}>
            <Send size={16} />
            <span>Send Alert Notification</span>
          </button>

        </form>
      </div>

      {/* 2. CHRONOLOGICAL NOTIFICATION LOGS PANEL */}
      <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.25rem', fontWeight: 600, borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>Announcements Log History</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '480px', flex: 1 }}>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
              No notifications sent. Comcompose one on the left!
            </div>
          ) : (
            notifications.map(notif => (
              <div 
                key={notif.id} 
                className="card-glass" 
                style={{ 
                  padding: '1rem', 
                  borderRadius: '10px', 
                  background: 'rgba(255,255,255,0.01)', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '6px',
                  borderLeft: notif.type === 'workout' ? '4px solid #F59E0B' : notif.type === 'diet' ? '4px solid #10B981' : notif.type === 'fee' ? '4px solid #EF4444' : '4px solid #6366F1'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{notif.title}</h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <Clock size={12} />
                      <span>{notif.date}</span>
                    </span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => handleDeleteNotif(notif.id)} 
                    style={{ color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                    className="delete-hover-color"
                    title="Delete Announcement"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>{notif.message}</p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    To: <strong style={{ color: 'var(--color-primary)' }}>{getRecipientName(notif.memberId)}</strong>
                  </span>
                  <span className={`badge ${notif.type === 'workout' ? 'badge-warning' : notif.type === 'diet' ? 'badge-success' : notif.type === 'fee' ? 'badge-danger' : 'badge-info'}`} style={{ fontSize: '0.65rem' }}>
                    {notif.type}
                  </span>
                </div>

              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
