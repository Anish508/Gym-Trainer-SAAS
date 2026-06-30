'use client';

import React, { useState, useEffect } from 'react';
import { dbReadOne, dbReadAll, dbCreate, dbUpdate } from '@/lib/db';
import { calculateMacros, calculateBMI } from '@/lib/utils';
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
  Calendar,
  Activity,
  Award,
  TrendingUp,
  Droplet,
  X,
  PlusCircle,
  FileText
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

  // Workout Split State (Monday to Sunday)
  const defaultExercises = [
    { id: '1', name: 'Bench Press', sets: 4, reps: 10, weight: 80, notes: 'Flat bench press' }
  ];
  const [workoutSchedule, setWorkoutSchedule] = useState({
    Monday: { isRestDay: false, exercises: [...defaultExercises] },
    Tuesday: { isRestDay: false, exercises: [...defaultExercises] },
    Wednesday: { isRestDay: false, exercises: [...defaultExercises] },
    Thursday: { isRestDay: false, exercises: [...defaultExercises] },
    Friday: { isRestDay: false, exercises: [...defaultExercises] },
    Saturday: { isRestDay: false, exercises: [...defaultExercises] },
    Sunday: { isRestDay: true, exercises: [] }
  });

  // Diet Form State
  const [dietForm, setDietForm] = useState({
    calories: 2200,
    protein: 140,
    carbs: 220,
    fat: 70,
    waterIntake: 3000,
    meals: {
      Breakfast: { food: 'Oats & Egg Whites', quantity: '1 bowl + 4 eggs', notes: 'Consume post-cardio' },
      Lunch: { food: 'Chicken Rice & Greens', quantity: '200g chicken, 1 cup rice', notes: 'Low sodium' },
      Snack: { food: 'Whey Shake & Almonds', quantity: '1 scoop + 10 almonds', notes: 'Pre-workout meal' },
      Dinner: { food: 'Salmon or Lean Beef', quantity: '150g steak + salad', notes: 'Zero carbs' }
    },
    supplements: 'Creatine, Whey Protein, Fish Oil, Vitamin D',
    notes: 'Prioritize whole foods over shakes.'
  });

  // Progress Log form state
  const [newLog, setNewLog] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '', bodyFat: '', chest: '', waist: '', arms: '', thighs: '', notes: ''
  });

  // Bookkeeping Payment Modal Form
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    amount: '',
    method: 'UPI', // UPI, Cash, Card
    remarks: 'Subscription Fee'
  });

  // PT Configuration Modal State
  const [showPTForm, setShowPTForm] = useState(false);
  const [ptForm, setPtForm] = useState({
    isPT: false,
    ptSessionsPerWeek: 3,
    ptFees: 5000,
    ptStartDate: new Date().toISOString().split('T')[0],
    ptSchedule: '',
    ptSessionsCompleted: 0,
    ptSessionsTotal: 12
  });

  useEffect(() => {
    if (memberId) {
      loadProfileData();
    }
  }, [memberId]);

  const loadProfileData = async () => {
    try {
      const mem = await dbReadOne('members', memberId);
      if (!mem) return;
      setMember(mem);

      // Initialize PT Form values
      setPtForm({
        isPT: mem.isPT || false,
        ptSessionsPerWeek: mem.ptSessionsPerWeek || 3,
        ptFees: mem.ptFees || 5000,
        ptStartDate: mem.ptStartDate || new Date().toISOString().split('T')[0],
        ptSchedule: mem.ptSchedule || '',
        ptSessionsCompleted: mem.ptSessionsCompleted || 0,
        ptSessionsTotal: mem.ptSessionsTotal || 12
      });

      // 1. Fetch Workout Plan split
      const wList = await dbReadAll('workouts') || [];
      const wPlan = wList.find(w => w.memberId === memberId);
      if (wPlan && wPlan.schedule) {
        setWorkout(wPlan);
        
        // Parse workout split
        const parsed = {};
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        days.forEach(day => {
          const dayData = wPlan.schedule[day];
          if (dayData) {
            parsed[day] = {
              isRestDay: dayData.isRestDay === undefined ? (dayData === 'Rest' || dayData === 'Rest Day') : dayData.isRestDay,
              exercises: Array.isArray(dayData.exercises) ? dayData.exercises : []
            };
          } else {
            parsed[day] = { isRestDay: day === 'Sunday', exercises: [] };
          }
        });
        setWorkoutSchedule(parsed);
      }

      // 2. Fetch Diet Plan reference
      const dList = await dbReadAll('dietPlans') || [];
      const dPlan = dList.find(d => d.memberId === memberId);
      if (dPlan) {
        setDiet(dPlan);
        setDietForm({
          calories: dPlan.calories || 2200,
          protein: dPlan.protein || 140,
          carbs: dPlan.carbs || 220,
          fat: dPlan.fat || 70,
          waterIntake: dPlan.waterIntake || 3000,
          meals: dPlan.meals || dietForm.meals,
          supplements: dPlan.supplements || 'Creatine, Whey Protein, Fish Oil, Vitamin D',
          notes: dPlan.notes || ''
        });
      }

      // 3. Fetch progress logs
      const pList = await dbReadAll('progress') || [];
      const pLogs = pList.filter(p => p.memberId === memberId) || [];
      setProgressLogs(pLogs.sort((a, b) => new Date(a.date) - new Date(b.date)));

      // 4. Fetch Payments logs
      const allPayments = await dbReadAll('payments') || [];
      setPayments(allPayments.filter(p => p.memberId === memberId) || []);

      // 5. Fetch Attendance checklist
      const allAtt = await dbReadAll('attendance') || [];
      setAttendance(allAtt.filter(a => a.memberId === memberId).sort((a,b) => new Date(b.date) - new Date(a.date)));

      // 6. Fetch general settings
      const settingsObj = await dbReadOne('settings', 'settings');
      setGymSettings(settingsObj || {});

    } catch (e) {
      console.error("Error loading profile details", e);
    }
  };

  // Profile actions
  const handleDeactivateMember = async () => {
    if (!member) return;
    const newStatus = member.status === 'active' ? 'suspended' : 'active';
    if (window.confirm(`Are you sure you want to change this member's status to ${newStatus.toUpperCase()}?`)) {
      await dbUpdate('members', memberId, { status: newStatus });
      showToast('success', `Member status set to ${newStatus}`);
      loadProfileData();
      window.dispatchEvent(new Event('db-change'));
    }
  };

  const handleRenewMembership = async () => {
    if (!member) return;
    try {
      const planPrice = gymSettings?.membershipPlans?.find(p => p.name === member.membershipPlan)?.price || 2000;
      const duration = gymSettings?.membershipPlans?.find(p => p.name === member.membershipPlan)?.duration || 1;

      const newRenewal = new Date();
      newRenewal.setMonth(newRenewal.getMonth() + duration);
      const renewalStr = newRenewal.toISOString().split('T')[0];

      await dbUpdate('members', memberId, { status: 'active' });

      // Bookkeeping payment
      await dbCreate('payments', {
        id: `PAY-${memberId}-${Math.floor(1000 + Math.random() * 9000)}`,
        memberId,
        planType: member.membershipPlan,
        amount: planPrice,
        paymentDate: new Date().toISOString().split('T')[0],
        dueDate: renewalStr,
        status: 'paid',
        transactionId: 'UPI-RENEW-TABS'
      });

      showToast('success', `Membership renewed successfully! Next due date: ${renewalStr}`);
      loadProfileData();
      window.dispatchEvent(new Event('db-change'));
    } catch(e) {
      showToast('error', 'Renewal failed.');
    }
  };

  // PT Configuration save
  const handleSavePTEnrollment = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        isPT: ptForm.isPT,
        ptSessionsPerWeek: ptForm.isPT ? Number(ptForm.ptSessionsPerWeek) : 0,
        ptFees: ptForm.isPT ? Number(ptForm.ptFees) : 0,
        ptStartDate: ptForm.isPT ? ptForm.ptStartDate : '',
        ptSchedule: ptForm.isPT ? ptForm.ptSchedule : '',
        ptSessionsCompleted: ptForm.isPT ? Number(ptForm.ptSessionsCompleted) : 0,
        ptSessionsTotal: ptForm.isPT ? Number(ptForm.ptSessionsTotal) : 12
      };
      await dbUpdate('members', memberId, payload);
      showToast('success', "Personal Training configuration saved!");
      setShowPTForm(false);
      loadProfileData();
      window.dispatchEvent(new Event('db-change'));
    } catch (err) {
      showToast('error', "Failed to save PT configuration.");
    }
  };

  // Workout list modifiers
  const handleAddExercise = (day) => {
    const newEx = {
      id: String(Date.now()),
      name: '',
      sets: 4,
      reps: 10,
      weight: 60,
      notes: ''
    };
    setWorkoutSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        exercises: [...prev[day].exercises, newEx]
      }
    }));
  };

  const handleRemoveExercise = (day, exId) => {
    setWorkoutSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        exercises: prev[day].exercises.filter(ex => ex.id !== exId)
      }
    }));
  };

  const handleExerciseChange = (day, exId, field, value) => {
    setWorkoutSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        exercises: prev[day].exercises.map(ex => {
          if (ex.id === exId) {
            return { ...ex, [field]: value };
          }
          return ex;
        })
      }
    }));
  };

  const handleSaveWorkout = async (e) => {
    e.preventDefault();
    try {
      if (workout) {
        await dbUpdate('workouts', workout.id, { schedule: workoutSchedule });
      } else {
        await dbCreate('workouts', {
          id: `W-${memberId}`,
          memberId,
          schedule: workoutSchedule
        });
      }
      showToast('success', "Workout weekly split split saved successfully!");
      loadProfileData();
    } catch(err) {
      showToast('error', "Failed to save weekly split.");
    }
  };

  // Diet Save
  const handleSaveDiet = async (e) => {
    e.preventDefault();
    try {
      if (diet) {
        await dbUpdate('dietPlans', diet.id, dietForm);
      } else {
        await dbCreate('dietPlans', {
          id: `D-${memberId}`,
          memberId,
          ...dietForm
        });
      }
      showToast('success', "Nutrition and Diet Plan reference sheet saved!");
      loadProfileData();
    } catch (err) {
      showToast('error', "Failed to save Diet Plan.");
    }
  };

  // Progress Log Record
  const handleSaveProgressLog = async (e) => {
    e.preventDefault();
    try {
      const logId = `PROG-${memberId}-${Math.floor(1000 + Math.random() * 9000)}`;
      await dbCreate('progress', {
        id: logId,
        memberId,
        date: newLog.date,
        weight: Number(newLog.weight),
        bodyFat: Number(newLog.bodyFat) || 0,
        chest: Number(newLog.chest) || 0,
        waist: Number(newLog.waist) || 0,
        arms: Number(newLog.arms) || 0,
        thighs: Number(newLog.thighs) || 0,
        notes: newLog.notes
      });

      // Update current member weight
      await dbUpdate('members', memberId, { weight: Number(newLog.weight) });
      showToast('success', "Progress check-in logged!");
      setNewLog({
        date: new Date().toISOString().split('T')[0],
        weight: '', bodyFat: '', chest: '', waist: '', arms: '', thighs: '', notes: ''
      });
      loadProfileData();
      window.dispatchEvent(new Event('db-change'));
    } catch(err) {
      showToast('error', "Failed to save progress log.");
    }
  };

  // Record manual bookkeeping payment
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      const planPrice = gymSettings?.membershipPlans?.find(p => p.name === member.membershipPlan)?.price || 2000;
      const duration = gymSettings?.membershipPlans?.find(p => p.name === member.membershipPlan)?.duration || 1;

      const due = new Date(paymentForm.paymentDate);
      due.setMonth(due.getMonth() + duration);
      const dueDateStr = due.toISOString().split('T')[0];

      await dbCreate('payments', {
        id: `PAY-${memberId}-${Math.floor(1000 + Math.random() * 9000)}`,
        memberId,
        planType: member.membershipPlan,
        amount: Number(paymentForm.amount),
        paymentDate: paymentForm.paymentDate,
        dueDate: dueDateStr,
        status: 'paid',
        transactionId: `${paymentForm.method.toUpperCase()}-BOOK`
      });

      await dbUpdate('members', memberId, { status: 'active' });
      showToast('success', "Payment transaction recorded successfully!");
      setShowPaymentModal(false);
      setPaymentForm({
        paymentDate: new Date().toISOString().split('T')[0],
        amount: '',
        method: 'UPI',
        remarks: 'Subscription Fee'
      });
      loadProfileData();
      window.dispatchEvent(new Event('db-change'));
    } catch (err) {
      showToast('error', "Failed to record payment.");
    }
  };

  if (!member) {
    return <div className="card-glass text-center" style={{ padding: '3rem' }}>Loading Member Profile Details...</div>;
  }

  // Attendance metrics calculations
  const totalAtt = attendance.length;
  const presentDays = attendance.filter(a => a.status === 'present').length;
  const lateEntries = attendance.filter(a => a.status === 'late').length;
  const absentDays = attendance.filter(a => a.status === 'absent').length;
  const attendancePct = totalAtt > 0 ? Math.round(((presentDays + lateEntries) / totalAtt) * 100) : 0;

  // Render Tabs Content
  const renderProfileTab = () => (
    <div className="tab-panel-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
      
      {/* Basic Contact details */}
      <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '16px' }}>
        <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>Basic & Contact Details</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.9rem' }}>
          <div><span style={{ color: 'var(--text-secondary)' }}>Member ID:</span> <strong style={{ color: '#fff', fontFamily: 'monospace' }}>{member.id}</strong></div>
          <div><span style={{ color: 'var(--text-secondary)' }}>Full Name:</span> <strong style={{ color: '#fff' }}>{member.fullName}</strong></div>
          <div><span style={{ color: 'var(--text-secondary)' }}>Mobile Number:</span> <strong style={{ color: '#fff' }}>{member.mobileNumber}</strong></div>
          <div><span style={{ color: 'var(--text-secondary)' }}>Email Address:</span> <strong style={{ color: '#fff' }}>{member.email || '--'}</strong></div>
          <div><span style={{ color: 'var(--text-secondary)' }}>Home Address:</span> <strong style={{ color: '#fff' }}>{member.address || '--'}</strong></div>
          <div><span style={{ color: 'var(--text-secondary)' }}>Date of Birth:</span> <strong style={{ color: '#fff' }}>{member.dob || '--'}</strong></div>
          <div><span style={{ color: 'var(--text-secondary)' }}>Emergency Contact:</span> <strong style={{ color: '#fff' }}>{member.emergencyContact}</strong></div>
        </div>
      </div>

      {/* Fitness and Notes */}
      <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '16px' }}>
        <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>Fitness & Health Details</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.9rem', marginBottom: '1rem' }}>
          <div><span style={{ color: 'var(--text-secondary)' }}>Age / Gender:</span> <strong style={{ color: '#fff' }}>{member.dob ? `${new Date().getFullYear() - new Date(member.dob).getFullYear()} Years` : '--'} / {member.gender}</strong></div>
          <div><span style={{ color: 'var(--text-secondary)' }}>Height / Weight:</span> <strong style={{ color: '#fff' }}>{member.height ? `${member.height} cm` : '--'} / {member.weight ? `${member.weight} kg` : '--'}</strong></div>
          <div><span style={{ color: 'var(--text-secondary)' }}>Blood Group:</span> <strong style={{ color: '#fff' }}>{member.bloodGroup || '--'}</strong></div>
          <div><span style={{ color: 'var(--text-secondary)' }}>Medical Conditions:</span> <strong style={{ color: '#EF4444' }}>{member.medicalConditions || 'None'}</strong></div>
          <div><span style={{ color: 'var(--text-secondary)' }}>Trainer Notes:</span> <p style={{ fontStyle: 'italic', marginTop: '4px', color: 'var(--text-secondary)' }}>{member.trainerNotes || 'No notes added.'}</p></div>
        </div>
      </div>

      {/* Membership and actions */}
      <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.1rem' }}>Membership Details</h3>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '0.75rem', borderRadius: '8px' }}>
          <div><span style={{ color: 'var(--text-secondary)' }}>Plan:</span> <strong style={{ color: '#fff' }}>{member.membershipPlan}</strong></div>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>Status:</span> 
            <span className={`badge ${member.status === 'active' ? 'badge-success' : 'badge-danger'}`} style={{ marginLeft: '6px' }}>
              {member.status.toUpperCase()}
            </span>
          </div>
          <div><span style={{ color: 'var(--text-secondary)' }}>PT Client:</span> <strong style={{ color: '#fff' }}>{member.isPT ? 'Yes' : 'No'}</strong></div>
          {member.isPT && (
            <div><span style={{ color: 'var(--text-secondary)' }}>PT Schedule:</span> <strong style={{ color: '#fff' }}>{member.ptSchedule}</strong></div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
          <button className="btn-primary" onClick={handleRenewMembership}>Renew Membership</button>
          
          <button className="btn-secondary" onClick={() => {
            setPtForm({
              isPT: member.isPT || false,
              ptSessionsPerWeek: member.ptSessionsPerWeek || 3,
              ptFees: member.ptFees || 5000,
              ptStartDate: member.ptStartDate || new Date().toISOString().split('T')[0],
              ptSchedule: member.ptSchedule || '',
              ptSessionsCompleted: member.ptSessionsCompleted || 0,
              ptSessionsTotal: member.ptSessionsTotal || 12
            });
            setShowPTForm(true);
          }}>
            {member.isPT ? 'Configure PT Pack' : 'Enroll in PT'}
          </button>

          <button className="btn-secondary" onClick={handleDeactivateMember} style={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.2)' }}>
            {member.status === 'active' ? 'Deactivate Member' : 'Activate Member'}
          </button>
        </div>
      </div>

    </div>
  );

  const renderWorkoutTab = () => (
    <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.15rem' }}>Workout Split Reference</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Manage exercises, sets, reps, and target loads.</span>
        </div>
      </div>

      <form onSubmit={handleSaveWorkout} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
          const split = workoutSchedule[day] || { isRestDay: false, exercises: [] };

          return (
            <div key={day} className="card-glass" style={{ padding: '1rem', borderRadius: '12px', borderLeft: split.isRestDay ? '4px solid var(--text-muted)' : '4px solid var(--color-primary)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>{day}</h4>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input 
                    type="checkbox" 
                    checked={split.isRestDay} 
                    onChange={(e) => {
                      const val = e.target.checked;
                      setWorkoutSchedule(prev => ({
                        ...prev,
                        [day]: { ...prev[day], isRestDay: val }
                      }));
                    }}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span>Rest Day</span>
                </label>
              </div>

              {!split.isRestDay ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  
                  {/* Exercises List table/inputs */}
                  {split.exercises.map((ex, idx) => (
                    <div key={ex.id || idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1.5fr 3fr auto', gap: '8px', alignItems: 'center' }} className="mobile-column-grid">
                      <input 
                        type="text" 
                        placeholder="Exercise Name" 
                        value={ex.name} 
                        onChange={(e) => handleExerciseChange(day, ex.id, 'name', e.target.value)} 
                        style={{ height: '36px', minHeight: '36px', fontSize: '0.85rem', padding: '0 0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '6px' }}
                      />
                      <input 
                        type="number" 
                        placeholder="Sets" 
                        value={ex.sets} 
                        onChange={(e) => handleExerciseChange(day, ex.id, 'sets', Number(e.target.value))} 
                        style={{ height: '36px', minHeight: '36px', fontSize: '0.85rem', padding: '0 0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '6px' }}
                      />
                      <input 
                        type="text" 
                        placeholder="Reps" 
                        value={ex.reps} 
                        onChange={(e) => handleExerciseChange(day, ex.id, 'reps', e.target.value)} 
                        style={{ height: '36px', minHeight: '36px', fontSize: '0.85rem', padding: '0 0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '6px' }}
                      />
                      <input 
                        type="number" 
                        placeholder="Weight (kg)" 
                        value={ex.weight} 
                        onChange={(e) => handleExerciseChange(day, ex.id, 'weight', Number(e.target.value))} 
                        style={{ height: '36px', minHeight: '36px', fontSize: '0.85rem', padding: '0 0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '6px' }}
                      />
                      <input 
                        type="text" 
                        placeholder="Coaching notes (e.g. Flat Bench)" 
                        value={ex.notes} 
                        onChange={(e) => handleExerciseChange(day, ex.id, 'notes', e.target.value)} 
                        style={{ height: '36px', minHeight: '36px', fontSize: '0.85rem', padding: '0 0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '6px' }}
                      />
                      <button type="button" className="btn-icon" onClick={() => handleRemoveExercise(day, ex.id)} style={{ color: '#EF4444' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}

                  <button type="button" className="btn-secondary" onClick={() => handleAddExercise(day)} style={{ alignSelf: 'flex-start', padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                    <Plus size={14} />
                    <span>Add Exercise</span>
                  </button>

                </div>
              ) : (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '0.5rem 0' }}>💤 Rest day split. No exercises assigned.</div>
              )}

            </div>
          );
        })}

        <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-end', padding: '0.6rem 2rem' }}>
          Save Weekly Split
        </button>

      </form>
    </div>
  );

  const renderDietTab = () => (
    <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '16px' }}>
      <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.15rem', marginBottom: '0.4rem' }}>Diet & Nutrition Reference</h3>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Manage macro goals, meal components, and supplements.</span>

      <form onSubmit={handleSaveDiet} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
        
        {/* Macros split cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.8rem' }}>
          
          <div className="card-glass" style={{ padding: '1rem', borderLeft: '4px solid #8B5CF6', background: 'rgba(139,92,246,0.02)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>CALORIES</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
              <input 
                type="number" 
                value={dietForm.calories} 
                onChange={(e) => setDietForm({ ...dietForm, calories: Number(e.target.value) })}
                style={{ background: 'none', border: 'none', fontSize: '1.35rem', fontWeight: 700, color: '#fff', width: '80px', padding: 0, minHeight: 'auto' }} 
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>kcal</span>
            </div>
          </div>

          <div className="card-glass" style={{ padding: '1rem', borderLeft: '4px solid #10B981', background: 'rgba(16,185,129,0.02)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>PROTEIN</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
              <input 
                type="number" 
                value={dietForm.protein} 
                onChange={(e) => setDietForm({ ...dietForm, protein: Number(e.target.value) })}
                style={{ background: 'none', border: 'none', fontSize: '1.35rem', fontWeight: 700, color: '#fff', width: '60px', padding: 0, minHeight: 'auto' }} 
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>g</span>
            </div>
          </div>

          <div className="card-glass" style={{ padding: '1rem', borderLeft: '4px solid #F59E0B', background: 'rgba(245,158,11,0.02)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>CARBS</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
              <input 
                type="number" 
                value={dietForm.carbs} 
                onChange={(e) => setDietForm({ ...dietForm, carbs: Number(e.target.value) })}
                style={{ background: 'none', border: 'none', fontSize: '1.35rem', fontWeight: 700, color: '#fff', width: '60px', padding: 0, minHeight: 'auto' }} 
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>g</span>
            </div>
          </div>

          <div className="card-glass" style={{ padding: '1rem', borderLeft: '4px solid #EF4444', background: 'rgba(239,68,68,0.02)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>FAT</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
              <input 
                type="number" 
                value={dietForm.fat} 
                onChange={(e) => setDietForm({ ...dietForm, fat: Number(e.target.value) })}
                style={{ background: 'none', border: 'none', fontSize: '1.35rem', fontWeight: 700, color: '#fff', width: '60px', padding: 0, minHeight: 'auto' }} 
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>g</span>
            </div>
          </div>

          <div className="card-glass" style={{ padding: '1rem', borderLeft: '4px solid #3B82F6', background: 'rgba(59,130,246,0.02)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>WATER INTAKE</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
              <input 
                type="number" 
                value={dietForm.waterIntake} 
                onChange={(e) => setDietForm({ ...dietForm, waterIntake: Number(e.target.value) })}
                style={{ background: 'none', border: 'none', fontSize: '1.35rem', fontWeight: 700, color: '#fff', width: '70px', padding: 0, minHeight: 'auto' }} 
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ml</span>
            </div>
          </div>

        </div>

        {/* Meal split grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {['Breakfast', 'Lunch', 'Snack', 'Dinner'].map(meal => {
            const mealData = dietForm.meals[meal] || { food: '', quantity: '', notes: '' };

            return (
              <div key={meal} className="card-glass" style={{ padding: '1rem', borderRadius: '12px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.8rem' }}>{meal}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="Food items (e.g. Oatmeal & Eggs)" 
                    value={mealData.food} 
                    onChange={(e) => setDietForm({
                      ...dietForm,
                      meals: {
                        ...dietForm.meals,
                        [meal]: { ...mealData, food: e.target.value }
                      }
                    })}
                    style={{ height: '36px', padding: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                  <input 
                    type="text" 
                    placeholder="Quantity (e.g. 50g oats, 4 egg whites)" 
                    value={mealData.quantity} 
                    onChange={(e) => setDietForm({
                      ...dietForm,
                      meals: {
                        ...dietForm.meals,
                        [meal]: { ...mealData, quantity: e.target.value }
                      }
                    })}
                    style={{ height: '36px', padding: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                  <input 
                    type="text" 
                    placeholder="Meal specific notes" 
                    value={mealData.notes} 
                    onChange={(e) => setDietForm({
                      ...dietForm,
                      meals: {
                        ...dietForm.meals,
                        [meal]: { ...mealData, notes: e.target.value }
                      }
                    })}
                    style={{ height: '36px', padding: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Supplements & Diet Notes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }} className="mobile-column-grid">
          <div className="form-group">
            <label>Supplements Checklist</label>
            <input 
              type="text" 
              placeholder="e.g. Creatine, Whey Protein, Fish Oil, Vitamin D" 
              value={dietForm.supplements} 
              onChange={(e) => setDietForm({ ...dietForm, supplements: e.target.value })}
              style={{ minHeight: '44px' }}
            />
          </div>
          <div className="form-group">
            <label>Diet Split Notes</label>
            <textarea 
              rows="2" 
              placeholder="Free text instructions..." 
              value={dietForm.notes} 
              onChange={(e) => setDietForm({ ...dietForm, notes: e.target.value })}
            />
          </div>
        </div>

        <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-end', padding: '0.6rem 2rem' }}>
          Save Diet Split
        </button>

      </form>
    </div>
  );

  const renderProgressTab = () => {
    // Compile weights trend
    const sortedLogs = [...progressLogs].sort((a,b) => new Date(a.date) - new Date(b.date));
    const labels = sortedLogs.map(l => l.date);
    const weights = sortedLogs.map(l => l.weight);
    const fatPct = sortedLogs.map(l => l.bodyFat);

    const chartData = {
      labels,
      datasets: [
        {
          label: 'Weight (kg)',
          data: weights,
          borderColor: '#8B5CF6',
          backgroundColor: 'rgba(139, 92, 246, 0.05)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Body Fat (%)',
          data: fatPct,
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.05)',
          tension: 0.4,
          fill: true
        }
      ]
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Form measurements details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          
          <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>Record Transformation Progress</h3>
            
            <form onSubmit={handleSaveProgressLog} className="responsive-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div className="form-group">
                  <label>Record Date</label>
                  <input type="date" required value={newLog.date} onChange={(e) => setNewLog({ ...newLog, date: e.target.value })} style={{ minHeight: '40px' }} />
                </div>
                <div className="form-group">
                  <label>Weight (kg) *</label>
                  <input type="number" step="0.1" required value={newLog.weight} onChange={(e) => setNewLog({ ...newLog, weight: e.target.value })} placeholder="72" style={{ minHeight: '40px' }} />
                </div>
              </div>

              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                <div className="form-group">
                  <label>Chest (cm)</label>
                  <input type="number" step="0.1" value={newLog.chest} onChange={(e) => setNewLog({ ...newLog, chest: e.target.value })} style={{ minHeight: '40px' }} />
                </div>
                <div className="form-group">
                  <label>Waist (cm)</label>
                  <input type="number" step="0.1" value={newLog.waist} onChange={(e) => setNewLog({ ...newLog, waist: e.target.value })} style={{ minHeight: '40px' }} />
                </div>
                <div className="form-group">
                  <label>Body Fat (%)</label>
                  <input type="number" step="0.1" value={newLog.bodyFat} onChange={(e) => setNewLog({ ...newLog, bodyFat: e.target.value })} placeholder="14" style={{ minHeight: '40px' }} />
                </div>
              </div>

              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div className="form-group">
                  <label>Arms (cm)</label>
                  <input type="number" step="0.1" value={newLog.arms} onChange={(e) => setNewLog({ ...newLog, arms: e.target.value })} style={{ minHeight: '40px' }} />
                </div>
                <div className="form-group">
                  <label>Thigh (cm)</label>
                  <input type="number" step="0.1" value={newLog.thighs} onChange={(e) => setNewLog({ ...newLog, thighs: e.target.value })} style={{ minHeight: '40px' }} />
                </div>
              </div>

              <div className="form-group">
                <label>Progress Notes</label>
                <input type="text" placeholder="Feels stronger, vascularity improvements..." value={newLog.notes} onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })} style={{ minHeight: '40px' }} />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%' }}>Log Transformation Entry</button>
            </form>
          </div>

          {/* Transformation progress checklist/summary */}
          <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>Transformation Metrics Overview</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', flex: 1 }}>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Starting Weight:</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>{progressLogs[0]?.weight ? `${progressLogs[0].weight} kg` : '--'}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Latest Weight:</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>{progressLogs[progressLogs.length - 1]?.weight ? `${progressLogs[progressLogs.length - 1].weight} kg` : '--'}</div>
              </div>
            </div>
          </div>

        </div>

        {/* Charts and measurements timeline */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1.5rem' }} className="mobile-column-grid">
          
          <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '16px' }}>
            <h4 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1rem', marginBottom: '1rem' }}>Weight & Body Fat Trend</h4>
            {progressLogs.length > 0 ? (
              <div style={{ height: '240px', position: 'relative' }}>
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
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Log progress details to display charts.</div>
            )}
          </div>

          {/* Measurements timeline grid */}
          <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>Measurements Log Timeline</h4>
            <div style={{ flex: 1, maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {progressLogs.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>No progress entries logged yet.</div>
              ) : (
                [...progressLogs].reverse().map(log => (
                  <div key={log.id} style={{ padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong>{log.date}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>W: {log.weight} kg • Fat: {log.bodyFat || '--'}%</span>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>C:{log.chest || '--'} W:{log.waist || '--'} A:{log.arms || '--'} T:{log.thighs || '--'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    );
  };

  const renderPaymentsTab = () => {
    // Current totals
    const planPrice = gymSettings?.membershipPlans?.find(p => p.name === member.membershipPlan)?.price || 2000;
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Stats card */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <div className="card-glass" style={{ padding: '1.25rem', borderLeft: '4px solid var(--color-primary)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>MEMBERSHIP FEE</span>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: '4px' }}>₹{planPrice.toLocaleString()}</h3>
          </div>
          <div className="card-glass" style={{ padding: '1.25rem', borderLeft: '4px solid #10B981' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TOTAL PAID AMOUNT</span>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: '4px' }}>₹{totalPaid.toLocaleString()}</h3>
          </div>
          <div className="card-glass" style={{ padding: '1.25rem', borderLeft: '4px solid #F59E0B' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>RENEWAL DUE DATE</span>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: '4px', fontFamily: 'monospace' }}>
              {payments.length > 0 ? payments.sort((a,b) => new Date(b.dueDate) - new Date(a.dueDate))[0].dueDate : '--'}
            </h3>
          </div>
        </div>

        {/* Payments history bookkeeping */}
        <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '16px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Payment Ledger History</h4>
            <button className="btn-primary" onClick={() => setShowPaymentModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '4px', minHeight: '36px', padding: '0 0.8rem', fontSize: '0.8rem' }}>
              <Plus size={14} />
              <span>Record Payment</span>
            </button>
          </div>

          <div className="table-responsive">
            <table className="table-custom" style={{ width: '100%' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.01)' }}>
                  <th style={{ padding: '0.8rem' }}>Date</th>
                  <th style={{ padding: '0.8rem' }}>Amount</th>
                  <th style={{ padding: '0.8rem' }}>Method</th>
                  <th style={{ padding: '0.8rem' }}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No transactions found in database logs.</td>
                  </tr>
                ) : (
                  [...payments].sort((a,b) => new Date(b.paymentDate) - new Date(a.paymentDate)).map(pay => (
                    <tr key={pay.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.8rem', fontFamily: 'monospace' }}>{pay.paymentDate}</td>
                      <td style={{ padding: '0.8rem', fontWeight: 600, color: 'var(--color-primary)' }}>₹{pay.amount.toLocaleString()}</td>
                      <td style={{ padding: '0.8rem' }}>{pay.transactionId?.split('-')[0] || 'UPI'}</td>
                      <td style={{ padding: '0.8rem', color: 'var(--text-secondary)' }}>{pay.remarks || 'Subscription Fee Payment'}</td>
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

  const renderAttendanceTab = () => {
    // Generate monthly calendar checklist
    const generateCalendarDays = () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth(); // 0-indexed
      
      const firstDay = new Date(year, month, 1).getDay(); // day of week
      const totalDays = new Date(year, month + 1, 0).getDate(); // days count

      const grid = [];
      // Fill empty slots for previous month overflow
      for (let i = 0; i < firstDay; i++) {
        grid.push({ type: 'empty' });
      }

      // Fill current month days
      for (let d = 1; d <= totalDays; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const att = attendance.find(a => a.date === dateStr);
        
        let status = 'none';
        if (att) {
          status = att.status; // present, absent, late
        }

        grid.push({
          type: 'day',
          day: d,
          dateStr,
          status
        });
      }

      return grid;
    };

    const calendarGrid = generateCalendarDays();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Summary metric rows */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          
          <div className="card-glass" style={{ padding: '1.25rem', borderLeft: '4px solid var(--color-primary)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ATTENDANCE RATE</span>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: '4px' }}>{attendancePct}%</h3>
          </div>
          
          <div className="card-glass" style={{ padding: '1.25rem', borderLeft: '4px solid #10B981' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>PRESENT DAYS</span>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: '4px', color: '#10B981' }}>{presentDays} Days</h3>
          </div>

          <div className="card-glass" style={{ padding: '1.25rem', borderLeft: '4px solid #F59E0B' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>LATE ENTRIES</span>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: '4px', color: '#F59E0B' }}>{lateEntries} Times</h3>
          </div>

          <div className="card-glass" style={{ padding: '1.25rem', borderLeft: '4px solid #EF4444' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ABSENT DAYS</span>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: '4px', color: '#EF4444' }}>{absentDays} Days</h3>
          </div>

        </div>

        {/* Calendar and table checklist layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="mobile-column-grid">
          
          {/* Monthly Calendar layout */}
          <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '16px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>{monthNames[new Date().getMonth()]} Checklist Calendar</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
              {calendarGrid.map((cell, idx) => {
                if (cell.type === 'empty') {
                  return <div key={idx} style={{ height: '36px' }}></div>;
                }
                
                let bg = 'rgba(255,255,255,0.03)';
                let color = 'var(--text-secondary)';
                if (cell.status === 'present') {
                  bg = '#10B981';
                  color = '#fff';
                } else if (cell.status === 'late') {
                  bg = '#F59E0B';
                  color = '#fff';
                } else if (cell.status === 'absent') {
                  bg = '#EF4444';
                  color = '#fff';
                }

                return (
                  <div 
                    key={idx} 
                    style={{ height: '36px', background: bg, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}
                    title={`${cell.dateStr}: ${cell.status}`}
                  >
                    {cell.day}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '10px', height: '10px', background: '#10B981', borderRadius: '2px' }}></div>Present</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '10px', height: '10px', background: '#F59E0B', borderRadius: '2px' }}></div>Late</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '10px', height: '10px', background: '#EF4444', borderRadius: '2px' }}></div>Absent</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '10px', height: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '2px' }}></div>No Visit</div>
            </div>
          </div>

          {/* History table checklist */}
          <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Attendance History Ledger</h4>
            <div style={{ flex: 1, maxHeight: '280px', overflowY: 'auto' }}>
              <table className="table-custom" style={{ width: '100%' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.01)' }}>
                    <th style={{ padding: '0.6rem' }}>Date</th>
                    <th style={{ padding: '0.6rem' }}>Check In</th>
                    <th style={{ padding: '0.6rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No attendance entries logged.</td>
                    </tr>
                  ) : (
                    attendance.map(att => (
                      <tr key={att.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.6rem', fontFamily: 'monospace' }}>{att.date}</td>
                        <td style={{ padding: '0.6rem', fontFamily: 'monospace' }}>{att.checkInTime || '--'}</td>
                        <td style={{ padding: '0.6rem' }}>
                          <span className={`badge ${att.status === 'present' ? 'badge-success' : att.status === 'late' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
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

        </div>

      </div>
    );
  };

  return (
    <div className="member-profile-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Back button toolbar */}
      <button className="btn-secondary" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '4px', alignSelf: 'flex-start', padding: '0.5rem 1rem' }}>
        <ChevronLeft size={16} />
        <span>Back to Members</span>
      </button>

      {/* Header banner */}
      <div className="profile-header card-glass" style={{ display: 'flex', gap: '1.25rem', padding: '1.25rem', borderRadius: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.25rem', border: '2px solid var(--color-primary)' }}>
          {member.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-outfit)' }}>{member.fullName}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
            Goal: <strong style={{ color: '#fff' }}>{member.fitnessGoal}</strong> | Plan: <strong style={{ color: '#fff' }}>{member.membershipPlan}</strong>
          </p>
        </div>
      </div>

      {/* Tabs Menu Navigation Bar */}
      <div className="tabs-menu" style={{ display: 'flex', gap: '6px', borderBottom: '1px solid rgba(255,255,255,0.08)', overflowX: 'auto', paddingBottom: '0.5rem', width: '100%', WebkitOverflowScrolling: 'touch' }}>
        
        <button className={`profile-tab-item tab-link ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.6rem 1.1rem', background: activeTab === 'profile' ? 'rgba(139, 92, 246, 0.1)' : 'none', border: 'none', borderRadius: '20px', color: activeTab === 'profile' ? 'var(--color-primary)' : '#fff', cursor: 'pointer', fontWeight: 600, flexShrink: 0 }}>
          <User size={15} />
          <span>Profile</span>
        </button>

        <button className={`profile-tab-item tab-link ${activeTab === 'workout' ? 'active' : ''}`} onClick={() => setActiveTab('workout')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.6rem 1.1rem', background: activeTab === 'workout' ? 'rgba(139, 92, 246, 0.1)' : 'none', border: 'none', borderRadius: '20px', color: activeTab === 'workout' ? 'var(--color-primary)' : '#fff', cursor: 'pointer', fontWeight: 600, flexShrink: 0 }}>
          <Dumbbell size={15} />
          <span>Workout</span>
        </button>

        <button className={`profile-tab-item tab-link ${activeTab === 'diet' ? 'active' : ''}`} onClick={() => setActiveTab('diet')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.6rem 1.1rem', background: activeTab === 'diet' ? 'rgba(139, 92, 246, 0.1)' : 'none', border: 'none', borderRadius: '20px', color: activeTab === 'diet' ? 'var(--color-primary)' : '#fff', cursor: 'pointer', fontWeight: 600, flexShrink: 0 }}>
          <Apple size={15} />
          <span>Diet</span>
        </button>

        <button className={`profile-tab-item tab-link ${activeTab === 'progress' ? 'active' : ''}`} onClick={() => setActiveTab('progress')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.6rem 1.1rem', background: activeTab === 'progress' ? 'rgba(139, 92, 246, 0.1)' : 'none', border: 'none', borderRadius: '20px', color: activeTab === 'progress' ? 'var(--color-primary)' : '#fff', cursor: 'pointer', fontWeight: 600, flexShrink: 0 }}>
          <LineChart size={15} />
          <span>Progress</span>
        </button>

        <button className={`profile-tab-item tab-link ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => setActiveTab('billing')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.6rem 1.1rem', background: activeTab === 'billing' ? 'rgba(139, 92, 246, 0.1)' : 'none', border: 'none', borderRadius: '20px', color: activeTab === 'billing' ? 'var(--color-primary)' : '#fff', cursor: 'pointer', fontWeight: 600, flexShrink: 0 }}>
          <CreditCard size={15} />
          <span>Payments</span>
        </button>

        <button className={`profile-tab-item tab-link ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.6rem 1.1rem', background: activeTab === 'attendance' ? 'rgba(139, 92, 246, 0.1)' : 'none', border: 'none', borderRadius: '20px', color: activeTab === 'attendance' ? 'var(--color-primary)' : '#fff', cursor: 'pointer', fontWeight: 600, flexShrink: 0 }}>
          <Activity size={15} />
          <span>Attendance</span>
        </button>

      </div>

      {/* RENDER ACTIVE TAB */}
      <div className="tab-panels">
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'workout' && renderWorkoutTab()}
        {activeTab === 'diet' && renderDietTab()}
        {activeTab === 'progress' && renderProgressTab()}
        {activeTab === 'billing' && renderPaymentsTab()}
        {activeTab === 'attendance' && renderAttendanceTab()}
      </div>

      {/* RECORD PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 2000 }}>
          <div className="modal-card card-glass" style={{ display: 'block', maxWidth: '440px', width: '90%', padding: '1.5rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Record Manual Payment</h3>
              <button className="btn-icon" onClick={() => setShowPaymentModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleRecordPayment} className="responsive-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Amount Received (₹) *</label>
                <input 
                  type="number" 
                  required 
                  value={paymentForm.amount} 
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} 
                />
              </div>
              <div className="form-group">
                <label>Payment Date</label>
                <input 
                  type="date" 
                  value={paymentForm.paymentDate} 
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })} 
                />
              </div>
              <div className="form-group">
                <label>Payment Method</label>
                <select value={paymentForm.method} onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}>
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                </select>
              </div>
              <div className="form-group">
                <label>Remarks</label>
                <input 
                  type="text" 
                  value={paymentForm.remarks} 
                  onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })} 
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIGURE PT MODAL */}
      {showPTForm && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 2000 }}>
          <div className="modal-card card-glass" style={{ display: 'block', maxWidth: '440px', width: '90%', padding: '1.5rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Personal Training Enrolment</h3>
              <button className="btn-icon" onClick={() => setShowPTForm(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSavePTEnrollment} className="responsive-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="checkbox" 
                  id="modalIsPT" 
                  checked={ptForm.isPT} 
                  onChange={(e) => setPtForm({ ...ptForm, isPT: e.target.checked })} 
                  style={{ width: '20px', height: '20px' }}
                />
                <label htmlFor="modalIsPT" style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>Enable PT</label>
              </div>

              {ptForm.isPT && (
                <>
                  <div className="form-group">
                    <label>Sessions Per Week</label>
                    <select value={ptForm.ptSessionsPerWeek} onChange={(e) => setPtForm({ ...ptForm, ptSessionsPerWeek: Number(e.target.value) })}>
                      <option value="2">2 sessions/week</option>
                      <option value="3">3 sessions/week</option>
                      <option value="4">4 sessions/week</option>
                      <option value="5">5 sessions/week</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>PT Fee (₹)</label>
                    <input 
                      type="number" 
                      value={ptForm.ptFees} 
                      onChange={(e) => setPtForm({ ...ptForm, ptFees: e.target.value })} 
                    />
                  </div>
                  <div className="form-group">
                    <label>PT Slot Schedule</label>
                    <select value={ptForm.ptSchedule} onChange={(e) => setPtForm({ ...ptForm, ptSchedule: e.target.value })}>
                      <option value="">Choose slot...</option>
                      {gymSettings?.ptSlots?.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      )) || (
                        <option value="06:00 AM - 07:00 AM">06:00 AM - 07:00 AM</option>
                      )}
                    </select>
                  </div>
                  <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                      <label>Sessions Completed</label>
                      <input 
                        type="number" 
                        value={ptForm.ptSessionsCompleted} 
                        onChange={(e) => setPtForm({ ...ptForm, ptSessionsCompleted: Number(e.target.value) })} 
                      />
                    </div>
                    <div className="form-group">
                      <label>Total Pack Sessions</label>
                      <input 
                        type="number" 
                        value={ptForm.ptSessionsTotal} 
                        onChange={(e) => setPtForm({ ...ptForm, ptSessionsTotal: Number(e.target.value) })} 
                      />
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowPTForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Config</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
