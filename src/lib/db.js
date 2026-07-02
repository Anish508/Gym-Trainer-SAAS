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
      splitType: "Full Body",
      duration: "8 Weeks",
      daysCount: 3,
      muscles: "Full Body, Legs, Chest, Back",
      isFavorite: false,
      isArchived: false,
      updatedAt: new Date().toISOString(),
      schedule: {
        Monday: {
          isRestDay: false,
          workoutName: "Full Body A",
          exercises: [
            { id: "e1", name: "Goblet Squats", sets: 3, reps: "12", weight: 16, restTime: "60s", tempo: "3-0-1-0", notes: "Focus on knee alignment" },
            { id: "e2", name: "Dumbbell Chest Press", sets: 3, reps: "10", weight: 12, restTime: "60s", tempo: "2-0-1-0", notes: "Control the descending path" },
            { id: "e3", name: "Lat Pulldown", sets: 3, reps: "12", weight: 35, restTime: "60s", tempo: "3-0-1-1", notes: "Squeeze upper back" }
          ]
        },
        Tuesday: { isRestDay: true, workoutName: "Rest Day", exercises: [] },
        Wednesday: {
          isRestDay: false,
          workoutName: "Full Body B",
          exercises: [
            { id: "e4", name: "Romanian Deadlift", sets: 3, reps: "12", weight: 30, restTime: "75s", tempo: "3-0-1-0", notes: "Hinge at the hips" },
            { id: "e5", name: "Dumbbell Shoulder Press", sets: 3, reps: "10", weight: 10, restTime: "60s", tempo: "2-0-1-0", notes: "Don't flare elbows" },
            { id: "e6", name: "Seated Cable Row", sets: 3, reps: "12", weight: 30, restTime: "60s", tempo: "3-0-1-1", notes: "Keep spine straight" }
          ]
        },
        Thursday: { isRestDay: true, workoutName: "Rest Day", exercises: [] },
        Friday: {
          isRestDay: false,
          workoutName: "Full Body C",
          exercises: [
            { id: "e7", name: "Leg Press", sets: 3, reps: "12", weight: 80, restTime: "90s", tempo: "3-0-1-0", notes: "Avoid locking knees" },
            { id: "e8", name: "Pushups", sets: 3, reps: "10", weight: 0, restTime: "60s", tempo: "2-0-1-0", notes: "Tighten core" },
            { id: "e9", name: "Face Pulls", sets: 3, reps: "15", weight: 15, restTime: "45s", tempo: "2-0-1-2", notes: "Target rear delts" }
          ]
        },
        Saturday: { isRestDay: true, workoutName: "Rest Day", exercises: [] },
        Sunday: { isRestDay: true, workoutName: "Rest Day", exercises: [] }
      }
    },
    {
      id: "tmpl-2",
      name: "Push Pull Legs",
      goal: "Hypertrophy & Base Strength Progression",
      difficulty: "Intermediate",
      description: "Classic PPL program to split mechanical movement classes for optimal recovery.",
      splitType: "Push Pull Legs",
      duration: "12 Weeks",
      daysCount: 6,
      muscles: "Chest, Shoulders, Triceps, Back, Biceps, Legs",
      isFavorite: false,
      isArchived: false,
      updatedAt: new Date().toISOString(),
      schedule: {
        Monday: {
          isRestDay: false,
          workoutName: "Push A",
          exercises: [
            { id: "e301", name: "Flat Barbell Bench Press", sets: 4, reps: "6", weight: 70, restTime: "120s", tempo: "3-0-1-0", notes: "Warmup shoulder capsules first" },
            { id: "e302", name: "Dumbbell Incline Bench", sets: 3, reps: "10", weight: 24, restTime: "90s", tempo: "2-0-1-0", notes: "Stretch chest muscles" },
            { id: "e302_2", name: "Overhead Triceps Extension", sets: 3, reps: "12", weight: 14, restTime: "60s", tempo: "2-0-1-0", notes: "Tuck elbows in" }
          ]
        },
        Tuesday: {
          isRestDay: false,
          workoutName: "Pull A",
          exercises: [
            { id: "e303", name: "Bent Over Barbell Row", sets: 4, reps: "8", weight: 55, restTime: "90s", tempo: "2-0-1-1", notes: "Pull to lower waist" },
            { id: "e304", name: "Chin Ups", sets: 3, reps: "10", weight: 0, restTime: "90s", tempo: "2-0-1-0", notes: "Focus on lat squeeze" },
            { id: "e304_2", name: "Incline DB Curls", sets: 3, reps: "12", weight: 10, restTime: "60s", tempo: "3-0-1-0", notes: "Full range bicep stretch" }
          ]
        },
        Wednesday: {
          isRestDay: false,
          workoutName: "Legs A",
          exercises: [
            { id: "e305", name: "Barbell Squats", sets: 4, reps: "8", weight: 80, restTime: "120s", tempo: "3-1-1-0", notes: "Deep reps, break parallel" },
            { id: "e305_2", name: "Romanian Deadlift", sets: 3, reps: "10", weight: 60, restTime: "90s", tempo: "3-0-1-0", notes: "Hinge hips back" }
          ]
        },
        Thursday: {
          isRestDay: false,
          workoutName: "Push B",
          exercises: [
            { id: "e306", name: "Standing Overhead Press", sets: 4, reps: "8", weight: 40, restTime: "90s", tempo: "2-0-1-0", notes: "Squeeze glutes to protect lower back" },
            { id: "e306_2", name: "Cable Chest Flyes", sets: 3, reps: "15", weight: 15, restTime: "60s", tempo: "2-0-1-2", notes: "Squeeze chest at center" }
          ]
        },
        Friday: {
          isRestDay: false,
          workoutName: "Pull B",
          exercises: [
            { id: "e307", name: "Chest Supported Row", sets: 4, reps: "10", weight: 22, restTime: "75s", tempo: "2-0-1-1", notes: "Contract rhomboids" },
            { id: "e307_2", name: "Hammer Curls", sets: 3, reps: "12", weight: 12, restTime: "60s", tempo: "2-0-1-0", notes: "Focus on brachialis" }
          ]
        },
        Saturday: {
          isRestDay: false,
          workoutName: "Legs B",
          exercises: [
            { id: "e308", name: "Leg Press", sets: 4, reps: "12", weight: 120, restTime: "90s", tempo: "3-0-1-0", notes: "High volume legs" },
            { id: "e308_2", name: "Seated Calf Raises", sets: 4, reps: "15", weight: 35, restTime: "60s", tempo: "2-1-2-1", notes: "Slow stretch and squeeze" }
          ]
        },
        Sunday: { isRestDay: true, workoutName: "Rest Day", exercises: [] }
      }
    },
    {
      id: "tmpl-3",
      name: "Upper Lower Split",
      goal: "Hypertrophy & Balanced Upper/Lower Development",
      difficulty: "Intermediate",
      description: "4-day split alternating between upper body pushing/pulling and lower body development.",
      splitType: "Upper Lower",
      duration: "10 Weeks",
      daysCount: 4,
      muscles: "Chest, Back, Shoulders, Quads, Hamstrings, Core",
      isFavorite: false,
      isArchived: false,
      updatedAt: new Date().toISOString(),
      schedule: {
        Monday: {
          isRestDay: false,
          workoutName: "Upper A",
          exercises: [
            { id: "e401", name: "Incline DB Press", sets: 4, reps: "8", weight: 22, restTime: "90s", tempo: "3-0-1-0", notes: "Focus upper chest stretch" },
            { id: "e402", name: "Weighted Pull-ups", sets: 3, reps: "8", weight: 10, restTime: "90s", tempo: "2-0-1-0", notes: "Full range hang" },
            { id: "e403", name: "Lateral Raises", sets: 3, reps: "15", weight: 10, restTime: "60s", tempo: "2-0-1-1", notes: "Control descending path" }
          ]
        },
        Tuesday: {
          isRestDay: false,
          workoutName: "Lower A",
          exercises: [
            { id: "e404", name: "Barbell Back Squats", sets: 4, reps: "6", weight: 85, restTime: "120s", tempo: "3-1-1-0", notes: "Focus on depth" },
            { id: "e405", name: "Lying Hamstring Curl", sets: 3, reps: "12", weight: 40, restTime: "75s", tempo: "2-0-1-1", notes: "Slow eccentric phase" }
          ]
        },
        Wednesday: { isRestDay: true, workoutName: "Rest Day", exercises: [] },
        Thursday: {
          isRestDay: false,
          workoutName: "Upper B",
          exercises: [
            { id: "e406", name: "Flat Barbell Bench", sets: 4, reps: "8", weight: 65, restTime: "90s", tempo: "3-0-1-0", notes: "Control bar speed" },
            { id: "e407", name: "Seated Cable Row", sets: 3, reps: "10", weight: 45, restTime: "75s", tempo: "2-0-1-1", notes: "Keep posture straight" }
          ]
        },
        Friday: {
          isRestDay: false,
          workoutName: "Lower B",
          exercises: [
            { id: "e408", name: "Hex Bar Deadlifts", sets: 4, reps: "6", weight: 90, restTime: "120s", tempo: "2-0-1-0", notes: "Drive with the legs" },
            { id: "e409", name: "Walking Lunges", sets: 3, reps: "12 steps", weight: 16, restTime: "75s", tempo: "1-0-1-0", notes: "Perform in control" }
          ]
        },
        Saturday: { isRestDay: true, workoutName: "Rest Day", exercises: [] },
        Sunday: { isRestDay: true, workoutName: "Rest Day", exercises: [] }
      }
    },
    {
      id: "tmpl-4",
      name: "Fat Loss Program",
      goal: "Fat Loss & Aerobic Conditioning",
      difficulty: "Beginner",
      description: "High-intensity circuits combined with steady-state cardio for maximum caloric burn.",
      splitType: "Cardio & HIIT",
      duration: "6 Weeks",
      daysCount: 4,
      muscles: "Full Body, Core, Cardio",
      isFavorite: false,
      isArchived: false,
      updatedAt: new Date().toISOString(),
      schedule: {
        Monday: {
          isRestDay: false,
          workoutName: "HIIT Circuit A",
          exercises: [
            { id: "e501", name: "Kettlebell Swings", sets: 4, reps: "20", weight: 16, restTime: "30s", tempo: "1-0-1-0", notes: "Hip drive emphasis" },
            { id: "e502", name: "Burpees", sets: 4, reps: "12", weight: 0, restTime: "30s", tempo: "1-0-1-0", notes: "Fast pace" },
            { id: "e503", name: "Mountain Climbers", sets: 4, reps: "30s", weight: 0, restTime: "30s", tempo: "1-0-1-0", notes: "Keep hips low" }
          ]
        },
        Tuesday: {
          isRestDay: false,
          workoutName: "Steady Cardio",
          exercises: [
            { id: "e504", name: "Incline Treadmill Walk", sets: 1, reps: "40 min", weight: 0, restTime: "--", tempo: "--", notes: "Speed: 5km/h, Incline: 8%" }
          ]
        },
        Wednesday: { isRestDay: true, workoutName: "Rest Day", exercises: [] },
        Thursday: {
          isRestDay: false,
          workoutName: "Full Body Tone",
          exercises: [
            { id: "e505", name: "Dumbbell Thrusters", sets: 3, reps: "15", weight: 8, restTime: "60s", tempo: "2-0-1-0", notes: "Squat into shoulder press" },
            { id: "e506", name: "Renegade Rows", sets: 3, reps: "12", weight: 10, restTime: "60s", tempo: "2-0-1-0", notes: "Avoid twisting hips" }
          ]
        },
        Friday: {
          isRestDay: false,
          workoutName: "HIIT Circuit B",
          exercises: [
            { id: "e507", name: "Jump Squats", sets: 4, reps: "15", weight: 0, restTime: "30s", tempo: "1-0-1-0", notes: "Soft landings" },
            { id: "e508", name: "Plank Jacks", sets: 4, reps: "45s", weight: 0, restTime: "30s", tempo: "1-0-1-0", notes: "Core stability" }
          ]
        },
        Saturday: { isRestDay: true, workoutName: "Rest Day", exercises: [] },
        Sunday: { isRestDay: true, workoutName: "Rest Day", exercises: [] }
      }
    },
    {
      id: "tmpl-5",
      name: "Muscle Gain Program",
      goal: "Muscle Gain & Hypertrophy",
      difficulty: "Advanced",
      description: "High-volume splits focusing on progressive overload and isolation targeting.",
      splitType: "Bodybuilding",
      duration: "12 Weeks",
      daysCount: 5,
      muscles: "Chest, Back, Legs, Shoulders, Arms",
      isFavorite: false,
      isArchived: false,
      updatedAt: new Date().toISOString(),
      schedule: {
        Monday: {
          isRestDay: false,
          workoutName: "Chest Focus",
          exercises: [
            { id: "e601", name: "Flat Barbell Bench Press", sets: 4, reps: "8", weight: 80, restTime: "90s", tempo: "3-0-1-0", notes: "Warmup thoroughly" },
            { id: "e602", name: "Incline DB Bench Press", sets: 3, reps: "10", weight: 28, restTime: "90s", tempo: "2-0-1-0", notes: "Upper chest pump" }
          ]
        },
        Tuesday: {
          isRestDay: false,
          workoutName: "Back Focus",
          exercises: [
            { id: "e603", name: "Deadlifts", sets: 4, reps: "5", weight: 120, restTime: "120s", tempo: "2-1-1-0", notes: "Reset every rep" },
            { id: "e604", name: "Barbell Rows", sets: 3, reps: "8", weight: 60, restTime: "90s", tempo: "2-0-1-1", notes: "Pull to abdomen" }
          ]
        },
        Wednesday: {
          isRestDay: false,
          workoutName: "Legs Focus",
          exercises: [
            { id: "e605", name: "Barbell Squats", sets: 4, reps: "8", weight: 90, restTime: "120s", tempo: "3-0-1-0", notes: "Squat below parallel" },
            { id: "e606", name: "Lying Leg Curls", sets: 3, reps: "12", weight: 45, restTime: "60s", tempo: "2-0-1-1", notes: "Tense hamstrings" }
          ]
        },
        Thursday: {
          isRestDay: false,
          workoutName: "Shoulders Focus",
          exercises: [
            { id: "e607", name: "Seated DB Overhead Press", sets: 4, reps: "8", weight: 22, restTime: "90s", tempo: "3-0-1-0", notes: "Lockout at top" },
            { id: "e608", name: "Cable Lateral Raises", sets: 3, reps: "15", weight: 10, restTime: "60s", tempo: "2-0-1-2", notes: "Constant cable tension" }
          ]
        },
        Friday: {
          isRestDay: false,
          workoutName: "Arms Focus",
          exercises: [
            { id: "e609", name: "Barbell Bicep Curls", sets: 4, reps: "10", weight: 35, restTime: "60s", tempo: "3-0-1-0", notes: "Do not swing hips" },
            { id: "e610", name: "Skull Crushers", sets: 4, reps: "10", weight: 30, restTime: "60s", tempo: "3-0-1-0", notes: "Lower to forehead" }
          ]
        },
        Saturday: { isRestDay: true, workoutName: "Rest Day", exercises: [] },
        Sunday: { isRestDay: true, workoutName: "Rest Day", exercises: [] }
      }
    },
    {
      id: "tmpl-6",
      name: "Bodybuilding Split",
      goal: "Maximal Hypertrophy & Muscle Density",
      difficulty: "Advanced",
      description: "Traditional high-volume bodybuilding split designed to build muscle thickness.",
      splitType: "Bodybuilding",
      duration: "12 Weeks",
      daysCount: 5,
      muscles: "Chest, Back, Legs, Shoulders, Arms",
      isFavorite: true,
      isArchived: false,
      updatedAt: new Date().toISOString(),
      schedule: {
        Monday: {
          isRestDay: false,
          workoutName: "Chest & Triceps",
          exercises: [
            { id: "e201", name: "Incline Barbell Press", sets: 4, reps: "8", weight: 60, restTime: "90s", tempo: "3-1-1-0", notes: "Upper chest focus" },
            { id: "e202", name: "Flat Dumbbell Press", sets: 3, reps: "10", weight: 26, restTime: "90s", tempo: "2-0-1-0", notes: "Full stretch at bottom" },
            { id: "e203", name: "Tricep Overhead Pushdown", sets: 4, reps: "12", weight: 25, restTime: "60s", tempo: "2-0-1-1", notes: "Keep elbows tucked" }
          ]
        },
        Tuesday: {
          isRestDay: false,
          workoutName: "Back & Biceps",
          exercises: [
            { id: "e204", name: "Conventional Deadlifts", sets: 4, reps: "6", weight: 100, restTime: "120s", tempo: "2-1-1-0", notes: "Engage lats before pulling" },
            { id: "e205", name: "Weighted Pull-Ups", sets: 3, reps: "8", weight: 10, restTime: "90s", tempo: "2-0-1-0", notes: "Full range dead hang" },
            { id: "e206", name: "Barbell Bicep Curls", sets: 4, reps: "10", weight: 30, restTime: "60s", tempo: "3-0-1-0", notes: "Minimize hip sway" }
          ]
        },
        Wednesday: {
          isRestDay: false,
          workoutName: "Legs & Abs",
          exercises: [
            { id: "e207", name: "Barbell Back Squats", sets: 4, reps: "8", weight: 80, restTime: "120s", tempo: "3-0-1-0", notes: "Squat below parallel" },
            { id: "e208", name: "Hamstring Curls", sets: 3, reps: "12", weight: 45, restTime: "75s", tempo: "2-0-1-1", notes: "Slow eccentric control" },
            { id: "e209", name: "Hanging Leg Raises", sets: 3, reps: "15", weight: 0, restTime: "60s", tempo: "2-0-1-2", notes: "Target lower abs" }
          ]
        },
        Thursday: {
          isRestDay: false,
          workoutName: "Shoulders & Arms",
          exercises: [
            { id: "e210", name: "Seated Barbell Overhead Press", sets: 4, reps: "8", weight: 45, restTime: "90s", tempo: "2-0-1-0", notes: "Bar to collarbone level" },
            { id: "e211", name: "Dumbbell Lateral Raises", sets: 4, reps: "15", weight: 12, restTime: "60s", tempo: "2-0-1-1", notes: "Lead with elbows" },
            { id: "e212", name: "Close-Grip Bench Press", sets: 3, reps: "10", weight: 50, restTime: "75s", tempo: "3-0-1-0", notes: "Inner tricep focus" }
          ]
        },
        Friday: { isRestDay: true, workoutName: "Active Recovery", exercises: [] },
        Saturday: {
          isRestDay: false,
          workoutName: "Functional HIIT Circuits",
          exercises: [
            { id: "e213", name: "Kettlebell Swings", sets: 4, reps: "20", weight: 20, restTime: "45s", tempo: "1-0-1-0", notes: "Hinge-power output" },
            { id: "e214", name: "Burpees", sets: 4, reps: "12", weight: 0, restTime: "45s", tempo: "1-0-1-0", notes: "High heart rate pacing" }
          ]
        },
        Sunday: { isRestDay: true, workoutName: "Rest Day", exercises: [] }
      }
    },
    {
      id: "tmpl-7",
      name: "Women's Weight Loss",
      goal: "Tone & Body Recomposition",
      difficulty: "Intermediate",
      description: "Focused lower-body and core training combined with metabolic conditioning.",
      splitType: "Full Body",
      duration: "8 Weeks",
      daysCount: 3,
      muscles: "Glutes, Hamstrings, Abs, Shoulders",
      isFavorite: false,
      isArchived: false,
      updatedAt: new Date().toISOString(),
      schedule: {
        Monday: {
          isRestDay: false,
          workoutName: "Lower Body & Glutes",
          exercises: [
            { id: "e701", name: "Dumbbell Sumo Squats", sets: 4, reps: "12", weight: 16, restTime: "60s", tempo: "3-0-1-0", notes: "Keep torso upright" },
            { id: "e702", name: "Barbell Hip Thrusts", sets: 4, reps: "15", weight: 40, restTime: "75s", tempo: "2-0-1-2", notes: "Squeeze glutes at top" },
            { id: "e703", name: "Cable Kickbacks", sets: 3, reps: "15", weight: 10, restTime: "45s", tempo: "2-0-1-1", notes: "Control the return" }
          ]
        },
        Tuesday: { isRestDay: true, workoutName: "Rest Day", exercises: [] },
        Wednesday: {
          isRestDay: false,
          workoutName: "Upper Body & Core",
          exercises: [
            { id: "e704", name: "Dumbbell Row", sets: 3, reps: "12", weight: 10, restTime: "60s", tempo: "2-0-1-0", notes: "Pull to back hip" },
            { id: "e705", name: "Dumbbell Shoulder Press", sets: 3, reps: "12", weight: 8, restTime: "60s", tempo: "2-0-1-0", notes: "Keep core tight" },
            { id: "e706", name: "Russian Twists", sets: 3, reps: "20", weight: 6, restTime: "45s", tempo: "1-0-1-0", notes: "Use weight or bodyweight" }
          ]
        },
        Thursday: { isRestDay: true, workoutName: "Rest Day", exercises: [] },
        Friday: {
          isRestDay: false,
          workoutName: "Full Body Circuit",
          exercises: [
            { id: "e707", name: "Goblet Squats", sets: 3, reps: "15", weight: 12, restTime: "45s", tempo: "2-0-1-0", notes: "Keep heels down" },
            { id: "e708", name: "Dumbbell Deadlifts", sets: 3, reps: "12", weight: 14, restTime: "45s", tempo: "3-0-1-0", notes: "Keep back flat" },
            { id: "e709", name: "Bicycle Crunches", sets: 3, reps: "20 reps", weight: 0, restTime: "45s", tempo: "1-0-1-0", notes: "Focus on oblique contraction" }
          ]
        },
        Saturday: { isRestDay: true, workoutName: "Rest Day", exercises: [] },
        Sunday: { isRestDay: true, workoutName: "Rest Day", exercises: [] }
      }
    },
    {
      id: "tmpl-8",
      name: "Senior Fitness",
      goal: "Mobility, Balance & Joint Strength",
      difficulty: "Beginner",
      description: "Low-impact movements focusing on core stability, flexibility, and longevity.",
      splitType: "Mobility",
      duration: "8 Weeks",
      daysCount: 3,
      muscles: "Core, Joints, Back, Balance",
      isFavorite: false,
      isArchived: false,
      updatedAt: new Date().toISOString(),
      schedule: {
        Monday: {
          isRestDay: false,
          workoutName: "Balance & Mobility",
          exercises: [
            { id: "e801", name: "Single Leg Stand", sets: 3, reps: "30s each", weight: 0, restTime: "45s", tempo: "--", notes: "Hold wall if needed" },
            { id: "e802", name: "Wall Push-ups", sets: 3, reps: "12", weight: 0, restTime: "60s", tempo: "2-0-2-0", notes: "Keep body in straight line" },
            { id: "e803", name: "Seated Chair Squats", sets: 3, reps: "10", weight: 0, restTime: "60s", tempo: "3-0-1-0", notes: "Use core to stand up" }
          ]
        },
        Tuesday: { isRestDay: true, workoutName: "Rest Day", exercises: [] },
        Wednesday: {
          isRestDay: false,
          workoutName: "Light Strength",
          exercises: [
            { id: "e804", name: "Dumbbell Bicep Curls", sets: 3, reps: "12", weight: 4, restTime: "45s", tempo: "2-0-2-0", notes: "Control the weight" },
            { id: "e805", name: "Resistance Band Rows", sets: 3, reps: "15", weight: 0, restTime: "45s", tempo: "2-0-2-1", notes: "Focus upper back pinch" }
          ]
        },
        Thursday: { isRestDay: true, workoutName: "Rest Day", exercises: [] },
        Friday: {
          isRestDay: false,
          workoutName: "Flexibility & Core",
          exercises: [
            { id: "e806", name: "Cat-Cow Stretch", sets: 3, reps: "10", weight: 0, restTime: "30s", tempo: "--", notes: "Inhale/exhale flow" },
            { id: "e807", name: "Bird-Dog Pose", sets: 3, reps: "8 each", weight: 0, restTime: "45s", tempo: "--", notes: "Keep hips level" },
            { id: "e808", name: "Glute Bridges", sets: 3, reps: "12", weight: 0, restTime: "45s", tempo: "2-0-1-1", notes: "Squeeze glutes" }
          ]
        },
        Saturday: { isRestDay: true, workoutName: "Rest Day", exercises: [] },
        Sunday: { isRestDay: true, workoutName: "Rest Day", exercises: [] }
      }
    },
    {
      id: "tmpl-9",
      name: "Strength Program",
      goal: "Maximal Strength & Power Development",
      difficulty: "Advanced",
      description: "Powerlifting-focused split built around the Squat, Bench Press, and Deadlift.",
      splitType: "Powerlifting",
      duration: "12 Weeks",
      daysCount: 4,
      muscles: "Full Body, Legs, Chest, Back",
      isFavorite: false,
      isArchived: false,
      updatedAt: new Date().toISOString(),
      schedule: {
        Monday: {
          isRestDay: false,
          workoutName: "Squat Day",
          exercises: [
            { id: "e901", name: "Barbell Back Squats", sets: 5, reps: "5", weight: 100, restTime: "180s", tempo: "3-1-1-0", notes: "Heavy working sets" },
            { id: "e902", name: "Leg Press", sets: 3, reps: "8", weight: 160, restTime: "90s", tempo: "3-0-1-0", notes: "Quadriceps volume accessory" }
          ]
        },
        Tuesday: {
          isRestDay: false,
          workoutName: "Bench Press Day",
          exercises: [
            { id: "e903", name: "Flat Barbell Bench Press", sets: 5, reps: "5", weight: 80, restTime: "180s", tempo: "3-0-1-0", notes: "Heavy bench press" },
            { id: "e904", name: "Close Grip Bench Press", sets: 3, reps: "8", weight: 60, restTime: "90s", tempo: "2-0-1-0", notes: "Tuck elbows in" }
          ]
        },
        Wednesday: { isRestDay: true, workoutName: "Rest Day", exercises: [] },
        Thursday: {
          isRestDay: false,
          workoutName: "Deadlift Day",
          exercises: [
            { id: "e905", name: "Conventional Deadlifts", sets: 5, reps: "3", weight: 140, restTime: "180s", tempo: "2-1-1-0", notes: "Maintain neutral spine" },
            { id: "e906", name: "Barbell Deficit Deadlifts", sets: 3, reps: "6", weight: 100, restTime: "120s", tempo: "3-0-1-0", notes: "1-inch deficit plate" }
          ]
        },
        Friday: { isRestDay: true, workoutName: "Rest Day", exercises: [] },
        Saturday: {
          isRestDay: false,
          workoutName: "Overhead Press Day",
          exercises: [
            { id: "e907", name: "Standing Barbell OHP", sets: 5, reps: "5", weight: 50, restTime: "120s", tempo: "2-0-1-0", notes: "Strict overhead pressing" },
            { id: "e908", name: "Weighted Dips", sets: 3, reps: "8", weight: 15, restTime: "90s", tempo: "3-0-1-0", notes: "Chest accessory focus" }
          ]
        },
        Sunday: { isRestDay: true, workoutName: "Rest Day", exercises: [] }
      }
    },
    {
      id: "tmpl-10",
      name: "Athletic Conditioning",
      goal: "Explosiveness, Agility & Stamina",
      difficulty: "Intermediate",
      description: "Plyometrics and agility drills designed to build athletic capability and speed.",
      splitType: "Conditioning",
      duration: "8 Weeks",
      daysCount: 4,
      muscles: "Full Body, Cardio, Explosiveness",
      isFavorite: false,
      isArchived: false,
      updatedAt: new Date().toISOString(),
      schedule: {
        Monday: {
          isRestDay: false,
          workoutName: "Speed & Agility",
          exercises: [
            { id: "e1001", name: "Agility Ladder Drills", sets: 5, reps: "2 min", weight: 0, restTime: "60s", tempo: "--", notes: "Focus on fast footwork" },
            { id: "e1002", name: "Box Jumps", sets: 4, reps: "8", weight: 0, restTime: "90s", tempo: "1-0-1-0", notes: "Land softly in squat" },
            { id: "e1003", name: "Medicine Ball Slams", sets: 4, reps: "15", weight: 9, restTime: "60s", tempo: "1-0-1-0", notes: "Aggressive trunk flexion" }
          ]
        },
        Tuesday: {
          isRestDay: false,
          workoutName: "Explosive Power",
          exercises: [
            { id: "e1004", name: "Power Clean from Hang", sets: 5, reps: "3", weight: 45, restTime: "120s", tempo: "1-0-1-0", notes: "Triple extension focus" },
            { id: "e1005", name: "Barbell Push Press", sets: 4, reps: "6", weight: 40, restTime: "90s", tempo: "2-0-1-0", notes: "Drive with the legs" }
          ]
        },
        Wednesday: { isRestDay: true, workoutName: "Rest Day", exercises: [] },
        Thursday: {
          isRestDay: false,
          workoutName: "Stamina Conditioning",
          exercises: [
            { id: "e1006", name: "Assault Bike Intervals", sets: 1, reps: "20 min", weight: 0, restTime: "--", tempo: "--", notes: "30s sprint / 30s recovery" },
            { id: "e1007", name: "Kettlebell Snatch", sets: 3, reps: "10 each", weight: 16, restTime: "60s", tempo: "1-0-1-0", notes: "Single arm explosive pull" }
          ]
        },
        Friday: { isRestDay: true, workoutName: "Rest Day", exercises: [] },
        Saturday: {
          isRestDay: false,
          workoutName: "Core & Plyometrics",
          exercises: [
            { id: "e1008", name: "Broad Jumps", sets: 4, reps: "6", weight: 0, restTime: "90s", tempo: "--", notes: "Jump for max distance" },
            { id: "e1009", name: "Hanging Knee Raises", sets: 3, reps: "12", weight: 0, restTime: "60s", tempo: "2-0-1-0", notes: "Control the sway" }
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
