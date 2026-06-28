'use client';

import React, { useState, useEffect } from 'react';
import { dbReadOne, dbReadAll, dbCreate, dbUpdate, dbQuery } from '@/lib/db';
import { calculateMacros } from '@/lib/utils';
import { workoutTemplates } from '@/lib/workoutTemplates';
import { QRCodeSVG } from 'qrcode.react';
import { Line } from 'react-chartjs-2';
import { User, Dumbbell, Apple, LineChart, Plus, Check, ChevronLeft, CreditCard } from 'lucide-react';

export default function MemberProfileView({ memberId, onBack }) {
  const [activeTab, setActiveTab] = useState('personal');
  const [member, setMember] = useState(null);
  
  // Data States
  const [workout, setWorkout] = useState(null);
  const [diet, setDiet] = useState(null);
  const [progressLogs, setProgressLogs] = useState([]);
  
  // Form/Input States
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [workoutForm, setWorkoutForm] = useState({
    planName: '',
    difficulty: 'Intermediate',
    schedule: {
      Monday: '', Tuesday: '', Wednesday: '', Thursday: '', Friday: '', Saturday: '', Sunday: ''
    }
  });

  const [dietForm, setDietForm] = useState({
    planName: '',
    targetCalories: 2000,
    targetProtein: 100,
    targetCarbs: 200,
    targetFats: 60,
    waterIntake: 2500,
    meals: { Breakfast: '', Lunch: '', Dinner: '' },
    supplements: ''
  });

  const [newLog, setNewLog] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '', chest: '', waist: '', hips: '', biceps: '', thighs: '', bodyFat: ''
  });

  const [payments, setPayments] = useState([]);
  const [gymSettings, setGymSettings] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    planType: '',
    amount: '',
    status: 'paid',
    transactionId: '',
    dueDate: ''
  });

  useEffect(() => {
    if (memberId) {
      loadProfileData();
    }
  }, [memberId]);

  const loadProfileData = async () => {
    const mem = await dbReadOne('members', memberId);
    if (!mem) return;
    setMember(mem);

    // 1. Fetch Workout Plan
    const wList = await dbReadAll('workouts') || [];
    const wPlan = wList.find(w => w.memberId === memberId);
    if (wPlan) {
      setWorkout(wPlan);
      setWorkoutForm({
        planName: wPlan.planName || '',
        difficulty: wPlan.difficulty || 'Intermediate',
        schedule: { ...wPlan.schedule }
      });
    }

    // 2. Fetch Diet Plan
    const dList = await dbReadAll('dietPlans') || [];
    const dPlan = dList.find(d => d.memberId === memberId);
    if (dPlan) {
      setDiet(dPlan);
      setDietForm({
        planName: dPlan.planName || '',
        targetCalories: dPlan.targetCalories || 2000,
        targetProtein: dPlan.targetProtein || 100,
        targetCarbs: dPlan.targetCarbs || 200,
        targetFats: dPlan.targetFats || 60,
        waterIntake: dPlan.waterIntake || 2500,
        meals: { ...dPlan.meals },
        supplements: dPlan.supplements || ''
      });
    }

    // 3. Fetch Progress Logs
    const pList = await dbReadAll('progress') || [];
    const pLogs = pList.filter(p => p.memberId === memberId) || [];
    setProgressLogs(pLogs.sort((a, b) => new Date(a.date) - new Date(b.date)));

    // 4. Fetch Payments for this member
    const pPayments = await dbReadAll('payments') || [];
    setPayments(pPayments.filter(p => p.memberId === memberId) || []);

    // 5. Fetch Gym settings
    const settingsObj = await dbReadOne('settings', 'settings');
    setGymSettings(settingsObj || {});
  };

  const handlePlanChange = (planName) => {
    const selectedPlanObj = gymSettings?.membershipPlans?.find(p => p.name === planName);
    const price = selectedPlanObj ? selectedPlanObj.price : '';
    const duration = selectedPlanObj ? selectedPlanObj.duration : 1;

    // Calculate due date
    const payDate = new Date(paymentForm.paymentDate);
    payDate.setMonth(payDate.getMonth() + duration);
    const dueDateStr = payDate.toISOString().split('T')[0];

    setPaymentForm(prev => ({
      ...prev,
      planType: planName,
      amount: price,
      dueDate: dueDateStr
    }));
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      const payId = `PAY-${memberId}-${Math.floor(1000 + Math.random() * 9000)}`;
      const paymentData = {
        id: payId,
        memberId,
        planType: paymentForm.planType,
        amount: Number(paymentForm.amount) || 0,
        paymentDate: paymentForm.paymentDate,
        dueDate: paymentForm.dueDate,
        status: paymentForm.status,
        transactionId: paymentForm.transactionId
      };

      await dbCreate('payments', paymentData);

      // Also auto-update the member's current plan and plan active status!
      await dbUpdate('members', memberId, { 
        membershipPlan: paymentForm.planType,
        status: 'active'
      });

      // Show welcome/renewal system notification
      const notifId = `NOTIF-${memberId}-${Math.floor(1000 + Math.random() * 9000)}`;
      await dbCreate('notifications', {
        id: notifId,
        memberId: memberId,
        title: "Payment Logged Successfully",
        message: `Plan ${paymentForm.planType} payment of ₹${paymentForm.amount.toLocaleString()} received.`,
        type: "fee",
        date: new Date().toISOString().split('T')[0],
        read: false
      });

      alert("Payment recorded successfully!");
      setShowPaymentModal(false);
      
      // Reset form
      setPaymentForm({
        paymentDate: new Date().toISOString().split('T')[0],
        planType: '',
        amount: '',
        status: 'paid',
        transactionId: '',
        dueDate: ''
      });

      loadProfileData();
      window.dispatchEvent(new Event('db-change'));
    } catch (err) {
      console.error(err);
      alert("Failed to log payment.");
    }
  };

  // Workout template handler
  const handleApplyTemplate = (templateId) => {
    setSelectedTemplate(templateId);
    const template = workoutTemplates.find(t => t.id === templateId);
    if (template) {
      setWorkoutForm({
        planName: template.name,
        difficulty: template.difficulty,
        schedule: { ...template.schedule }
      });
    }
  };

  const handleSaveWorkout = async (e) => {
    e.preventDefault();
    if (workout) {
      await dbUpdate('workouts', workout.id, workoutForm);
    } else {
      const id = `W-${memberId}`;
      await dbCreate('workouts', { id, memberId, ...workoutForm });
    }
    alert("Workout plan saved successfully!");
    loadProfileData();
  };

  // Auto calculate macros when target calories change
  const handleDietCaloriesChange = (calories) => {
    const c = Number(calories) || 2000;
    const macros = calculateMacros(c, member?.fitnessGoal || 'General Fitness');
    setDietForm(prev => ({
      ...prev,
      targetCalories: c,
      targetProtein: macros.protein,
      targetCarbs: macros.carbs,
      targetFats: macros.fats
    }));
  };

  const handleSaveDiet = async (e) => {
    e.preventDefault();
    if (diet) {
      await dbUpdate('dietPlans', diet.id, dietForm);
    } else {
      const id = `D-${memberId}`;
      await dbCreate('dietPlans', { id, memberId, ...dietForm });
    }
    alert("Nutrition plan saved successfully!");
    loadProfileData();
  };

  const handleAddProgressLog = async (e) => {
    e.preventDefault();
    const id = `PROG-${memberId}-${Math.floor(1000 + Math.random() * 9000)}`;
    const parsedLog = {
      id,
      memberId,
      date: newLog.date,
      weight: parseFloat(newLog.weight) || 0,
      chest: parseFloat(newLog.chest) || 0,
      waist: parseFloat(newLog.waist) || 0,
      hips: parseFloat(newLog.hips) || 0,
      biceps: parseFloat(newLog.biceps) || 0,
      thighs: parseFloat(newLog.thighs) || 0,
      bodyFat: parseFloat(newLog.bodyFat) || 0
    };

    await dbCreate('progress', parsedLog);
    
    // Auto-update member's weight in members table if this is the newest log
    await dbUpdate('members', memberId, { weight: parsedLog.weight });

    alert("Progress log added!");
    setNewLog({
      date: new Date().toISOString().split('T')[0],
      weight: '', chest: '', waist: '', hips: '', biceps: '', thighs: '', bodyFat: ''
    });
    loadProfileData();
    window.dispatchEvent(new Event('db-change'));
  };

  if (!member) {
    return <div className="loading-container"><div className="loader-spinner"></div></div>;
  }

  // Progress chart configuration
  const progressChartData = {
    labels: progressLogs.map(l => l.date),
    datasets: [
      {
        label: 'Weight (kg)',
        data: progressLogs.map(l => l.weight),
        borderColor: '#FF2A5F',
        backgroundColor: 'rgba(255, 42, 95, 0.1)',
        tension: 0.3,
        yAxisID: 'y'
      },
      {
        label: 'Body Fat (%)',
        data: progressLogs.map(l => l.bodyFat),
        borderColor: '#6366F1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.3,
        yAxisID: 'y1'
      }
    ]
  };

  return (
    <div className="member-profile-container">
      {/* Back button */}
      <button className="btn-secondary" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '1rem', padding: '0.5rem 1rem' }}>
        <ChevronLeft size={16} />
        <span>Back to Roster</span>
      </button>

      {/* Profile Header banner */}
      <div className="profile-header card-glass" style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <img src={member.profilePhoto || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&fit=crop'} alt={member.fullName} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-primary)' }} />
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-outfit)' }}>{member.fullName}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Goal: <strong style={{ color: '#fff' }}>{member.fitnessGoal}</strong> | Status: <span className={`badge ${member.status === 'active' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.75rem' }}>{member.status.toUpperCase()}</span></p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="tabs-menu" style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <button className={`tab-link ${activeTab === 'personal' ? 'active' : ''}`} onClick={() => setActiveTab('personal')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.2rem', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', outline: 'none' }}>
          <User size={16} />
          <span>Profile Details</span>
        </button>
        <button className={`tab-link ${activeTab === 'workout' ? 'active' : ''}`} onClick={() => setActiveTab('workout')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.2rem', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', outline: 'none' }}>
          <Dumbbell size={16} />
          <span>Workout Schedule</span>
        </button>
        <button className={`tab-link ${activeTab === 'diet' ? 'active' : ''}`} onClick={() => setActiveTab('diet')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.2rem', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', outline: 'none' }}>
          <Apple size={16} />
          <span>Nutrition Plan</span>
        </button>
        <button className={`tab-link ${activeTab === 'progress' ? 'active' : ''}`} onClick={() => setActiveTab('progress')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.2rem', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', outline: 'none' }}>
          <LineChart size={16} />
          <span>Body Progress</span>
        </button>
        <button className={`tab-link ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => setActiveTab('billing')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.2rem', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', outline: 'none' }}>
          <CreditCard size={16} />
          <span>Billing & Payments</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="tab-panels">
        
        {/* TAB 1: PERSONAL DETAILS & QR */}
        {activeTab === 'personal' && (
          <div className="tab-panel-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
              <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>Member Contact Info</h3>
              <div className="profile-details-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.95rem' }}>
                <div><span style={{ color: 'var(--text-secondary)' }}>Member ID:</span> <strong>{member.id}</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Mobile Number:</span> <strong>{member.mobileNumber}</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Email Address:</span> <strong>{member.email}</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Home Address:</span> <strong>{member.address || '--'}</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Emergency Contact:</span> <strong>{member.emergencyContact}</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Join Date:</span> <strong>{member.joinDate}</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Membership Plan:</span> <strong>{member.membershipPlan}</strong></div>
              </div>
            </div>

            <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
              <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>Fitness & Medical Logs</h3>
              <div className="profile-details-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.95rem', marginBottom: '1rem' }}>
                <div><span style={{ color: 'var(--text-secondary)' }}>Age / Gender:</span> <strong>{member.age || '--'} / {member.gender}</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Height / Weight:</span> <strong>{member.height ? `${member.height} cm` : '--'} / {member.weight ? `${member.weight} kg` : '--'}</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Blood Group:</span> <strong>{member.bloodGroup || '--'}</strong></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Medical Issues:</span> <strong className="text-danger">{member.medicalConditions || 'None reported'}</strong></div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.8rem', borderRadius: '8px', borderLeft: '3px solid var(--color-primary)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Trainer Announcements/Notes:</span>
                <p style={{ fontSize: '0.9rem', marginTop: '0.2rem', fontStyle: 'italic' }}>{member.trainerNotes || 'No notes added.'}</p>
              </div>
            </div>

            {/* Member App Login Check-in QR */}
            <div className="card-glass text-center" style={{ padding: '1.5rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.8rem' }}>
              <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.2rem' }}>Member QR Code</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Use this QR code for swift check-in at the attendance counter.</p>
              <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', display: 'inline-block' }}>
                <QRCodeSVG value={member.id} size={150} level="H" />
              </div>
              <strong style={{ fontSize: '1.1rem', letterSpacing: '2px', fontFamily: 'monospace' }}>{member.id}</strong>
            </div>
          </div>
        )}

        {/* TAB 2: WORKOUT PLANNER */}
        {activeTab === 'workout' && (
          <div className="workout-planner card-glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.3rem', fontWeight: 600 }}>Client Workout Split</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Assign a standard training split or customize Monday-Sunday routines.</p>
              </div>

              {/* Template dropdown */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Template:</label>
                <select 
                  value={selectedTemplate}
                  onChange={(e) => handleApplyTemplate(e.target.value)}
                  style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.5rem', borderRadius: '6px' }}
                >
                  <option value="">Apply template...</option>
                  {workoutTemplates.map(template => (
                    <option key={template.id} value={template.id}>{template.name} ({template.difficulty})</option>
                  ))}
                </select>
              </div>
            </div>

            <form onSubmit={handleSaveWorkout}>
              <div className="form-grid" style={{ marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>Plan Title / Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Muscle Gain Hypertrophy" 
                    value={workoutForm.planName}
                    onChange={(e) => setWorkoutForm({ ...workoutForm, planName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Difficulty</label>
                  <select 
                    value={workoutForm.difficulty}
                    onChange={(e) => setWorkoutForm({ ...workoutForm, difficulty: e.target.value })}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="workout-schedule-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                {Object.keys(workoutForm.schedule).map(day => (
                  <div key={day} className="form-group" style={{ background: 'rgba(255,255,255,0.01)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600 }}>{day}</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Chest + Triceps or Rest" 
                      value={workoutForm.schedule[day]}
                      onChange={(e) => {
                        const updatedSchedule = { ...workoutForm.schedule, [day]: e.target.value };
                        setWorkoutForm({ ...workoutForm, schedule: updatedSchedule });
                      }}
                      style={{ marginTop: '0.3rem' }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.5rem' }}>
                  <Check size={18} />
                  <span>Save Training Split</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: DIET MANAGEMENT */}
        {activeTab === 'diet' && (
          <div className="diet-planner card-glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
            <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.3rem', fontWeight: 600, marginBottom: '0.5rem' }}>Custom Diet Planner</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Configure daily target calories and macronutrient splits. Macros are auto-calculated on calorie edits.</p>
            
            <form onSubmit={handleSaveDiet}>
              <div className="form-grid" style={{ marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>Diet Plan Name</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Lean Bulk Diet" 
                    value={dietForm.planName}
                    onChange={(e) => setDietForm({ ...dietForm, planName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Target Daily Calories (kcal)</label>
                  <input 
                    type="number" 
                    required 
                    value={dietForm.targetCalories}
                    onChange={(e) => handleDietCaloriesChange(e.target.value)}
                  />
                </div>
              </div>

              {/* Macros Breakdown cards */}
              <div className="macros-breakdown-row" style={{ display: 'flex', gap: '1rem', margin: '1rem 0', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '100px', background: 'rgba(255, 42, 95, 0.08)', border: '1px solid rgba(255, 42, 95, 0.2)', padding: '0.8rem', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Protein</div>
                  <strong style={{ fontSize: '1.2rem', color: 'var(--color-primary)' }}>{dietForm.targetProtein}g</strong>
                </div>
                <div style={{ flex: 1, minWidth: '100px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '0.8rem', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Carbohydrates</div>
                  <strong style={{ fontSize: '1.2rem', color: '#6366F1' }}>{dietForm.targetCarbs}g</strong>
                </div>
                <div style={{ flex: 1, minWidth: '100px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.8rem', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Fats</div>
                  <strong style={{ fontSize: '1.2rem', color: '#10B981' }}>{dietForm.targetFats}g</strong>
                </div>
                <div style={{ flex: 1, minWidth: '100px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '0.8rem', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Water Intake</div>
                  <strong style={{ fontSize: '1.2rem', color: '#F59E0B' }}>{dietForm.waterIntake} ml</strong>
                </div>
              </div>

              {/* Meals Inputs */}
              <div className="meals-inputs-column" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                <div className="form-group">
                  <label style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Breakfast Options</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Oatmeal with eggs and milk" 
                    value={dietForm.meals.Breakfast}
                    onChange={(e) => {
                      const updatedMeals = { ...dietForm.meals, Breakfast: e.target.value };
                      setDietForm({ ...dietForm, meals: updatedMeals });
                    }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ color: '#6366F1', fontWeight: 600 }}>Lunch Options</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Chicken breast with rice and steamed broccoli" 
                    value={dietForm.meals.Lunch}
                    onChange={(e) => {
                      const updatedMeals = { ...dietForm.meals, Lunch: e.target.value };
                      setDietForm({ ...dietForm, meals: updatedMeals });
                    }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ color: '#10B981', fontWeight: 600 }}>Dinner Options</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Grilled salmon or fish fillets with avocado salad" 
                    value={dietForm.meals.Dinner}
                    onChange={(e) => {
                      const updatedMeals = { ...dietForm.meals, Dinner: e.target.value };
                      setDietForm({ ...dietForm, meals: updatedMeals });
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>Supplements & Notes</label>
                  <textarea 
                    rows="2" 
                    placeholder="e.g. Creatine 5g, Whey protein 1 scoop post workout" 
                    value={dietForm.supplements}
                    onChange={(e) => setDietForm({ ...dietForm, supplements: e.target.value })}
                  ></textarea>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.5rem' }}>
                  <Check size={18} />
                  <span>Save Nutrition Plan</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: BODY PROGRESS */}
        {activeTab === 'progress' && (
          <div className="body-progress-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* New Log Input Form Card */}
            <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
              <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.2rem', marginBottom: '1rem' }}>Log Progress Entry</h3>
              
              <form onSubmit={handleAddProgressLog}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Log Date</label>
                    <input type="date" required value={newLog.date} onChange={(e) => setNewLog({ ...newLog, date: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Weight (kg) *</label>
                    <input type="number" step="0.1" required value={newLog.weight} onChange={(e) => setNewLog({ ...newLog, weight: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Body Fat %</label>
                    <input type="number" step="0.1" value={newLog.bodyFat} onChange={(e) => setNewLog({ ...newLog, bodyFat: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Chest (cm)</label>
                    <input type="number" step="0.1" value={newLog.chest} onChange={(e) => setNewLog({ ...newLog, chest: e.target.value })} />
                  </div>
                </div>

                <div className="form-grid" style={{ marginTop: '0.5rem' }}>
                  <div className="form-group">
                    <label>Waist (cm)</label>
                    <input type="number" step="0.1" value={newLog.waist} onChange={(e) => setNewLog({ ...newLog, waist: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Hips (cm)</label>
                    <input type="number" step="0.1" value={newLog.hips} onChange={(e) => setNewLog({ ...newLog, hips: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Biceps (cm)</label>
                    <input type="number" step="0.1" value={newLog.biceps} onChange={(e) => setNewLog({ ...newLog, biceps: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Thighs (cm)</label>
                    <input type="number" step="0.1" value={newLog.thighs} onChange={(e) => setNewLog({ ...newLog, thighs: e.target.value })} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.5rem 1.2rem' }}>
                    <Plus size={16} />
                    <span>Save Entry</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Regression Chart Card */}
            {progressLogs.length > 0 && (
              <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '12px', minHeight: '340px' }}>
                <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.2rem', marginBottom: '1rem' }}>Weight & Body Fat Progress</h3>
                <div style={{ height: '240px', position: 'relative' }}>
                  <Line 
                    data={progressChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Weight (kg)' } },
                        y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Fat (%)' } }
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Log History list */}
            <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
              <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.2rem', marginBottom: '1rem' }}>Historical Entries</h3>
              <div className="table-responsive" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                <table className="table-custom" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                      <th style={{ padding: '0.5rem 1rem' }}>Date</th>
                      <th style={{ padding: '0.5rem 1rem' }}>Weight</th>
                      <th style={{ padding: '0.5rem 1rem' }}>Fat %</th>
                      <th style={{ padding: '0.5rem 1rem' }}>Chest</th>
                      <th style={{ padding: '0.5rem 1rem' }}>Waist</th>
                      <th style={{ padding: '0.5rem 1rem' }}>Biceps</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progressLogs.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No entries logged yet.</td>
                      </tr>
                    ) : (
                      [...progressLogs].reverse().map(log => (
                        <tr key={log.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '0.5rem 1rem', fontFamily: 'monospace' }}>{log.date}</td>
                          <td style={{ padding: '0.5rem 1rem' }}>{log.weight} kg</td>
                          <td style={{ padding: '0.5rem 1rem' }}>{log.bodyFat ? `${log.bodyFat} %` : '--'}</td>
                          <td style={{ padding: '0.5rem 1rem' }}>{log.chest ? `${log.chest} cm` : '--'}</td>
                          <td style={{ padding: '0.5rem 1rem' }}>{log.waist ? `${log.waist} cm` : '--'}</td>
                          <td style={{ padding: '0.5rem 1rem' }}>{log.biceps ? `${log.biceps} cm` : '--'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: BILLING & PAYMENTS */}
        {activeTab === 'billing' && (
          <div className="billing-payments-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.3rem', fontWeight: 600 }}>Billing History</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Log payments, view active plans, and track dues for {member.fullName}.</p>
                </div>
                <button className="btn-primary" onClick={() => setShowPaymentModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.5rem 1.2rem' }}>
                  <Plus size={16} />
                  <span>Record Payment</span>
                </button>
              </div>

              {/* Payments History table */}
              <div className="table-responsive">
                <table className="table-custom" style={{ width: '100%' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                      <th style={{ padding: '0.8rem' }}>Payment Date</th>
                      <th style={{ padding: '0.8rem' }}>Plan Type</th>
                      <th style={{ padding: '0.8rem' }}>Amount</th>
                      <th style={{ padding: '0.8rem' }}>Due Date</th>
                      <th style={{ padding: '0.8rem' }}>Status</th>
                      <th style={{ padding: '0.8rem' }}>Transaction ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No payments logged.</td>
                      </tr>
                    ) : (
                      [...payments].reverse().map(pay => (
                        <tr key={pay.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '0.8rem', fontFamily: 'monospace' }}>{pay.paymentDate}</td>
                          <td style={{ padding: '0.8rem', fontWeight: 600, color: '#fff' }}>{pay.planType}</td>
                          <td style={{ padding: '0.8rem', color: 'var(--color-primary)', fontWeight: 600 }}>₹{pay.amount.toLocaleString()}</td>
                          <td style={{ padding: '0.8rem', fontFamily: 'monospace' }}>{pay.dueDate}</td>
                          <td style={{ padding: '0.8rem' }}>
                            <span className={`badge ${pay.status === 'paid' ? 'badge-success' : pay.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                              {pay.status.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '0.8rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>{pay.transactionId || '--'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Record Payment Dialog Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 2000 }}>
          <div className="modal-card card-glass" style={{ display: 'block', maxWidth: '500px', width: '90%', padding: '1.5rem', borderRadius: '12px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fff' }}>Record Client Fee Payment</h2>
              <button className="btn-icon" onClick={() => setShowPaymentModal(false)}><span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>×</span></button>
            </div>
            
            <form onSubmit={handleRecordPayment} className="responsive-form">
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Select Membership Plan *</label>
                <select 
                  required
                  value={paymentForm.planType} 
                  onChange={(e) => handlePlanChange(e.target.value)}
                >
                  <option value="">Choose plan...</option>
                  {gymSettings?.membershipPlans?.map(plan => (
                    <option key={plan.id} value={plan.name}>{plan.name} (₹{plan.price} / {plan.duration} Month{plan.duration > 1 ? 's' : ''})</option>
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

              <div className="form-grid" style={{ marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>Amount Received (₹) *</label>
                  <input 
                    type="number" 
                    required 
                    placeholder="2000"
                    value={paymentForm.amount} 
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Payment Date *</label>
                  <input 
                    type="date" 
                    required 
                    value={paymentForm.paymentDate} 
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-grid" style={{ marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>Next Expiry Due Date *</label>
                  <input 
                    type="date" 
                    required 
                    value={paymentForm.dueDate} 
                    onChange={(e) => setPaymentForm({ ...paymentForm, dueDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Payment Status</label>
                  <select 
                    value={paymentForm.status} 
                    onChange={(e) => setPaymentForm({ ...paymentForm, status: e.target.value })}
                  >
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Transaction ID / Reference (UPI/Cash/Card)</label>
                <input 
                  type="text" 
                  placeholder="UPI-12345678 or CASH"
                  value={paymentForm.transactionId} 
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
