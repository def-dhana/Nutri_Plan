import './style.css';
import { supabase } from './supabase.js';

const mealIcons = {
  breakfast: '🌅',
  lunch: '🌞',
  dinner: '🌙',
  snack: '🍎'
};

const mealNames = {
  breakfast: 'Sarapan',
  lunch: 'Makan Siang',
  dinner: 'Makan Malam',
  snack: 'Snack'
};

function calculateBMR(gender, weight, height, age) {
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
}

function calculateTDEE(bmr, activityLevel) {
  return Math.round(bmr * parseFloat(activityLevel));
}

function calculateTargetCalories(tdee, goal) {
  if (goal === 'lose') {
    return tdee - 500;
  } else if (goal === 'gain') {
    return tdee + 300;
  }
  return tdee;
}

async function getFoodItems() {
  const { data, error } = await supabase
    .from('food_items')
    .select('*');

  if (error) {
    console.error('Error fetching food items:', error);
    return [];
  }

  return data || [];
}

function selectMeals(foodItems, targetCalories) {
  const calorieDistribution = {
    breakfast: 0.30,
    lunch: 0.35,
    dinner: 0.30,
    snack: 0.05
  };

  const mealPlan = {};

  for (const [mealType, percentage] of Object.entries(calorieDistribution)) {
    const targetMealCalories = targetCalories * percentage;
    const availableItems = foodItems.filter(item => item.meal_type === mealType);

    if (availableItems.length === 0) {
      mealPlan[mealType] = [];
      continue;
    }

    const selectedItems = [];
    let currentCalories = 0;
    const usedIndices = new Set();

    while (currentCalories < targetMealCalories * 0.8 && usedIndices.size < availableItems.length) {
      const remainingCalories = targetMealCalories - currentCalories;

      let bestItem = null;
      let bestDiff = Infinity;
      let bestIndex = -1;

      availableItems.forEach((item, index) => {
        if (usedIndices.has(index)) return;

        const diff = Math.abs(remainingCalories - item.calories);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestItem = item;
          bestIndex = index;
        }
      });

      if (bestItem && currentCalories + bestItem.calories <= targetMealCalories * 1.2) {
        selectedItems.push(bestItem);
        currentCalories += bestItem.calories;
        usedIndices.add(bestIndex);
      } else {
        break;
      }
    }

    mealPlan[mealType] = selectedItems;
  }

  return mealPlan;
}

function displayCalorieInfo(bmr, tdee, targetCalories, goal) {
  const goalText = {
    lose: 'Turun Berat Badan',
    maintain: 'Jaga Berat Badan',
    gain: 'Naik Berat Badan'
  };

  return `
    <div class="calorie-stat">
      <div class="calorie-label">BMR (Basal Metabolic Rate)</div>
      <div class="calorie-value">${Math.round(bmr)} <span>kal/hari</span></div>
    </div>
    <div class="calorie-stat">
      <div class="calorie-label">TDEE (Total Daily Energy Expenditure)</div>
      <div class="calorie-value">${tdee} <span>kal/hari</span></div>
    </div>
    <div class="calorie-stat">
      <div class="calorie-label">Target Kalori Harian (${goalText[goal]})</div>
      <div class="calorie-value">${targetCalories} <span>kal/hari</span></div>
    </div>
  `;
}

function displayMealPlan(mealPlan) {
  let html = '';
  let totalCalories = 0;

  const mealOrder = ['breakfast', 'lunch', 'dinner', 'snack'];

  mealOrder.forEach(mealType => {
    const items = mealPlan[mealType] || [];
    if (items.length === 0) return;

    const mealCalories = items.reduce((sum, item) => sum + item.calories, 0);
    totalCalories += mealCalories;

    html += `
      <div class="meal-category">
        <h3>
          <span class="meal-icon">${mealIcons[mealType]}</span>
          ${mealNames[mealType]}
        </h3>
        <div class="meal-items">
          ${items.map(item => `
            <div class="meal-item">
              <div class="meal-item-name">${item.name}</div>
              <div class="meal-item-details">
                <span class="meal-item-serving">${item.serving_size}</span>
                <span class="meal-item-calories">${item.calories} kal</span>
              </div>
              <div class="meal-item-macros">
                P: ${item.protein}g | K: ${item.carbs}g | L: ${item.fat}g
              </div>
            </div>
          `).join('')}
        </div>
        <div class="meal-total">Total: ${mealCalories} kalori</div>
      </div>
    `;
  });

  html += `
    <div style="margin-top: 24px; padding: 16px; background: linear-gradient(135deg, #e0f2e9 0%, #d0ebe2 100%); border-radius: 8px; text-align: center;">
      <div style="font-size: 0.9rem; color: #475569; margin-bottom: 4px;">Total Kalori Harian</div>
      <div style="font-size: 2rem; font-weight: 700; color: #15803d;">${totalCalories} <span style="font-size: 1rem; font-weight: 500;">kalori</span></div>
    </div>
  `;

  return html;
}

document.getElementById('user-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const gender = document.getElementById('gender').value;
  const age = parseInt(document.getElementById('age').value);
  const weight = parseFloat(document.getElementById('weight').value);
  const height = parseInt(document.getElementById('height').value);
  const activityLevel = document.getElementById('activity').value;
  const goal = document.getElementById('goal').value;

  const bmr = calculateBMR(gender, weight, height, age);
  const tdee = calculateTDEE(bmr, activityLevel);
  const targetCalories = calculateTargetCalories(tdee, goal);

  const foodItems = await getFoodItems();

  if (foodItems.length === 0) {
    alert('Database menu makanan masih kosong. Silakan tambahkan data terlebih dahulu.');
    return;
  }

  const mealPlan = selectMeals(foodItems, targetCalories);

  document.getElementById('calorie-info').innerHTML = displayCalorieInfo(bmr, tdee, targetCalories, goal);
  document.getElementById('meal-plan').innerHTML = displayMealPlan(mealPlan);

  document.getElementById('input-section').classList.add('hidden');
  document.getElementById('result-section').classList.remove('hidden');

  window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.getElementById('reset-btn').addEventListener('click', () => {
  document.getElementById('user-form').reset();
  document.getElementById('input-section').classList.remove('hidden');
  document.getElementById('result-section').classList.add('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
