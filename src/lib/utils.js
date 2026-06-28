/* ==========================================
   UTILITY HELPER MODULE (BMI, MACROS, CSV EXPORT)
   ========================================== */

// 1. BMI Calculation
export function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return { bmi: "--", category: "--", color: "text-muted" };
  
  const heightM = heightCm / 100;
  const bmi = (weightKg / (heightM * heightM)).toFixed(1);
  let category = "Normal";
  let color = "badge-success";

  if (bmi < 18.5) {
    category = "Underweight";
    color = "badge-warning";
  } else if (bmi >= 25 && bmi < 29.9) {
    category = "Overweight";
    color = "badge-warning";
  } else if (bmi >= 30) {
    category = "Obese";
    color = "badge-danger";
  }

  return { bmi, category, color };
}

// 2. Daily Caloric & Macro splits
export function calculateMacros(calories, fitnessGoal) {
  let proteinRatio = 0.3; // default splits
  let carbsRatio = 0.45;
  let fatsRatio = 0.25;

  if (fitnessGoal === 'Muscle Gain') {
    proteinRatio = 0.35;
    carbsRatio = 0.50;
    fatsRatio = 0.15;
  } else if (fitnessGoal === 'Weight Loss') {
    proteinRatio = 0.40;
    carbsRatio = 0.30;
    fatsRatio = 0.30;
  } else if (fitnessGoal === 'Strength Training') {
    proteinRatio = 0.30;
    carbsRatio = 0.45;
    fatsRatio = 0.25;
  }

  // Protein and Carbs are 4 kcal/g, Fat is 9 kcal/g
  const protein = Math.round((calories * proteinRatio) / 4);
  const carbs = Math.round((calories * carbsRatio) / 4);
  const fats = Math.round((calories * fatsRatio) / 9);

  return { protein, carbs, fats };
}

// 3. Export Array of Objects to Excel / CSV format
export function exportToCSV(data, fileName = 'export.csv') {
  if (!data || !data.length) {
    alert("No records found to export.");
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      const escaped = ('' + (val ?? '')).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
