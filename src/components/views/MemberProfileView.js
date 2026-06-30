'use client';

import React, { useState, useEffect } from 'react';
import { dbReadOne, dbReadAll, dbCreate, dbUpdate, dbDelete } from '@/lib/db';
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
  FileText,
  Lock,
  Star,
  Search as SearchIcon,
  ArrowUpDown,
  Copy,
  FolderHeart,
  ChevronRight,
  ClipboardList
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
  const [rescheduledLogs, setRescheduledLogs] = useState([]);
  const [gymSettings, setGymSettings] = useState(null);
  const [workoutTemplates, setWorkoutTemplates] = useState([]);

  // Workout Split State (Monday to Sunday detailed cards with exercises)
  const [workoutPlanName, setWorkoutPlanName] = useState('Custom Split');
  const [workoutDifficulty, setWorkoutDifficulty] = useState('Intermediate');
  const [workoutSchedule, setWorkoutSchedule] = useState({
    Monday: { isRestDay: false, workoutName: 'Chest + Triceps', exercises: [] },
    Tuesday: { isRestDay: false, workoutName: 'Back + Biceps', exercises: [] },
    Wednesday: { isRestDay: false, workoutName: 'Legs', exercises: [] },
    Thursday: { isRestDay: false, workoutName: 'Shoulders', exercises: [] },
    Friday: { isRestDay: false, workoutName: 'Chest + Arms', exercises: [] },
    Saturday: { isRestDay: false, workoutName: 'Cardio + Core', exercises: [] },
    Sunday: { isRestDay: true, workoutName: 'Rest', exercises: [] }
  });

  const [selectedDay, setSelectedDay] = useState('Monday');

  // Workout Splits Library Modal States
  const [showSplitsLibrary, setShowSplitsLibrary] = useState(false);
  const [splitsSearchTerm, setSplitsSearchTerm] = useState('');
  const [splitsSortBy, setSplitsSortBy] = useState('name');
  const [favorites, setFavorites] = useState([]);

  // Apply template confirm overlay
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);
  const [templateToApply, setTemplateToApply] = useState(null);

  // Smart Reschedule Modal States
  const [showSmartReschedule, setShowSmartReschedule] = useState(false);
  const [targetRescheduleLog, setTargetRescheduleLog] = useState(null);
  const [rescheduleOption, setRescheduleOption] = useState('tomorrow'); // tomorrow, custom-date, end-of-week, next-workout-day
  const [customRescheduleDate, setCustomRescheduleDate] = useState(new Date().toISOString().split('T')[0]);

  // Edit Reschedule Log Modal States
  const [showEditRescheduleModal, setShowEditRescheduleModal] = useState(false);
  const [editRescheduleData, setEditRescheduleData] = useState({
    id: '',
    status: 'Missed',
    rescheduledTo: '',
    workoutName: '',
    note: ''
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
      if (wPlan) {
        setWorkout(wPlan);
        setWorkoutPlanName(wPlan.planName || 'Custom Split');
        setWorkoutDifficulty(wPlan.difficulty || 'Intermediate');
        
        // Parse workout split
        const parsed = {};
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        days.forEach(day => {
          const dayVal = wPlan.schedule?.[day];
          if (dayVal && typeof dayVal === 'object') {
            parsed[day] = {
              isRestDay: dayVal.isRestDay || false,
              workoutName: dayVal.workoutName || '',
              exercises: Array.isArray(dayVal.exercises) ? dayVal.exercises : []
            };
          } else {
            const isRest = dayVal === 'Rest' || dayVal === 'Rest Day' || day === 'Sunday';
            parsed[day] = {
              isRestDay: isRest,
              workoutName: isRest ? '' : (typeof dayVal === 'string' ? dayVal : ''),
              exercises: []
            };
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

      // 6. Fetch Rescheduled workouts log
      const resList = await dbReadAll('rescheduledWorkouts') || [];
      setRescheduledLogs(resList.filter(r => r.memberId === memberId) || []);

      // 7. Fetch Workout Splits Templates
      const tmplList = await dbReadAll('workoutTemplates') || [];
      setWorkoutTemplates(tmplList);

      // 8. Fetch general settings
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

  // Workout Schedule Save
  const handleSaveWorkout = async (e) => {
    if (e) e.preventDefault();
    try {
      if (workout) {
        await dbUpdate('workouts', workout.id, { 
          planName: workoutPlanName,
          difficulty: workoutDifficulty,
          schedule: workoutSchedule 
        });
      } else {
        await dbCreate('workouts', {
          id: `W-${memberId}`,
          memberId,
          planName: workoutPlanName,
          difficulty: workoutDifficulty,
          schedule: workoutSchedule
        });
      }
      showToast('success', "Workout weekly split saved successfully!");
      loadProfileData();
      window.dispatchEvent(new Event('db-change'));
    } catch(err) {
      showToast('error', "Failed to save weekly split.");
    }
  };

  // Delete/Clear Workout split
  const handleDeleteWorkoutPlan = async () => {
    if (window.confirm("Are you sure you want to delete and clear this client's workout plan?")) {
      try {
        const cleared = {};
        ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].forEach(day => {
          cleared[day] = { isRestDay: day === 'Sunday', workoutName: '', exercises: [] };
        });
        setWorkoutSchedule(cleared);
        setWorkoutPlanName('Custom Split');
        setWorkoutDifficulty('Intermediate');
        
        if (workout) {
          await dbUpdate('workouts', workout.id, {
            planName: 'Custom Split',
            difficulty: 'Intermediate',
            schedule: cleared
          });
        }
        showToast('success', "Workout plan cleared successfully!");
        loadProfileData();
        window.dispatchEvent(new Event('db-change'));
      } catch(e) {
        showToast('error', "Failed to clear workout plan.");
      }
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

  // Workout Library Templates Management
  const handleCreateTemplate = async () => {
    const name = window.prompt("Enter a name for your custom split template:", "Custom Split");
    if (!name) return;
    const goal = window.prompt("Enter target fitness goal:", "Force and Hypertrophy development");
    const muscles = window.prompt("Enter targeted muscle groups:", "Chest, Back, Legs");
    const difficulty = window.prompt("Enter difficulty (Beginner, Intermediate, Advanced):", "Intermediate");

    const templateObj = {
      id: `tmpl-${Date.now()}`,
      name,
      difficulty: difficulty || 'Intermediate',
      goal: goal || 'Custom split target',
      muscles: muscles || 'Custom groups',
      schedule: { ...workoutSchedule }
    };

    try {
      await dbCreate('workoutTemplates', templateObj);
      showToast('success', `Custom template "${name}" created!`);
      loadProfileData();
    } catch(e) {
      showToast('error', "Failed to save template.");
    }
  };

  const handleDuplicateTemplate = async (t) => {
    const templateObj = {
      ...t,
      id: `tmpl-dup-${Date.now()}`,
      name: `${t.name} (Copy)`
    };

    try {
      await dbCreate('workoutTemplates', templateObj);
      showToast('success', `Duplicated template into "${templateObj.name}"!`);
      loadProfileData();
    } catch(e) {
      showToast('error', "Failed to duplicate template.");
    }
  };

  const toggleFavorite = async (id) => {
    const target = workoutTemplates.find(t => t.id === id);
    if (!target) return;
    try {
      await dbUpdate('workoutTemplates', id, { isFavorite: !target.isFavorite });
      loadProfileData();
    } catch(e) {}
  };

  const handleApplyTemplateClick = (t) => {
    setTemplateToApply(t);
    setShowApplyConfirm(true);
  };

  const executeApplyTemplate = (replace) => {
    if (!templateToApply) return;
    
    if (replace) {
      // Overwrite split
      setWorkoutSchedule(templateToApply.schedule);
      setWorkoutPlanName(templateToApply.name);
      setWorkoutDifficulty(templateToApply.difficulty);
      showToast('success', `Replaced workout split with "${templateToApply.name}"!`);
    } else {
      // Merge split
      const merged = {};
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      days.forEach(day => {
        const currentDay = workoutSchedule[day] || { isRestDay: true, workoutName: '', exercises: [] };
        const templateDay = templateToApply.schedule[day] || { isRestDay: true, workoutName: '', exercises: [] };

        if (templateDay.isRestDay) {
          merged[day] = { ...currentDay };
        } else {
          merged[day] = {
            isRestDay: false,
            workoutName: currentDay.workoutName && currentDay.workoutName !== 'Rest' ? `${currentDay.workoutName} + ${templateDay.workoutName}` : templateDay.workoutName,
            exercises: [...(currentDay.exercises || []), ...(templateDay.exercises || [])]
          };
        }
      });
      setWorkoutSchedule(merged);
      showToast('success', `Merged "${templateToApply.name}" templates with current schedule!`);
    }
    setShowApplyConfirm(false);
    setShowSplitsLibrary(false);
  };

  // Copy Previous Day split helper
  const handleDuplicatePreviousDay = (day, prevDay) => {
    const prevData = workoutSchedule[prevDay] || { isRestDay: true, workoutName: '', exercises: [] };
    setWorkoutSchedule(prev => ({
      ...prev,
      [day]: {
        isRestDay: prevData.isRestDay,
        workoutName: prevData.workoutName,
        exercises: prevData.exercises ? [...prevData.exercises] : []
      }
    }));
    showToast('success', `Copied ${prevDay}'s workout split to ${day}!`);
  };

  // Exercises list management
  const handleAddExercise = (day) => {
    const updated = { ...workoutSchedule };
    const currentExercises = updated[day]?.exercises || [];
    updated[day] = {
      ...updated[day],
      exercises: [
        ...currentExercises,
        { id: `ex-${Date.now()}-${Math.random()}`, name: '', sets: 3, reps: '10', weight: 10, restTime: '60s', notes: '' }
      ]
    };
    setWorkoutSchedule(updated);
  };

  const handleRemoveExercise = (day, exerciseId) => {
    const updated = { ...workoutSchedule };
    const currentExercises = updated[day]?.exercises || [];
    updated[day] = {
      ...updated[day],
      exercises: currentExercises.filter(ex => ex.id !== exerciseId)
    };
    setWorkoutSchedule(updated);
  };

  const handleExerciseChange = (day, exerciseId, field, val) => {
    const updated = { ...workoutSchedule };
    const currentExercises = updated[day]?.exercises || [];
    updated[day] = {
      ...updated[day],
      exercises: currentExercises.map(ex => {
        if (ex.id === exerciseId) {
          return { ...ex, [field]: val };
        }
        return ex;
      })
    };
    setWorkoutSchedule(updated);
  };

  // Smart Rescheduling Calculation
  const handleOpenReschedule = (log) => {
    setTargetRescheduleLog(log);
    setShowSmartReschedule(true);
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!targetRescheduleLog) return;
    
    try {
      // Calculate target date
      const baseDate = targetRescheduleLog.date;
      let targetDate = customRescheduleDate;
      
      if (rescheduleOption === 'tomorrow') {
        const nextDay = new Date(baseDate);
        nextDay.setDate(nextDay.getDate() + 1);
        targetDate = nextDay.toISOString().split('T')[0];
      } else if (rescheduleOption === 'end-of-week') {
        const base = new Date(baseDate);
        const day = base.getDay();
        const diff = (day === 0 ? 0 : 7 - day); // next Sunday
        base.setDate(base.getDate() + diff);
        targetDate = base.toISOString().split('T')[0];
      } else if (rescheduleOption === 'next-workout-day') {
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        let found = false;
        for (let i = 1; i <= 7; i++) {
          const nextDate = new Date(baseDate);
          nextDate.setDate(nextDate.getDate() + i);
          const nextDayName = daysOfWeek[nextDate.getDay()];
          if (!workoutSchedule[nextDayName]?.isRestDay) {
            targetDate = nextDate.toISOString().split('T')[0];
            found = true;
            break;
          }
        }
        if (!found) {
          const nextDay = new Date(baseDate);
          nextDay.setDate(nextDay.getDate() + 1);
          targetDate = nextDay.toISOString().split('T')[0];
        }
      }

      // Update Rescheduled log status
      await dbUpdate('rescheduledWorkouts', targetRescheduleLog.id, {
        status: 'rescheduled',
        rescheduledTo: targetDate,
        note: `Rescheduled to ${targetDate} using smart shift strategy.`
      });

      // Calculate daysOfWeek names
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const targetDayName = daysOfWeek[new Date(targetDate).getDay()];
      const missedDayName = daysOfWeek[new Date(baseDate).getDay()];

      // Trigger Smart Shifting of splits
      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      let targetIdx = dayOrder.indexOf(targetDayName);
      let missedIdx = dayOrder.indexOf(missedDayName);

      if (targetIdx !== -1 && missedIdx !== -1) {
        const shifted = { ...workoutSchedule };
        const originalValues = dayOrder.map(d => ({ ...workoutSchedule[d] }));
        
        // Push the missed workout to the target day
        const missedWorkout = { ...workoutSchedule[missedDayName] };
        shifted[targetDayName] = missedWorkout;
        
        // Shift future workouts forward from target day name onwards
        for (let i = targetIdx + 1; i < dayOrder.length; i++) {
          shifted[dayOrder[i]] = originalValues[i - 1];
        }
        // Set the missed day itself as a Rest Day
        shifted[missedDayName] = { isRestDay: true, workoutName: 'Rest Day (Missed)', exercises: [] };

        // Save workout updates
        setWorkoutSchedule(shifted);
        if (workout) {
          await dbUpdate('workouts', workout.id, { schedule: shifted });
        }
      }

      showToast('success', `Workout rescheduled to ${targetDate} & schedule shifted!`);
      setShowSmartReschedule(false);
      loadProfileData();
      window.dispatchEvent(new Event('db-change'));
    } catch(err) {
      showToast('error', "Failed to reschedule workout.");
    }
  };

  const handleSkipWorkout = async (log) => {
    if (window.confirm("Are you sure you want to skip this missed workout?")) {
      try {
        await dbUpdate('rescheduledWorkouts', log.id, { status: 'skipped', note: 'Skipped by trainer.' });
        showToast('info', 'Missed workout skipped.');
        loadProfileData();
        window.dispatchEvent(new Event('db-change'));
      } catch(e) {}
    }
  };

  const handleCompleteLater = async (log) => {
    try {
      await dbUpdate('rescheduledWorkouts', log.id, { status: 'delayed', note: 'Marked to complete later.' });
      showToast('info', 'Workout marked as delayed.');
      loadProfileData();
      window.dispatchEvent(new Event('db-change'));
    } catch(e) {}
  };

  const handleSaveEditReschedule = async (e) => {
    e.preventDefault();
    if (!editRescheduleData) return;
    try {
      await dbUpdate('rescheduledWorkouts', editRescheduleData.id, {
        status: editRescheduleData.status,
        rescheduledTo: editRescheduleData.rescheduledTo,
        workoutName: editRescheduleData.workoutName,
        note: editRescheduleData.note
      });
      showToast('success', "Rescheduled log entry updated!");
      setShowEditRescheduleModal(false);
      loadProfileData();
      window.dispatchEvent(new Event('db-change'));
    } catch(err) {
      showToast('error', "Failed to update log entry.");
    }
  };

  const handleDeleteRescheduleLog = async (logId) => {
    if (window.confirm("Are you sure you want to delete this log entry permanently?")) {
      try {
        await dbDelete('rescheduledWorkouts', logId);
        showToast('success', "Log entry deleted successfully.");
        loadProfileData();
        window.dispatchEvent(new Event('db-change'));
      } catch(e) {
        showToast('error', "Failed to delete log entry.");
      }
    }
  };

  // Get status badge css
  const getStatusBadgeClass = (status) => {
    const s = status.toLowerCase();
    if (s === 'completed') return 'badge-completed';
    if (s === 'missed') return 'badge-missed';
    if (s === 'rescheduled') return 'badge-rescheduled';
    if (s === 'skipped') return 'badge-skipped';
    if (s === 'delayed') return 'badge-delayed';
    return 'badge-upcoming';
  };

  // Filter templates list
  const missedWorkouts = rescheduledLogs.filter(log => log.status?.toLowerCase() === 'missed');

  const filteredTemplates = workoutTemplates.filter(t => 
    (t.name || '').toLowerCase().includes(splitsSearchTerm.toLowerCase()) ||
    (t.goal || '').toLowerCase().includes(splitsSearchTerm.toLowerCase())
  ).sort((a, b) => {
    if (splitsSortBy === 'name') {
      return (a.name || '').localeCompare(b.name || '');
    }
    return 0;
  });

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

  const renderWorkoutTab = () => {
    const split = workoutSchedule[selectedDay] || { isRestDay: true, workoutName: 'Rest', exercises: [] };
    const daysArr = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const prevDayName = daysArr[(daysArr.indexOf(selectedDay) + 6) % 7];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Sticky Alert panel for missed workouts */}
        {missedWorkouts.length > 0 && (
          <div className="card-glass" style={{ padding: '1.25rem', borderRadius: '14px', borderLeft: '5px solid #EF4444', background: 'rgba(239,68,68,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <ClipboardList size={22} style={{ color: '#EF4444' }} />
              <div>
                <strong style={{ color: '#fff', fontSize: '0.95rem' }}>Missed Workout Detected</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {missedWorkouts[0].workoutName} on {missedWorkouts[0].date} was missed (Absent).
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-primary" onClick={() => handleOpenReschedule(missedWorkouts[0])} style={{ background: '#EF4444', height: '34px', fontSize: '0.8rem', padding: '0 0.85rem' }}>
                Reschedule
              </button>
              <button className="btn-secondary" onClick={() => handleSkipWorkout(missedWorkouts[0])} style={{ height: '34px', fontSize: '0.8rem', padding: '0 0.85rem' }}>
                Skip
              </button>
              <button className="btn-secondary" onClick={() => handleCompleteLater(missedWorkouts[0])} style={{ height: '34px', fontSize: '0.8rem', padding: '0 0.85rem' }}>
                Complete Later
              </button>
            </div>
          </div>
        )}

        {/* Client Workout Planner Main Editor Layout */}
        <div className="card-glass profile-tab-card" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Header toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.2rem', fontWeight: 600 }}>Client Workout Planner</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Customize individual days or apply split templates.</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button type="button" className="btn-secondary" onClick={() => {
                localStorage.setItem('kmf_copied_workout', JSON.stringify(workoutSchedule));
                showToast('success', 'Workout week split copied!');
              }} style={{ height: '38px', padding: '0 0.85rem', fontSize: '0.8rem' }}>
                Copy Week
              </button>
              <button type="button" className="btn-secondary" onClick={() => {
                const copied = localStorage.getItem('kmf_copied_workout');
                if (copied) {
                  try {
                    setWorkoutSchedule(JSON.parse(copied));
                    showToast('success', 'Workout week split pasted!');
                  } catch(e){}
                } else {
                  showToast('error', 'No copied week schedule found.');
                }
              }} style={{ height: '38px', padding: '0 0.85rem', fontSize: '0.8rem' }}>
                Paste Week
              </button>
              <button type="button" className="btn-primary" onClick={() => setShowSplitsLibrary(true)} style={{ height: '38px', padding: '0 1rem', fontSize: '0.8rem', display: 'flex', gap: '6px', alignItems: 'center', background: 'var(--color-primary)' }}>
                <Dumbbell size={14} />
                <span>Apply Split template...</span>
              </button>
            </div>
          </div>

          {/* Plan Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1.25rem' }}>
            <div className="form-grid mobile-column-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Plan Name</label>
                <input 
                  type="text" 
                  value={workoutPlanName} 
                  onChange={(e) => setWorkoutPlanName(e.target.value)} 
                  placeholder="e.g. Muscle Gain Split" 
                />
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
            
            <button 
              type="button" 
              onClick={handleDeleteWorkoutPlan} 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#EF4444', background: 'none', border: 'none', fontSize: '0.85rem', cursor: 'pointer', padding: 0, fontWeight: 600, alignSelf: 'flex-start' }}
            >
              <Trash2 size={16} />
              <span>Delete Plan</span>
            </button>
          </div>

          {/* Swipeable / Scrollable Weekly Days Tabs */}
          <div className="weekly-day-scroller">
            {daysArr.map(d => {
              const isActive = d === selectedDay;
              const dSplit = workoutSchedule[d] || { isRestDay: true };
              
              return (
                <div 
                  key={d} 
                  className={`weekly-day-tab ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedDay(d)}
                >
                  <div style={{ fontSize: '0.75rem', color: isActive ? 'var(--color-primary)' : 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{d.slice(0,3)}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {dSplit.isRestDay ? 'Rest' : (dSplit.workoutName || 'Active')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Split Day Card Editor */}
          <div className="daily-split-card" style={{ borderLeft: '4px solid var(--color-primary)', background: 'rgba(255,255,255,0.01)', padding: '1.25rem', borderRadius: '12px' }}>
            
            <div className="daily-split-header">
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{selectedDay} Split Target</h4>
              
              <div className="daily-split-actions">
                <button 
                  type="button" 
                  className="daily-split-dup-btn" 
                  onClick={() => handleDuplicatePreviousDay(selectedDay, prevDayName)}
                >
                  <span>Duplicate {prevDayName}</span>
                </button>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <input 
                    type="checkbox" 
                    checked={split.isRestDay} 
                    onChange={(e) => {
                      const val = e.target.checked;
                      setWorkoutSchedule(prev => ({
                        ...prev,
                        [selectedDay]: { ...prev[selectedDay], isRestDay: val }
                      }));
                    }}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span>Rest Day</span>
                </label>
              </div>
            </div>

            {/* Split inputs and exercise editor row lists */}
            {!split.isRestDay ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.75rem' }}>
                
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Workout Name / Focus Summary</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Chest + Triceps Heavy" 
                    value={split.workoutName} 
                    onChange={(e) => setWorkoutSchedule(prev => ({
                      ...prev,
                      [selectedDay]: { ...prev[selectedDay], workoutName: e.target.value }
                    }))}
                    style={{ width: '100%', height: '40px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}
                  />
                </div>

                {/* Exercises array builder */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Exercises List</span>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {split.exercises?.map((ex) => (
                      <div key={ex.id} className="exercise-edit-row">
                        <input 
                          type="text" 
                          placeholder="Exercise Name" 
                          value={ex.name} 
                          onChange={(e) => handleExerciseChange(selectedDay, ex.id, 'name', e.target.value)} 
                          style={{ height: '36px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '6px', fontSize: '0.85rem' }}
                        />
                        <input 
                          type="number" 
                          placeholder="Sets" 
                          value={ex.sets} 
                          onChange={(e) => handleExerciseChange(selectedDay, ex.id, 'sets', Number(e.target.value))} 
                          style={{ height: '36px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '6px', fontSize: '0.85rem' }}
                        />
                        <input 
                          type="text" 
                          placeholder="Reps" 
                          value={ex.reps} 
                          onChange={(e) => handleExerciseChange(selectedDay, ex.id, 'reps', e.target.value)} 
                          style={{ height: '36px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '6px', fontSize: '0.85rem' }}
                        />
                        <input 
                          type="number" 
                          placeholder="Wt (kg)" 
                          value={ex.weight} 
                          onChange={(e) => handleExerciseChange(selectedDay, ex.id, 'weight', Number(e.target.value))} 
                          style={{ height: '36px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '6px', fontSize: '0.85rem' }}
                        />
                        <input 
                          type="text" 
                          placeholder="Rest" 
                          value={ex.restTime} 
                          onChange={(e) => handleExerciseChange(selectedDay, ex.id, 'restTime', e.target.value)} 
                          style={{ height: '36px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '6px', fontSize: '0.85rem' }}
                        />
                        <input 
                          type="text" 
                          placeholder="Coaching notes..." 
                          value={ex.notes} 
                          onChange={(e) => handleExerciseChange(selectedDay, ex.id, 'notes', e.target.value)} 
                          style={{ height: '36px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '6px', fontSize: '0.85rem' }}
                        />
                        <button type="button" className="btn-icon" onClick={() => handleRemoveExercise(selectedDay, ex.id)} style={{ color: '#EF4444', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)', padding: '0.35rem' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button type="button" className="btn-secondary" onClick={() => handleAddExercise(selectedDay)} style={{ alignSelf: 'flex-start', padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', gap: '4px', alignItems: 'center', marginTop: '6px' }}>
                    <Plus size={14} />
                    <span>Add Exercise Row</span>
                  </button>

                </div>

              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '1rem 0', textAlign: 'center' }}>
                💤 Rest day split. No target exercises scheduled.
              </div>
            )}

          </div>

          <button onClick={() => handleSaveWorkout()} className="btn-primary" style={{ alignSelf: 'flex-end', padding: '0.6rem 2.5rem' }}>
            Save Workout Schedule
          </button>

        </div>

        {/* Rescheduling & Missed Workouts Log Table */}
        <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <h4 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.05rem', fontWeight: 600 }}>Workout Rescheduling & Missed History</h4>
          
          <div className="table-responsive">
            <table className="table-custom" style={{ width: '100%' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.01)' }}>
                  <th style={{ padding: '0.8rem', fontSize: '0.75rem' }}>ORIGINAL DATE</th>
                  <th style={{ padding: '0.8rem', fontSize: '0.75rem' }}>WORKOUT</th>
                  <th style={{ padding: '0.8rem', fontSize: '0.75rem' }}>STATUS</th>
                  <th style={{ padding: '0.8rem', fontSize: '0.75rem' }}>RESCHEDULED TO</th>
                  <th style={{ padding: '0.8rem', fontSize: '0.75rem' }}>COACHING NOTES</th>
                  <th style={{ padding: '0.8rem', fontSize: '0.75rem', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {rescheduledLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No rescheduled workouts on record.</td>
                  </tr>
                ) : (
                  [...rescheduledLogs].sort((a,b) => new Date(b.date) - new Date(a.date)).map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '0.8rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>{log.date}</td>
                      <td style={{ padding: '0.8rem', fontWeight: 600, color: '#fff', fontSize: '0.85rem' }}>{log.workoutName}</td>
                      <td style={{ padding: '0.8rem' }}>
                        <span className={`badge ${getStatusBadgeClass(log.status)}`} style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                          {log.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.8rem' }}>
                        {log.rescheduledTo ? (
                          <span className="badge badge-success" style={{ fontSize: '0.8rem', fontFamily: 'monospace', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '0.2rem 0.5rem' }}>
                            {log.rescheduledTo}
                          </span>
                        ) : '--'}
                      </td>
                      <td style={{ padding: '0.8rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{log.note || '--'}</td>
                      <td style={{ padding: '0.8rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button 
                            type="button" 
                            className="btn-secondary" 
                            onClick={() => {
                              setEditRescheduleData({
                                id: log.id,
                                status: log.status,
                                rescheduledTo: log.rescheduledTo || '',
                                workoutName: log.workoutName,
                                note: log.note || ''
                              });
                              setShowEditRescheduleModal(true);
                            }}
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', minHeight: '26px' }}
                          >
                            Edit
                          </button>
                          <button 
                            type="button" 
                            className="btn-secondary" 
                            onClick={() => handleDeleteRescheduleLog(log.id)}
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', minHeight: '26px', color: '#EF4444', borderColor: 'rgba(239,68,68,0.2)' }}
                          >
                            Delete
                          </button>
                        </div>
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

  if (!member) {
    return (
      <div className="card-glass text-center" style={{ padding: '4rem 2rem' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading member profile details...</p>
      </div>
    );
  }

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

      {/* WORKOUT SPLITS LIBRARY MODAL OVERLAY (MOBILE-FIRST BOTTOM SHEET) */}
      {showSplitsLibrary && (
        <div className="bottom-sheet-overlay">
          <div className="bottom-sheet-card">
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Dumbbell size={20} style={{ color: 'var(--color-primary)' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-outfit)', margin: 0 }}>Workout Templates Library</h3>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button type="button" className="btn-primary" onClick={handleCreateTemplate} style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', minHeight: '32px' }}>
                  + Create Template
                </button>
                <button className="btn-icon" onClick={() => setShowSplitsLibrary(false)} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Search & Sort Panel */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '8px', padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: '8px', alignItems: 'center', flex: 1 }}>
                <SearchIcon size={15} style={{ color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Search templates by name or goal..." 
                  value={splitsSearchTerm}
                  onChange={(e) => setSplitsSearchTerm(e.target.value)}
                  style={{ background: 'none', border: 'none', color: '#fff', outline: 'none', width: '100%', fontSize: '0.85rem' }}
                />
              </div>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setSplitsSortBy(splitsSortBy === 'name' ? 'default' : 'name')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', height: '36px', padding: '0 0.85rem', background: 'rgba(255,255,255,0.03)' }}
              >
                <ArrowUpDown size={14} />
                <span>{splitsSortBy === 'name' ? 'Sorted by Name' : 'Sort by Name'}</span>
              </button>
            </div>

            {/* Templates Cards List */}
            <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem', paddingRight: '4px' }}>
              {filteredTemplates.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No split templates matched your search.</div>
              ) : (
                filteredTemplates.map(t => {
                  const isFav = favorites.includes(t.id);

                  return (
                    <div 
                      key={t.id} 
                      className="card-glass" 
                      style={{ padding: '1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', border: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}
                      className="mobile-column-grid"
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', margin: 0 }}>{t.name}</h4>
                          <span 
                            className="badge" 
                            style={{ 
                              fontSize: '0.7rem', 
                              padding: '0.1rem 0.4rem', 
                              borderRadius: '4px',
                              background: t.difficulty === 'Beginner' ? 'rgba(16,185,129,0.1)' : t.difficulty === 'Advanced' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                              color: t.difficulty === 'Beginner' ? '#10B981' : t.difficulty === 'Advanced' ? '#EF4444' : '#F59E0B'
                            }}
                          >
                            {t.difficulty}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <strong>Goal:</strong> {t.goal}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <strong>Description:</strong> {t.description || 'Workout split routine'}
                        </p>
                      </div>

                      {/* Action buttons on the right */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button 
                          type="button" 
                          onClick={() => toggleFavorite(t.id)} 
                          style={{ background: 'none', border: 'none', color: isFav ? '#F59E0B' : 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                        >
                          <Star size={16} fill={isFav ? '#F59E0B' : 'none'} />
                        </button>
                        
                        <button 
                          type="button" 
                          className="btn-secondary" 
                          onClick={() => handleDuplicateTemplate(t)}
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', minHeight: '32px', height: '32px' }}
                        >
                          Duplicate
                        </button>
                        
                        <button 
                          type="button" 
                          className="btn-primary" 
                          onClick={() => handleApplyTemplateClick(t)}
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.85rem', minHeight: '32px', height: '32px', background: 'var(--color-primary)' }}
                        >
                          Apply to Client
                        </button>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      )}

      {/* REPLACE OR MERGE CONFIRM DIALOG */}
      {showApplyConfirm && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 4000 }}>
          <div className="modal-card card-glass" style={{ display: 'block', maxWidth: '420px', width: '90%', padding: '1.5rem', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Apply Template Plan</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Choose how you want to apply the template plan **"{templateToApply?.name}"** to this member's workout split schedule.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="btn-primary" onClick={() => executeApplyTemplate(true)} style={{ width: '100%' }}>
                Replace Existing Plan (Overwrite)
              </button>
              <button className="btn-secondary" onClick={() => executeApplyTemplate(false)} style={{ width: '100%' }}>
                Merge With Existing Plan (Append Exercises)
              </button>
              <button className="btn-secondary" onClick={() => setShowApplyConfirm(false)} style={{ width: '100%', borderColor: 'transparent', color: 'var(--text-muted)' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMART RESCHEDULE SLIDING OVERLAY (MOBILE BOTTOM SHEET) */}
      {showSmartReschedule && (
        <div className="bottom-sheet-overlay">
          <div className="bottom-sheet-card">
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>Smart Workout Rescheduling</h3>
              <button className="btn-icon" onClick={() => setShowSmartReschedule(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="responsive-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Rescheduling missed session:</span>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-glass)', marginTop: '4px' }}>
                  <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{targetRescheduleLog?.workoutName}</strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>Originally planned date: {targetRescheduleLog?.date}</p>
                </div>
              </div>

              <div className="form-group">
                <label>Choose Rescheduling strategy</label>
                <select value={rescheduleOption} onChange={(e) => setRescheduleOption(e.target.value)}>
                  <option value="tomorrow">Move to Tomorrow (Shift Week)</option>
                  <option value="next-workout-day">Next Available Workout Day (Shift Week)</option>
                  <option value="end-of-week">Move to End of Week (Sunday/Weekend)</option>
                  <option value="custom-date">Pick Custom Date...</option>
                </select>
              </div>

              {rescheduleOption === 'custom-date' && (
                <div className="form-group">
                  <label>Select Target Reschedule Date</label>
                  <input 
                    type="date" 
                    required 
                    value={customRescheduleDate} 
                    onChange={(e) => setCustomRescheduleDate(e.target.value)} 
                  />
                </div>
              )}

              <div style={{ background: 'rgba(139,92,246,0.05)', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(139,92,246,0.15)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600 }}>ℹ️ Smart Shift Strategy</span>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.35' }}>
                  The system will automatically shift subsequent workout splits forward to maintain muscle groups recovery balances and preserve the workout order context.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowSmartReschedule(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: 'var(--color-primary)' }}>Apply Rescheduling</button>
              </div>

            </form>

          </div>
        </div>
      )}
      {/* EDIT RESCHEDULE LOG ENTRY OVERLAY (MOBILE BOTTOM SHEET) */}
      {showEditRescheduleModal && (
        <div className="bottom-sheet-overlay">
          <div className="bottom-sheet-card">
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>Edit Rescheduled Workout Log</h3>
              <button className="btn-icon" onClick={() => setShowEditRescheduleModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveEditReschedule} className="responsive-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              
              <div className="form-group">
                <label>Workout Name / Focus</label>
                <input 
                  type="text" 
                  required 
                  value={editRescheduleData.workoutName} 
                  onChange={(e) => setEditRescheduleData({ ...editRescheduleData, workoutName: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select value={editRescheduleData.status} onChange={(e) => setEditRescheduleData({ ...editRescheduleData, status: e.target.value })}>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Completed">Completed</option>
                  <option value="Missed">Missed</option>
                  <option value="Rescheduled">Rescheduled</option>
                  <option value="Skipped">Skipped</option>
                  <option value="Delayed">Delayed</option>
                </select>
              </div>

              <div className="form-group">
                <label>Rescheduled Date (YYYY-MM-DD)</label>
                <input 
                  type="date" 
                  value={editRescheduleData.rescheduledTo} 
                  onChange={(e) => setEditRescheduleData({ ...editRescheduleData, rescheduledTo: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label>Trainer Notes / Remarks</label>
                <input 
                  type="text" 
                  value={editRescheduleData.note} 
                  onChange={(e) => setEditRescheduleData({ ...editRescheduleData, note: e.target.value })} 
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowEditRescheduleModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: 'var(--color-primary)' }}>Save Changes</button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
