'use client';

import React, { useState, useEffect } from 'react';
import { dbReadOne, dbReadAll, dbCreate, dbUpdate } from '@/lib/db';
import { calculateMacros } from '@/lib/utils';
import { workoutTemplates } from '@/lib/workoutTemplates';
import { QRCodeSVG } from 'qrcode.react';
import { Line } from 'react-chartjs-2';
import { useToast } from '@/context/ToastContext';
import { 
  User, 
  Dumbbell, 
  Apple, 
  LineChart, 
  Plus, 
  Check, 
  ChevronLeft, 
  CreditCard,
  Trash2,
  Copy,
  Clipboard,
  Calendar,
  Activity,
  Award,
  TrendingUp,
  Droplet
} from 'lucide-react';

export default function MemberProfileView({ memberId, onBack }) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [member, setMember] = useState(null);
  
  // Data States
  const [workout, setWorkout] = useState(null);
  const [diet, setDiet] = useState(null);
  const [progressLogs, setProgressLogs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [gymSettings, setGymSettings] = useState(null);
  
  // Form/Input States
  const [selectedTemplate, setSelectedTemplate] = useState('');
  
  // Workout split state - holds parsed object per day
  const [workoutSchedule, setWorkoutSchedule] = useState({
    Monday: { name: '', muscleGroup: '', notes: '', isRestDay: false },
    Tuesday: { name: '', muscleGroup: '', notes: '', isRestDay: false },
    Wednesday: { name: '', muscleGroup: '', notes: '', isRestDay: false },
    Thursday: { name: '', muscleGroup: '', notes: '', isRestDay: false },
    Friday: { name: '', muscleGroup: '', notes: '', isRestDay: false },
    Saturday: { name: '', muscleGroup: '', notes: '', isRestDay: false },
    Sunday: { name: '', muscleGroup: '', notes: '', isRestDay: true }
  });
  const [workoutPlanName, setWorkoutPlanName] = useState('');
  const [workoutDifficulty, setWorkoutDifficulty] = useState('Intermediate');

  // Diet form state
  const [dietForm, setDietForm] = useState({
    planName: 'Standard Nutrition Plan',
    targetCalories: 2000,
    targetProtein: 100,
    targetCarbs: 200,
    targetFats: 60,
    waterIntake: 2500,
    meals: { Breakfast: '', Lunch: '', Snack: '', Dinner: '' },
    supplements: ''
  });

  // Progress Log form state
  const [newLog, setNewLog] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '', chest: '', waist: '', hips: '', biceps: '', thighs: '', bodyFat: ''
  });

  // Record Payment Modal
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

  // Synchronize active tab with URL hash fragments if any
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleHashTab = () => {
        const hash = window.location.hash;
        if (hash.includes('#workouts')) setActiveTab('workout');
        else if (hash.includes('#diet')) setActiveTab('diet');
        else if (hash.includes('#progress')) setActiveTab('progress');
        else if (hash.includes('#billing')) setActiveTab('billing');
        else if (hash.includes('#attendance')) setActiveTab('attendance');
        else if (hash.includes('#profile')) setActiveTab('profile');
      };
      handleHashTab();
      window.addEventListener('hashchange', handleHashTab);
      return () => window.removeEventListener('hashchange', handleHashTab);
    }
  }, [memberId]);

  const loadProfileData = async () => {
    const mem = await dbReadOne('members', memberId);
    if (!mem) return;
    setMember(mem);

    // 1. Fetch Workout Plan and parse schedule
    const wList = await dbReadAll('workouts') || [];
    const wPlan = wList.find(w => w.memberId === memberId);
    if (wPlan) {
      setWorkout(wPlan);
      setWorkoutPlanName(wPlan.planName || 'Custom Split');
      setWorkoutDifficulty(wPlan.difficulty || 'Intermediate');
      
      const parsedSched = {};
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      days.forEach(day => {
        const dayVal = wPlan.schedule?.[day];
        parsedSched[day] = parseDaySchedule(dayVal);
      });
      setWorkoutSchedule(parsedSched);
    }

    // 2. Fetch Diet Plan
    const dList = await dbReadAll('dietPlans') || [];
    const dPlan = dList.find(d => d.memberId === memberId);
    if (dPlan) {
      setDiet(dPlan);
      setDietForm({
        planName: dPlan.planName || 'Lean Body Plan',
        targetCalories: dPlan.targetCalories || 2000,
        targetProtein: dPlan.targetProtein || 100,
        targetCarbs: dPlan.targetCarbs || 200,
        targetFats: dPlan.targetFats || 60,
        waterIntake: dPlan.waterIntake || 2500,
        meals: {
          Breakfast: dPlan.meals?.Breakfast || dPlan.meals?.breakfast || '',
          Lunch: dPlan.meals?.Lunch || dPlan.meals?.lunch || '',
          Snack: dPlan.meals?.Snack || dPlan.meals?.snack || '',
          Dinner: dPlan.meals?.Dinner || dPlan.meals?.dinner || ''
        },
        supplements: dPlan.supplements || ''
      });
    }

    // 3. Fetch Progress logs
    const pList = await dbReadAll('progress') || [];
    const pLogs = pList.filter(p => p.memberId === memberId) || [];
    setProgressLogs(pLogs.sort((a, b) => new Date(a.date) - new Date(b.date)));

    // 4. Fetch Payments
    const pPayments = await dbReadAll('payments') || [];
    setPayments(pPayments.filter(p => p.memberId === memberId) || []);

    // 5. Fetch Attendance
    const allAtt = await dbReadAll('attendance') || [];
    setAttendance(allAtt.filter(a => a.memberId === memberId).sort((a,b) => new Date(b.date) - new Date(a.date)));

    // 6. Fetch settings
    const settingsObj = await dbReadOne('settings', 'settings');
    setGymSettings(settingsObj || {});
  };

  // Parsing helper for workout days
  const parseDaySchedule = (dayVal) => {
    if (!dayVal) {
      return { name: '', muscleGroup: '', notes: '', isRestDay: true };
    }
    if (typeof dayVal === 'string') {
      const isRest = dayVal.toLowerCase() === 'rest' || dayVal.toLowerCase() === 'rest day' || dayVal.toLowerCase() === 'rest day badge';
      return {
        name: isRest ? '' : dayVal,
        muscleGroup: '',
        notes: '',
        isRestDay: isRest
      };
    }
    return {
      name: dayVal.name || dayVal.workoutName || '',
      muscleGroup: dayVal.muscleGroup || '',
      notes: dayVal.notes || '',
      isRestDay: !!dayVal.isRestDay
    };
  };

  // PT session trackers
  const handleMarkPTComplete = async () => {
    if (!member) return;
    const completed = Number(member.ptSessionsCompleted || 0);
    const total = Number(member.ptSessionsTotal || 10);
    
    if (completed < total) {
      const newCompleted = completed + 1;
      await dbUpdate('members', memberId, { ptSessionsCompleted: newCompleted });
      showToast('success', `PT session marked complete! (${newCompleted}/${total} sessions finished)`);
      loadProfileData();
      window.dispatchEvent(new Event('db-change'));
    }
  };

  const handleResetPTCounter = async () => {
    if (!member) return;
    const newTotal = prompt("Enter total sessions for the new PT pack:", member.ptSessionsTotal || 10);
    if (newTotal !== null) {
      await dbUpdate('members', memberId, { 
        ptSessionsCompleted: 0, 
        ptSessionsTotal: Number(newTotal) || 10 
      });
      showToast('success', "PT Session pack renewed/reset successfully.");
      loadProfileData();
      window.dispatchEvent(new Event('db-change'));
    }
  };

  // Workouts planner actions
  const handleApplyTemplate = (templateId) => {
    setSelectedTemplate(templateId);
    const template = workoutTemplates.find(t => t.id === templateId);
    if (template) {
      setWorkoutPlanName(template.name);
      setWorkoutDifficulty(template.difficulty);
      
      const parsedSched = {};
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      days.forEach(day => {
        parsedSched[day] = parseDaySchedule(template.schedule[day]);
      });
      setWorkoutSchedule(parsedSched);
      showToast('info', `Applied split template: ${template.name}`);
    }
  };

  const handleDuplicateDay = (targetDay, sourceDay) => {
    setWorkoutSchedule(prev => ({
      ...prev,
      [targetDay]: { ...prev[sourceDay] }
    }));
    showToast('success', `Duplicated ${sourceDay}'s routine to ${targetDay}.`);
  };

  const handleCopyWeek = () => {
    localStorage.setItem('kmf_copied_week_routine', JSON.stringify(workoutSchedule));
    showToast('success', "Workout week configuration copied to clipboard!");
  };

  const handlePasteWeek = () => {
    const copied = localStorage.getItem('kmf_copied_week_routine');
    if (copied) {
      try {
        setWorkoutSchedule(JSON.parse(copied));
        showToast('success', "Workout week configuration pasted successfully!");
      } catch (e) {
        showToast('error', "Failed to paste week routine configuration.");
      }
    } else {
      showToast('info', "No copied workout week config found. Copy a week first!");
    }
  };

  const handleSaveWorkout = async (e) => {
    e.preventDefault();
    
    // Convert current workoutSchedule object back to database JSON format
    const dbSchedule = {};
    Object.keys(workoutSchedule).forEach(day => {
      const data = workoutSchedule[day];
      if (data.isRestDay) {
        dbSchedule[day] = "Rest";
      } else {
        dbSchedule[day] = {
          name: data.name,
          muscleGroup: data.muscleGroup,
          notes: data.notes,
          isRestDay: false
        };
      }
    });

    try {
      if (workout) {
        await dbUpdate('workouts', workout.id, {
          planName: workoutPlanName,
          difficulty: workoutDifficulty,
          schedule: dbSchedule
        });
      } else {
        const id = `W-${memberId}`;
        await dbCreate('workouts', {
          id,
          memberId,
          planName: workoutPlanName,
          difficulty: workoutDifficulty,
          schedule: dbSchedule
        });
      }
      showToast('success', "Workout plan split updated successfully!");
      loadProfileData();
    } catch (err) {
      console.error(err);
      showToast('error', "Failed to save workout split plan.");
    }
  };

  // Diet section actions
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
    try {
      if (diet) {
        await dbUpdate('dietPlans', diet.id, dietForm);
      } else {
        const id = `D-${memberId}`;
        await dbCreate('dietPlans', { id, memberId, ...dietForm });
      }
      showToast('success', "Nutrition and diet cards saved successfully!");
      loadProfileData();
    } catch (err) {
      console.error(err);
      showToast('error', "Failed to save diet plan.");
    }
  };

  // Progress actions
  const handleSaveProgressLog = async (e) => {
    e.preventDefault();
    try {
      const logId = `PROG-${memberId}-${Math.floor(1000 + Math.random() * 9000)}`;
      const logData = {
        id: logId,
        memberId,
        date: newLog.date,
        weight: newLog.weight ? Number(newLog.weight) : null,
        chest: newLog.chest ? Number(newLog.chest) : null,
        waist: newLog.waist ? Number(newLog.waist) : null,
        hips: newLog.hips ? Number(newLog.hips) : null,
        biceps: newLog.biceps ? Number(newLog.biceps) : null,
        thighs: newLog.thighs ? Number(newLog.thighs) : null,
        bodyFat: newLog.bodyFat ? Number(newLog.bodyFat) : null
      };

      await dbCreate('progress', logData);
      
      // Also update the member's current weight in the members table!
      if (newLog.weight) {
        await dbUpdate('members', memberId, { weight: Number(newLog.weight) });
      }

      showToast('success', "Body progress measurement logged successfully!");
      setNewLog({
        date: new Date().toISOString().split('T')[0],
        weight: '', chest: '', waist: '', hips: '', biceps: '', thighs: '', bodyFat: ''
      });
      loadProfileData();
      window.dispatchEvent(new Event('db-change'));
    } catch (err) {
      console.error(err);
      showToast('error', "Failed to record progress log.");
    }
  };

  // Payments log
  const handlePlanChange = (planName) => {
    const selectedPlanObj = gymSettings?.membershipPlans?.find(p => p.name === planName);
    const price = selectedPlanObj ? selectedPlanObj.price : '';
    const duration = selectedPlanObj ? selectedPlanObj.duration : 1;

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

      await dbUpdate('members', memberId, { 
        membershipPlan: paymentForm.planType,
        status: 'active'
      });

      // System notification
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

      showToast('success', "Fee payment logged and plan active!");
      setShowPaymentModal(false);
      
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
      showToast('error', "Failed to log payment.");
    }
  };

  const handleMarkPaymentPaid = async (paymentId) => {
    try {
      await dbUpdate('payments', paymentId, { status: 'paid' });
      await dbUpdate('members', memberId, { status: 'active' });
      showToast('success', "Payment status marked as PAID!");
      loadProfileData();
      window.dispatchEvent(new Event('db-change'));
    } catch (e) {
      showToast('error', "Failed to update payment status.");
    }
  };

  if (!member) {
    return <div className="card-glass text-center" style={{ padding: '3rem' }}>Loading Member Profile...</div>;
  }

  // 1. LAZY RENDER TABS CONTENT
  const renderProfileTab = () => (
    <div className="tab-panel-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
      
      {/* Contact info card */}
      <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
        <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>Member Contact Info</h3>
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

      {/* Fitness and health measurements */}
      <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
        <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>Fitness & Medical Logs</h3>
        <div className="profile-details-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.95rem', marginBottom: '1rem' }}>
          <div><span style={{ color: 'var(--text-secondary)' }}>Age / Gender:</span> <strong>{member.age || '--'} / {member.gender}</strong></div>
          <div><span style={{ color: 'var(--text-secondary)' }}>Height / Weight:</span> <strong>{member.height ? `${member.height} cm` : '--'} / {member.weight ? `${member.weight} kg` : '--'}</strong></div>
          <div><span style={{ color: 'var(--text-secondary)' }}>Blood Group:</span> <strong>{member.bloodGroup || '--'}</strong></div>
          <div><span style={{ color: 'var(--text-secondary)' }}>Medical Issues:</span> <strong className="text-danger">{member.medicalConditions || 'None reported'}</strong></div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.8rem', borderRadius: '8px', borderLeft: '3px solid var(--color-primary)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Trainer Notes:</span>
          <p style={{ fontSize: '0.9rem', marginTop: '0.2rem', fontStyle: 'italic' }}>{member.trainerNotes || 'No notes added.'}</p>
        </div>
      </div>

      {/* PT Tracker card inside profile if member has PT */}
      {member.isPT ? (
        <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.2rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award size={18} style={{ color: 'var(--color-primary)' }} />
            <span>PT Session Tracker</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(99, 102, 241, 0.05)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Schedule Timing:</span>
              <strong style={{ color: '#fff' }}>{member.ptSchedule || 'Not Assigned'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '4px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>PT Fees:</span>
              <strong style={{ color: 'var(--color-primary)' }}>₹{(Number(member.ptFees) || 0).toLocaleString()}</strong>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Sessions Logged:</span>
            <strong style={{ fontSize: '1.15rem' }}>{member.ptSessionsCompleted} / {member.ptSessionsTotal}</strong>
          </div>

          <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min((Number(member.ptSessionsCompleted)/Number(member.ptSessionsTotal))*100, 100)}%`, height: '100%', background: 'var(--color-primary)' }}></div>
          </div>

          {Number(member.ptSessionsCompleted) >= Number(member.ptSessionsTotal) ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', color: '#10B981', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
              <span>🏆 PT Package Completed</span>
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button className="btn-primary" onClick={handleMarkPTComplete} disabled={Number(member.ptSessionsCompleted) >= Number(member.ptSessionsTotal)} style={{ flex: 1, minHeight: '40px' }}>
              Mark PT Complete
            </button>
            <button className="btn-secondary" onClick={handleResetPTCounter} style={{ minHeight: '40px' }}>
              Renew
            </button>
          </div>
        </div>
      ) : (
        <div className="card-glass text-center" style={{ padding: '1.5rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.8rem' }}>
          <QRCodeSVG value={member.id} size={150} level="H" />
          <strong style={{ fontSize: '1.1rem', letterSpacing: '2px', fontFamily: 'monospace' }}>{member.id}</strong>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Check-in QR Code</span>
        </div>
      )}

    </div>
  );

  const renderWorkoutTab = () => (
    <div className="workout-planner card-glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
      
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.25rem', fontWeight: 600 }}>Client Workout Planner</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Customize individual days or apply workout split templates.</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" className="btn-secondary" onClick={handleCopyWeek} style={{ display: 'flex', alignItems: 'center', gap: '4px', minHeight: '38px', padding: '0 1rem' }}>
            <Copy size={15} />
            <span style={{ fontSize: '0.8rem' }}>Copy Week</span>
          </button>
          <button type="button" className="btn-secondary" onClick={handlePasteWeek} style={{ display: 'flex', alignItems: 'center', gap: '4px', minHeight: '38px', padding: '0 1rem' }}>
            <Clipboard size={15} />
            <span style={{ fontSize: '0.8rem' }}>Paste Week</span>
          </button>
          <select 
            value={selectedTemplate}
            onChange={(e) => handleApplyTemplate(e.target.value)}
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', color: '#fff', padding: '0.4rem', borderRadius: '6px', height: '38px' }}
          >
            <option value="">Apply Split template...</option>
            {workoutTemplates.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.difficulty})</option>
            ))}
          </select>
        </div>
      </div>

      <form onSubmit={handleSaveWorkout}>
        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="form-group">
            <label>Plan Name</label>
            <input type="text" required value={workoutPlanName} onChange={(e) => setWorkoutPlanName(e.target.value)} placeholder="e.g. Muscle Gain Spli" />
          </div>
          <div className="form-group">
            <label>Difficulty</label>
            <select value={workoutDifficulty} onChange={(e) => setWorkoutDifficulty(e.target.value)}>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* 7 Day Workout cards */}
        <div className="workout-cards-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, idx) => {
            const data = workoutSchedule[day] || { name: '', muscleGroup: '', notes: '', isRestDay: false };
            const prevDay = idx > 0 ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][idx - 1] : 'Sunday';
            
            return (
              <div key={day} className="card-glass" style={{ padding: '1rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '10px', borderLeft: data.isRestDay ? '4px solid var(--text-muted)' : '4px solid var(--color-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontWeight: 700, color: data.isRestDay ? 'var(--text-secondary)' : '#fff' }}>{day}</h4>
                  
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button type="button" className="btn-text" onClick={() => handleDuplicateDay(day, prevDay)} style={{ fontSize: '0.75rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <Copy size={12} />
                      <span>Duplicate {prevDay}</span>
                    </button>
                    
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', userSelect: 'none' }}>
                      <input 
                        type="checkbox" 
                        checked={data.isRestDay} 
                        onChange={(e) => {
                          const val = e.target.checked;
                          setWorkoutSchedule(prev => ({
                            ...prev,
                            [day]: { ...prev[day], isRestDay: val }
                          }));
                        }}
                      />
                      <span>Rest Day</span>
                    </label>
                  </div>
                </div>

                {!data.isRestDay ? (
                  <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '0.75rem' }}>Workout Name / Focus</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. Chest Press, Inclines" 
                        value={data.name} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setWorkoutSchedule(prev => ({
                            ...prev,
                            [day]: { ...prev[day], name: val }
                          }));
                        }} 
                        style={{ minHeight: '40px', padding: '0.5rem 0.8rem' }}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.75rem' }}>Muscle Groups Targeted</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Chest, Triceps" 
                        value={data.muscleGroup} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setWorkoutSchedule(prev => ({
                            ...prev,
                            [day]: { ...prev[day], muscleGroup: val }
                          }));
                        }} 
                        style={{ minHeight: '40px', padding: '0.5rem 0.8rem' }}
                      />
                    </div>
                    <div className="form-group colspan-2" style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '0.75rem' }}>Workout Coaching Notes</label>
                      <input 
                        type="text" 
                        placeholder="Sets, reps, rest details..." 
                        value={data.notes} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setWorkoutSchedule(prev => ({
                            ...prev,
                            [day]: { ...prev[day], notes: val }
                          }));
                        }} 
                        style={{ minHeight: '40px', padding: '0.5rem 0.8rem' }}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.01)', borderRadius: '6px', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                    💤 Scheduled Rest Day.
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button type="submit" className="btn-primary" style={{ padding: '0.6rem 2rem' }}>
            <Check size={18} style={{ marginRight: '6px' }} />
            <span>Save Workout Schedule</span>
          </button>
        </div>

      </form>

    </div>
  );

  const renderDietTab = () => (
    <div className="diet-planner card-glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
      <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.4rem' }}>Nutrition Plan</h3>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Define daily macro targets and input meal details.</span>
      
      <form onSubmit={handleSaveDiet} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
        
        {/* Macro targets progress cards */}
        <div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.8rem' }}>Target Macronutrients Split</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.8rem' }}>
            
            <div className="card-glass" style={{ padding: '1rem', borderLeft: '4px solid #FF2A5F', background: 'rgba(255, 42, 95, 0.03)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>CALORIES</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
                <input 
                  type="number" 
                  value={dietForm.targetCalories} 
                  onChange={(e) => handleDietCaloriesChange(e.target.value)} 
                  style={{ background: 'none', border: 'none', fontSize: '1.25rem', fontWeight: 700, color: '#fff', width: '80px', padding: 0, minHeight: 'auto' }} 
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>kcal</span>
              </div>
            </div>

            <div className="card-glass" style={{ padding: '1rem', borderLeft: '4px solid #6366F1', background: 'rgba(99, 102, 241, 0.03)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>PROTEIN</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
                <input 
                  type="number" 
                  value={dietForm.targetProtein} 
                  onChange={(e) => setDietForm({ ...dietForm, targetProtein: Number(e.target.value) })} 
                  style={{ background: 'none', border: 'none', fontSize: '1.25rem', fontWeight: 700, color: '#fff', width: '60px', padding: 0, minHeight: 'auto' }} 
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>g</span>
              </div>
            </div>

            <div className="card-glass" style={{ padding: '1rem', borderLeft: '4px solid #F59E0B', background: 'rgba(245, 158, 11, 0.03)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>CARBS</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
                <input 
                  type="number" 
                  value={dietForm.targetCarbs} 
                  onChange={(e) => setDietForm({ ...dietForm, targetCarbs: Number(e.target.value) })} 
                  style={{ background: 'none', border: 'none', fontSize: '1.25rem', fontWeight: 700, color: '#fff', width: '60px', padding: 0, minHeight: 'auto' }} 
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>g</span>
              </div>
            </div>

            <div className="card-glass" style={{ padding: '1rem', borderLeft: '4px solid #10B981', background: 'rgba(16, 185, 129, 0.03)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>FATS</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
                <input 
                  type="number" 
                  value={dietForm.targetFats} 
                  onChange={(e) => setDietForm({ ...dietForm, targetFats: Number(e.target.value) })} 
                  style={{ background: 'none', border: 'none', fontSize: '1.25rem', fontWeight: 700, color: '#fff', width: '60px', padding: 0, minHeight: 'auto' }} 
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>g</span>
              </div>
            </div>

          </div>
        </div>

        {/* Meal cards grid */}
        <div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.8rem' }}>Daily Meals & Supplements</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            
            <div className="card-glass" style={{ padding: '1rem', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                🍳 Breakfast
              </div>
              <textarea 
                rows="2" 
                placeholder="Eggs, toast, oatmeal details..." 
                value={dietForm.meals.Breakfast} 
                onChange={(e) => setDietForm({ ...dietForm, meals: { ...dietForm.meals, Breakfast: e.target.value } })}
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '6px', width: '100%', padding: '0.5rem' }}
              ></textarea>
            </div>

            <div className="card-glass" style={{ padding: '1rem', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                🍗 Lunch
              </div>
              <textarea 
                rows="2" 
                placeholder="Chicken, rice, broccoli..." 
                value={dietForm.meals.Lunch} 
                onChange={(e) => setDietForm({ ...dietForm, meals: { ...dietForm.meals, Lunch: e.target.value } })}
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '6px', width: '100%', padding: '0.5rem' }}
              ></textarea>
            </div>

            <div className="card-glass" style={{ padding: '1rem', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                🍌 Snack
              </div>
              <textarea 
                rows="2" 
                placeholder="Protein shake, fruit, almonds..." 
                value={dietForm.meals.Snack} 
                onChange={(e) => setDietForm({ ...dietForm, meals: { ...dietForm.meals, Snack: e.target.value } })}
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '6px', width: '100%', padding: '0.5rem' }}
              ></textarea>
            </div>

            <div className="card-glass" style={{ padding: '1rem', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                🥗 Dinner
              </div>
              <textarea 
                rows="2" 
                placeholder="Salmon, sweet potatoes, salad..." 
                value={dietForm.meals.Dinner} 
                onChange={(e) => setDietForm({ ...dietForm, meals: { ...dietForm.meals, Dinner: e.target.value } })}
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '6px', width: '100%', padding: '0.5rem' }}
              ></textarea>
            </div>

            <div className="card-glass" style={{ padding: '1rem', borderRadius: '10px', borderLeft: '4px solid #3B82F6' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#3B82F6', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Droplet size={16} /> Water Intake (ml)
              </div>
              <input 
                type="number" 
                placeholder="2500" 
                value={dietForm.waterIntake} 
                onChange={(e) => setDietForm({ ...dietForm, waterIntake: Number(e.target.value) })}
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '6px', width: '100%', padding: '0.5rem', minHeight: '40px' }}
              />
            </div>

            <div className="card-glass" style={{ padding: '1rem', borderRadius: '10px', borderLeft: '4px solid #8B5CF6' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#8B5CF6', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                💊 Supplements
              </div>
              <textarea 
                rows="1" 
                placeholder="Creatine, Whey Protein, Multivitamin..." 
                value={dietForm.supplements} 
                onChange={(e) => setDietForm({ ...dietForm, supplements: e.target.value })}
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '6px', width: '100%', padding: '0.5rem' }}
              ></textarea>
            </div>

          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button type="submit" className="btn-primary" style={{ padding: '0.6rem 2rem' }}>
            <Check size={18} style={{ marginRight: '6px' }} />
            <span>Save Nutrition Card</span>
          </button>
        </div>

      </form>
    </div>
  );

  const renderProgressTab = () => {
    // Compile chart variables
    const labels = progressLogs.map(l => l.date);
    const weights = progressLogs.map(l => l.weight);
    const fatPercent = progressLogs.map(l => l.bodyFat);

    const chartData = {
      labels,
      datasets: [
        {
          label: 'Weight (kg)',
          data: weights,
          borderColor: '#FF2A5F',
          backgroundColor: 'rgba(255, 42, 95, 0.1)',
          tension: 0.3,
          fill: true
        },
        {
          label: 'Body Fat (%)',
          data: fatPercent,
          borderColor: '#6366F1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.3,
          fill: true
        }
      ]
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Log measurements form & photo comparisons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          
          <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
            <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>Log Body Measurements</h3>
            <form onSubmit={handleSaveProgressLog} className="responsive-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div className="form-group">
                  <label>Log Date</label>
                  <input type="date" required value={newLog.date} onChange={(e) => setNewLog({ ...newLog, date: e.target.value })} style={{ minHeight: '40px' }} />
                </div>
                <div className="form-group">
                  <label>Weight (kg)</label>
                  <input type="number" step="0.01" required value={newLog.weight} onChange={(e) => setNewLog({ ...newLog, weight: e.target.value })} style={{ minHeight: '40px' }} placeholder="e.g. 78" />
                </div>
              </div>
              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
                <div className="form-group">
                  <label>Chest (cm)</label>
                  <input type="number" step="0.1" value={newLog.chest} onChange={(e) => setNewLog({ ...newLog, chest: e.target.value })} style={{ minHeight: '40px' }} />
                </div>
                <div className="form-group">
                  <label>Waist (cm)</label>
                  <input type="number" step="0.1" value={newLog.waist} onChange={(e) => setNewLog({ ...newLog, waist: e.target.value })} style={{ minHeight: '40px' }} />
                </div>
                <div className="form-group">
                  <label>Hips (cm)</label>
                  <input type="number" step="0.1" value={newLog.hips} onChange={(e) => setNewLog({ ...newLog, hips: e.target.value })} style={{ minHeight: '40px' }} />
                </div>
              </div>
              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
                <div className="form-group">
                  <label>Biceps (cm)</label>
                  <input type="number" step="0.1" value={newLog.biceps} onChange={(e) => setNewLog({ ...newLog, biceps: e.target.value })} style={{ minHeight: '40px' }} />
                </div>
                <div className="form-group">
                  <label>Thighs (cm)</label>
                  <input type="number" step="0.1" value={newLog.thighs} onChange={(e) => setNewLog({ ...newLog, thighs: e.target.value })} style={{ minHeight: '40px' }} />
                </div>
                <div className="form-group">
                  <label>Body Fat (%)</label>
                  <input type="number" step="0.1" value={newLog.bodyFat} onChange={(e) => setNewLog({ ...newLog, bodyFat: e.target.value })} style={{ minHeight: '40px' }} placeholder="14" />
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                Record Measurements
              </button>
            </form>
          </div>

          {/* Photo comparisons */}
          <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
            <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>Transformation Photos</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', height: 'calc(100% - 40px)', minHeight: '220px' }}>
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <img src={progressLogs[0]?.beforePhoto || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&fit=crop'} alt="Before" style={{ width: '100%', height: '80%', objectFit: 'cover' }} />
                <span style={{ fontSize: '0.75rem', padding: '4px', fontWeight: 600, color: 'var(--text-secondary)' }}>BEFORE PHOTO</span>
              </div>
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <img src={progressLogs[progressLogs.length - 1]?.afterPhoto || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&fit=crop'} alt="After" style={{ width: '100%', height: '80%', objectFit: 'cover' }} />
                <span style={{ fontSize: '0.75rem', padding: '4px', fontWeight: 600, color: 'var(--color-primary)' }}>LATEST PROGRESS</span>
              </div>
            </div>
          </div>

        </div>

        {/* Charts log display */}
        {progressLogs.length > 0 ? (
          <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
            <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Progress History Chart</h3>
            <div style={{ height: '260px', position: 'relative' }}>
              <Line 
                data={chartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: { beginAtZero: false, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'var(--text-secondary)' } },
                    x: { grid: { display: false }, ticks: { color: 'var(--text-secondary)' } }
                  }
                }}
              />
            </div>
          </div>
        ) : (
          <div className="card-glass text-center" style={{ padding: '3rem 1.5rem', borderRadius: '12px' }}>
            <TrendingUp size={30} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>No Progression Chart Data</h4>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Log measurement values above to plot the weight transition curve.</span>
          </div>
        )}

      </div>
    );
  };

  const renderPaymentsTab = () => {
    // Find latest active plan details
    const overduePayments = payments.some(p => p.status === 'overdue');
    return (
      <div className="billing-payments-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Payment Summary Header metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          
          <div className="card-glass" style={{ padding: '1.25rem', borderLeft: '4px solid var(--color-primary)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>CURRENT ACTIVE PLAN</span>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: '4px', color: '#fff' }}>{member.membershipPlan || 'None'}</h3>
          </div>

          <div className="card-glass" style={{ padding: '1.25rem', borderLeft: '4px solid #10B981' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>BILLING DUE DATE</span>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: '4px', color: '#fff', fontFamily: 'monospace' }}>
              {payments.length > 0 ? payments.sort((a,b) => new Date(b.dueDate) - new Date(a.dueDate))[0].dueDate : '--'}
            </h3>
          </div>

          <div className="card-glass" style={{ padding: '1.25rem', borderLeft: overduePayments ? '4px solid #EF4444' : '4px solid var(--text-muted)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>FEE STATUS</span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center' }}>
              <span className={`badge ${overduePayments ? 'badge-danger' : 'badge-success'}`} style={{ textTransform: 'uppercase' }}>
                {overduePayments ? 'OVERDUE DUES' : 'PAID / ACTIVE'}
              </span>
            </h3>
          </div>

        </div>

        {/* History table list */}
        <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.25rem', fontWeight: 600 }}>Billing & Payment Logs</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Review client historical invoices and log pending transactions.</span>
            </div>
            <button type="button" className="btn-primary" onClick={() => setShowPaymentModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '4px', minHeight: '38px', padding: '0 1rem' }}>
              <Plus size={16} />
              <span style={{ fontSize: '0.8rem' }}>Record Payment</span>
            </button>
          </div>

          {/* Table display */}
          <div className="table-responsive">
            <table className="table-custom" style={{ width: '100%' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '0.8rem' }}>Payment Date</th>
                  <th style={{ padding: '0.8rem' }}>Plan</th>
                  <th style={{ padding: '0.8rem' }}>Amount</th>
                  <th style={{ padding: '0.8rem' }}>Next Due</th>
                  <th style={{ padding: '0.8rem' }}>Status</th>
                  <th style={{ padding: '0.8rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No payments registered.</td>
                  </tr>
                ) : (
                  [...payments].sort((a,b) => new Date(b.paymentDate) - new Date(a.paymentDate)).map(pay => (
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
                      <td style={{ padding: '0.8rem', textAlign: 'right' }}>
                        {pay.status !== 'paid' && (
                          <button 
                            type="button" 
                            className="btn-primary" 
                            onClick={() => handleMarkPaymentPaid(pay.id)}
                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', minHeight: '28px', borderRadius: '4px' }}
                          >
                            Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>
    );
  };

  const renderAttendanceTab = () => (
    <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
      <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.4rem' }}>Attendance Checklist Logs</h3>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Log sheet showing chronological history checklist status.</span>
      
      <div className="table-responsive" style={{ marginTop: '1.5rem' }}>
        <table className="table-custom" style={{ width: '100%' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '0.8rem' }}>Check-in Date</th>
              <th style={{ padding: '0.8rem' }}>Check-in Time</th>
              <th style={{ padding: '0.8rem' }}>Check-in Status</th>
            </tr>
          </thead>
          <tbody>
            {attendance.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No attendance record checklist marked.</td>
              </tr>
            ) : (
              attendance.map(att => (
                <tr key={att.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '0.8rem', fontWeight: 600, color: '#fff', fontFamily: 'monospace' }}>{att.date}</td>
                  <td style={{ padding: '0.8rem', fontFamily: 'monospace' }}>{att.checkInTime || '--'}</td>
                  <td style={{ padding: '0.8rem' }}>
                    <span className={`badge ${att.status === 'present' ? 'badge-success' : att.status === 'late' ? 'badge-warning' : 'badge-danger'}`}>
                      {att.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="member-profile-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Back to roster toolbar */}
      <button className="btn-secondary" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', alignSelf: 'flex-start', padding: '0.5rem 1rem' }}>
        <ChevronLeft size={16} />
        <span>Back to Roster</span>
      </button>

      {/* Header card banner */}
      <div className="profile-header card-glass" style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', borderRadius: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <img src={member.profilePhoto || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&fit=crop'} alt={member.fullName} style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-primary)' }} />
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-outfit)' }}>{member.fullName}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
            Goal: <strong style={{ color: '#fff' }}>{member.fitnessGoal}</strong> | Status: <span className={`badge ${member.status === 'active' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>{member.status.toUpperCase()}</span>
          </p>
        </div>
      </div>

      {/* Horizontal pill navigation bar for mobile-first scrolling */}
      <div className="tabs-menu" style={{ display: 'flex', gap: '6px', borderBottom: '1px solid rgba(255,255,255,0.08)', overflowX: 'auto', paddingBottom: '0.5rem', width: '100%', WebkitOverflowScrolling: 'touch' }}>
        <button className={`profile-tab-item tab-link ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.6rem 1.1rem', background: activeTab === 'profile' ? 'rgba(99,102,241,0.1)' : 'none', border: 'none', borderRadius: '20px', color: activeTab === 'profile' ? 'var(--color-primary)' : '#fff', cursor: 'pointer', fontWeight: 600, outline: 'none', flexShrink: 0 }}>
          <User size={15} />
          <span>Profile</span>
        </button>
        <button className={`profile-tab-item tab-link ${activeTab === 'workout' ? 'active' : ''}`} onClick={() => setActiveTab('workout')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.6rem 1.1rem', background: activeTab === 'workout' ? 'rgba(99,102,241,0.1)' : 'none', border: 'none', borderRadius: '20px', color: activeTab === 'workout' ? 'var(--color-primary)' : '#fff', cursor: 'pointer', fontWeight: 600, outline: 'none', flexShrink: 0 }}>
          <Dumbbell size={15} />
          <span>Workout</span>
        </button>
        <button className={`profile-tab-item tab-link ${activeTab === 'diet' ? 'active' : ''}`} onClick={() => setActiveTab('diet')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.6rem 1.1rem', background: activeTab === 'diet' ? 'rgba(99,102,241,0.1)' : 'none', border: 'none', borderRadius: '20px', color: activeTab === 'diet' ? 'var(--color-primary)' : '#fff', cursor: 'pointer', fontWeight: 600, outline: 'none', flexShrink: 0 }}>
          <Apple size={15} />
          <span>Diet</span>
        </button>
        <button className={`profile-tab-item tab-link ${activeTab === 'progress' ? 'active' : ''}`} onClick={() => setActiveTab('progress')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.6rem 1.1rem', background: activeTab === 'progress' ? 'rgba(99,102,241,0.1)' : 'none', border: 'none', borderRadius: '20px', color: activeTab === 'progress' ? 'var(--color-primary)' : '#fff', cursor: 'pointer', fontWeight: 600, outline: 'none', flexShrink: 0 }}>
          <LineChart size={15} />
          <span>Progress</span>
        </button>
        <button className={`profile-tab-item tab-link ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => setActiveTab('billing')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.6rem 1.1rem', background: activeTab === 'billing' ? 'rgba(99,102,241,0.1)' : 'none', border: 'none', borderRadius: '20px', color: activeTab === 'billing' ? 'var(--color-primary)' : '#fff', cursor: 'pointer', fontWeight: 600, outline: 'none', flexShrink: 0 }}>
          <CreditCard size={15} />
          <span>Payments</span>
        </button>
        <button className={`profile-tab-item tab-link ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.6rem 1.1rem', background: activeTab === 'attendance' ? 'rgba(99,102,241,0.1)' : 'none', border: 'none', borderRadius: '20px', color: activeTab === 'attendance' ? 'var(--color-primary)' : '#fff', cursor: 'pointer', fontWeight: 600, outline: 'none', flexShrink: 0 }}>
          <Activity size={15} />
          <span>Attendance</span>
        </button>
      </div>

      {/* 2. LAZY LOADED TAB PANELS */}
      <div className="tab-panels">
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'workout' && renderWorkoutTab()}
        {activeTab === 'diet' && renderDietTab()}
        {activeTab === 'progress' && renderProgressTab()}
        {activeTab === 'billing' && renderPaymentsTab()}
        {activeTab === 'attendance' && renderAttendanceTab()}
      </div>

      {/* RECORD PAYMENT MODAL DIALOG */}
      {showPaymentModal && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 2000 }}>
          <div className="modal-card card-glass" style={{ display: 'block', maxWidth: '480px', width: '90%', padding: '1.5rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>Record Client Fee Payment</h3>
              <button className="btn-icon" onClick={() => setShowPaymentModal(false)}><X size={18} /></button>
            </div>
            
            <form onSubmit={handleRecordPayment} className="responsive-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
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

              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
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

              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
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

              <div className="form-group">
                <label>Transaction ID / Reference (UPI/Cash/Card)</label>
                <input 
                  type="text" 
                  placeholder="UPI-12345678 or CASH"
                  value={paymentForm.transactionId} 
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
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
