/* ==========================================
   UNIFIED DATABASE LAYER (SUPABASE & LOCAL STORAGE MOCK)
   ========================================== */

import { getSupabaseRef } from './supabase-config-adapter';

// Helper to resolve supabase ref dynamic imports
function getRef() {
  return getSupabaseRef();
}

// Table mappings for Supabase
const TABLE_MAP = {
  members: 'members',
  attendance: 'attendance',
  payments: 'payments',
  workouts: 'workouts',
  dietPlans: 'diet_plans',
  progress: 'progress',
  notifications: 'notifications',
  settings: 'settings',
  rescheduledWorkouts: 'rescheduled_workouts'
};

// Camel to Snake helper for Postgres
export function camelToSnake(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(camelToSnake);
  if (typeof obj !== 'object' || obj instanceof Date) return obj;
  
  const result = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      let val = obj[key];
      // Normalize empty strings to null for database compatibility
      if (val === '') {
        val = null;
      }
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = camelToSnake(val);
    }
  }
  return result;
}

// Snake to Camel helper for JS
export function snakeToCamel(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(snakeToCamel);
  if (typeof obj !== 'object' || obj instanceof Date) return obj;
  
  const result = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/([-_][a-z])/g, group => group.toUpperCase().replace('-', '').replace('_', ''));
      result[camelKey] = snakeToCamel(obj[key]);
    }
  }
  return result;
}

