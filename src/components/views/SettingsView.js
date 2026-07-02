'use client';

import React, { useState, useEffect } from 'react';
import { dbReadOne, dbUpdate, dbReadAll, dbCreate, dbDelete } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { exportToCSV } from '@/lib/utils';
import { 
  Save, Plus, Trash2, ShieldAlert, Download, FileSpreadsheet, Lock,
  Dumbbell, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, Edit, 
  Copy, Archive, RefreshCw, Eye, Check, X, Users, Star, Info
} from 'lucide-react';

export default function SettingsView() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState('gym'); // gym, templates, admin

  // --- Gym Settings State ---
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
  const [newPlan, setNewPlan] = useState({ name: '', duration: '', price: '' });
  const [newSlot, setNewSlot] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // --- Workout Templates State ---
  const [workoutTemplates, setWorkoutTemplates] = useState([]);
  const [workoutsList, setWorkoutsList] = useState([]);
  const [membersList, setMembersList] = useState([]);
  
  // Filtering & Sorting State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterGoal, setFilterGoal] = useState('all');
  const [filterDays, setFilterDays] = useState('all');
  const [filterSplitType, setFilterSplitType] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [sortBy, setSortBy] = useState('recent');

  // Preview Template State
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingTemplate, setViewingTemplate] = useState(null);

  // Template Form State (Multi-step)
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDayTab, setSelectedDayTab] = useState('Monday');
  const [templateForm, setTemplateForm] = useState({
    id: null,
    name: '',
    goal: 'Muscle Gain',
    difficulty: 'Intermediate',
    description: '',
    duration: '8 Weeks',
    daysCount: 3,
    splitType: 'Full Body',
    schedule: {
      Monday: { isRestDay: false, workoutName: 'Full Body A', muscles: 'Chest, Back, Legs', notes: '', exercises: [] },
      Tuesday: { isRestDay: true, workoutName: 'Rest Day', muscles: '', notes: '', exercises: [] },
      Wednesday: { isRestDay: false, workoutName: 'Full Body B', muscles: 'Shoulders, Arms, Core', notes: '', exercises: [] },
      Thursday: { isRestDay: true, workoutName: 'Rest Day', muscles: '', notes: '', exercises: [] },
      Friday: { isRestDay: false, workoutName: 'Full Body C', muscles: 'Legs focus, HIIT', notes: '', exercises: [] },
      Saturday: { isRestDay: true, workoutName: 'Rest Day', muscles: '', notes: '', exercises: [] },
      Sunday: { isRestDay: true, workoutName: 'Rest Day', muscles: '', notes: '', exercises: [] }
    }
  });

  // Cascade Update Sync Modal State
  const [showCascadeModal, setShowCascadeModal] = useState(false);
  const [pendingUpdateTemplate, setPendingUpdateTemplate] = useState(null);
  const [affectedMembers, setAffectedMembers] = useState([]);
  const [selectedMembersToUpdate, setSelectedMembersToUpdate] = useState([]);

  // Usage Modal State
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [usageModalTemplate, setUsageModalTemplate] = useState(null);
  const [usageMembers, setUsageMembers] = useState([]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // 1. Gym Configuration Settings
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

      // 2. Workout Templates
      const templates = await dbReadAll('workoutTemplates') || [];
      setWorkoutTemplates(templates);

      // 3. Workouts (to calculate member usage)
      const workouts = await dbReadAll('workouts') || [];
      setWorkoutsList(workouts);

      // 4. Gym Members (to match display names)
      const members = await dbReadAll('members') || [];
      setMembersList(members);

    } catch (err) {
      console.error("Error loading settings/templates data", err);
    }
    setLoading(false);
  };

  const loadSettings = async () => {
    // Wrapper to refresh just settings if needed
    loadAllData();
  };

  // --- Gym settings handlers ---
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

  const handleBackupDatabase = async () => {
    try {
      const keys = ['members', 'attendance', 'payments', 'workouts', 'dietPlans', 'progress', 'settings', 'workoutTemplates'];
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

      showToast('success', 'Database backup JSON file generated successfully!');
    } catch(e) {
      showToast('error', 'Database backup failed.');
    }
  };

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


  // --- Workout Templates CRUD Handlers ---

  const handleOpenCreateTemplate = () => {
    setTemplateForm({
      id: null,
      name: '',
      goal: 'Muscle Gain',
      difficulty: 'Intermediate',
      description: '',
      duration: '8 Weeks',
      daysCount: 3,
      splitType: 'Full Body',
      schedule: {
        Monday: { isRestDay: false, workoutName: 'Full Body A', muscles: 'Chest, Back, Legs', notes: '', exercises: [] },
        Tuesday: { isRestDay: true, workoutName: 'Rest Day', muscles: '', notes: '', exercises: [] },
        Wednesday: { isRestDay: false, workoutName: 'Full Body B', muscles: 'Shoulders, Arms, Core', notes: '', exercises: [] },
        Thursday: { isRestDay: true, workoutName: 'Rest Day', muscles: '', notes: '', exercises: [] },
        Friday: { isRestDay: false, workoutName: 'Full Body C', muscles: 'Legs focus, HIIT', notes: '', exercises: [] },
        Saturday: { isRestDay: true, workoutName: 'Rest Day', muscles: '', notes: '', exercises: [] },
        Sunday: { isRestDay: true, workoutName: 'Rest Day', muscles: '', notes: '', exercises: [] }
      }
    });
    setSelectedDayTab('Monday');
    setCurrentStep(1);
    setShowTemplateModal(true);
  };

  const handleOpenEditTemplate = (t) => {
    // Deep clone schedule to avoid instant mutation
    const scheduleClone = {};
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    days.forEach(d => {
      const dayData = t.schedule?.[d] || { isRestDay: true, workoutName: '', muscles: '', notes: '', exercises: [] };
      scheduleClone[d] = {
        isRestDay: dayData.isRestDay,
        workoutName: dayData.workoutName || '',
        muscles: dayData.muscles || '',
        notes: dayData.notes || '',
        exercises: Array.isArray(dayData.exercises) ? dayData.exercises.map(ex => ({ ...ex })) : []
      };
    });

    setTemplateForm({
      id: t.id,
      name: t.name || '',
      goal: t.goal || 'General Fitness',
      difficulty: t.difficulty || 'Intermediate',
      description: t.description || '',
      duration: t.duration || '8 Weeks',
      daysCount: t.daysCount || 3,
      splitType: t.splitType || 'Full Body',
      schedule: scheduleClone
    });
    
    // Find first active workout day as default selected tab
    const firstActiveDay = days.find(d => !scheduleClone[d].isRestDay) || 'Monday';
    setSelectedDayTab(firstActiveDay);
    
    setCurrentStep(1);
    setShowTemplateModal(true);
  };

  const handleDuplicateTemplate = async (t, e) => {
    if (e) e.stopPropagation();
    
    // Unique ID and Name
    const newId = `tmpl-${Date.now()}`;
    const newName = `${t.name} V2`;
    
    const duplicate = {
      ...t,
      id: newId,
      name: newName,
      isFavorite: false,
      isArchived: false,
      updatedAt: new Date().toISOString()
    };

    try {
      await dbCreate('workoutTemplates', duplicate);
      showToast('success', `Duplicated "${t.name}" as "${newName}"!`);
      loadAllData();
      window.dispatchEvent(new Event('db-change'));
    } catch (err) {
      showToast('error', "Failed to duplicate template.");
    }
  };

  const handleToggleArchiveTemplate = async (t, e) => {
    if (e) e.stopPropagation();
    const nextArchived = !t.isArchived;
    
    try {
      await dbUpdate('workoutTemplates', t.id, { isArchived: nextArchived });
      showToast('success', nextArchived ? `Template "${t.name}" archived.` : `Template "${t.name}" restored.`);
      loadAllData();
      window.dispatchEvent(new Event('db-change'));
    } catch (err) {
      showToast('error', "Failed to update archive status.");
    }
  };

  const handleDeleteTemplate = async (t, e) => {
    if (e) e.stopPropagation();
    
    if (window.confirm(`Are you sure you want to delete the template "${t.name}" permanently? This cannot be undone.`)) {
      try {
        await dbDelete('workoutTemplates', t.id);
        showToast('success', `Template "${t.name}" deleted.`);
        loadAllData();
        window.dispatchEvent(new Event('db-change'));
      } catch (err) {
        showToast('error', "Failed to delete template.");
      }
    }
  };

  const handleToggleFavoriteTemplate = async (t, e) => {
    if (e) e.stopPropagation();
    const nextFav = !t.isFavorite;
    
    try {
      await dbUpdate('workoutTemplates', t.id, { isFavorite: nextFav });
      loadAllData();
      window.dispatchEvent(new Event('db-change'));
    } catch (err) {}
  };

  const getActiveMembersCount = (t) => {
    return workoutsList.filter(w => w.templateId === t.id || w.planName === t.name).length;
  };

  const handleOpenUsageModal = (t, e) => {
    if (e) e.stopPropagation();
    const list = workoutsList.filter(w => w.templateId === t.id || w.planName === t.name);
    const membersUsing = list.map(w => {
      const mem = membersList.find(m => m.id === w.memberId);
      return {
        id: w.memberId,
        name: mem ? mem.fullName : `Member ID: ${w.memberId}`,
        status: mem ? mem.status : 'active',
        goal: mem ? mem.fitnessGoal : '--'
      };
    });
    setUsageModalTemplate(t);
    setUsageMembers(membersUsing);
    setShowUsageModal(true);
  };

  // --- Multi-Step Form Helpers ---

  const handleFormChange = (field, val) => {
    setTemplateForm(prev => ({ ...prev, [field]: val }));
  };

  const handleDayFieldChange = (day, field, val) => {
    setTemplateForm(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          [field]: val
        }
      }
    }));
  };

  const handleAddExerciseRow = (day) => {
    const daySchedule = templateForm.schedule[day];
    const newEx = {
      id: `ex-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      sets: 3,
      reps: '10',
      weight: 10,
      restTime: '60s',
      tempo: '3-0-1-0',
      notes: ''
    };

    setTemplateForm(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          exercises: [...(daySchedule.exercises || []), newEx]
        }
      }
    }));
  };

  const handleRemoveExerciseRow = (day, id) => {
    const daySchedule = templateForm.schedule[day];
    setTemplateForm(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          exercises: daySchedule.exercises.filter(ex => ex.id !== id)
        }
      }
    }));
  };

  const handleExerciseFieldChange = (day, id, field, val) => {
    const daySchedule = templateForm.schedule[day];
    const updated = daySchedule.exercises.map(ex => {
      if (ex.id === id) {
        return { ...ex, [field]: val };
      }
      return ex;
    });

    setTemplateForm(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          exercises: updated
        }
      }
    }));
  };

  // Drag and drop reordering
  const handleDragStart = (e, day, index) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ day, index }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, day, targetIndex) => {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData('text/plain');
      if (!dataStr) return;
      const { day: sourceDay, index: sourceIndex } = JSON.parse(dataStr);
      
      if (sourceDay !== day) return; // Only allow drag-and-drop within the same day
      
      const daySchedule = templateForm.schedule[day];
      const exercises = [...(daySchedule.exercises || [])];
      
      const [moved] = exercises.splice(sourceIndex, 1);
      exercises.splice(targetIndex, 0, moved);
      
      setTemplateForm(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          [day]: {
            ...prev.schedule[day],
            exercises
          }
        }
      }));
    } catch (err) {}
  };

  const moveExercise = (day, index, direction) => {
    const daySchedule = templateForm.schedule[day];
    const exercises = [...(daySchedule.exercises || [])];
    
    if (direction === 'up' && index > 0) {
      const temp = exercises[index];
      exercises[index] = exercises[index - 1];
      exercises[index - 1] = temp;
    } else if (direction === 'down' && index < exercises.length - 1) {
      const temp = exercises[index];
      exercises[index] = exercises[index + 1];
      exercises[index + 1] = temp;
    }
    
    setTemplateForm(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          exercises
        }
      }
    }));
  };

  // Next / Back Step handlers
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!templateForm.name.trim()) {
        showToast('error', 'Template name is required.');
        return;
      }
    }
    setCurrentStep(prev => prev + 1);
  };

  const handleBackStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  // Submit Save Template
  const handleSaveTemplateSubmit = async () => {
    const templateData = {
      ...templateForm,
      id: templateForm.id || `tmpl-${Date.now()}`,
      updatedAt: new Date().toISOString()
    };

    // Calculate muscles covered dynamically if not entered
    const activeDays = Object.values(templateForm.schedule).filter(d => !d.isRestDay);
    const uniqueMuscles = new Set();
    activeDays.forEach(d => {
      if (d.muscles) {
        d.muscles.split(',').forEach(m => uniqueMuscles.add(m.trim()));
      }
    });
    templateData.muscles = Array.from(uniqueMuscles).join(', ') || 'Custom focus';

    if (!templateForm.id) {
      // Create new template
      await dbCreate('workoutTemplates', templateData);
      showToast('success', `Template "${templateForm.name}" created successfully!`);
      setShowTemplateModal(false);
      loadAllData();
      window.dispatchEvent(new Event('db-change'));
      return;
    }

    // Editing template. Check members usage.
    const activeUsers = workoutsList.filter(w => w.templateId === templateForm.id || w.planName === templateForm.name);
    
    if (activeUsers.length === 0) {
      // No active users, save directly
      await dbUpdate('workoutTemplates', templateForm.id, templateData);
      showToast('success', `Template "${templateForm.name}" updated successfully!`);
      setShowTemplateModal(false);
      loadAllData();
      window.dispatchEvent(new Event('db-change'));
    } else {
      // Save pending state and open the Cascade modal
      setPendingUpdateTemplate(templateData);
      const affected = activeUsers.map(w => {
        const mem = membersList.find(m => m.id === w.memberId);
        return {
          memberId: w.memberId,
          memberName: mem ? mem.fullName : `Member ID: ${w.memberId}`,
          status: mem ? mem.status : 'active',
          workoutId: w.id
        };
      });
      setAffectedMembers(affected);
      setSelectedMembersToUpdate(affected.map(m => m.memberId)); // check all by default
      setShowCascadeModal(true);
    }
  };

  // Cascade Sync modal resolution functions
  const handleCascadeFutureOnly = async () => {
    if (!pendingUpdateTemplate) return;
    try {
      await dbUpdate('workoutTemplates', pendingUpdateTemplate.id, pendingUpdateTemplate);
      showToast('success', "Template saved. Existing members remain unchanged.");
      setShowCascadeModal(false);
      setShowTemplateModal(false);
      loadAllData();
      window.dispatchEvent(new Event('db-change'));
    } catch(err) {
      showToast('error', "Failed to update template.");
    }
  };

  const handleCascadeAllMembers = async () => {
    if (!pendingUpdateTemplate) return;
    try {
      // 1. Update template
      await dbUpdate('workoutTemplates', pendingUpdateTemplate.id, pendingUpdateTemplate);
      
      // 2. Loop through all active users and overwrite their schedules
      for (const item of affectedMembers) {
        await dbUpdate('workouts', item.workoutId, {
          planName: pendingUpdateTemplate.name,
          difficulty: pendingUpdateTemplate.difficulty,
          fitnessGoal: pendingUpdateTemplate.goal,
          schedule: pendingUpdateTemplate.schedule,
          templateId: pendingUpdateTemplate.id
        });
      }

      showToast('success', `Template updated & synced to all ${affectedMembers.length} active members!`);
      setShowCascadeModal(false);
      setShowTemplateModal(false);
      loadAllData();
      window.dispatchEvent(new Event('db-change'));
    } catch(err) {
      showToast('error', "Sync failed.");
    }
  };

  const handleCascadeSelectedMembers = async () => {
    if (!pendingUpdateTemplate) return;
    if (selectedMembersToUpdate.length === 0) {
      showToast('warning', "No members selected. Choose option 1 instead.");
      return;
    }
    try {
      // 1. Update template
      await dbUpdate('workoutTemplates', pendingUpdateTemplate.id, pendingUpdateTemplate);
      
      // 2. Overwrite only selected members
      let count = 0;
      for (const item of affectedMembers) {
        if (selectedMembersToUpdate.includes(item.memberId)) {
          await dbUpdate('workouts', item.workoutId, {
            planName: pendingUpdateTemplate.name,
            difficulty: pendingUpdateTemplate.difficulty,
            fitnessGoal: pendingUpdateTemplate.goal,
            schedule: pendingUpdateTemplate.schedule,
            templateId: pendingUpdateTemplate.id
          });
          count++;
        }
      }

      showToast('success', `Template updated & synced to ${count} selected members!`);
      setShowCascadeModal(false);
      setShowTemplateModal(false);
      loadAllData();
      window.dispatchEvent(new Event('db-change'));
    } catch(err) {
      showToast('error', "Sync failed.");
    }
  };

  // --- Filtering & Sorting Calculations ---

  const filteredTemplates = workoutTemplates.filter(t => {
    // 1. Search term match
    const matchesSearch = 
      (t.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.goal || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.muscles || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    // 2. Difficulty filter
    const matchesDifficulty = filterDifficulty === 'all' || t.difficulty === filterDifficulty;
    
    // 3. Goal filter
    const matchesGoal = filterGoal === 'all' || t.goal === filterGoal;
    
    // 4. Workout days filter
    const matchesDays = filterDays === 'all' || String(t.daysCount) === filterDays;
    
    // 5. Split Type filter
    const matchesSplitType = filterSplitType === 'all' || t.splitType === filterSplitType;
    
    // 6. Archived status toggle
    const matchesArchived = t.isArchived === showArchived;

    return matchesSearch && matchesDifficulty && matchesGoal && matchesDays && matchesSplitType && matchesArchived;
  }).sort((a, b) => {
    if (sortBy === 'alphabetical') {
      return (a.name || '').localeCompare(b.name || '');
    }
    if (sortBy === 'most-used') {
      return getActiveMembersCount(b) - getActiveMembersCount(a);
    }
    if (sortBy === 'newest') {
      return new Date(b.created_at || b.updatedAt || 0) - new Date(a.created_at || a.updatedAt || 0);
    }
    // Default 'recent' sort (using updatedAt)
    return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
  });

  // Get unique goals and splits for filter boxes
  const uniqueGoals = Array.from(new Set(workoutTemplates.map(t => t.goal).filter(Boolean)));
  const uniqueSplits = Array.from(new Set(workoutTemplates.map(t => t.splitType).filter(Boolean)));

  // Render Loader
  if (loading) {
    return <div className="loading-container"><div className="loader-spinner"></div></div>;
  }

  return (
    <div className="settings-view-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 3-Tab Header Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        <button 
          type="button" 
          onClick={() => setActiveTab('gym')} 
          style={{ 
            color: activeTab === 'gym' ? '#fff' : 'var(--text-secondary)',
            borderBottom: activeTab === 'gym' ? '3px solid var(--color-primary)' : '3px solid transparent',
            padding: '0.6rem 1.25rem',
            fontWeight: 600,
            fontSize: '0.9rem',
            transition: 'var(--transition-smooth)'
          }}
        >
          Gym Configuration
        </button>
        <button 
          type="button" 
          onClick={() => setActiveTab('templates')} 
          style={{ 
            color: activeTab === 'templates' ? '#fff' : 'var(--text-secondary)',
            borderBottom: activeTab === 'templates' ? '3px solid var(--color-primary)' : '3px solid transparent',
            padding: '0.6rem 1.25rem',
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'var(--transition-smooth)'
          }}
        >
          <Dumbbell size={16} />
          <span>Workout Templates Library</span>
        </button>
        <button 
          type="button" 
          onClick={() => setActiveTab('admin')} 
          style={{ 
            color: activeTab === 'admin' ? '#fff' : 'var(--text-secondary)',
            borderBottom: activeTab === 'admin' ? '3px solid var(--color-primary)' : '3px solid transparent',
            padding: '0.6rem 1.25rem',
            fontWeight: 600,
            fontSize: '0.9rem',
            transition: 'var(--transition-smooth)'
          }}
        >
          Admin Utilities & Maintenance
        </button>
      </div>

      {/* TABS CONTAINER */}
      
      {/* TAB 1: GYM SETTINGS */}
      {activeTab === 'gym' && (
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
      )}

      {/* TAB 2: WORKOUT TEMPLATES LIBRARY */}
      {activeTab === 'templates' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Header Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Central Workout Templates Library</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Manage and deploy standardized workout program splits to your members.</p>
            </div>
            
            <button 
              type="button" 
              onClick={handleOpenCreateTemplate} 
              className="btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.6rem 1.25rem' }}
            >
              <Plus size={18} />
              <span>Create Template</span>
            </button>
          </div>

          {/* Search, Filter, and Sort Bar */}
          <div className="card-glass" style={{ padding: '1.25rem', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Row 1: Search & sorting */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '8px', padding: '0.5rem 0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '8px', alignItems: 'center', flex: 1, minWidth: '240px' }}>
                <Search size={16} style={{ color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Search templates by name, goal, muscles..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ background: 'none', border: 'none', color: '#fff', outline: 'none', width: '100%', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sort:</span>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)} 
                  style={{ height: '38px', minWidth: '150px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-glass)', padding: '0 0.5rem', fontSize: '0.8rem' }}
                >
                  <option value="recent">Recently Created</option>
                  <option value="alphabetical">Alphabetical</option>
                  <option value="most-used">Most Used</option>
                  <option value="newest">Newest</option>
                </select>
              </div>

              <button 
                type="button" 
                onClick={() => setShowArchived(!showArchived)}
                className="btn-secondary" 
                style={{ 
                  height: '38px', 
                  fontSize: '0.8rem', 
                  borderColor: showArchived ? '#F59E0B' : 'var(--border-glass)',
                  color: showArchived ? '#F59E0B' : '#fff',
                  background: showArchived ? 'rgba(245,158,11,0.05)' : 'none'
                }}
              >
                <Archive size={14} style={{ marginRight: '6px' }} />
                <span>{showArchived ? "Showing Archived" : "Show Archived"}</span>
              </button>
            </div>

            {/* Row 2: Filters */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.85rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '130px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>DIFFICULTY</span>
                <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)} style={{ height: '34px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '6px', fontSize: '0.75rem' }}>
                  <option value="all">All Difficulties</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '130px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>FITNESS GOAL</span>
                <select value={filterGoal} onChange={(e) => setFilterGoal(e.target.value)} style={{ height: '34px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '6px', fontSize: '0.75rem' }}>
                  <option value="all">All Goals</option>
                  {uniqueGoals.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '130px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>WORKOUT DAYS</span>
                <select value={filterDays} onChange={(e) => setFilterDays(e.target.value)} style={{ height: '34px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '6px', fontSize: '0.75rem' }}>
                  <option value="all">Any Days</option>
                  <option value="3">3 Days</option>
                  <option value="4">4 Days</option>
                  <option value="5">5 Days</option>
                  <option value="6">6 Days</option>
                  <option value="7">7 Days</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '130px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>SPLIT TYPE</span>
                <select value={filterSplitType} onChange={(e) => setFilterSplitType(e.target.value)} style={{ height: '34px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '6px', fontSize: '0.75rem' }}>
                  <option value="all">All Splits</option>
                  {uniqueSplits.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

          </div>

          {/* Grid of Template Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.25rem' }}>
            {filteredTemplates.length === 0 ? (
              <div className="card-glass colspan-full" style={{ padding: '3rem', gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-secondary)', borderRadius: '16px' }}>
                <Dumbbell size={36} style={{ color: 'var(--text-muted)', marginBottom: '0.8rem', opacity: 0.5 }} />
                <h4>No Templates Found</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Try clearing filters or create a new template split library.</p>
              </div>
            ) : (
              filteredTemplates.map(t => {
                const isFav = t.isFavorite;
                const usersCount = getActiveMembersCount(t);
                
                return (
                  <div 
                    key={t.id} 
                    className="card-glass" 
                    style={{ 
                      borderRadius: '16px', 
                      overflow: 'hidden', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      border: '1px solid var(--border-glass)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    {/* Top bar with Goal & Favorite button */}
                    <div style={{ padding: '1rem 1rem 0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 600, background: 'rgba(139,92,246,0.08)', padding: '0.2rem 0.6rem', borderRadius: '50px' }}>
                        {t.goal || 'General Fitness'}
                      </span>
                      <button 
                        type="button" 
                        onClick={(e) => handleToggleFavoriteTemplate(t, e)}
                        style={{ color: isFav ? '#F59E0B' : 'var(--text-muted)' }}
                      >
                        <Star size={16} fill={isFav ? '#F59E0B' : 'none'} />
                      </button>
                    </div>

                    {/* Card Body */}
                    <div style={{ padding: '0 1rem 1rem 1rem', flex: 1 }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>{t.name}</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '36px' }}>
                        {t.description || 'Standard workout routine template split.'}
                      </p>

                      {/* Attribute Badges Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.02)', padding: '0.6rem', borderRadius: '8px' }}>
                        <div>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>DIFFICULTY</span>
                          <span 
                            style={{ 
                              fontSize: '0.75rem', 
                              fontWeight: 600,
                              color: t.difficulty === 'Beginner' ? '#10B981' : t.difficulty === 'Advanced' ? '#EF4444' : '#F59E0B'
                            }}
                          >
                            {t.difficulty}
                          </span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>SPLIT TYPE</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>{t.splitType || 'Custom'}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>DAYS ACTIVE</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>{t.daysCount || 3} Workout Days</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>EST. DURATION</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>{t.duration || '8 Weeks'}</span>
                        </div>
                      </div>

                      {/* Muscles covered */}
                      <div style={{ marginTop: '0.75rem', fontSize: '0.75rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Target muscles:</span>{' '}
                        <span style={{ color: '#fff', fontWeight: 500 }}>{t.muscles || 'Custom split focus'}</span>
                      </div>

                      {/* Last updated */}
                      <div style={{ marginTop: '0.4rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Last updated: {t.updatedAt ? new Date(t.updatedAt).toLocaleDateString() : '--'}
                      </div>
                    </div>

                    {/* Member usage block */}
                    <div 
                      onClick={(e) => handleOpenUsageModal(t, e)}
                      style={{ 
                        padding: '0.6rem 1rem', 
                        background: 'rgba(255,255,255,0.02)', 
                        borderTop: '1px solid var(--border-glass)', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                      className="hover-brighten"
                    >
                      <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={14} />
                        <span>Used by:</span>
                      </span>
                      <strong style={{ color: usersCount > 0 ? 'var(--color-primary)' : 'var(--text-muted)' }}>
                        {usersCount} Member{usersCount !== 1 ? 's' : ''}
                      </strong>
                    </div>

                    {/* Footer Actions list */}
                    <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-glass)', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button 
                        type="button" 
                        title="Preview schedule details"
                        className="btn-secondary" 
                        onClick={() => { setViewingTemplate(t); setShowViewModal(true); }}
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', flex: 1, minHeight: '32px' }}
                      >
                        <Eye size={13} style={{ marginRight: '4px' }} />
                        <span>View</span>
                      </button>
                      <button 
                        type="button" 
                        title="Edit template fields & split"
                        className="btn-secondary" 
                        onClick={() => handleOpenEditTemplate(t)}
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', flex: 1, minHeight: '32px' }}
                      >
                        <Edit size={13} style={{ marginRight: '4px' }} />
                        <span>Edit</span>
                      </button>
                      <button 
                        type="button" 
                        title="Duplicate template"
                        className="btn-secondary" 
                        onClick={(e) => handleDuplicateTemplate(t, e)}
                        style={{ padding: '0.4rem 0.5rem', minHeight: '32px' }}
                      >
                        <Copy size={13} />
                      </button>
                      <button 
                        type="button" 
                        title={t.isArchived ? "Restore template" : "Archive template"}
                        className="btn-secondary" 
                        onClick={(e) => handleToggleArchiveTemplate(t, e)}
                        style={{ padding: '0.4rem 0.5rem', minHeight: '32px' }}
                      >
                        <Archive size={13} />
                      </button>
                      <button 
                        type="button" 
                        title="Delete template permanently"
                        className="btn-secondary" 
                        onClick={(e) => handleDeleteTemplate(t, e)}
                        style={{ padding: '0.4rem 0.5rem', minHeight: '32px', color: '#EF4444', borderColor: 'rgba(239,68,68,0.2)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

      {/* TAB 3: ADMIN UTILITIES */}
      {activeTab === 'admin' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
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
      )}

      {/* --- OVERLAY MODALS --- */}

      {/* MODAL 1: VIEW TEMPLATE DETAILS */}
      {showViewModal && viewingTemplate && (
        <div className="bottom-sheet-overlay" style={{ display: 'flex', zIndex: 3000 }}>
          <div className="bottom-sheet-card" style={{ maxWidth: '650px', width: '90%' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Dumbbell size={20} style={{ color: 'var(--color-primary)' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>{viewingTemplate.name}</h3>
              </div>
              <button className="btn-icon" onClick={() => setShowViewModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '450px', overflowY: 'auto', paddingRight: '4px' }}>
              
              {/* Meta description box */}
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '0.85rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}><strong>Goal:</strong> {viewingTemplate.goal} | <strong>Difficulty:</strong> {viewingTemplate.difficulty}</div>
                {viewingTemplate.description && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', fontStyle: 'italic' }}>
                    "{viewingTemplate.description}"
                  </p>
                )}
              </div>

              {/* Weekly Schedule Days */}
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                const daySplit = viewingTemplate.schedule?.[day] || { isRestDay: true, workoutName: 'Rest Day', exercises: [] };
                const isRest = daySplit.isRestDay;

                return (
                  <div 
                    key={day} 
                    style={{ 
                      padding: '0.85rem', 
                      borderRadius: '10px', 
                      borderLeft: isRest ? '4px solid var(--text-muted)' : '4px solid var(--color-primary)', 
                      background: isRest ? 'rgba(255,255,255,0.01)' : 'rgba(139,92,246,0.02)',
                      border: '1px solid var(--border-glass)',
                      borderLeftWidth: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{day}</strong>
                      <span style={{ fontSize: '0.75rem', color: isRest ? 'var(--text-muted)' : 'var(--color-primary)', fontWeight: 600 }}>
                        {isRest ? 'REST DAY' : (daySplit.workoutName || 'Active Split')}
                      </span>
                    </div>

                    {!isRest && daySplit.muscles && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Focus: {daySplit.muscles}
                      </div>
                    )}

                    {!isRest && daySplit.exercises && daySplit.exercises.length > 0 && (
                      <div style={{ marginTop: '0.75rem', borderTop: '1px dashed rgba(255,255,255,0.04)', paddingTop: '0.5rem' }}>
                        <table style={{ width: '100%', fontSize: '0.75rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ color: 'var(--text-muted)' }}>
                              <th style={{ padding: '0.2rem 0' }}>Exercise Name</th>
                              <th style={{ padding: '0.2rem 0', width: '50px' }}>Sets</th>
                              <th style={{ padding: '0.2rem 0', width: '60px' }}>Reps</th>
                              <th style={{ padding: '0.2rem 0', width: '50px' }}>Weight</th>
                              <th style={{ padding: '0.2rem 0', width: '60px' }}>Tempo</th>
                            </tr>
                          </thead>
                          <tbody>
                            {daySplit.exercises.map((ex, index) => (
                              <tr key={ex.id || index} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                <td style={{ padding: '0.3rem 0', color: '#fff', fontWeight: 500 }}>
                                  {ex.name}
                                  {ex.notes && <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{ex.notes}</span>}
                                </td>
                                <td style={{ padding: '0.3rem 0' }}>{ex.sets}</td>
                                <td style={{ padding: '0.3rem 0' }}>{ex.reps}</td>
                                <td style={{ padding: '0.3rem 0' }}>{ex.weight ? `${ex.weight}kg` : '--'}</td>
                                <td style={{ padding: '0.3rem 0', color: 'var(--color-primary)' }}>{ex.tempo || '--'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', borderTop: '1px solid var(--border-glass)', paddingTop: '0.75rem' }}>
              <button type="button" className="btn-secondary" onClick={() => setShowViewModal(false)}>Close Preview</button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: USAGE MEMBER LIST VIEW */}
      {showUsageModal && usageModalTemplate && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 3000 }}>
          <div className="modal-card card-glass" style={{ maxWidth: '450px', width: '90%', padding: '1.5rem', borderRadius: '16px', display: 'block' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Template Usage: {usageModalTemplate.name}</h3>
              <button className="btn-icon" onClick={() => setShowUsageModal(false)}><X size={16} /></button>
            </div>
            
            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {usageMembers.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No members are currently assigned to this template.
                </div>
              ) : (
                usageMembers.map(m => (
                  <div 
                    key={m.id} 
                    onClick={() => { setShowUsageModal(false); window.location.hash = `#member-profile?id=${m.id}`; }}
                    style={{ 
                      padding: '0.75rem', 
                      background: 'rgba(255,255,255,0.02)', 
                      border: '1px solid var(--border-glass)', 
                      borderRadius: '8px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      cursor: 'pointer' 
                    }}
                    className="hover-card"
                  >
                    <div>
                      <strong style={{ color: '#fff', fontSize: '0.85rem' }}>{m.name}</strong>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Goal: {m.goal}</div>
                    </div>
                    <span className={`badge ${m.status === 'active' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.65rem' }}>
                      {m.status.toUpperCase()}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', borderTop: '1px solid var(--border-glass)', paddingTop: '0.75rem' }}>
              <button type="button" className="btn-secondary" onClick={() => setShowUsageModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE & EDIT TEMPLATE (MULTI-STEP FORM) */}
      {showTemplateModal && (
        <div className="bottom-sheet-overlay" style={{ display: 'flex', zIndex: 3500 }}>
          <div className="bottom-sheet-card" style={{ maxWidth: '850px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Dumbbell size={20} style={{ color: 'var(--color-primary)' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                  {templateForm.id ? `Edit Template: ${templateForm.name}` : "Create New Workout Template"}
                </h3>
              </div>
              <button className="btn-icon" onClick={() => setShowTemplateModal(false)} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            {/* Steps Progress Indicator */}
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '1rem 0', padding: '0.5rem', background: 'rgba(255,255,255,0.01)', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
              {[
                { step: 1, label: '1. Basic Information' },
                { step: 2, label: '2. Weekly Split Config' },
                { step: 3, label: '3. Exercises Playlist' },
                { step: 4, label: '4. Summary Finish' }
              ].map(s => {
                const isActive = s.step === currentStep;
                const isPassed = s.step < currentStep;
                return (
                  <div 
                    key={s.step} 
                    style={{ 
                      fontSize: '0.8rem', 
                      fontWeight: isActive || isPassed ? 600 : 500, 
                      color: isActive ? 'var(--color-primary)' : isPassed ? '#10B981' : 'var(--text-muted)',
                      flex: 1,
                      textAlign: 'center',
                      borderBottom: isActive ? '2px solid var(--color-primary)' : isPassed ? '2px solid #10B981' : '2px solid transparent',
                      paddingBottom: '0.4rem'
                    }}
                  >
                    {s.label}
                  </div>
                );
              })}
            </div>

            {/* Step Contents Viewport */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', marginBottom: '1rem' }}>
              
              {/* STEP 1: BASIC INFO */}
              {currentStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="form-group">
                    <label>Template Name</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Push Pull Legs Advance, Beginner Full Body" 
                      value={templateForm.name} 
                      onChange={(e) => handleFormChange('name', e.target.value)} 
                    />
                  </div>

                  <div className="form-grid mobile-column-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Fitness Target Goal</label>
                      <select value={templateForm.goal} onChange={(e) => handleFormChange('goal', e.target.value)}>
                        <option value="Muscle Gain">Muscle Gain</option>
                        <option value="Fat Loss">Fat Loss</option>
                        <option value="Strength">Strength</option>
                        <option value="General Fitness">General Fitness</option>
                        <option value="Bodybuilding">Bodybuilding</option>
                        <option value="Endurance">Endurance</option>
                        <option value="Mobility/Longevity">Mobility/Longevity</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Difficulty Tier</label>
                      <select value={templateForm.difficulty} onChange={(e) => handleFormChange('difficulty', e.target.value)}>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-grid mobile-column-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Training Split Type</label>
                      <select value={templateForm.splitType} onChange={(e) => handleFormChange('splitType', e.target.value)}>
                        <option value="Full Body">Full Body Split</option>
                        <option value="Push Pull Legs">Push Pull Legs (PPL)</option>
                        <option value="Upper Lower">Upper Lower Split</option>
                        <option value="Bodybuilding">Bodybuilding Split</option>
                        <option value="Strength">Powerlifting / Strength</option>
                        <option value="Cardio & HIIT">Cardio & HIIT Circuit</option>
                        <option value="Mobility">Mobility & Restoration</option>
                        <option value="Other">Other Custom Split</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Estimated Plan Duration</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 8 Weeks, 12 Weeks" 
                        value={templateForm.duration} 
                        onChange={(e) => handleFormChange('duration', e.target.value)} 
                      />
                    </div>

                    <div className="form-group">
                      <label>Number of Workout Days</label>
                      <select 
                        value={templateForm.daysCount} 
                        onChange={(e) => handleFormChange('daysCount', Number(e.target.value))}
                      >
                        <option value={3}>3 Workout Days</option>
                        <option value={4}>4 Workout Days</option>
                        <option value={5}>5 Workout Days</option>
                        <option value={6}>6 Workout Days</option>
                        <option value={7}>7 Workout Days</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description & Objectives</label>
                    <textarea 
                      rows={3} 
                      placeholder="Enter a brief summary about this split template..."
                      value={templateForm.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: WEEKLY SPLIT CONFIG */}
              {currentStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ background: 'rgba(139,92,246,0.05)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(139,92,246,0.1)', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    ℹ️ Define targets for Monday to Sunday. Rest days will not have exercises added.
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                      const daySplit = templateForm.schedule[day] || { isRestDay: true, workoutName: '', muscles: '', notes: '' };
                      const isRest = daySplit.isRestDay;

                      return (
                        <div 
                          key={day} 
                          className="card-glass" 
                          style={{ 
                            padding: '1rem', 
                            borderRadius: '12px', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '0.8rem',
                            borderLeft: isRest ? '4px solid var(--text-muted)' : '4px solid var(--color-primary)',
                            background: isRest ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.02)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <strong style={{ fontSize: '0.95rem', color: '#fff' }}>{day}</strong>
                            
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                              <input 
                                type="checkbox" 
                                checked={isRest} 
                                onChange={(e) => handleDayFieldChange(day, 'isRestDay', e.target.checked)}
                                style={{ width: '16px', height: '16px' }}
                              />
                              <span>Rest Day</span>
                            </label>
                          </div>

                          {!isRest && (
                            <div className="form-grid mobile-column-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginTop: '0.25rem' }}>
                              <div className="form-group" style={{ margin: 0 }}>
                                <label style={{ fontSize: '0.7rem' }}>Workout Split Name</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. Chest + Triceps Heavy" 
                                  value={daySplit.workoutName} 
                                  onChange={(e) => handleDayFieldChange(day, 'workoutName', e.target.value)} 
                                  style={{ height: '36px', fontSize: '0.8rem' }}
                                />
                              </div>
                              <div className="form-group" style={{ margin: 0 }}>
                                <label style={{ fontSize: '0.7rem' }}>Primary Muscles Covered</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. Chest, Triceps" 
                                  value={daySplit.muscles} 
                                  onChange={(e) => handleDayFieldChange(day, 'muscles', e.target.value)} 
                                  style={{ height: '36px', fontSize: '0.8rem' }}
                                />
                              </div>
                              <div className="form-group" style={{ margin: 0 }}>
                                <label style={{ fontSize: '0.7rem' }}>Split Notes / Guidelines</label>
                                <input 
                                  type="text" 
                                  placeholder="e.g. High intensity overload" 
                                  value={daySplit.notes} 
                                  onChange={(e) => handleDayFieldChange(day, 'notes', e.target.value)} 
                                  style={{ height: '36px', fontSize: '0.8rem' }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3: EXERCISES LIST */}
              {currentStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* Select Active Day sub-tab */}
                  <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '4px', borderBottom: '1px solid var(--border-glass)' }}>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                      const daySplit = templateForm.schedule[day] || { isRestDay: true };
                      const isRest = daySplit.isRestDay;
                      if (isRest) return null; // hide rest days in exercise editor

                      const isSelected = selectedDayTab === day;
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => selectedDayTab !== day ? setSelectedDayTab(day) : null}
                          style={{
                            padding: '0.5rem 0.85rem',
                            borderRadius: '8px',
                            background: isSelected ? 'var(--color-primary)' : 'rgba(255,255,255,0.02)',
                            color: isSelected ? '#fff' : 'var(--text-secondary)',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            border: '1px solid var(--border-glass)'
                          }}
                        >
                          {day} ({daySplit.workoutName || 'Active'})
                        </button>
                      );
                    })}
                  </div>

                  {/* Day Exercise Editor viewport */}
                  {(() => {
                    const activeDayData = templateForm.schedule[selectedDayTab] || { isRestDay: true, exercises: [] };
                    if (activeDayData.isRestDay) {
                      return (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          💤 {selectedDayTab} is a rest day. Select a workout day from tabs above to add exercises.
                        </div>
                      );
                    }

                    const exercises = activeDayData.exercises || [];

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>
                            {selectedDayTab} Exercises ({exercises.length})
                          </h4>
                          
                          <button 
                            type="button" 
                            onClick={() => handleAddExerciseRow(selectedDayTab)}
                            className="btn-secondary"
                            style={{ display: 'flex', gap: '4px', alignItems: 'center', fontSize: '0.75rem', height: '34px', padding: '0 0.75rem' }}
                          >
                            <Plus size={14} />
                            <span>Add Exercise Row</span>
                          </button>
                        </div>

                        {/* List of exercises edit rows */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {exercises.length === 0 ? (
                            <div style={{ padding: '2rem', border: '1px dashed var(--border-glass)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                              No exercises added yet. Click "+ Add Exercise Row" above to build your workout.
                            </div>
                          ) : (
                            exercises.map((ex, index) => (
                              <div 
                                key={ex.id || index}
                                className="card-glass"
                                draggable
                                onDragStart={(e) => handleDragStart(e, selectedDayTab, index)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, selectedDayTab, index)}
                                style={{ 
                                  padding: '0.85rem', 
                                  borderRadius: '10px', 
                                  border: '1px solid var(--border-glass)', 
                                  display: 'flex', 
                                  flexDirection: 'column', 
                                  gap: '0.6rem',
                                  background: 'rgba(255,255,255,0.01)',
                                  position: 'relative'
                                }}
                              >
                                {/* Header inside row card with drag indicator & up/down buttons */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed rgba(255,255,255,0.04)', paddingBottom: '0.35rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'grab' }} title="Drag card to reorder">
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>☰</span>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Exercise #{index + 1}</span>
                                  </div>
                                  
                                  {/* Order controller actions */}
                                  <div style={{ display: 'flex', gap: '4px' }}>
                                    <button 
                                      type="button" 
                                      onClick={() => moveExercise(selectedDayTab, index, 'up')}
                                      disabled={index === 0}
                                      style={{ padding: '0.2rem', color: index === 0 ? 'var(--text-muted)' : '#fff', opacity: index === 0 ? 0.3 : 1 }}
                                    >
                                      <ArrowUp size={14} />
                                    </button>
                                    <button 
                                      type="button" 
                                      onClick={() => moveExercise(selectedDayTab, index, 'down')}
                                      disabled={index === exercises.length - 1}
                                      style={{ padding: '0.2rem', color: index === exercises.length - 1 ? 'var(--text-muted)' : '#fff', opacity: index === exercises.length - 1 ? 0.3 : 1 }}
                                    >
                                      <ArrowDown size={14} />
                                    </button>
                                    <button 
                                      type="button" 
                                      onClick={() => handleRemoveExerciseRow(selectedDayTab, ex.id)}
                                      style={{ padding: '0.2rem', color: '#EF4444', marginLeft: '6px' }}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>

                                {/* Form fields for exercise input */}
                                <div className="form-grid mobile-column-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', gap: '0.5rem' }}>
                                  <div className="form-group" style={{ margin: 0 }}>
                                    <input 
                                      type="text" 
                                      required
                                      placeholder="Exercise Name" 
                                      value={ex.name} 
                                      onChange={(e) => handleExerciseFieldChange(selectedDayTab, ex.id, 'name', e.target.value)}
                                      style={{ height: '36px', fontSize: '0.8rem', padding: '0 0.5rem' }}
                                    />
                                  </div>
                                  <div className="form-group" style={{ margin: 0 }}>
                                    <input 
                                      type="number" 
                                      placeholder="Sets" 
                                      value={ex.sets} 
                                      onChange={(e) => handleExerciseFieldChange(selectedDayTab, ex.id, 'sets', Number(e.target.value))}
                                      style={{ height: '36px', fontSize: '0.8rem', padding: '0 0.5rem' }}
                                    />
                                  </div>
                                  <div className="form-group" style={{ margin: 0 }}>
                                    <input 
                                      type="text" 
                                      placeholder="Reps" 
                                      value={ex.reps} 
                                      onChange={(e) => handleExerciseFieldChange(selectedDayTab, ex.id, 'reps', e.target.value)}
                                      style={{ height: '36px', fontSize: '0.8rem', padding: '0 0.5rem' }}
                                    />
                                  </div>
                                  <div className="form-group" style={{ margin: 0 }}>
                                    <input 
                                      type="number" 
                                      placeholder="Weight (kg)" 
                                      value={ex.weight} 
                                      onChange={(e) => handleExerciseFieldChange(selectedDayTab, ex.id, 'weight', Number(e.target.value))}
                                      style={{ height: '36px', fontSize: '0.8rem', padding: '0 0.5rem' }}
                                    />
                                  </div>
                                  <div className="form-group" style={{ margin: 0 }}>
                                    <input 
                                      type="text" 
                                      placeholder="Rest (e.g. 60s)" 
                                      value={ex.restTime} 
                                      onChange={(e) => handleExerciseFieldChange(selectedDayTab, ex.id, 'restTime', e.target.value)}
                                      style={{ height: '36px', fontSize: '0.8rem', padding: '0 0.5rem' }}
                                    />
                                  </div>
                                  <div className="form-group" style={{ margin: 0 }}>
                                    <input 
                                      type="text" 
                                      placeholder="Tempo (3010)" 
                                      value={ex.tempo} 
                                      onChange={(e) => handleExerciseFieldChange(selectedDayTab, ex.id, 'tempo', e.target.value)}
                                      style={{ height: '36px', fontSize: '0.8rem', padding: '0 0.5rem' }}
                                    />
                                  </div>
                                </div>
                                
                                {/* Form field notes row */}
                                <div className="form-group" style={{ margin: 0 }}>
                                  <input 
                                    type="text" 
                                    placeholder="Coaching instructions / Notes for this exercise..." 
                                    value={ex.notes} 
                                    onChange={(e) => handleExerciseFieldChange(selectedDayTab, ex.id, 'notes', e.target.value)}
                                    style={{ height: '34px', fontSize: '0.75rem', padding: '0 0.5rem' }}
                                  />
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                      </div>
                    );
                  })()}

                </div>
              )}

              {/* STEP 4: FINISH / SUMMARY */}
              {currentStep === 4 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: '#10B981', padding: '0.85rem', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={20} />
                    <strong>Template Plan Configured! Review summary details below.</strong>
                  </div>

                  <div className="card-glass" style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                    <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem', marginBottom: '0.75rem', color: 'var(--color-primary)' }}>Basic Information</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                      <div><span style={{ color: 'var(--text-secondary)' }}>Template Name:</span> <strong>{templateForm.name}</strong></div>
                      <div><span style={{ color: 'var(--text-secondary)' }}>Fitness Goal:</span> <strong>{templateForm.goal}</strong></div>
                      <div><span style={{ color: 'var(--text-secondary)' }}>Difficulty Level:</span> <strong>{templateForm.difficulty}</strong></div>
                      <div><span style={{ color: 'var(--text-secondary)' }}>Split Type:</span> <strong>{templateForm.splitType}</strong></div>
                      <div><span style={{ color: 'var(--text-secondary)' }}>Workout Days Count:</span> <strong>{templateForm.daysCount} active days</strong></div>
                      <div><span style={{ color: 'var(--text-secondary)' }}>Estimated Duration:</span> <strong>{templateForm.duration}</strong></div>
                      {templateForm.description && <div><span style={{ color: 'var(--text-secondary)' }}>Description:</span> <p style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>"{templateForm.description}"</p></div>}
                    </div>
                  </div>

                  <div className="card-glass" style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                    <h4 style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem', marginBottom: '0.75rem', color: 'var(--color-primary)' }}>Weekly Routine Summary</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                        const daySplit = templateForm.schedule[day] || { isRestDay: true, workoutName: 'Rest' };
                        const active = !daySplit.isRestDay;
                        const count = daySplit.exercises?.length || 0;

                        return (
                          <div key={day} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '4px', fontSize: '0.8rem' }}>
                            <span style={{ fontWeight: 600 }}>{day}</span>
                            <span style={{ color: active ? '#fff' : 'var(--text-muted)' }}>
                              {active ? `${daySplit.workoutName} (${count} exercises)` : '💤 Rest Day'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* Modal Footer Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-glass)', paddingTop: '0.75rem' }}>
              <div>
                {currentStep > 1 && (
                  <button type="button" className="btn-secondary" onClick={handleBackStep} style={{ height: '38px' }}>
                    &larr; Back
                  </button>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowTemplateModal(false)} style={{ height: '38px', borderColor: 'transparent', color: 'var(--text-muted)' }}>
                  Cancel
                </button>
                
                {currentStep < 4 ? (
                  <button type="button" className="btn-primary" onClick={handleNextStep} style={{ height: '38px', padding: '0 1.5rem' }}>
                    Next Step &rarr;
                  </button>
                ) : (
                  <button type="button" className="btn-primary" onClick={handleSaveTemplateSubmit} style={{ height: '38px', padding: '0 2rem', background: '#10B981' }}>
                    Save Template
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 4: CASCADE SYNC OPTIONS FOR EXISTING USERS */}
      {showCascadeModal && pendingUpdateTemplate && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 4000 }}>
          <div className="modal-card card-glass" style={{ maxWidth: '500px', width: '95%', padding: '1.5rem', borderRadius: '16px', display: 'block' }}>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              <ShieldAlert size={22} style={{ color: 'var(--color-warning)' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Template Updated: Sync Workout Plans</h3>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.4' }}>
              The template **"{pendingUpdateTemplate.name}"** is currently assigned to **{affectedMembers.length}** active members. How do you want to handle the update?
            </p>

            {/* Sync Options list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.25rem' }}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={handleCascadeFutureOnly}
                style={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left', padding: '0.75rem', height: 'auto', display: 'block' }}
              >
                <strong>1. Apply changes only to future members</strong>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Current members will keep their existing workout schedule unchanged.</div>
              </button>

              <button 
                type="button" 
                className="btn-primary" 
                onClick={handleCascadeAllMembers}
                style={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left', padding: '0.75rem', height: 'auto', display: 'block', background: 'var(--color-primary)' }}
              >
                <strong>2. Update all current members using this template</strong>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>Automatically overwrite the schedule of all {affectedMembers.length} members with new template details.</div>
              </button>
            </div>

            {/* Selection checkbox list (Option 3) */}
            <div style={{ borderTop: '1px dashed rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Option 3: Select specific members to update manually
              </span>

              <div style={{ maxHeight: '140px', overflowY: 'auto', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {affectedMembers.map(item => (
                  <label 
                    key={item.memberId} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      fontSize: '0.75rem', 
                      color: '#fff', 
                      cursor: 'pointer',
                      background: selectedMembersToUpdate.includes(item.memberId) ? 'rgba(139,92,246,0.05)' : 'transparent',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px'
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={selectedMembersToUpdate.includes(item.memberId)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSelectedMembersToUpdate(prev => 
                          checked ? [...prev, item.memberId] : prev.filter(id => id !== item.memberId)
                        );
                      }}
                    />
                    <span>{item.memberName} ({item.status})</span>
                  </label>
                ))}
              </div>

              <button 
                type="button" 
                className="btn-secondary" 
                onClick={handleCascadeSelectedMembers}
                disabled={selectedMembersToUpdate.length === 0}
                style={{ width: '100%', marginTop: '0.75rem', border: '1px solid rgba(139, 92, 246, 0.4)', color: '#fff', fontWeight: 600 }}
              >
                Sync Updates to {selectedMembersToUpdate.length} Selected Member(s)
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem', borderTop: '1px solid var(--border-glass)', paddingTop: '0.75rem' }}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setShowCascadeModal(false)}
                style={{ borderColor: 'transparent', color: 'var(--text-muted)' }}
              >
                Cancel / Return
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
