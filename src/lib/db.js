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
  rescheduledWorkouts: 'rescheduled_workouts',
  workoutTemplates: 'workout_templates'
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
  members: [],
  attendance: [],
  payments: [],
  workouts: [],
  dietPlans: [],
  progress: [],
  notifications: [],
  rescheduledWorkouts: [],
  workoutTemplates: [
    {
      id: "tmpl-1",
      name: "Beginner Full Body",
      goal: "General Conditioning & Movement Mechanics",
      difficulty: "Beginner",
      description: "Full body split targeting foundational movements for gym novices.",
      isFavorite: false,
      schedule: {
        Monday: {
          isRestDay: false,
          workoutName: "Full Body A",
          exercises: [
            { id: "e1", name: "Goblet Squats", sets: 3, reps: 12, weight: 16, restTime: "60s", notes: "Focus on knee alignment" },
            { id: "e2", name: "Dumbbell Chest Press", sets: 3, reps: 10, weight: 12, restTime: "60s", notes: "Control the descending path" },
            { id: "e3", name: "Lat Pulldown", sets: 3, reps: 12, weight: 35, restTime: "60s", notes: "Squeeze upper back" }
          ]
        },
        Tuesday: { isRestDay: true, workoutName: "Rest Day", exercises: [] },
        Wednesday: {
          isRestDay: false,
          workoutName: "Full Body B",
          exercises: [
            { id: "e4", name: "Romanian Deadlift", sets: 3, reps: 12, weight: 30, restTime: "75s", notes: "Hinge at the hips" },
            { id: "e5", name: "Dumbbell Shoulder Press", sets: 3, reps: 10, weight: 10, restTime: "60s", notes: "Don't flare elbows" },
            { id: "e6", name: "Seated Cable Row", sets: 3, reps: 12, weight: 30, restTime: "60s", notes: "Keep spine straight" }
          ]
        },
        Thursday: { isRestDay: true, workoutName: "Rest Day", exercises: [] },
        Friday: {
          isRestDay: false,
          workoutName: "Full Body C",
          exercises: [
            { id: "e7", name: "Leg Press", sets: 3, reps: 12, weight: 80, restTime: "90s", notes: "Avoid locking knees" },
            { id: "e8", name: "Pushups", sets: 3, reps: 10, weight: 0, restTime: "60s", notes: "Tighten core" },
            { id: "e9", name: "Face Pulls", sets: 3, reps: 15, weight: 15, restTime: "45s", notes: "Target rear delts" }
          ]
        },
        Saturday: { isRestDay: true, workoutName: "Rest Day", exercises: [] },
        Sunday: { isRestDay: true, workoutName: "Rest Day", exercises: [] }
      }
    },
    {
      id: "tmpl-2",
      name: "Bodybuilding Split",
      goal: "Maximal Hypertrophy & Muscle Density",
      difficulty: "Advanced",
      description: "Traditional high-volume bodybuilding split designed to build muscle thickness.",
      isFavorite: true,
      schedule: {
        Monday: {
          isRestDay: false,
          workoutName: "Chest & Triceps",
          exercises: [
            { id: "e201", name: "Incline Barbell Press", sets: 4, reps: 8, weight: 60, restTime: "90s", notes: "Upper chest focus" },
            { id: "e202", name: "Flat Dumbbell Press", sets: 3, reps: 10, weight: 26, restTime: "90s", notes: "Full stretch at bottom" },
            { id: "e203", name: "Tricep Overhead Pushdown", sets: 4, reps: 12, weight: 25, restTime: "60s", notes: "Keep elbows tucked" }
          ]
        },
        Tuesday: {
          isRestDay: false,
          workoutName: "Back & Biceps",
          exercises: [
            { id: "e204", name: "Conventional Deadlifts", sets: 4, reps: 6, weight: 100, restTime: "120s", notes: "Engage lats before pulling" },
            { id: "e205", name: "Weighted Pull-Ups", sets: 3, reps: 8, weight: 10, restTime: "90s", notes: "Full range dead hang" },
            { id: "e206", name: "Barbell Bicep Curls", sets: 4, reps: 10, weight: 30, restTime: "60s", notes: "Minimize hip sway" }
          ]
        },
        Wednesday: {
          isRestDay: false,
          workoutName: "Legs & Abs",
          exercises: [
            { id: "e207", name: "Barbell Back Squats", sets: 4, reps: 8, weight: 80, restTime: "120s", notes: "Squat below parallel" },
            { id: "e208", name: "Hamstring Curls", sets: 3, reps: 12, weight: 45, restTime: "75s", notes: "Slow eccentric control" },
            { id: "e209", name: "Hanging Leg Raises", sets: 3, reps: 15, weight: 0, restTime: "60s", notes: "Target lower abs" }
          ]
        },
        Thursday: {
          isRestDay: false,
          workoutName: "Shoulders & Arms",
          exercises: [
            { id: "e210", name: "Seated Barbell Overhead Press", sets: 4, reps: 8, weight: 45, restTime: "90s", notes: "Bar to collarbone level" },
            { id: "e211", name: "Dumbbell Lateral Raises", sets: 4, reps: 15, weight: 12, restTime: "60s", notes: "Lead with elbows" },
            { id: "e212", name: "Close-Grip Bench Press", sets: 3, reps: 10, weight: 50, restTime: "75s", notes: "Inner tricep focus" }
          ]
        },
        Friday: { isRestDay: true, workoutName: "Active Recovery", exercises: [] },
        Saturday: {
          isRestDay: false,
          workoutName: "Functional HIIT Circuits",
          exercises: [
            { id: "e213", name: "Kettlebell Swings", sets: 4, reps: 20, weight: 20, restTime: "45s", notes: "Hinge-power output" },
            { id: "e214", name: "Burpees", sets: 4, reps: 12, weight: 0, restTime: "45s", notes: "High heart rate pacing" }
          ]
        },
        Sunday: { isRestDay: true, workoutName: "Rest Day", exercises: [] }
      }
    },
    {
      id: "tmpl-3",
      name: "Push Pull Legs",
      goal: "Hypertrophy & Base Strength Progression",
      difficulty: "Intermediate",
      description: "Classic PPL program to split mechanical movement classes for optimal recovery.",
      isFavorite: false,
      schedule: {
        Monday: {
          isRestDay: false,
          workoutName: "Push",
          exercises: [
            { id: "e301", name: "Flat Barbell Bench Press", sets: 4, reps: 6, weight: 70, restTime: "120s", notes: "Warmup shoulder capsules first" },
            { id: "e302", name: "Dumbbell Incline Bench", sets: 3, reps: 10, weight: 24, restTime: "90s", notes: "Stretch chest muscles" }
          ]
        },
        Tuesday: {
          isRestDay: false,
          workoutName: "Pull",
          exercises: [
            { id: "e303", name: "Bent Over Barbell Row", sets: 4, reps: 8, weight: 55, restTime: "90s", notes: "Pull to lower waist" },
            { id: "e304", name: "Chin Ups", sets: 3, reps: 10, weight: 0, restTime: "90s", notes: "Focus on lat squeeze" }
          ]
        },
        Wednesday: {
          isRestDay: false,
          workoutName: "Legs",
          exercises: [
            { id: "e305", name: "Squats", sets: 4, reps: 8, weight: 80, restTime: "120s", notes: "Deep reps" }
          ]
        },
        Thursday: { isRestDay: true, workoutName: "Rest Day", exercises: [] },
        Friday: {
          isRestDay: false,
          workoutName: "Push B",
          exercises: [
            { id: "e306", name: "Standing Overhead Press", sets: 4, reps: 8, weight: 40, restTime: "90s", notes: "Squeeze glutes to protect lower back" }
          ]
        },
        Saturday: {
          isRestDay: false,
          workoutName: "Pull B",
          exercises: [
            { id: "e307", name: "Chest Supported Row", sets: 4, reps: 10, weight: 22, restTime: "75s", notes: "Contract rhomboids" }
          ]
        },
        Sunday: { isRestDay: true, workoutName: "Rest Day", exercises: [] }
      }
    }
  ],
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
    MOCK_DATA_SEED.attendance = [];
    
    localStorage.setItem(`${keyPrefix}members`, JSON.stringify(MOCK_DATA_SEED.members));
    localStorage.setItem(`${keyPrefix}attendance`, JSON.stringify(MOCK_DATA_SEED.attendance));
    localStorage.setItem(`${keyPrefix}payments`, JSON.stringify(MOCK_DATA_SEED.payments));
    localStorage.setItem(`${keyPrefix}workouts`, JSON.stringify(MOCK_DATA_SEED.workouts));
    localStorage.setItem(`${keyPrefix}dietPlans`, JSON.stringify(MOCK_DATA_SEED.dietPlans));
    localStorage.setItem(`${keyPrefix}progress`, JSON.stringify(MOCK_DATA_SEED.progress));
    localStorage.setItem(`${keyPrefix}notifications`, JSON.stringify(MOCK_DATA_SEED.notifications));
    localStorage.setItem(`${keyPrefix}rescheduledWorkouts`, JSON.stringify(MOCK_DATA_SEED.rescheduledWorkouts));
    localStorage.setItem(`${keyPrefix}workoutTemplates`, JSON.stringify(MOCK_DATA_SEED.workoutTemplates));
    localStorage.setItem(`${keyPrefix}settings`, JSON.stringify(MOCK_DATA_SEED.settings));
    
    console.log("Keerthan MindFit: LocalStorage database pre-populated successfully.");
  } else {
    console.log("Keerthan MindFit: Safety check skipped seeding to prevent data loss.");
    if (!localStorage.getItem(`${keyPrefix}workoutTemplates`)) {
      localStorage.setItem(`${keyPrefix}workoutTemplates`, JSON.stringify(MOCK_DATA_SEED.workoutTemplates || []));
      console.log("Keerthan MindFit: Supplemental seeding for workoutTemplates completed.");
    }
    if (!localStorage.getItem(`${keyPrefix}settings`)) {
      localStorage.setItem(`${keyPrefix}settings`, JSON.stringify(MOCK_DATA_SEED.settings || {}));
      console.log("Keerthan MindFit: Supplemental seeding for settings completed.");
    }
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