// Pre-seeded Mock Data for Keerthan MindFit
const MOCK_DATA_SEED = {
  members: [
    {
      id: "KMF101",
      fullName: "Alex Mercer",
      gender: "Male",
      age: 26,
      height: 182,
      weight: 78,
      bmi: "23.5",
      mobileNumber: "+91 98765 43210",
      email: "alex.mercer@gmail.com",
      address: "12, Fitness Street, Crossways, Bangalore",
      emergencyContact: "Sarah Mercer - +91 98765 43211",
      bloodGroup: "A+",
      fitnessGoal: "Muscle Gain",
      joinDate: "2026-01-10",
      membershipPlan: "Yearly",
      status: "active",
      trainerNotes: "Focus on upper body hypertrophy.",
      medicalConditions: "None",
      profilePhoto: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&fit=crop",
      isPT: true,
      ptFees: 5000,
      ptSchedule: "06:00 AM - 07:00 AM",
      ptSessionsCompleted: 8,
      ptSessionsTotal: 12
    },
    {
      id: "KMF102",
      fullName: "Sarah Connor",
      gender: "Female",
      age: 29,
      height: 168,
      weight: 62,
      bmi: "22.0",
      mobileNumber: "+91 98765 43220",
      email: "sarah.connor@gmail.com",
      address: "44, Rebel Heights, Bangalore",
      emergencyContact: "John Connor - +91 98765 43221",
      bloodGroup: "O+",
      fitnessGoal: "Strength Training",
      joinDate: "2026-02-15",
      membershipPlan: "Half-Yearly",
      status: "active",
      trainerNotes: "Cardio endurance and core conditioning.",
      medicalConditions: "Past knee injury, avoid heavy squats",
      profilePhoto: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300&fit=crop",
      isPT: false,
      ptFees: 0,
      ptSchedule: "",
      ptSessionsCompleted: 0,
      ptSessionsTotal: 0
    },
    {
      id: "KMF103",
      fullName: "David Goggins",
      gender: "Male",
      age: 38,
      height: 185,
      weight: 84,
      bmi: "24.5",
      mobileNumber: "+91 98765 43230",
      email: "david.goggins@email.com",
      address: "Running Trail 1, Bangalore",
      emergencyContact: "Team Goggins - +91 98765 43231",
      bloodGroup: "B+",
      fitnessGoal: "Endurance Training",
      joinDate: "2026-03-01",
      membershipPlan: "Monthly",
      status: "active",
      trainerNotes: "Extremely high pain tolerance.",
      medicalConditions: "None",
      profilePhoto: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300&fit=crop",
      isPT: true,
      ptFees: 6000,
      ptSchedule: "05:00 AM - 06:00 AM",
      ptSessionsCompleted: 10,
      ptSessionsTotal: 15
    },
    {
      id: "KMF104",
      fullName: "Emily Blunt",
      gender: "Female",
      age: 34,
      height: 171,
      weight: 56,
      bmi: "19.2",
      mobileNumber: "+91 98765 43240",
      email: "emily.blunt@gmail.com",
      address: "5th Avenue, Parkside, Bangalore",
      emergencyContact: "John Krasinski - +91 98765 43241",
      bloodGroup: "AB-",
      fitnessGoal: "Weight Loss",
      joinDate: "2026-05-12",
      membershipPlan: "Quarterly",
      status: "active",
      trainerNotes: "Recovering from minor wrist sprain, avoid heavy cleans.",
      medicalConditions: "Recent wrist sprain",
      profilePhoto: "https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=300&fit=crop",
      isPT: false,
      ptFees: 0,
      ptSchedule: "",
      ptSessionsCompleted: 0,
      ptSessionsTotal: 0
    },
    {
      id: "KMF105",
      fullName: "Marcus Aurelius",
      gender: "Male",
      age: 45,
      height: 178,
      weight: 80,
      bmi: "25.2",
      mobileNumber: "+91 98765 43250",
      email: "marcus.stoic@gmail.com",
      address: "Stoic Academy, Bangalore",
      emergencyContact: "Lucius - +91 98765 43251",
      bloodGroup: "O-",
      fitnessGoal: "General Fitness",
      joinDate: "2026-06-01",
      membershipPlan: "Monthly",
      status: "suspended",
      trainerNotes: "Suspended membership due to travel.",
      medicalConditions: "Lower back pain",
      profilePhoto: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&fit=crop",
      isPT: false,
      ptFees: 0,
      ptSchedule: "",
      ptSessionsCompleted: 0,
      ptSessionsTotal: 0
    }
  ],
  attendance: [],
  payments: [
    { id: "PAY101", memberId: "KMF101", planType: "Yearly", amount: 15000, paymentDate: "2026-01-10", dueDate: "2027-01-10", status: "paid", transactionId: "UPI-481920-VAL" },
    { id: "PAY102", memberId: "KMF102", planType: "Half-Yearly", amount: 8500, paymentDate: "2026-02-15", dueDate: "2026-08-15", status: "paid", transactionId: "CASH-PAID" },
    { id: "PAY103", memberId: "KMF103", planType: "Monthly", amount: 2000, paymentDate: "2026-06-01", dueDate: "2026-07-01", status: "paid", transactionId: "UPI-901827-GPG" },
    { id: "PAY104", memberId: "KMF104", planType: "Quarterly", amount: 5000, paymentDate: "2026-05-12", dueDate: "2026-08-12", status: "paid", transactionId: "UPI-771120-NET" },
    { id: "PAY105", memberId: "KMF105", planType: "Monthly", amount: 2000, paymentDate: "2026-05-01", dueDate: "2026-06-01", status: "overdue", transactionId: "" }
  ],
  workouts: [
    {
      id: "W-KMF101",
      memberId: "KMF101",
      planName: "Muscle Gain Routine",
      difficulty: "Advanced",
      fitnessGoal: "Muscle Gain",
      schedule: {
        "Monday": "Chest + Triceps",
        "Tuesday": "Back + Biceps",
        "Wednesday": "Legs",
        "Thursday": "Shoulders",
        "Friday": "Arms",
        "Saturday": "Cardio + Abs",
        "Sunday": "Rest"
      }
    },
    {
      id: "W-KMF102",
      memberId: "KMF102",
      planName: "Strength & Endurance",
      difficulty: "Intermediate",
      fitnessGoal: "Strength Training",
      schedule: {
        "Monday": "Chest + Triceps",
        "Tuesday": "Back + Biceps",
        "Wednesday": "Legs",
        "Thursday": "Shoulders",
        "Friday": "Arms",
        "Saturday": "Cardio + Abs",
        "Sunday": "Rest"
      }
    }
  ],
  dietPlans: [
    {
      id: "D-KMF101",
      memberId: "KMF101",
      planName: "Muscle Gain Plan",
      targetCalories: 2800,
      targetProtein: 150,
      targetCarbs: 350,
      targetFats: 70,
      waterIntake: 3000,
      meals: {
        "Breakfast": "Oats, Eggs, Milk",
        "Lunch": "Rice, Chicken, Vegetables",
        "Dinner": "Fish, Salad"
      },
      supplements: "Whey Protein, Creatine"
    },
    {
      id: "D-KMF102",
      memberId: "KMF102",
      planName: "Fat Loss Split Plan",
      targetCalories: 1800,
      targetProtein: 120,
      targetCarbs: 180,
      targetFats: 50,
      waterIntake: 3500,
      meals: {
        "Breakfast": "Oats, Eggs, Milk",
        "Lunch": "Rice, Chicken, Vegetables",
        "Dinner": "Fish, Salad"
      },
      supplements: "Whey Protein"
    }
  ],
  progress: [
    {
      id: "PROG-101-1",
      memberId: "KMF101",
      date: "2026-05-15",
      weight: 76.5,
      chest: 101,
      waist: 82,
      hips: 95,
      biceps: 36.5,
      thighs: 56,
      bodyFat: 15.5,
      beforePhoto: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&fit=crop",
      afterPhoto: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&fit=crop"
    },
    {
      id: "PROG-101-2",
      memberId: "KMF101",
      date: "2026-06-20",
      weight: 78.0,
      chest: 104,
      waist: 80,
      hips: 94,
      biceps: 38.0,
      thighs: 57.5,
      bodyFat: 14.2,
      beforePhoto: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&fit=crop",
      afterPhoto: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&fit=crop"
    }
  ],
  notifications: [
    { id: "NOT1", memberId: "All", title: "New Gym Timings", message: "Starting July 1st, Keerthan MindFit will remain open from 5:00 AM to 10:00 PM on weekdays.", type: "system", date: "2026-06-20", read: false },
    { id: "NOT2", memberId: "KMF101", title: "New Workout Assigned", message: "Trainer updated your Muscle Gain split plan.", type: "workout", date: "2026-06-22", read: false },
    { id: "NOT3", memberId: "KMF105", title: "Membership Due Reminder", message: "Your membership expired on 2026-06-01. Please renew.", type: "fee", date: "2026-06-15", read: false }
  ],
  rescheduledWorkouts: [],
  settings: {
    id: "settings",
    gymName: "Keerthan MindFit",
    logo: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=80&fit=crop",
    address: "Keerthan MindFit Center, Bengaluru, IN",
    phone: "+91 99887 76655",
    email: "info@keerthanmindfit.com",
    membershipPlans: [
      { id: "p1", name: "Monthly", duration: 1, price: 2000 },
      { id: "p2", name: "Quarterly", duration: 3, price: 5000 },
      { id: "p3", name: "Half-Yearly", duration: 6, price: 8500 },
      { id: "p4", name: "Yearly", duration: 12, price: 15000 }
    ],
    ptSlots: [
      "05:00 AM - 06:00 AM",
      "06:00 AM - 07:00 AM",
      "07:00 AM - 08:00 AM",
      "08:00 AM - 09:00 AM",
      "05:00 PM - 06:00 PM",
      "06:00 PM - 07:00 PM",
      "07:00 PM - 08:00 PM",
      "08:00 PM - 09:00 PM"
    ]
  }
};

