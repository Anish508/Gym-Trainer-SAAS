/* ==========================================================================
   SPARK FITNESS - WORKOUT TEMPLATE LIBRARY (25 splits)
   ========================================================================== */

export const workoutTemplates = [
  // ==========================================
  // BEGINNER CATEGORY
  // ==========================================
  {
    id: "beg_full_body",
    name: "Beginner Full Body",
    category: "Beginner",
    difficulty: "Beginner",
    goal: "General Conditioning & Movement Mechanics",
    duration: "45-50 mins",
    muscleGroups: "Full Body (Core, Chest, Back, Legs, Shoulders)",
    frequency: "3 Days Strength + 2 Days LISS",
    description: "A solid foundation-building routine targeting all major muscle groups in a single session. Ideal for learning basic lift patterns.",
    schedule: {
      Monday: "Focus: Full Body (Compound Strength)\n- Dumbbell Goblet Squats: 3 sets x 10 reps (Rest: 90s)\n- Dumbbell Flat Bench Press: 3 sets x 10 reps (Rest: 90s)\n- Seated Lat Pulldowns: 3 sets x 12 reps (Rest: 90s)\n- Dumbbell Shoulder Press: 3 sets x 12 reps (Rest: 75s)\n- Hanging Knee Raises: 3 sets x 12 reps (Rest: 60s)\n- Lying Glute Bridges: 2 sets x 15 reps (Rest: 60s)\n*Progressive Overload Tip: Increase dumbbell weight by 1-2kg once 3 sets of 10-12 reps feel easy.",
      Tuesday: "Focus: LISS Cardio & Active Recovery\n- Brisk Incline Walk: 30 minutes at 5-6 km/h (moderate effort)\n- Full Body Static Stretching: 15 minutes focusing on hips, hamstrings, and thoracic spine",
      Wednesday: "Focus: Full Body (Pull & Posterior Chain Emphasis)\n- Romanian Deadlifts (RDLs): 3 sets x 10 reps (Rest: 90s) - Hinge at hips\n- Chest-Supported Dumbbell Rows: 3 sets x 12 reps (Rest: 90s)\n- Bodyweight Reverse Lunges: 3 sets x 10 reps per leg (Rest: 75s)\n- Incline Push-Ups: 3 sets x Max Reps (Rest: 75s)\n- Dumbbell Bicep Curls: 3 sets x 12 reps (Rest: 60s)\n- Plank: 3 sets x 30-45 seconds (Rest: 60s)\n*Progressive Overload Tip: Focus on slow negatives (3-sec lowering) to build muscle control.",
      Thursday: "Focus: Rest & Muscle Recovery\n- Rest Day: Hydrate well, maintain a clean diet, and perform light walking or mobility work if tight.",
      Friday: "Focus: Full Body (Push & Lateral Emphasis)\n- Leg Press: 3 sets x 10 reps (Rest: 90s)\n- Incline Dumbbell Chest Press: 3 sets x 10 reps (Rest: 90s)\n- Dumbbell Lateral Raises: 3 sets x 15 reps (Rest: 60s)\n- Cable Face Pulls: 3 sets x 15 reps (Rest: 60s) - Focus on rear delts\n- Tricep Pushdowns: 3 sets x 12 reps (Rest: 60s)\n- Deadbug Core Stabilization: 3 sets x 10 reps per side (Rest: 45s)\n*Progressive Overload Tip: Add one extra rep to each chest press set compared to Monday.",
      Saturday: "Focus: Conditioning & Heart Rate Base\n- Elliptical Trainer: 25 minutes at moderate intensity\n- Russian Twists (Bodyweight): 3 sets x 20 total reps (Rest: 45s)\n- Cobra Stretch & Child's Pose: 10 minutes",
      Sunday: "Focus: Rest & Recovery\n- Rest Day: Active mobility, stretching, and light walking."
    }
  },
  {
    id: "beg_push_pull_legs",
    name: "Beginner Push Pull Legs",
    category: "Beginner",
    difficulty: "Beginner",
    goal: "Introduction to Muscle Group Splitting",
    duration: "50-55 mins",
    muscleGroups: "Push (Chest/Shoulders/Triceps), Pull (Back/Biceps), Legs",
    frequency: "3 Days Strength + 2 Days Active Cardio",
    description: "An classic routine split that separates work by movement function. Allows more targeted attention to each muscle group.",
    schedule: {
      Monday: "Focus: Push (Chest, Shoulders & Triceps)\n- Dumbbell Bench Press: 3 sets x 10 reps (Rest: 90s)\n- Dumbbell Arnold Press: 3 sets x 10 reps (Rest: 90s)\n- Dumbbell Flyes: 3 sets x 12 reps (Rest: 75s)\n- Tricep Dumbbell Kickbacks: 3 sets x 12 reps (Rest: 60s)\n- Dumbbell Lateral Raises: 3 sets x 15 reps (Rest: 60s)\n*Progressive Overload Tip: Push to perform 12 reps on all sets before moving up in weight.",
      Tuesday: "Focus: Active Cardio & Midsection Core\n- Steady Cycling: 25 minutes on stationary bike\n- Bicycle Crunches: 3 sets x 20 reps (Rest: 45s)\n- Bird-Dog Raises: 3 sets x 10 reps per side (Rest: 45s)",
      Wednesday: "Focus: Pull (Back, Rear Delts & Biceps)\n- Wide Lat Pulldowns: 3 sets x 12 reps (Rest: 90s)\n- Single-Arm Dumbbell Row: 3 sets x 10 reps per side (Rest: 75s)\n- Dumbbell Hammer Curls: 3 sets x 12 reps (Rest: 60s)\n- Band Pull-Aparts: 3 sets x 15 reps (Rest: 60s)\n- Dumbbell Shrugs: 3 sets x 12 reps (Rest: 60s)\n*Progressive Overload Tip: Squeeze back muscles for 1 second at the peak of row and pull exercises.",
      Thursday: "Focus: Rest & Recovery\n- Rest Day: Spend 10-15 minutes doing light stretching for lower back and hips.",
      Friday: "Focus: Legs & Lower Core\n- Dumbbell Goblet Squats: 3 sets x 12 reps (Rest: 90s)\n- Dumbbell Romanian Deadlifts (RDLs): 3 sets x 10 reps (Rest: 90s)\n- Dumbbell Calf Raises: 4 sets x 15 reps (Rest: 60s)\n- Plank: 3 sets x 40 seconds (Rest: 60s)\n*Progressive Overload Tip: Focus on deep control on squats. Keep spine neutral during RDLs.",
      Saturday: "Focus: Heart Rate Conditioning\n- Row Machine: 20 minutes at moderate pace\n- Plank Jacks: 3 sets x 12 reps (Rest: 45s)\n- Foam Rolling: 10 minutes (quads, lats, and calves)",
      Sunday: "Focus: Rest & Recovery\n- Rest Day: Active mobility, stretching, and light walking."
    }
  },
  {
    id: "beg_upper_lower",
    name: "Beginner Upper Lower",
    category: "Beginner",
    difficulty: "Beginner",
    goal: "Structural Balance & Hypertrophy Base",
    duration: "50 mins",
    muscleGroups: "Upper Body (Chest/Back/Shoulders/Arms), Lower Body (Legs/Core)",
    frequency: "4 Days Strength + 1 Day Cardio",
    description: "Splits upper body and lower body exercises. Highly effective for building consistency and strength with higher muscle-specific rest.",
    schedule: {
      Monday: "Focus: Upper Body Focus\n- Dumbbell Incline Chest Press: 3 sets x 10 reps (Rest: 90s)\n- Seated Cable Rows: 3 sets x 12 reps (Rest: 90s)\n- Seated Dumbbell Shoulder Press: 3 sets x 12 reps (Rest: 75s)\n- Lat Pulldowns: 3 sets x 12 reps (Rest: 75s)\n- Bicep Dumbbell Curls: 3 sets x 12 reps (Rest: 60s)\n- Tricep Pushdowns: 3 sets x 12 reps (Rest: 60s)\n*Progressive Overload Tip: Try to increase reps by 1 in each upper body exercise today.",
      Tuesday: "Focus: Lower Body & Core\n- Leg Press: 3 sets x 12 reps (Rest: 90s)\n- Dumbbell Romanian Deadlifts: 3 sets x 10 reps (Rest: 90s)\n- Lying Leg Extensions: 3 sets x 12 reps (Rest: 60s)\n- Lying Leg Curls: 3 sets x 12 reps (Rest: 60s)\n- Hanging Knee Raises: 3 sets x 12 reps (Rest: 60s)\n- Standing Calf Raises: 3 sets x 15 reps (Rest: 60s)\n*Progressive Overload Tip: Ensure hips go back on RDLs and knees do not buckle inward on Leg Press.",
      Wednesday: "Focus: Rest & Recovery\n- Rest Day: Take a light walk; focus on nutrient density in meals.",
      Thursday: "Focus: Upper Body Focus (Volume)\n- Push-Ups: 3 sets x Max Reps (Rest: 75s)\n- Chest-Supported Rows: 3 sets x 12 reps (Rest: 90s)\n- Dumbbell Lateral Raises: 3 sets x 15 reps (Rest: 60s)\n- Seated Overhead Dumbbell Tricep Extension: 3 sets x 12 reps (Rest: 60s)\n- Dumbbell Preacher Curls: 3 sets x 12 reps (Rest: 60s)\n*Progressive Overload Tip: Add a slight weight increase on rows if 12 reps are completed comfortably.",
      Friday: "Focus: Lower Body & Core (Strength)\n- Dumbbell Goblet Squats: 3 sets x 10 reps (Rest: 90s)\n- Dumbbell Glute Bridges: 3 sets x 12 reps (Rest: 75s)\n- Dumbbell Step-Ups: 3 sets x 8 reps per leg (Rest: 75s)\n- Seated Calf Raises: 3 sets x 15 reps (Rest: 60s)\n- Planks: 3 sets x 45 seconds (Rest: 45s)\n*Progressive Overload Tip: Keep step-ups controlled, drive through the front heel.",
      Saturday: "Focus: Cardiovascular Conditioning\n- Stationary Bike or Incline Treadmill: 30 minutes at moderate pace\n- Dynamic Stretching: Hip circles, leg swings, arm crossovers (10 minutes)",
      Sunday: "Focus: Rest & Recovery\n- Rest Day: Active mobility, stretching, and light walking."
    }
  },
  {
    id: "beg_body_part_split",
    name: "Beginner Body Part Split",
    category: "Beginner",
    difficulty: "Beginner",
    goal: "Targeted Muscle Isolation & Muscle Connection",
    duration: "45 mins",
    muscleGroups: "Chest/Triceps, Back/Biceps, Shoulders/Abs, Legs",
    frequency: "4 Days Strength",
    description: "A modern spin on the classic bodybuilding split, optimized for beginners to establish a strong mind-muscle connection.",
    schedule: {
      Monday: "Focus: Chest & Triceps\n- Dumbbell Flat Bench Press: 3 sets x 10 reps (Rest: 90s)\n- Dumbbell Incline Flyes: 3 sets x 12 reps (Rest: 90s)\n- Dumbbell Floor Press: 3 sets x 12 reps (Rest: 75s)\n- Cable Tricep Pushdowns: 4 sets x 12 reps (Rest: 60s)\n- Tricep Overhead extensions (DB): 3 sets x 12 reps (Rest: 60s)\n*Progressive Overload Tip: Keep scapula retracted and shoulders down during flat bench press.",
      Tuesday: "Focus: Back & Biceps\n- Lat Pulldowns (Medium Grip): 3 sets x 12 reps (Rest: 90s)\n- Chest-Supported Rows: 3 sets x 12 reps (Rest: 90s)\n- Dumbbell Hammer Curls: 3 sets x 12 reps (Rest: 60s)\n- Barbell Bicep Curls (Light): 3 sets x 10 reps (Rest: 60s)\n- Hyperextensions (Bodyweight): 3 sets x 12 reps (Rest: 60s)\n*Progressive Overload Tip: Pull with your elbows rather than your hands to engage the lats.",
      Wednesday: "Focus: Rest & Recovery\n- Rest Day: Perform deep static stretching for upper body.",
      Thursday: "Focus: Shoulders & Core\n- Seated Dumbbell shoulder press: 3 sets x 12 reps (Rest: 90s)\n- Dumbbell Lateral Raises: 4 sets x 15 reps (Rest: 60s)\n- Rear Delt Dumbbell Flyes: 3 sets x 15 reps (Rest: 60s)\n- Russian Twists: 3 sets x 20 reps (Rest: 45s)\n- Planks: 3 sets x 40 seconds (Rest: 45s)\n*Progressive Overload Tip: Focus on slow eccentric (lowering phase) of the lateral raises.",
      Friday: "Focus: Legs & Calves\n- Leg Press: 3 sets x 12 reps (Rest: 90s)\n- Lying Leg Curls: 3 sets x 12 reps (Rest: 75s)\n- Leg Extensions: 3 sets x 12 reps (Rest: 75s)\n- Standing Calf Raises: 4 sets x 15 reps (Rest: 60s)\n*Progressive Overload Tip: In leg extensions, squeeze the quads hard at the top for 1 second.",
      Saturday: "Focus: Cardio & Core\n- Moderate Jog / Fast Walk: 25 minutes\n- Bicycle Crunches: 3 sets x 20 reps (Rest: 45s)\n- Bird-Dog Exercises: 3 sets x 12 reps per side (Rest: 45s)",
      Sunday: "Focus: Rest & Recovery\n- Rest Day: Active mobility, stretching, and light walking."
    }
  },
  {
    id: "beg_functional",
    name: "Beginner Functional Training",
    category: "Beginner",
    difficulty: "Beginner",
    goal: "Mobility, Balance, & Core Stabilization",
    duration: "45 mins",
    muscleGroups: "Core, Hips, Shoulder Stabilizers, Full Body Coordination",
    frequency: "4 Days Functional + 1 Day Recovery",
    description: "Focuses on patterns mimicking daily physical activities. Improves joint stability, balance, posture, and core transfers.",
    schedule: {
      Monday: "Focus: Balance & Core Control\n- Bird-Dog: 3 sets x 10 reps per side (Rest: 60s)\n- Deadbug: 3 sets x 10 reps per side (Rest: 60s)\n- Single-Leg Goblet Squats (Sitting to Bench): 3 sets x 8 reps per leg (Rest: 75s)\n- Dumbbell Farmer's Walk: 3 sets x 40 meters (Rest: 60s) - Stand tall and engage core\n- Dumbbell Halos: 3 sets x 10 total reps (Rest: 60s)\n*Progressive Overload Tip: Increase walking distance or dumbbell weight for Farmer's Walks.",
      Tuesday: "Focus: Upper Body Stabilization\n- Wall Slides (Shoulder Mobility): 3 sets x 12 reps (Rest: 60s)\n- Kneeling Push-Ups: 3 sets x Max Reps (Rest: 75s)\n- Band Pull-Aparts: 3 sets x 15 reps (Rest: 60s)\n- Dumbbell Suitcase Carry: 3 sets x 30 meters per side (Rest: 60s)\n- Plank-to-Pushup Transitions: 3 sets x 6 reps (Rest: 60s)\n*Progressive Overload Tip: Ensure hips do not sag or twist during suitcase carry.",
      Wednesday: "Focus: Rest & Joint Mobility\n- Rest Day: Complete joint dynamic mobility sequence (15-20 minutes).",
      Thursday: "Focus: Lower Body Power & Hinge\n- Kettlebell Deadlifts (Light): 3 sets x 12 reps (Rest: 90s) - Hinge at hips\n- Bodyweight Step-ups: 3 sets x 10 reps per leg (Rest: 75s)\n- Glute Bridge March: 3 sets x 10 reps per leg (Rest: 60s)\n- Wall Sits: 3 sets x 30-45 seconds (Rest: 60s)\n*Progressive Overload Tip: Add a light kettlebell to step-ups next week.",
      Friday: "Focus: Integrated Full Body Coordination\n- Kettlebell Swings (Light): 3 sets x 12 reps (Rest: 90s)\n- Bear Crawls: 3 sets x 15 meters (Rest: 60s)\n- Dumbbell Thrusters (Light): 3 sets x 10 reps (Rest: 90s)\n- Side Planks: 3 sets x 20-30 seconds per side (Rest: 45s)\n*Progressive Overload Tip: Perform Bear Crawls slow and controlled. Do not rush.",
      Saturday: "Focus: Active Recovery & Flexibility\n- Stationary Cycling: 20 minutes (low resistance)\n- Hamstring, quad, chest and hip static stretches (15 minutes)",
      Sunday: "Focus: Rest & Recovery\n- Rest Day: Active mobility, stretching, and light walking."
    }
  },

  // ==========================================
  // INTERMEDIATE CATEGORY
  // ==========================================
  {
    id: "int_push_pull_legs",
    name: "Intermediate Push Pull Legs",
    category: "Intermediate",
    difficulty: "Intermediate",
    goal: "Hypertrophy & Base Strength Progression",
    duration: "60-70 mins",
    muscleGroups: "Push (Chest/Shoulders/Triceps), Pull (Back/Biceps), Legs (Quads/Hams/Calves)",
    frequency: "5-6 Days/Week",
    description: "Higher volume, compound movements. Suitable for intermediate lifters looking to break plateaus.",
    schedule: {
      Monday: "Focus: Push Day (Chest & Shoulders)\n- Barbell Flat Bench Press: 4 sets x 8 reps (Rest: 90s-120s)\n- Seated Overhead Dumbbell Press: 3 sets x 10 reps (Rest: 90s)\n- Incline Dumbbell Press: 3 sets x 10 reps (Rest: 90s)\n- Cable Crossover (Low to High): 3 sets x 12 reps (Rest: 75s)\n- Dumbbell Lateral Raises: 4 sets x 12-15 reps (Rest: 60s)\n- Skull Crushers: 3 sets x 10 reps (Rest: 60s)\n*Progressive Overload Tip: Use double progression. Add reps until max range, then add weight.",
      Tuesday: "Focus: Pull Day (Back & Rear Delts)\n- Barbell Rows: 4 sets x 8 reps (Rest: 90s-120s)\n- Weighted Chin-ups: 3 sets x 8 reps (Rest: 90s)\n- Seated Cable Rows (Close Grip): 3 sets x 10 reps (Rest: 75s)\n- Cable Face Pulls: 4 sets x 15 reps (Rest: 60s)\n- Barbell Bicep Curls: 3 sets x 10 reps (Rest: 60s)\n- Hammer Curls: 3 sets x 12 reps (Rest: 60s)\n*Progressive Overload Tip: Pull barbell rows to the lower belly to hit lat thickness.",
      Wednesday: "Focus: Legs & Core\n- Barbell Back Squats: 4 sets x 8 reps (Rest: 2m)\n- Romanian Deadlifts (RDL): 3 sets x 10 reps (Rest: 90s)\n- Leg Press: 3 sets x 12 reps (Rest: 90s)\n- Lying Leg Curls: 3 sets x 12 reps (Rest: 75s)\n- Seated Calf Raises: 4 sets x 15 reps (Rest: 60s)\n- Hanging Knee Raises: 3 sets x 15 reps (Rest: 60s)\n*Progressive Overload Tip: Squat deep while maintaining a vertical chest.",
      Thursday: "Focus: Active Rest & Recovery\n- Steady Incline Treadmill: 30 minutes at moderate intensity\n- Foam Rolling & Hip Mobility Drill: 15 minutes",
      Friday: "Focus: Push Day (Shoulders & Chest Hypertrophy)\n- Standing Barbell Overhead Press (OHP): 4 sets x 6 reps (Rest: 120s)\n- Incline Barbell Chest Press: 3 sets x 8 reps (Rest: 90s)\n- Weighted Chest Dips: 3 sets x 8-10 reps (Rest: 90s)\n- Cable Chest Flyes: 3 sets x 12 reps (Rest: 75s)\n- Dumbbell Lateral Raises: 4 sets x 12 reps (Rest: 60s)\n- Tricep Rope Pushdowns: 3 sets x 12 reps (Rest: 60s)\n*Progressive Overload Tip: Focus on controlled locks on OHP and core stabilization.",
      Saturday: "Focus: Pull Day (Back Width & Arms)\n- Lat Pulldowns (Wide): 4 sets x 10 reps (Rest: 90s)\n- Dumbbell Incline Rows: 3 sets x 10 reps (Rest: 90s)\n- Dumbbell Shrugs: 3 sets x 12 reps (Rest: 60s)\n- Dumbbell Rear Delt Raises: 3 sets x 15 reps (Rest: 60s)\n- Dumbbell Preacher Curls: 3 sets x 10 reps (Rest: 60s)\n- Dumbbell Incline Bicep Curls: 3 sets x 12 reps (Rest: 60s)\n*Progressive Overload Tip: Squeeze peak biceps contractions on preacher curls.",
      Sunday: "Focus: Rest & Recovery\n- Rest Day: Active mobility, stretching, and light walking."
    }
  },
  {
    id: "int_arnold_split",
    name: "Intermediate Arnold Split",
    category: "Intermediate",
    difficulty: "Intermediate",
    goal: "Aesthetic Proportions & Muscle Volume",
    duration: "60-75 mins",
    muscleGroups: "Chest/Back, Shoulders/Arms, Legs/Abs",
    frequency: "6 Days/Week",
    description: "Classic split popularized by Arnold Schwarzenegger. Pair antagonistic muscle groups (Chest/Back) for incredible pump and strength transfer.",
    schedule: {
      Monday: "Focus: Chest & Back\n- Barbell Flat Bench Press superset with Barbell Rows: 4 sets x 8 reps (Rest: 2m)\n- Incline Dumbbell Bench Press superset with Wide Grip Lat Pulldowns: 3 sets x 10 reps (Rest: 90s)\n- Flat Dumbbell Chest Flyes superset with Seated Cable Rows: 3 sets x 12 reps (Rest: 90s)\n- Dumbbell Pullovers: 3 sets x 12 reps (Rest: 75s)\n*Progressive Overload Tip: Work back and chest directly against each other for metabolic fatigue.",
      Tuesday: "Focus: Shoulders & Arms\n- Standing Barbell Overhead Press: 4 sets x 8 reps (Rest: 90s)\n- Seated Dumbbell lateral raises superset with Rear Delt Raises: 4 sets x 12-15 reps (Rest: 60s)\n- Incline Dumbbell Bicep Curls superset with Cable Tricep Extensions: 3 sets x 10 reps (Rest: 60s)\n- Barbell Preacher Curls superset with Close-Grip Bench Press: 3 sets x 10 reps (Rest: 60s)\n*Progressive Overload Tip: Maintain absolute elbow position stability during curls.",
      Wednesday: "Focus: Legs & Core\n- Barbell Back Squats: 4 sets x 8 reps (Rest: 2m)\n- Romanian Deadlifts (RDLs): 3 sets x 10 reps (Rest: 90s)\n- Leg Extensions superset with Leg Curls: 3 sets x 12 reps (Rest: 90s)\n- Standing Calf Raises: 4 sets x 15 reps (Rest: 60s)\n- Ab Wheel Rollouts: 3 sets x 10 reps (Rest: 60s)\n*Progressive Overload Tip: Lock legs at the top of squats, hinge hard at hips in RDLs.",
      Thursday: "Focus: Chest & Back (Hypertrophy)\n- Incline Barbell Press superset with Chin-ups: 4 sets x 8 reps (Rest: 90s-120s)\n- Dumbbell Flat Press superset with Single-Arm Dumbbell Rows: 3 sets x 10 reps (Rest: 90s)\n- Cable Crossovers superset with Straight-Arm Pulldowns: 3 sets x 12 reps (Rest: 75s)\n*Progressive Overload Tip: Lower the dumbbells slowly (3-4 seconds) to increase micro-tears.",
      Friday: "Focus: Shoulders & Arms (Isolation)\n- Dumbbell Shoulder Press: 4 sets x 10 reps (Rest: 90s)\n- Cable Lateral Raises: 4 sets x 12 reps (Rest: 60s)\n- Barbell Curls superset with Dumbbell Skull Crushers: 3 sets x 12 reps (Rest: 60s)\n- Dumbbell Hammer Curls superset with Rope Pushdowns: 3 sets x 12 reps (Rest: 60s)\n*Progressive Overload Tip: Focus on peak contraction on tricep rope extensions.",
      Saturday: "Focus: Legs & Lower Core\n- Barbell Front Squats: 4 sets x 8 reps (Rest: 120s)\n- Dumbbell Lunges: 3 sets x 10 reps per leg (Rest: 90s)\n- Seated Calf Raises: 4 sets x 15 reps (Rest: 60s)\n- Hanging Knee-to-Chest Raises: 3 sets x 15 reps (Rest: 60s)\n- Stomach Vacuums: 3 sets x 20-30 seconds hold\n*Progressive Overload Tip: Front squats place more load on quads; keep trunk upright.",
      Sunday: "Focus: Rest & Recovery\n- Rest Day: Active mobility, stretching, and light walking."
    }
  },
  {
    id: "int_upper_lower_strength",
    name: "Intermediate Upper Lower Strength",
    category: "Intermediate",
    difficulty: "Intermediate",
    goal: "Power & Muscular Strength Base",
    duration: "60 mins",
    muscleGroups: "Upper Power, Lower Power, Upper Hypertrophy, Lower Hypertrophy",
    frequency: "4 Days Strength + 1 Day Cardio Intervals",
    description: "Combines 2 days of heavy power/strength training with 2 days of hypertrophy/volume training. Excellent for athletic building.",
    schedule: {
      Monday: "Focus: Upper Power (Heavy Compounds)\n- Barbell Flat Bench Press: 4 sets x 5 reps (Rest: 2m-3m)\n- Barbell Bent-Over Rows: 4 sets x 5 reps (Rest: 2m)\n- Standing Overhead Press (OHP): 3 sets x 6 reps (Rest: 2m)\n- Weighted Chin-ups: 3 sets x 6 reps (Rest: 90s)\n- Close-Grip Bench Press: 3 sets x 8 reps (Rest: 90s)\n*Progressive Overload Tip: Aim for vertical path speed on compounds; add 2.5kg once all sets are achieved.",
      Tuesday: "Focus: Lower Power (Heavy Leg/Core Lifts)\n- Barbell Back Squats: 4 sets x 5 reps (Rest: 2.5m-3m)\n- Conventional Deadlifts: 3 sets x 5 reps (Rest: 3m)\n- Leg Press: 3 sets x 8 reps (Rest: 90s)\n- Lying Leg Curls: 3 sets x 8 reps (Rest: 90s)\n- Standing Calf Raises: 4 sets x 8 reps (Rest: 75s)\n*Progressive Overload Tip: Drive through the floor on deadlifts. Keep spine neutral.",
      Wednesday: "Focus: Rest & Light Mobility\n- Rest Day: Active stretching, light hip mobility flows, and posture adjustments.",
      Thursday: "Focus: Upper Hypertrophy (Volume Split)\n- Incline Dumbbell Bench Press: 4 sets x 8-10 reps (Rest: 90s)\n- Seated Cable Rows: 4 sets x 10 reps (Rest: 90s)\n- Dumbbell Lateral Raises: 4 sets x 12-15 reps (Rest: 60s)\n- Cable Chest Flyes: 3 sets x 12 reps (Rest: 75s)\n- Incline Bicep Curls: 3 sets x 10 reps (Rest: 60s)\n- Tricep Dumbbell Kickbacks: 3 sets x 12 reps (Rest: 60s)\n*Progressive Overload Tip: Maximize chest expansion during dumbbell presses.",
      Friday: "Focus: Lower Hypertrophy (Leg Growth)\n- Front Squats: 4 sets x 8 reps (Rest: 90s)\n- Romanian Deadlifts (RDLs): 4 sets x 8 reps (Rest: 90s)\n- Bulgarian Split Squats: 3 sets x 10 reps per leg (Rest: 75s)\n- Leg Extensions: 3 sets x 12 reps (Rest: 60s)\n- Seated Calf Raises: 4 sets x 12 reps (Rest: 60s)\n- Planks: 3 sets x 60 seconds (Rest: 45s)\n*Progressive Overload Tip: Drive unilateral balance on Bulgarian split squats.",
      Saturday: "Focus: Conditioning & Heart Rate Splits\n- Incline Treadmill Sprints: 15 mins (30s high speed sprint, 60s walk, repeat 10 times)\n- Ab Wheel Rollouts: 3 sets x 10 reps (Rest: 45s)\n- Russian Twists: 3 sets x 20 total reps (Rest: 45s)",
      Sunday: "Focus: Rest & Recovery\n- Rest Day: Active mobility, stretching, and light walking."
    }
  },
  {
    id: "int_hybrid_strength",
    name: "Intermediate Hybrid Strength",
    category: "Intermediate",
    difficulty: "Intermediate",
    goal: "Power & Functional Resistance Mix",
    duration: "60 mins",
    muscleGroups: "Full Body Hybrid (Strength + Aerobic / Muscular Endurance)",
    frequency: "5 Days/Week",
    description: "Combines functional movement capacity, heavy power movements, and high-intensity metabolic work to build a versatile physique.",
    schedule: {
      Monday: "Focus: Heavy Push & Core stability\n- Barbell Flat Bench Press: 4 sets x 6 reps (Rest: 2m)\n- Seated Arnold Shoulder Press: 3 sets x 8 reps (Rest: 90s)\n- Dumbbell Incline Bench Press: 3 sets x 10 reps (Rest: 90s)\n- Cable Woodchops: 3 sets x 12 reps per side (Rest: 60s)\n- Overhead Tricep Extension (Cable): 3 sets x 12 reps (Rest: 60s)\n*Progressive Overload Tip: Stand firm and use core torque on cable woodchops.",
      Tuesday: "Focus: Heavy Pull & Posterior Conditioning\n- Barbell Deadlifts: 4 sets x 5 reps (Rest: 2.5m)\n- Seated T-Bar Rows: 3 sets x 8 reps (Rest: 90s)\n- Wide Lat Pulldowns: 3 sets x 10 reps (Rest: 90s)\n- Dumbbell Bicep Hammer Curls: 3 sets x 10 reps (Rest: 60s)\n- Kettlebell Swings (Medium-Heavy): 3 sets x 15 reps (Rest: 60s)\n*Progressive Overload Tip: Snap hips forward forcefully on kettlebell swings.",
      Wednesday: "Focus: Rest & Recovery\n- Rest Day: Hydration, massage gun/foam roll legs and back.",
      Thursday: "Focus: Legs & Power Movements\n- Barbell Squats: 4 sets x 6 reps (Rest: 2m)\n- Kettlebell Goblet Clean-to-Squat: 3 sets x 10 reps (Rest: 90s)\n- Lying Leg Extensions: 3 sets x 12 reps (Rest: 60s)\n- Lying Leg Curls: 3 sets x 12 reps (Rest: 60s)\n- Hanging Knee Raises: 3 sets x 15 reps (Rest: 60s)\n*Progressive Overload Tip: Ensure clean transition from KB clean to the goblet squat position.",
      Friday: "Focus: Conditioning & Muscular Endurance (Functional)\n- Dumbbell Thrusters (Medium): 4 sets x 10 reps (Rest: 90s)\n- Farmer's Carry: 4 sets x 50 meters (Rest: 60s)\n- Push-Ups to Failure: 3 sets (Rest: 60s)\n- Medicine Ball Slams: 3 sets x 15 reps (Rest: 60s)\n- Plank Jacks: 3 sets x 20 reps (Rest: 45s)\n*Progressive Overload Tip: Maintain breathing control through continuous thrusters.",
      Saturday: "Focus: Aerobic Engine\n- Rower Machine: 25 minutes at moderate intensity (2:00-2:15 split time)\n- Yoga Mobility Dynamic Drills: 15 minutes",
      Sunday: "Focus: Rest & Recovery\n- Rest Day: Active mobility, stretching, and light walking."
    }
  },
  {
    id: "int_athletic_perf",
    name: "Intermediate Athletic Performance",
    category: "Intermediate",
    difficulty: "Intermediate",
    goal: "Explosive Power, Agility & Core Transfers",
    duration: "60 mins",
    muscleGroups: "Total Body Agility, Power Transfers, Single-Leg Balance",
    frequency: "5 Days/Week",
    description: "Designed to improve movement efficiency, jump height, linear speed, and core rotational power. Perfect for recreational athletes.",
    schedule: {
      Monday: "Focus: Power & Agility (Jumps & Hinge)\n- Box Jumps (30 inch): 4 sets x 5 reps (Rest: 90s) - Land soft\n- Medicine Ball Chest Pass against Wall: 4 sets x 8 reps (Rest: 60s)\n- Trap Bar Deadlifts (Explosive pull): 4 sets x 6 reps (Rest: 2m)\n- Single-Leg Romanian Deadlifts: 3 sets x 8 reps per leg (Rest: 75s)\n- Hanging Windshield Wipers: 3 sets x 10 total reps (Rest: 60s)\n*Progressive Overload Tip: Focus on explosive extension of hips during trap bar pull.",
      Tuesday: "Focus: Upper Body Plyo-Push\n- Clap Push-Ups: 3 sets x Max Reps (Rest: 90s)\n- Landmine Press (Single-Arm explosive): 3 sets x 8 reps per side (Rest: 75s)\n- Dumbbell Bent-Over Row (Power pull): 3 sets x 8 reps (Rest: 90s)\n- Dumbbell Lateral Raises: 3 sets x 12 reps (Rest: 60s)\n- Band Pull-Aparts: 3 sets x 15 reps (Rest: 45s)\n*Progressive Overload Tip: Punch through the top of the landmine press quickly.",
      Wednesday: "Focus: Rest & Core Mobility\n- Rest Day: Focus on spinal rotations, shoulder mobility, hip flexor stretch.",
      Thursday: "Focus: Lower Body Plyo-Legs\n- Jump Squats (Bodyweight explosive): 4 sets x 8 reps (Rest: 90s)\n- Bulgarian Split Squats (Dumbbells): 3 sets x 8 reps per leg (Rest: 90s)\n- Glute-Ham Raises (or Nordic Ham Curls): 3 sets x 6 reps (Rest: 90s)\n- Single-Leg Box Step-Ups: 3 sets x 10 reps per leg (Rest: 60s)\n- Standing Calf Raises: 4 sets x 12 reps (Rest: 60s)\n*Progressive Overload Tip: Control the lowering phase of the Nordic curl.",
      Friday: "Focus: Cardiovascular Conditioning (Metcon)\n- Kettlebell Swings: 4 sets x 15 reps (Rest: 60s)\n- Battle Ropes: 4 sets x 30 seconds work / 30 seconds rest\n- Sled Push: 4 sets x 20 meters (Rest: 90s)\n- Dumbbell Farmer's Walks: 3 sets x 40 meters (Rest: 60s)\n- Hanging Knee Raises: 3 sets x 15 reps (Rest: 45s)\n*Progressive Overload Tip: Add weight to the sled push when 20m is finished under 15s.",
      Saturday: "Focus: Active Recovery & Deep Stretch\n- Foam Rolling: 15 minutes (focus on IT band, hamstrings, upper back)\n- Static Stretching: 15 minutes (deep thoracic stretches, couch stretch)",
      Sunday: "Focus: Rest & Recovery\n- Rest Day: Active mobility, stretching, and light walking."
    }
  },

  // ==========================================
  // ADVANCED CATEGORY
  // ==========================================
  {
    id: "adv_bro_split",
    name: "Advanced Bro Split",
    category: "Advanced",
    difficulty: "Advanced",
    goal: "Maximal Hypertrophy & Muscle Density",
    duration: "70-80 mins",
    muscleGroups: "Chest, Back, Shoulders, Legs, Arms",
    frequency: "5 Days Strength + 1 Day Cardio/Core",
    description: "High-volume single muscle group isolation split. Optimized for advanced lifters with high recovery capacity.",
    schedule: {
      Monday: "Focus: Chest Isolation (Hypertrophy)\n- Incline Barbell Bench Press: 4 sets x 6-8 reps (Rest: 2m) - Last set drop-set\n- Flat Dumbbell Bench Press: 3 sets x 8 reps (Rest: 90s)\n- Decline Barbell Press: 3 sets x 10 reps (Rest: 90s)\n- Incline Cable Crossovers: 4 sets x 12 reps (Rest: 60s) - Hold squeeze 1s\n- Bodyweight Chest Dips (Weighted): 3 sets x 10 reps (Rest: 75s)\n*Progressive Overload Tip: On the drop-set, reduce weight by 30% and press to failure.",
      Tuesday: "Focus: Back Width & Thickness\n- Deadlifts: 4 sets x 5 reps (Rest: 2.5m-3m)\n- Weighted Pull-ups: 4 sets x 6-8 reps (Rest: 90s)\n- Barbell Rows (Underhand): 3 sets x 8 reps (Rest: 90s)\n- Seated Wide Lat Pulldowns: 3 sets x 10 reps (Rest: 75s)\n- Straight-Arm Pullover (Cable): 3 sets x 12 reps (Rest: 60s)\n*Progressive Overload Tip: Squeeze lats hard on deadlifts before lifting.",
      Wednesday: "Focus: Shoulders & Shrugs\n- Seated Barbell Military Press: 4 sets x 6 reps (Rest: 2m)\n- Seated Dumbbell Arnold Press: 3 sets x 8 reps (Rest: 90s)\n- Cable Lateral Raises: 4 sets x 12 reps (Rest: 60s) - Slow negative\n- Rear Delt Pec Dec Flyes: 4 sets x 15 reps (Rest: 60s)\n- Dumbbell Shrugs (Heavy): 4 sets x 10 reps (Rest: 60s) - Hold shrug 2s\n*Progressive Overload Tip: Rest shoulders at bottom of military press; control elbow path.",
      Thursday: "Focus: Legs (Quads, Hamstrings & Calves)\n- Barbell Back Squats (Heavy): 4 sets x 6 reps (Rest: 2.5m)\n- Leg Press: 3 sets x 10 reps (Rest: 2m) - Slow eccentric\n- Romanian Deadlifts (Barbell): 3 sets x 8 reps (Rest: 90s)\n- Leg Extensions superset with Leg Curls: 3 sets x 12 reps (Rest: 75s)\n- Standing Calf Raises: 4 sets x 12 reps (Rest: 60s)\n- Seated Calf Raises: 3 sets x 15 reps (Rest: 60s)\n*Progressive Overload Tip: Squat to parallel or lower to target quad depth.",
      Friday: "Focus: Arm Blaster (Biceps & Triceps)\n- Close-Grip Bench Press superset with Barbell Bicep Curls: 4 sets x 8 reps (Rest: 90s)\n- Dumbbell Skull Crushers superset with Incline DB Bicep Curls: 3 sets x 10 reps (Rest: 75s)\n- Cable Tricep Overhead Extension superset with Hammer Curls: 3 sets x 12 reps (Rest: 60s)\n- Wrist Curls (Barbell): 3 sets x 15 reps (Rest: 45s)\n*Progressive Overload Tip: Restict shoulder movement on curls; isolate the biceps.",
      Saturday: "Focus: Conditioning & Abs\n- Incline Treadmill Walk: 35 minutes at 6 km/h, 8% incline\n- Hanging Leg Raises: 4 sets x 12 reps (Rest: 45s)\n- Cable Crunches (Kneeling): 3 sets x 15 reps (Rest: 60s)\n- Stomach Vacuums: 3 sets x 40s hold\n- Full Body Yoga Flex: 15 minutes",
      Sunday: "Focus: Rest & Recovery\n- Rest Day: Active mobility, stretching, and light walking."
    }
  },
  {
    id: "adv_push_pull_legs",
    name: "Advanced Push Pull Legs",
    category: "Advanced",
    difficulty: "Advanced",
    goal: "Peak Strength, Density & Double Progression",
    duration: "75 mins",
    muscleGroups: "Push, Pull, Legs (High Volume Splits)",
    frequency: "6 Days/Week (2x Frequency per muscle)",
    description: "Designed for advanced trainers wishing to hit each muscle twice a week. Demands high structural endurance and clean nutrition.",
    schedule: {
      Monday: "Focus: Push A (Chest Emphasis & Triceps)\n- Barbell Flat Bench Press: 4 sets x 5 reps (Rest: 120s)\n- Incline Dumbbell Bench Press: 3 sets x 8 reps (Rest: 90s)\n- Standing Overhead Press (Barbell): 3 sets x 8 reps (Rest: 90s)\n- Weighted Chest Dips: 3 sets x 8 reps (Rest: 90s)\n- Dumbbell Lateral Raises: 4 sets x 12 reps (Rest: 60s)\n- Overhead Cable Tricep Extensions: 3 sets x 10 reps (Rest: 60s)\n*Progressive Overload Tip: Increase flat bench weight by 2.5kg once all 5 rep sets are completed.",
      Tuesday: "Focus: Pull A (Back Width & Biceps)\n- Weighted Pull-ups: 4 sets x 6 reps (Rest: 90s)\n- Barbell Rows: 3 sets x 8 reps (Rest: 90s)\n- Lat Pulldowns (Neutral Grip): 3 sets x 10 reps (Rest: 75s)\n- Rear Delt Pec Dec Flyes: 4 sets x 12 reps (Rest: 60s)\n- Barbell Bicep Curls: 3 sets x 8 reps (Rest: 60s)\n- Dumbbell Incline Bicep Curls: 3 sets x 12 reps (Rest: 60s)\n*Progressive Overload Tip: Pull from chest to trigger back retraction and lat squeeze.",
      Wednesday: "Focus: Legs A (Squat & Hamstring Strength)\n- Barbell Back Squats: 4 sets x 6 reps (Rest: 2.5m)\n- Romanian Deadlifts (RDLs): 3 sets x 8 reps (Rest: 90s)\n- Bulgarian Split Squats (Heavy): 3 sets x 8 reps per leg (Rest: 90s)\n- Lying Leg Curls: 3 sets x 12 reps (Rest: 60s)\n- Standing Calf Raises: 4 sets x 10 reps (Rest: 60s)\n- Hanging Knee Raises: 3 sets x 15 reps (Rest: 45s)\n*Progressive Overload Tip: Drive power through heel on squats and split squats.",
      Thursday: "Focus: Push B (Shoulders Emphasis & Chest flyes)\n- Standing Barbell Overhead Press (OHP): 4 sets x 5 reps (Rest: 120s)\n- Incline Barbell Bench Press: 3 sets x 8 reps (Rest: 90s)\n- Flat Dumbbell Bench Press: 3 sets x 10 reps (Rest: 90s)\n- Dumbbell Lateral Raises: 4 sets x 12 reps (Rest: 60s)\n- Cable Chest Flyes: 3 sets x 12 reps (Rest: 60s)\n- Cable Tricep Rope Pushdowns: 3 sets x 12 reps (Rest: 60s)\n*Progressive Overload Tip: Keep core tight and avoid bending back on OHP.",
      Friday: "Focus: Pull B (Back Thickness & Arms)\n- Barbell Rows (Reverse Grip): 4 sets x 8 reps (Rest: 90s)\n- Weighted Chin-ups: 3 sets x 8 reps (Rest: 90s)\n- Chest-Supported Rows: 3 sets x 10 reps (Rest: 75s)\n- Cable Face Pulls: 4 sets x 12 reps (Rest: 60s)\n- Dumbbell Hammer Curls: 3 sets x 10 reps (Rest: 60s)\n- Preacher Curls (EZ Bar): 3 sets x 12 reps (Rest: 60s)\n*Progressive Overload Tip: Use underhand grip on barbell rows to recruit lower lats.",
      Saturday: "Focus: Legs B (Leg Press & Quad Hypertrophy)\n- Leg Press (Heavy): 4 sets x 10 reps (Rest: 2m)\n- Barbell Hip Thrusts: 3 sets x 8 reps (Rest: 90s)\n- Lying Leg Extensions: 3 sets x 12 reps (Rest: 60s)\n- Seated Leg Curls: 3 sets x 12 reps (Rest: 60s)\n- Seated Calf Raises: 4 sets x 12 reps (Rest: 60s)\n- Cable Woodchops: 3 sets x 12 reps per side (Rest: 60s)\n*Progressive Overload Tip: Push hips up fully in hip thrusts and squeeze glutes.",
      Sunday: "Focus: Rest & Recovery\n- Rest Day: Active mobility, stretching, and light walking."
    }
  },
  {
    id: "adv_powerbuilding",
    name: "Advanced Powerbuilding",
    category: "Advanced",
    difficulty: "Advanced",
    goal: "Maximum Absolute Strength & Hypertrophy",
    duration: "75 mins",
    muscleGroups: "Big 3 Focus (Squat, Bench Press, Deadlift, OHP) + Accessories",
    frequency: "5 Days Strength",
    description: "Focuses on maximizing strength in compound barbell lifts while implementing high-volume bodybuilding accessories to gain mass.",
    schedule: {
      Monday: "Focus: Bench Press Strength & Chest Hypertrophy\n- Flat Barbell Bench Press: 5 sets x 3 reps @ 85% 1RM (Rest: 3m)\n- Incline Dumbbell Bench Press: 4 sets x 8 reps (Rest: 90s)\n- Seated Machine Chest Press: 3 sets x 10 reps (Rest: 90s) - Last set drop-set\n- Flat Dumbbell Flyes: 3 sets x 12 reps (Rest: 75s)\n- Overhead Dumbbell Tricep Extension: 4 sets x 10 reps (Rest: 60s)\n*Progressive Overload Tip: Maintain a solid leg drive during bench press sets.",
      Tuesday: "Focus: Squat Strength & Leg Hypertrophy\n- Barbell Back Squats: 5 sets x 3 reps @ 85% 1RM (Rest: 3m)\n- Romanian Deadlifts (RDLs): 3 sets x 8 reps (Rest: 90s)\n- Bulgarian Split Squats (Heavy): 3 sets x 8 reps per leg (Rest: 90s)\n- Leg Extensions: 3 sets x 15 reps (Rest: 60s)\n- Standing Calf Raises: 4 sets x 10 reps (Rest: 60s)\n*Progressive Overload Tip: Ensure clean, upright trunk angle in front/back squats.",
      Wednesday: "Focus: Rest & Muscle Flush\n- Rest Day: Dynamic range of motion drills and stretching.",
      Thursday: "Focus: Deadlift Strength & Back Hypertrophy\n- Conventional Deadlifts: 3 sets x 3 reps @ 85% 1RM (Rest: 3m-4m)\n- Weighted Pull-ups: 4 sets x 6 reps (Rest: 90s)\n- Seated Barbell Rows: 3 sets x 8 reps (Rest: 90s)\n- Straight-Arm Lat Pullovers (Cable): 3 sets x 12 reps (Rest: 60s)\n- Barbell Bicep Curls: 4 sets x 8 reps (Rest: 60s)\n*Progressive Overload Tip: Keep shoulders back and pull the slack out of the barbell before deadlifting.",
      Friday: "Focus: Overhead Press & Shoulder Hypertrophy\n- Standing Barbell Overhead Press (OHP): 5 sets x 3 reps @ 85% 1RM (Rest: 3m)\n- Seated Arnold Press: 3 sets x 8 reps (Rest: 90s)\n- Dumbbell Lateral Raises: 4 sets x 12-15 reps (Rest: 60s)\n- Dumbbell Rear Delt Raises: 4 sets x 15 reps (Rest: 60s)\n- EZ Bar Cable Skull Crushers: 3 sets x 10 reps (Rest: 60s)\n- Hammer Curls: 3 sets x 10 reps (Rest: 60s)\n*Progressive Overload Tip: Keep glutes squeezed tight to protect the lower back on OHP.",
      Saturday: "Focus: Core & Cardio Conditioning\n- Hanging Leg Raises: 4 sets x 12 reps (Rest: 45s)\n- Ab Wheel Rollouts: 3 sets x 10 reps (Rest: 60s)\n- Kettlebell Swings (Heavy): 3 sets x 15 reps (Rest: 60s)\n- Incline Treadmill Walk: 25 minutes at 6% incline\n*Progressive Overload Tip: Add a slight weight vest or belt to leg raises.",
      Sunday: "Focus: Rest & Recovery\n- Rest Day: Active mobility, stretching, and light walking."
    }
  },
  {
    id: "adv_strength_cond",
    name: "Advanced Strength & Conditioning",
    category: "Advanced",
    difficulty: "Advanced",
    goal: "Force Output, Stamina, & Recovery Capacity",
    duration: "60 mins",
    muscleGroups: "Total Body Conditioning, Explosiveness & Stamina",
    frequency: "5 Days Strength/Metcon",
    description: "Military-inspired template combining heavy weight lifting with high intensity cardiorespiratory circuits (Metcons). Highly demanding.",
    schedule: {
      Monday: "Focus: Barbell Power & Push\n- Barbell Clean & Press: 5 sets x 3 reps (Rest: 2m)\n- Incline Barbell Bench Press: 4 sets x 6 reps (Rest: 90s)\n- Seated DB Shoulder Press: 3 sets x 8 reps (Rest: 90s)\n- Dips (Weighted): 3 sets x 10 reps (Rest: 75s)\n- Lateral Raise (Cable): 3 sets x 12 reps (Rest: 60s)\n*Progressive Overload Tip: Clean the bar in one motion to the chest before pressing.",
      Tuesday: "Focus: Hinge Strength & Back Volume\n- Snatch-Grip Deadlifts (Heavy): 4 sets x 5 reps (Rest: 2.5m)\n- Pendlay Barbell Rows: 4 sets x 6 reps (Rest: 90s)\n- Weighted Pullups: 4 sets x 6 reps (Rest: 90s)\n- Dumbbell Rear Delt Raises: 3 sets x 15 reps (Rest: 60s)\n- Dumbbell Hammer Curls: 3 sets x 12 reps (Rest: 60s)\n*Progressive Overload Tip: Pull Pendlay row from the floor dynamically on every rep.",
      Wednesday: "Focus: Rest & Functional Rest\n- Rest Day: Rest and perform dynamic quad/hip flexor stretches.",
      Thursday: "Focus: Lower Power & Core Transfer\n- Front Squats (Heavy): 5 sets x 5 reps (Rest: 2m)\n- Weighted Step-Ups: 3 sets x 8 reps per leg (Rest: 75s)\n- Kettlebell Romanian Deadlifts (Single-Leg): 3 sets x 10 reps per leg (Rest: 60s)\n- Hanging Leg Raises: 4 sets x 12 reps (Rest: 45s)\n- Seated Calf Raises: 4 sets x 12 reps (Rest: 60s)\n*Progressive Overload Tip: Keep elbows up high in the front squat front-rack position.",
      Friday: "Focus: Metabolic Conditioning (The Engine)\n- MetCon Circuit (5 Rounds for Time):\n  * 10 Thrusters (Barbell)\n  * 10 Chest-to-Bar Pull-ups\n  * 15 Kettlebell Swings\n  * 20 Double Unders (Jump Rope)\n  * Rest 90s after each round\n*Progressive Overload Tip: Maintain a steady pace to prevent early redlining.",
      Saturday: "Focus: Cardiovascular Capacity\n- Rowing Machine: 35 minutes at moderate intensity\n- Deep Full-Body Flexibility Stretch: 15 minutes",
      Sunday: "Focus: Rest & Recovery\n- Rest Day: Active mobility, stretching, and light walking."
    }
  },
  {
    id: "adv_bodybuilding_prep",
    name: "Advanced Bodybuilding Prep",
    category: "Advanced",
    difficulty: "Advanced",
    goal: "Maximum Shred & Muscle Retention",
    duration: "70 mins",
    muscleGroups: "Deep Isolation Target & Pre-Exhaust Splits",
    frequency: "6 Days/Week",
    description: "Designed for competitive or peak shape cycles. Employs pre-exhaustion methods, dropsets, and high tempo work.",
    schedule: {
      Monday: "Focus: Quad & Calf Focus (Pre-Exhaust Method)\n- Leg Extensions (Pre-exhaust): 4 sets x 20 reps (Rest: 45s) - Squeeze hard\n- Hack Squats (or Safety Bar Squats): 4 sets x 10 reps (Rest: 90s)\n- Bulgarian Split Squats (DBs): 3 sets x 12 reps per leg (Rest: 75s)\n- Leg Press: 3 sets x 15 reps (Rest: 90s)\n- Standing Calf Raises: 4 sets x 12 reps (Rest: 45s) - Slow negative\n*Progressive Overload Tip: Control the hack squat negative; build quad tension.",
      Tuesday: "Focus: Upper Width & Posterior Back\n- Lat Pulldowns (Wide Grip): 4 sets x 12 reps (Rest: 75s)\n- Seated Cable Rows (Underhand): 3 sets x 10 reps (Rest: 75s)\n- Single-Arm Lat Pulls: 3 sets x 12 reps per side (Rest: 60s)\n- Cable Face Pulls: 4 sets x 15 reps (Rest: 45s)\n- Dumbbell Hammer Curls: 3 sets x 12 reps (Rest: 60s)\n*Progressive Overload Tip: Reach all the way up on pulldowns to stretch the lats.",
      Wednesday: "Focus: Chest & Front Delts\n- Incline Dumbbell Flyes (Pre-exhaust): 4 sets x 15 reps (Rest: 60s)\n- Incline Barbell Press: 4 sets x 8 reps (Rest: 90s)\n- Flat Dumbbell Chest Press: 3 sets x 10 reps (Rest: 75s)\n- Cable Crossovers (High-to-Low): 3 sets x 12 reps (Rest: 60s)\n- Dumbbell Front Raises: 3 sets x 12 reps (Rest: 60s)\n*Progressive Overload Tip: Squeeze chest at the top of dumbbell presses and flyes.",
      Thursday: "Focus: Hamstring & Glutes Density\n- Lying Leg Curls: 4 sets x 12 reps (Rest: 60s) - Hold squeeze 1s\n- Romanian Deadlifts (RDLs): 4 sets x 10 reps (Rest: 90s)\n- Barbell Hip Thrusts: 3 sets x 10 reps (Rest: 90s)\n- Seated Calf Raises: 4 sets x 15 reps (Rest: 45s)\n- Cable Crunches: 3 sets x 15 reps (Rest: 45s)\n*Progressive Overload Tip: Use a barbell pad on hip thrusts and push hips all the way up.",
      Friday: "Focus: Shoulder Cap & Arms\n- Seated Dumbbell Press: 4 sets x 10 reps (Rest: 90s)\n- Cable Lateral Raises (Single-Arm): 4 sets x 12 reps per side (Rest: 45s)\n- Dumbbell Rear Delt Raises: 4 sets x 15 reps (Rest: 45s)\n- Preacher Curls superset with Cable Overhead Extensions: 3 sets x 10 reps (Rest: 60s)\n- Hammer Curls superset with Tricep Pushdowns: 3 sets x 12 reps (Rest: 60s)\n*Progressive Overload Tip: Control the lateral raises and do not swing the weight.",
      Saturday: "Focus: Cardiovascular Shred & Abs\n- Incline Treadmill Walk: 40 minutes at 6.5 km/h, 10% incline\n- Hanging Leg Raises: 4 sets x 12 reps (Rest: 45s)\n- Plank Hold: 3 sets x 75 seconds (Rest: 45s)\n- Stomach Vacuums: 4 sets x 30 seconds hold\n*Progressive Overload Tip: Focus on breathing and deep transversus abdominis contraction.",
      Sunday: "Focus: Rest & Recovery\n- Rest Day: Active mobility, stretching, and light walking."
    }
  },

  // ==========================================
  // WEIGHT LOSS CATEGORY
  // ==========================================
  {
    id: "hiit_fat_burn",
    name: "HIIT Fat Burn",
    category: "Weight Loss",
    difficulty: "Intermediate",
    goal: "Caloric Deficit & VO2 Max Capacity",
    duration: "35 mins",
    muscleGroups: "Full Body Metabolic Conditioning",
    frequency: "5 Days Cardio/Resistance HIIT",
    description: "High Intensity Interval Training to stimulate the EPOC effect (burn calories long after the workout is complete).",
    schedule: {
      Monday: "Focus: Tabata Blast (High Intensity Intervals)\n- Perform 8 rounds (20s work, 10s rest) for each exercise:\n  * Jump Squats (Bodyweight)\n  * Push-Ups (or Kneeling)\n  * Mountain Climbers\n  * Burpees\n  * High Knees in place\n- Rest 2 mins between exercises\n*Progressive Overload Tip: Aim to increase total reps performed in each 20s interval.",
      Tuesday: "Focus: Kettlebell Resistance & Heart Rate\n- Kettlebell Swings: 4 sets x 15 reps (Rest: 45s)\n- Dumbbell Thrusters (Light): 3 sets x 12 reps (Rest: 60s)\n- Kettlebell Goblet Carry: 3 sets x 30 meters (Rest: 45s)\n- Rowing Machine: 15 minutes of 45s hard row, 45s light recovery\n*Progressive Overload Tip: Focus on explosive hip snap on swings.",
      Wednesday: "Focus: Rest & Deep Stretch\n- Rest Day: Light stretching, recovery walk, and hydration focus.",
      Thursday: "Focus: Core & Cardio HIIT\n- Plank Jacks: 4 sets x 20 reps (Rest: 45s)\n- Bicycle Crunches: 4 sets x 25 reps (Rest: 45s)\n- Spider Climbs: 3 sets x 12 reps per leg (Rest: 45s)\n- Jumping Jacks: 3 sets x 45 seconds (Rest: 30s)\n- Burpees: 3 sets x 10 reps (Rest: 60s)\n*Progressive Overload Tip: Keep core fully locked and hips low on plank jacks.",
      Friday: "Focus: Full Body Resistance Burn\n- Dumbbell Snatch (Single-Arm): 3 sets x 10 reps per side (Rest: 60s)\n- Jump Lunges (Bodyweight): 3 sets x 10 reps per leg (Rest: 60s)\n- Box Jumps (Light): 3 sets x 8 reps (Rest: 60s)\n- Battle Ropes: 4 sets x 30s work / 30s rest\n- Russian Twists (Bodyweight): 3 sets x 20 reps (Rest: 45s)\n*Progressive Overload Tip: Land softly on box jumps; keep joint pressure minimal.",
      Saturday: "Focus: Low-Intensity Steady State (LISS)\n- Incline Treadmill Walk: 30 minutes\n- Deep static hamstring and quad stretches: 10 minutes",
      Sunday: "Focus: Rest & Recovery\n- Rest Day: Active mobility, stretching, and light walking."
    }
  },
  {
    id: "circuit_training",
    name: "Circuit Training",
    category: "Weight Loss",
    difficulty: "Beginner",
    goal: "Muscular Endurance & Metabolic Volume",
    duration: "45 mins",
    muscleGroups: "Full Body Circuits (Upper & Lower Alternations)",
    frequency: "4 Days/Week",
    description: "Continuous loops of compound movements with minimal rest. Excellent for burning fat while maintaining muscle tone.",
    schedule: {
      Monday: "Focus: Full Body Circuit A (5 Rounds)\n- Move from 1 to 5 without rest. Rest 90s after each round:\n  1. Dumbbell Goblet Squats (Medium): 12 reps\n  2. Push-Ups (Bodyweight): 10 reps\n  3. Chest-Supported Dumbbell Rows: 12 reps\n  4. Kettlebell Swings: 15 reps\n  5. Plank Hold: 45 seconds\n*Progressive Overload Tip: Try to reduce the 90s rest to 75s next week.",
      Tuesday: "Focus: Cardiovascular Engine Circuit\n- 5 Rounds for speed. Rest 60s after each round:\n  * Row Machine: 400 meters\n  * Dumbbell Step-Ups: 12 reps total\n  * Wall Balls (Light): 12 reps\n  * Russian Twists: 20 reps total\n*Progressive Overload Tip: Record total time taken to complete 5 rounds; aim to beat it.",
      Wednesday: "Focus: Rest & Recovery\n- Rest Day: Muscle release, static stretching, warm bath.",
      Thursday: "Focus: Upper Body Sculpt Circuit (5 Rounds)\n- Move from 1 to 5 without rest. Rest 90s after each round:\n  1. Lat Pulldowns: 12 reps\n  2. Seated Dumbbell Shoulder Press: 12 reps\n  3. Cable Chest Flyes: 15 reps\n  4. Dumbbell Bicep Curls: 12 reps\n  5. Cable Tricep Rope Pushdowns: 12 reps\n*Progressive Overload Tip: Increase dumbbell press weight once all rounds are completed under control.",
      Friday: "Focus: Lower Body & Midsection Circuit (5 Rounds)\n- Move from 1 to 5 without rest. Rest 90s after each round:\n  1. Leg Press: 12 reps\n  2. Seated Leg Curls: 12 reps\n  3. Standing Calf Raises: 15 reps\n  4. Hanging Knee Raises: 12 reps\n  5. Side Planks: 20s per side\n*Progressive Overload Tip: Drive leg press depth to 90 degrees.",
      Saturday: "Focus: Active Outdoors Recovery\n- Outdoor Walk or Light Jog: 30 minutes\n- Full body stretching sequence: 15 minutes",
      Sunday: "Focus: Rest & Recovery\n- Rest Day: Active mobility, stretching, and light walking."
    }
  },
  {
    id: "cardio_resistance",
    name: "Cardio + Resistance",
    category: "Weight Loss",
    difficulty: "Beginner",
    goal: "Maintain Lean Mass & Burn Fat",
    duration: "50 mins",
    muscleGroups: "Full Body Resistance + Cardiovascular Splits",
    frequency: "5 Days/Week",
    description: "Alternates block of moderate cardiorespiratory exercise with structured muscle group resistance training.",
    schedule: {
      Monday: "Focus: Treadmill & Dumbbell Push\n- Block 1 (Cardio): 10 minutes incline treadmill walk\n- Block 2 (Resistance): 3 sets x 10 reps Flat DB Bench Press (Rest: 60s)\n- Block 3 (Cardio): 10 minutes treadmill jog\n- Block 4 (Resistance): 3 sets x 10 reps Seated DB Shoulder Press (Rest: 60s)\n- Block 5 (Core): 3 sets x 12 reps Hanging Knee Raises\n*Progressive Overload Tip: Slowly increase treadmill speed or DB weight weekly.",
      Tuesday: "Focus: Rowing & Dumbbell Pull\n- Block 1 (Cardio): 10 minutes Rowing Machine\n- Block 2 (Resistance): 3 sets x 10 reps Seated Cable Row (Rest: 60s)\n- Block 3 (Cardio): 10 minutes Rowing Machine\n- Block 4 (Resistance): 3 sets x 10 reps Lat Pulldowns (Rest: 60s)\n- Block 5 (Arms): 3 sets x 12 reps Dumbbell Hammer Curls\n*Progressive Overload Tip: Keep rowing strokes/min consistent around 22-24.",
      Wednesday: "Focus: Rest & Recovery\n- Rest Day: Hydration and light movement to flush out lactic acid.",
      Thursday: "Focus: Cycling & Dumbbell Legs\n- Block 1 (Cardio): 10 minutes Stationary Bike\n- Block 2 (Resistance): 3 sets x 10 reps Goblet Squats (Rest: 60s)\n- Block 3 (Cardio): 10 minutes Stationary Bike\n- Block 4 (Resistance): 3 sets x 10 reps Dumbbell Romanian Deadlifts (Rest: 60s)\n- Block 5 (Calves): 4 sets x 12 reps Calf Raises\n*Progressive Overload Tip: Focus on steady leg drive on the cycling intervals.",
      Friday: "Focus: Full Body Resistance & Core\n- Block 1 (Cardio): 15 minutes incline treadmill walk\n- Block 2 (Resistance): 3 sets x 10 reps Dumbbell Lunges (Rest: 60s)\n- Block 3 (Resistance): 3 sets x 10 reps Incline Push-Ups (Rest: 60s)\n- Block 4 (Core): 3 sets x 45 seconds Plank Hold\n*Progressive Overload Tip: Lower the hips on planks and squeeze glutes.",
      Saturday: "Focus: Active Outdoor Cardio\n- Steady Incline Outdoor Walk: 45 minutes\n- Full body stretching sequence: 15 minutes",
      Sunday: "Focus: Rest & Recovery\n- Rest Day: Active mobility, stretching, and light walking."
    }
  },
  {
    id: "functional_weight_loss",
    name: "Functional Weight Loss",
    category: "Weight Loss",
    difficulty: "Intermediate",
    goal: "Mobility, Balance, & Fat Reduction",
    duration: "45 mins",
    muscleGroups: "Core, Hips, Shoulder Girdle, Body Integration",
    frequency: "5 Days/Week",
    description: "Uses multi-planar functional movements to burn fat, build stabilizing core strength, and support overall mobility.",
    schedule: {
      Monday: "Focus: Push-Pull-Carry Circuit (4 Rounds)\n- Move from 1 to 4 with 15s rest. Rest 90s after each round:\n  1. Dumbbell Suitcase Carry: 30 meters per side\n  2. Kettlebell Deadlifts: 12 reps\n  3. Chest-Supported Rows: 10 reps\n  4. Push-Ups (Kneeling/Regular): Max Reps\n*Progressive Overload Tip: Carry slightly heavier dumbbells next week.",
      Tuesday: "Focus: Hip & Core Stability\n- Single-Leg Romanian Deadlifts (Bodyweight): 3 sets x 10 reps per leg (Rest: 60s)\n- Kettlebell Halos: 3 sets x 10 total reps (Rest: 60s)\n- Dumbbell Step-Ups: 3 sets x 8 reps per leg (Rest: 60s)\n- Planks (Side-to-Side): 3 sets x 30s per side (Rest: 60s)\n*Progressive Overload Tip: Focus on balance; do not let knee buckle inward.",
      Wednesday: "Focus: Rest & Muscle Stretch\n- Rest Day: Spend 15 minutes stretching hip flexors and chest.",
      Thursday: "Focus: Rotational Power & Lateral Movement (4 Rounds)\n- Move from 1 to 4 with 15s rest. Rest 90s after each round:\n  1. Dumbbell Lateral Lunges: 10 reps per leg\n  2. Cable Woodchops: 12 reps per side\n  3. Dumbbell Shoulder Press: 10 reps\n  4. Bicycle Crunches: 20 reps\n*Progressive Overload Tip: Squeeze abs during the rotational phase of woodchops.",
      Friday: "Focus: Dynamic Cardio Power\n- Kettlebell Swings: 3 sets x 15 reps (Rest: 60s)\n- Medicine Ball Slam: 3 sets x 12 reps (Rest: 60s)\n- Bodyweight Squats (Speed): 3 sets x 20 reps (Rest: 60s)\n- Deadbugs: 3 sets x 10 reps per side (Rest: 45s)\n*Progressive Overload Tip: Snap hips aggressively on kettlebell swings.",
      Saturday: "Focus: Low-Intensity Steady State & Yoga\n- Steady Incline Walking: 20 minutes\n- Full Body Yoga Flow (Vinyasa style): 20 minutes",
      Sunday: "Focus: Rest & Recovery\n- Rest Day: Active mobility, stretching, and light walking."
    }
  },
  {
    id: "metabolic_cond",
    name: "Metabolic Conditioning",
    category: "Weight Loss",
    difficulty: "Advanced",
    goal: "Peak Caloric Output & Muscle Hardening",
    duration: "40 mins",
    muscleGroups: "Total Body Conditioning & Stamina",
    frequency: "5 Days/Week",
    description: "High density sessions utilizing compound bar/dumbbell exercises combined with metabolic cardiovascular circuits.",
    schedule: {
      Monday: "Focus: Barbell MetCon (EMOM 15)\n- Every Minute on the Minute (EMOM) for 15 minutes:\n  * Minute 1: 5 Power Cleans (Medium weight)\n  * Minute 2: 8 Front Squats\n  * Minute 3: 10 Burpees\n- Repeat 5 times (for a total of 15 minutes)\n*Progressive Overload Tip: Aim to finish reps faster to gain more rest before the next minute starts.",
      Tuesday: "Focus: AMRAP Kettlebell & Bodyweight\n- As Many Rounds As Possible (AMRAP) in 20 minutes:\n  * 15 Kettlebell Swings\n  * 10 Push-Ups\n  * 10 Kettlebell Goblet Squats\n  * 8 Chin-Ups\n- Record total rounds completed\n*Progressive Overload Tip: Try to beat your total round score next session.",
      Wednesday: "Focus: Rest & Joint Care\n- Rest Day: Light walks, foam rolling of hips, quads, back.",
      Thursday: "Focus: Row & Press (3 Rounds for Time)\n- Complete as fast as possible:\n  * 800m Row\n  * 12 Dumbbell Thrusters (Medium weight)\n  * 12 Hanging Knee Raises\n- Track time taken\n*Progressive Overload Tip: Control breathing on thrusters to maintain output.",
      Friday: "Focus: Sprint & Core Intervals\n- Sprint 100m, followed by:\n  * 15 Bodyweight Air Squats\n  * 10 Push-Ups\n  * Plank Hold: 30 seconds\n- Repeat 8 rounds. Rest 60s after each round.\n*Progressive Overload Tip: Attempt to reduce rest time by 5-10s once endurance grows.",
      Saturday: "Focus: Recovery Engine\n- Elliptical or Bike: 30 minutes at low intensity\n- Deep static stretching: 15 minutes",
      Sunday: "Focus: Rest & Recovery\n- Rest Day: Active mobility, stretching, and light walking."
    }
  },

  // ==========================================
  // MUSCLE GAIN CATEGORY
  // ==========================================
  {
    id: "hypertrophy_split",
    name: "Hypertrophy Split",
    category: "Muscle Gain",
    difficulty: "Intermediate",
    goal: "Maximum Muscle Hypertrophy & Density",
    duration: "60-70 mins",
    muscleGroups: "Upper Push, Lower Pull, Upper Pull, Lower Push",
    frequency: "5 Days/Week",
    description: "Volume-focused split optimized to maximize sarcoplasmic hypertrophy by hitting target reps close to muscular failure.",
    schedule: {
      Monday: "Focus: Upper Push Focus (Hypertrophy)\n- Incline Dumbbell Bench Press: 4 sets x 10 reps (Rest: 90s)\n- Flat Dumbbell Bench Press: 3 sets x 12 reps (Rest: 90s)\n- Seated DB Shoulder Press: 3 sets x 10 reps (Rest: 75s)\n- Dumbbell Lateral Raises: 4 sets x 12-15 reps (Rest: 60s)\n- Cable Tricep Rope Pushdowns: 3 sets x 12 reps (Rest: 60s)\n- Tricep Dumbbell Kickbacks: 3 sets x 10 reps (Rest: 60s)\n*Progressive Overload Tip: Slow down the negative phase to 3 seconds for maximum micro-tears.",
      Tuesday: "Focus: Lower Pull Focus (Hamstring/Glute Growth)\n- Dumbbell Romanian Deadlifts (RDL): 4 sets x 10 reps (Rest: 90s)\n- Lying Leg Curls: 3 sets x 12-15 reps (Rest: 75s)\n- Dumbbell Bulgarian Split Squats: 3 sets x 10 reps per leg (Rest: 75s)\n- Seated Calf Raises: 4 sets x 15 reps (Rest: 60s)\n- Hanging Knee Raises: 3 sets x 15 reps (Rest: 60s)\n*Progressive Overload Tip: Push hips back on RDLs and keep knees soft to load the hamstrings.",
      Wednesday: "Focus: Rest & Recovery\n- Rest Day: Take a light walk; focus on high protein intake.",
      Thursday: "Focus: Upper Pull Focus (Back & Bicep Width)\n- Wide Lat Pulldowns: 4 sets x 10 reps (Rest: 90s)\n- Seated Cable Rows: 3 sets x 12 reps (Rest: 90s)\n- Dumbbell Shrugs: 3 sets x 12 reps (Rest: 60s)\n- EZ Bar Preacher Curls: 3 sets x 12 reps (Rest: 60s)\n- Dumbbell Hammer Curls: 3 sets x 12 reps (Rest: 60s)\n*Progressive Overload Tip: Squeeze shoulder blades together on row exercises.",
      Friday: "Focus: Lower Push Focus (Quad Growth)\n- Barbell Back Squats (Hypertrophy): 4 sets x 10 reps (Rest: 90s)\n- Leg Press: 3 sets x 12 reps (Rest: 90s)\n- Leg Extensions: 3 sets x 15 reps (Rest: 60s) - Squeeze at top\n- Standing Calf Raises: 4 sets x 12 reps (Rest: 60s)\n- Planks: 3 sets x 60 seconds (Rest: 45s)\n*Progressive Overload Tip: Add a slight pause at the bottom of the squat to eliminate momentum.",
      Saturday: "Focus: Arm & Shoulder Pump\n- Seated Overhead Dumbbell Press: 3 sets x 10 reps (Rest: 75s)\n- Dumbbell Lateral Raises: 4 sets x 15 reps (Rest: 45s)\n- Dumbbell Bicep Curls: 3 sets x 12 reps (Rest: 60s)\n- Tricep Overhead Extension (Cable): 3 sets x 12 reps (Rest: 60s)\n- Wrist Curls: 3 sets x 15 reps (Rest: 45s)\n*Progressive Overload Tip: Target a tight muscle squeeze at the top of curls.",
      Sunday: "Focus: Rest & Recovery\n- Rest Day: Active mobility, stretching, and light walking."
    }
  },
  {
    id: "power_mass",
    name: "Powerbuilding Mass",
    category: "Muscle Gain",
    difficulty: "Advanced",
    goal: "Muscular Size & Absolute Compound Power",
    duration: "65 mins",
    muscleGroups: "Heavy Barbell Compounds + Hypertrophy Blocks",
    frequency: "4 Days Strength + 1 Day Active Cardio",
    description: "Combines powerlifting compound structures with bodybuilding accessory volume. Builds a dense, powerful, and thick frame.",
    schedule: {
      Monday: "Focus: Heavy Squat & Leg Thickness\n- Barbell Back Squats: 4 sets x 6 reps (Rest: 2m)\n- Romanian Deadlifts (Barbell): 3 sets x 8 reps (Rest: 90s)\n- Dumbbell Lunges: 3 sets x 10 reps per leg (Rest: 75s)\n- Standing Calf Raises: 4 sets x 10 reps (Rest: 60s)\n- Cable Crunches: 3 sets x 15 reps (Rest: 60s)\n*Progressive Overload Tip: Increase squat weight by 2.5kg once 6 reps on all sets are achieved.",
      Tuesday: "Focus: Heavy Bench & Chest Bulk\n- Flat Barbell Bench Press: 4 sets x 6 reps (Rest: 2m)\n- Incline Dumbbell Bench Press: 3 sets x 8 reps (Rest: 90s)\n- Bodyweight Chest Dips (Weighted if possible): 3 sets x 10 reps (Rest: 90s)\n- Cable Crossovers: 3 sets x 12 reps (Rest: 75s)\n- Tricep Overhead Extension: 3 sets x 10 reps (Rest: 60s)\n*Progressive Overload Tip: Retract and depress scapula on bench press.",
      Wednesday: "Focus: Rest & Deep Tissue Roll\n- Rest Day: Perform 15 minutes foam rolling on quads, lats and chest.",
      Thursday: "Focus: Heavy Deadlift & Back Thickness\n- Conventional Deadlifts: 3 sets x 5 reps (Rest: 2m-3m)\n- Weighted Pull-ups: 4 sets x 6 reps (Rest: 90s)\n- Seated T-Bar Rows: 3 sets x 8 reps (Rest: 90s)\n- Barbell Bicep Curls: 3 sets x 10 reps (Rest: 60s)\n- Dumbbell Hammer Curls: 3 sets x 10 reps (Rest: 60s)\n*Progressive Overload Tip: Pull bar tightly against shins on deadlifts; snap hips at lock.",
      Friday: "Focus: Heavy OHP & Shoulder Caps\n- Standing Barbell Overhead Press (OHP): 4 sets x 6 reps (Rest: 2m)\n- Seated Arnold Press: 3 sets x 8 reps (Rest: 90s)\n- Dumbbell Lateral Raises: 4 sets x 12 reps (Rest: 60s)\n- Rear Delt Raises: 4 sets x 15 reps (Rest: 60s)\n- Cable Tricep Pushdowns: 3 sets x 12 reps (Rest: 60s)\n*Progressive Overload Tip: Stand firm and squeeze quads/glutes to stabilize barbell press.",
      Saturday: "Focus: Active Cardio & Recovery\n- Light Running / Jogging: 25 minutes\n- Planks: 3 sets x 45s (Rest: 45s)\n- Hamstring & Shoulder stretches: 10 minutes",
      Sunday: "Focus: Rest & Recovery\n- Rest Day: Active mobility, stretching, and light walking."
    }
  },
  {
    id: "classic_bodybuilding",
    name: "Classic Bodybuilding",
    category: "Muscle Gain",
    difficulty: "Advanced",
    goal: "Aesthetic Proportions, Balance, & Mass",
    duration: "65 mins",
    muscleGroups: "Chest/Back, Shoulders/Arms, Legs/Calves",
    frequency: "5 Days/Week",
    description: "Golden Era-style training focusing on aesthetic symmetry, lat width, upper chest fullness, and vacuum stomach control.",
    schedule: {
      Monday: "Focus: Chest & Back (Antagonist Pump)\n- Incline Dumbbell Bench Press: 4 sets x 10 reps (Rest: 75s)\n- Wide-Grip Chin-ups: 4 sets x 8 reps (Rest: 75s)\n- Flat Dumbbell Bench Press: 3 sets x 10 reps (Rest: 60s)\n- Seated Cable Rows (Underhand): 3 sets x 10 reps (Rest: 60s)\n- Flat Dumbbell Flyes: 3 sets x 12 reps (Rest: 60s)\n- Dumbbell Pullovers: 3 sets x 12 reps (Rest: 60s)\n*Progressive Overload Tip: Minimize rest between exercises to maintain high muscle pump.",
      Tuesday: "Focus: Shoulders & Arms\n- Standing Military Press: 4 sets x 10 reps (Rest: 90s)\n- Dumbbell Lateral Raises: 4 sets x 12-15 reps (Rest: 45s)\n- EZ Bar Bicep Curls: 3 sets x 10 reps (Rest: 60s)\n- Close-Grip Bench Press: 3 sets x 10 reps (Rest: 60s)\n- Dumbbell Preacher Curls: 3 sets x 12 reps (Rest: 60s)\n- Tricep Pushdowns: 3 sets x 12 reps (Rest: 60s)\n*Progressive Overload Tip: Work arms with clean contractions; avoid using torso momentum.",
      Wednesday: "Focus: Rest & Recovery\n- Rest Day: Deep joint mobility exercises.",
      Thursday: "Focus: Legs & Calves\n- Barbell Back Squats: 4 sets x 12 reps (Rest: 90s-120s)\n- Leg Press: 3 sets x 12 reps (Rest: 90s)\n- Lying Leg Curls: 4 sets x 12 reps (Rest: 60s)\n- Standing Calf Raises: 4 sets x 15 reps (Rest: 60s)\n- Seated Calf Raises: 3 sets x 15 reps (Rest: 60s)\n*Progressive Overload Tip: Slowly rise on calf raises and hold the stretch at the bottom.",
      Friday: "Focus: Upper Chest & Back Width\n- Incline Barbell Bench Press: 4 sets x 10 reps (Rest: 90s)\n- Lat Pulldowns (Wide): 4 sets x 10 reps (Rest: 90s)\n- Incline Dumbbell Flyes: 3 sets x 12 reps (Rest: 75s)\n- Single-Arm Dumbbell Rows: 3 sets x 10 reps per side (Rest: 75s)\n- Stomach Vacuums: 4 sets x 30s holds\n*Progressive Overload Tip: Vacuum abdominal wall inward on an exhale to train inner core.",
      Saturday: "Focus: Arms & Core Detail\n- Incline Bicep Curls: 3 sets x 12 reps (Rest: 60s)\n- Cable Overhead Extensions: 3 sets x 12 reps (Rest: 60s)\n- Reverse Barbell Curls: 3 sets x 15 reps (Rest: 45s)\n- Hanging Knee Raises: 3 sets x 15 reps (Rest: 45s)\n- Plank Hold: 3 sets x 60s (Rest: 45s)\n*Progressive Overload Tip: Build forearm mass with reverse curls.",
      Sunday: "Focus: Rest & Recovery\n- Rest Day: Active mobility, stretching, and light walking."
    }
  },
  {
    id: "ppl_hypertrophy",
    name: "Push Pull Legs Hypertrophy",
    category: "Muscle Gain",
    difficulty: "Advanced",
    goal: "Accelerated Muscle Growth (2x Frequency)",
    duration: "70 mins",
    muscleGroups: "Push, Pull, Legs (Alternating Focus Blocks)",
    frequency: "6 Days/Week",
    description: "Advanced splits hitting each muscle group twice weekly. Maximizes weekly protein synthesis cycles for hypertrophy.",
    schedule: {
      Monday: "Focus: Push Hypertrophy A\n- Dumbbell Flat Bench Press: 4 sets x 10 reps (Rest: 90s)\n- Seated Arnold Press: 3 sets x 10 reps (Rest: 90s)\n- Incline Dumbbell Bench Press: 3 sets x 12 reps (Rest: 75s)\n- Dumbbell Lateral Raises: 4 sets x 12 reps (Rest: 60s)\n- Overhead Cable Tricep Extension: 3 sets x 12 reps (Rest: 60s)\n- Tricep Rope Pushdowns: 3 sets x 12 reps (Rest: 60s)\n*Progressive Overload Tip: Keep elbows slightly tucked on presses to protect shoulder joints.",
      Tuesday: "Focus: Pull Hypertrophy A\n- Wide Lat Pulldowns: 4 sets x 10 reps (Rest: 90s)\n- Chest-Supported Rows: 3 sets x 12 reps (Rest: 90s)\n- Cable Face Pulls: 4 sets x 15 reps (Rest: 60s)\n- Seated Bicep Curls (DB): 3 sets x 10 reps (Rest: 60s)\n- Dumbbell Hammer Curls: 3 sets x 12 reps (Rest: 60s)\n- Rear Delt Pec Dec Flyes: 3 sets x 15 reps (Rest: 60s)\n*Progressive Overload Tip: Pull lat pulldown bar clean to clavicle.",
      Wednesday: "Focus: Legs Hypertrophy A\n- Leg Press (Hypertrophy volume): 4 sets x 12 reps (Rest: 90s-120s)\n- Romanian Deadlifts (DB): 3 sets x 10 reps (Rest: 90s)\n- Bulgarian Split Squats (Dumbbells): 3 sets x 10 reps per leg (Rest: 90s)\n- Lying Leg Curls: 3 sets x 12 reps (Rest: 60s)\n- Calf Press on Leg Press: 4 sets x 15 reps (Rest: 60s)\n- Plank Hold: 3 sets x 60s (Rest: 45s)\n*Progressive Overload Tip: Force depth on split squats to stimulate glute activation.",
      Thursday: "Focus: Push Hypertrophy B\n- Incline Barbell Bench Press: 4 sets x 10 reps (Rest: 90s)\n- Seated Dumbbell Shoulder Press: 3 sets x 10 reps (Rest: 90s)\n- Dumbbell Lateral Raises: 4 sets x 15 reps (Rest: 60s)\n- Cable Chest Flyes: 3 sets x 12 reps (Rest: 60s)\n- Close-Grip Bench Press: 3 sets x 10 reps (Rest: 75s)\n- Tricep Rope Pushdowns: 3 sets x 12 reps (Rest: 60s)\n*Progressive Overload Tip: Pause for 1 second at the contraction of flyes.",
      Friday: "Focus: Pull Hypertrophy B\n- Barbell Rows: 4 sets x 10 reps (Rest: 90s)\n- Neutral Grip Chin-ups: 3 sets x 10 reps (Rest: 90s)\n- Dumbbell Shrugs: 3 sets x 12 reps (Rest: 60s)\n- Cable Rear Delt Flyes: 3 sets x 15 reps (Rest: 60s)\n- EZ Bar Bicep Curls: 3 sets x 12 reps (Rest: 60s)\n- Preacher Curls (EZ Bar): 3 sets x 12 reps (Rest: 60s)\n*Progressive Overload Tip: Retract shoulder blades fully at peak of barbell rows.",
      Saturday: "Focus: Legs Hypertrophy B\n- Dumbbell Goblet Squats: 4 sets x 12 reps (Rest: 90s)\n- Dumbbell Romanian Deadlifts: 3 sets x 12 reps (Rest: 90s)\n- Leg Extensions: 3 sets x 15 reps (Rest: 60s)\n- Seated Calf Raises: 4 sets x 15 reps (Rest: 60s)\n- Hanging Knee Raises: 3 sets x 15 reps (Rest: 60s)\n*Progressive Overload Tip: In leg extensions, lock out knees cleanly and hold.",
      Sunday: "Focus: Rest & Recovery\n- Rest Day: Active mobility, stretching, and light walking."
    }
  },
  {
    id: "upper_lower_mass",
    name: "Upper Lower Mass Builder",
    category: "Muscle Gain",
    difficulty: "Advanced",
    goal: "Muscular Mass & Progressive Load Capacity",
    duration: "60 mins",
    muscleGroups: "Upper Mass, Lower Mass Splits",
    frequency: "4 Days Strength",
    description: "Alternates heavy upper and lower body layouts with high volume accessories. Ideal for packing on size.",
    schedule: {
      Monday: "Focus: Upper Mass Focus\n- Barbell Flat Bench Press: 4 sets x 8 reps (Rest: 90s)\n- Barbell Bent-Over Rows: 4 sets x 8 reps (Rest: 90s)\n- Seated Dumbbell Shoulder Press: 3 sets x 10 reps (Rest: 75s)\n- Chin-ups: 3 sets x 10 reps (Rest: 75s)\n- Cable Chest Crossovers: 3 sets x 12 reps (Rest: 60s)\n- Dumbbell Bicep Curls: 3 sets x 12 reps (Rest: 60s)\n*Progressive Overload Tip: Maintain clean control on barbell row return.",
      Tuesday: "Focus: Lower Mass Focus\n- Barbell Back Squats: 4 sets x 8 reps (Rest: 90s)\n- Romanian Deadlifts (Barbell): 4 sets x 8 reps (Rest: 90s)\n- Lying Leg Curls: 3 sets x 12 reps (Rest: 60s)\n- Lying Leg Extensions: 3 sets x 12 reps (Rest: 60s)\n- Standing Calf Raises: 4 sets x 12 reps (Rest: 60s)\n*Progressive Overload Tip: Drive heels hard into floor to power squats.",
      Wednesday: "Focus: Rest & Muscle Recovery\n- Rest Day: Muscle hydration, clean nutrition, and light posture stretches.",
      Thursday: "Focus: Upper Mass B (Hypertrophy)\n- Incline Dumbbell Bench Press: 4 sets x 10 reps (Rest: 90s)\n- Seated Lat Pulldowns: 4 sets x 10 reps (Rest: 90s)\n- Standing Barbell Overhead Press (OHP): 3 sets x 10 reps (Rest: 90s)\n- Chest Supported Rows: 3 sets x 10 reps (Rest: 75s)\n- Chest Dips (Bodyweight): 3 sets x 10 reps (Rest: 75s)\n- Dumbbell Skull Crushers: 3 sets x 12 reps (Rest: 60s)\n*Progressive Overload Tip: Avoid hyperextending back on OHP reps.",
      Friday: "Focus: Lower Mass B (Hypertrophy)\n- Leg Press (Heavy): 4 sets x 10 reps (Rest: 90s)\n- Bulgarian Split Squats: 3 sets x 12 reps per leg (Rest: 90s)\n- Seated Leg Curls: 3 sets x 12 reps (Rest: 60s)\n- Seated Calf Raises: 4 sets x 12 reps (Rest: 60s)\n- Hanging Knee-to-Chest Raises: 3 sets x 15 reps (Rest: 60s)\n*Progressive Overload Tip: Focus on the stretch of calves at bottom of seated raises.",
      Saturday: "Focus: Active Recovery & Cardio\n- Stationary Cycling: 30 minutes at low resistance\n- Static stretching for hips, glutes, chest (15 minutes)",
      Sunday: "Focus: Rest & Recovery\n- Rest Day: Active mobility, stretching, and light walking."
    }
  }
];