// Generates attendance history for the last 30 days
function seedAttendanceHistory() {
  const attendance = [];
  const membersList = MOCK_DATA_SEED.members;
  
  for (let i = 25; i >= 0; i--) {
    const dateObj = new Date();
    dateObj.setDate(dateObj.getDate() - i);
    const dateStr = dateObj.toISOString().split('T')[0];
    
    // Don't log Sundays
    if (dateObj.getDay() === 0) continue;

    membersList.forEach((mem) => {
      if (mem.status === 'suspended') {
        attendance.push({
          id: `ATT-${mem.id}-${dateStr}`,
          memberId: mem.id,
          date: dateStr,
          status: "absent",
          checkInTime: "--"
        });
      } else {
        const rand = Math.random();
        let status = "absent";
        let checkIn = "--";
        
        if (rand > 0.3) {
          status = "present";
          checkIn = "07:15 AM";
        } else if (rand > 0.1) {
          status = "late";
          checkIn = "08:45 AM";
        }

        attendance.push({
          id: `ATT-${mem.id}-${dateStr}`,
          memberId: mem.id,
          date: dateStr,
          status: status,
          checkInTime: checkIn
        });
      }
    });
  }
  return attendance;
}

function getSessionRole() {
  if (typeof window === 'undefined') return null;
  try {
    const session = sessionStorage.getItem('kmf_session_user') || localStorage.getItem('kmf_session_user');
    if (session) {
      return JSON.parse(session).role;
    }
  } catch (e) {}
  return null;
}

function logDevAction(action) {
  if (getSessionRole() === 'developer') {
    console.log(`[DEV ACTION] ${action}`);
  }
}

// Safety check to verify if a table/collection exists and contains rows
export async function runTableSafetyCheck(tableName) {
  const { active, supabase } = getRef();
  const dbTable = TABLE_MAP[tableName] || tableName;

  if (active && supabase) {
    try {
      const { count, error } = await supabase
        .from(dbTable)
        .select('*', { count: 'exact', head: true });

      if (!error && count && count > 0) {
        console.warn(`[SAFETY CHECK] Supabase table "${dbTable}" already exists and contains ${count} rows. Skipping creation/re-creation.`);
        return false; // Table has rows, skip creation
      }
    } catch (e) {
      console.log(`[SAFETY CHECK] Table check error for "${dbTable}" (may not exist). Safe to proceed.`, e);
    }
  } else {
    if (typeof window === 'undefined') return true;
    // LocalStorage Check
    const key = `kmf_gym_${tableName}`;
    const store = localStorage.getItem(key);
    if (store) {
      try {
        const parsed = JSON.parse(store);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.warn(`[SAFETY CHECK] LocalStorage table "${tableName}" already exists and contains rows. Skipping seed.`);
          return false; // Table has rows, skip seeding
        }
      } catch (e) {}
    }
  }
  return true; // Empty or doesn't exist, safe to proceed
}

// DB migrations runner for Developer role
export async function runDbMigrations() {
  logDevAction("Developer triggered DB Migrations Safety Check.");
  const tables = ['members', 'attendance', 'payments', 'workouts', 'dietPlans', 'progress', 'notifications', 'rescheduledWorkouts', 'settings'];
  
  console.log("[DEV ACTION] Starting DB Migrations table checks...");
  for (const t of tables) {
    const safe = await runTableSafetyCheck(t);
    if (!safe) {
      console.warn(`[SAFETY CHECK] [WARNING] "${t}" exists with data. Direct CREATE/DROP is blocked. Use ADD COLUMN IF NOT EXISTS.`);
    } else {
      console.log(`[SAFETY CHECK] "${t}" is empty or missing. Safe to create/migrate.`);
    }
  }
  console.log("[DEV ACTION] DB Migrations table checks completed.");
  return true;
}

// Initial storage boot
export async function seedLocalStorage() {
  if (typeof window === 'undefined') return;
  const keyPrefix = 'kmf_gym_';
  
  let shouldSeed = true;
  const tablesToCheck = ['members', 'payments', 'settings'];
  
  for (const table of tablesToCheck) {
    const isSafe = await runTableSafetyCheck(table);
    if (!isSafe) {
      shouldSeed = false;
      break;
    }
  }

  if (shouldSeed && !localStorage.getItem(`${keyPrefix}members`)) {
    MOCK_DATA_SEED.attendance = seedAttendanceHistory();
    
    localStorage.setItem(`${keyPrefix}members`, JSON.stringify(MOCK_DATA_SEED.members));
    localStorage.setItem(`${keyPrefix}attendance`, JSON.stringify(MOCK_DATA_SEED.attendance));
    localStorage.setItem(`${keyPrefix}payments`, JSON.stringify(MOCK_DATA_SEED.payments));
    localStorage.setItem(`${keyPrefix}workouts`, JSON.stringify(MOCK_DATA_SEED.workouts));
    localStorage.setItem(`${keyPrefix}dietPlans`, JSON.stringify(MOCK_DATA_SEED.dietPlans));
    localStorage.setItem(`${keyPrefix}progress`, JSON.stringify(MOCK_DATA_SEED.progress));
    localStorage.setItem(`${keyPrefix}notifications`, JSON.stringify(MOCK_DATA_SEED.notifications));
    localStorage.setItem(`${keyPrefix}rescheduledWorkouts`, JSON.stringify(MOCK_DATA_SEED.rescheduledWorkouts));
    localStorage.setItem(`${keyPrefix}settings`, JSON.stringify(MOCK_DATA_SEED.settings));
    
    console.log("Keerthan MindFit: LocalStorage database pre-populated successfully.");
  } else {
    console.log("Keerthan MindFit: Safety check skipped seeding to prevent data loss.");
  }
}

// Seed helper (safely runs client-side)
export function initLocalStorageSeeding() {
  seedLocalStorage();
}

// Helper to select localStorage key
const getStorageKey = (collectionName) => `kmf_gym_${collectionName}`;

/* ==========================================
   UNIFIED CRUD INTERFACE (SUPABASE & MOCK LOCALSTORAGE)
   ========================================== */

// CREATE (Add new item)
export async function dbCreate(collectionName, data) {
  logDevAction(`DB CREATE - Collection: "${collectionName}" - Data: ${JSON.stringify(data)}`);

  const { active, supabase } = getRef();
  
  if (active && supabase) {
    try {
      const table = TABLE_MAP[collectionName] || collectionName;
      const dbData = camelToSnake(data);
      const { data: res, error } = await supabase.from(table).insert([dbData]).select();
      if (error) throw error;
      return res[0]?.id || data.id;
    } catch (e) {
      console.error(`Supabase insert failed for ${collectionName}, falling back to LocalStorage`, e);
    }
  }

  if (typeof window === 'undefined') return data.id;

  // Local Storage fallback
  const key = getStorageKey(collectionName);
  let store = JSON.parse(localStorage.getItem(key)) || [];
  const newId = data.id || `${collectionName.slice(0,3).toUpperCase()}-${Math.floor(1000 + Math.random()*9000)}`;
  const record = { id: newId, ...data };
  
  if (Array.isArray(store)) {
    store.push(record);
  } else {
    store = record;
  }
  localStorage.setItem(key, JSON.stringify(store));
  return newId;
}

// READ (Get all items in collection)
export async function dbReadAll(collectionName) {
  logDevAction(`DB READ ALL - Collection: "${collectionName}"`);

  const { active, supabase } = getRef();

  if (active && supabase) {
    try {
      const table = TABLE_MAP[collectionName] || collectionName;
      const { data: res, error } = await supabase.from(table).select('*');
      if (error) throw error;
      return snakeToCamel(res);
    } catch (e) {
      console.error(`Supabase select * failed for ${collectionName}, falling back to LocalStorage`, e);
    }
  }

  if (typeof window === 'undefined') return [];

  // Local Storage fallback
  const key = getStorageKey(collectionName);
  const data = JSON.parse(localStorage.getItem(key));
  return Array.isArray(data) ? data : (data ? [data] : []);
}

// READ ONE BY ID
export async function dbReadOne(collectionName, id) {
  logDevAction(`DB READ ONE - Collection: "${collectionName}" - ID: "${id}"`);

  const { active, supabase } = getRef();

  if (active && supabase) {
    try {
      const table = TABLE_MAP[collectionName] || collectionName;
      const { data: res, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return snakeToCamel(res);
    } catch (e) {
      console.error(`Supabase select single failed for ${collectionName}:${id}, falling back to LocalStorage`, e);
    }
  }

  if (typeof window === 'undefined') return null;

  // Local Storage fallback
  const key = getStorageKey(collectionName);
  const store = JSON.parse(localStorage.getItem(key));
  if (Array.isArray(store)) {
    return store.find(item => item.id === id) || null;
  }
  return store;
}

// UPDATE (Modify an existing item)
export async function dbUpdate(collectionName, id, updatedData) {
  logDevAction(`DB UPDATE - Collection: "${collectionName}" - ID: "${id}" - Data: ${JSON.stringify(updatedData)}`);

  const { active, supabase } = getRef();

  if (active && supabase) {
    try {
      const table = TABLE_MAP[collectionName] || collectionName;
      const dbData = camelToSnake(updatedData);
      const { error } = await supabase.from(table).update(dbData).eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error(`Supabase update failed for ${collectionName}:${id}, falling back to LocalStorage`, e);
    }
  }

  if (typeof window === 'undefined') return false;

  // Local Storage fallback
  const key = getStorageKey(collectionName);
  const store = JSON.parse(localStorage.getItem(key));
  if (Array.isArray(store)) {
    const idx = store.findIndex(item => item.id === id);
    if (idx !== -1) {
      store[idx] = { ...store[idx], ...updatedData };
      localStorage.setItem(key, JSON.stringify(store));
      return true;
    }
    return false;
  } else if (store && typeof store === 'object') {
    const updatedObj = { ...store, ...updatedData };
    localStorage.setItem(key, JSON.stringify(updatedObj));
    return true;
  }
  return false;
}

// DELETE (Remove item)
export async function dbDelete(collectionName, id) {
  logDevAction(`DB DELETE - Collection: "${collectionName}" - ID: "${id}"`);

  const { active, supabase } = getRef();

  if (active && supabase) {
    try {
      const table = TABLE_MAP[collectionName] || collectionName;
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error(`Supabase delete failed for ${collectionName}:${id}, falling back to LocalStorage`, e);
    }
  }

  if (typeof window === 'undefined') return false;

  // Local Storage fallback
  const key = getStorageKey(collectionName);
  const store = JSON.parse(localStorage.getItem(key)) || [];
  if (Array.isArray(store)) {
    const filtered = store.filter(item => item.id !== id);
    localStorage.setItem(key, JSON.stringify(filtered));
    return true;
  }
  return false;
}

// FIND BY KEY (Query / Search)
export async function dbQuery(collectionName, field, value) {
  logDevAction(`DB QUERY - Collection: "${collectionName}" - Field: "${field}" - Value: "${value}"`);

  const { active, supabase } = getRef();

  if (active && supabase) {
    try {
      const table = TABLE_MAP[collectionName] || collectionName;
      const snakeField = field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      const { data: res, error } = await supabase.from(table).select('*').eq(snakeField, value);
      if (error) throw error;
      return snakeToCamel(res);
    } catch (e) {
      console.error(`Supabase query failed for ${collectionName}, falling back to LocalStorage`, e);
    }
  }

  if (typeof window === 'undefined') return [];

  // Local Storage fallback
  const key = getStorageKey(collectionName);
  const store = JSON.parse(localStorage.getItem(key)) || [];
  if (Array.isArray(store)) {
    return store.filter(item => item[field] === value);
  }
  return store && store[field] === value ? [store] : [];
}
