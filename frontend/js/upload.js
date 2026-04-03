/* upload.js — 4-step upload wizard with auth guard */

let currentStep = 1;
const totalSteps = 4;
let ingredientCount = 0;
let stepCount = 0;

document.addEventListener('DOMContentLoaded', () => {
  // Auth guard — soft (show toast, not hard redirect)
  if (!Auth.isLoggedIn()) {
    showToast('Sign in to share your recipes!', 'warning');
  }

  // Show step 1
  showStep(1);

  // Seed ingredient and step rows
  addIngredient(); addIngredient(); addIngredient();
  addStep(); addStep();

  // Cover image zone
  const coverZone = document.getElementById('cover-zone');
  const coverInput = document.getElementById('cover-input');
  if (coverZone && coverInput) {
    coverZone.addEventListener('click', () => coverInput.click());
    coverInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        coverZone.style.backgroundImage  = `url(${ev.target.result})`;
        coverZone.style.backgroundSize   = 'cover';
        coverZone.style.backgroundPosition = 'center';
        coverZone.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.35);color:#fff;font-size:0.85rem;font-weight:600;border-radius:inherit">✓ Cover set — click to change</div>';
      };
      reader.readAsDataURL(file);
    });
  }

  // Tag toggle
  document.querySelectorAll('.upload-tag').forEach(btn => {
    btn.addEventListener('click', () => btn.classList.toggle('active'));
  });
});

// ── Wizard Navigation ─────────────────────────────────────────
function showStep(n) {
  currentStep = Math.max(1, Math.min(n, totalSteps));
  for (let i = 1; i <= totalSteps; i++) {
    const el  = document.getElementById(`step-${i}`);
    const nav = document.querySelector(`[data-step="${i}"]`);
    if (el)  el.classList.toggle('active', i === currentStep);
    if (nav) {
      nav.classList.toggle('active', i === currentStep);
      nav.classList.toggle('done',   i < currentStep);
    }
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.nextStep = () => showStep(currentStep + 1);
window.prevStep = () => showStep(currentStep - 1);
window.goToStep = (n) => { if (n <= currentStep) showStep(n); };

// ── Ingredients ───────────────────────────────────────────────
window.addIngredient = function() {
  const list = document.getElementById('ingredients-list-upload');
  if (!list) return;
  ingredientCount++;
  const row = document.createElement('div');
  row.className = 'ingredient-row';
  row.id = `ingredient-row-${ingredientCount}`;
  row.innerHTML = `
    <input class="form-input" style="width:80px" placeholder="Amount" id="ing-amount-${ingredientCount}" />
    <select class="form-select" style="width:90px" id="ing-unit-${ingredientCount}">
      <option>g</option><option>ml</option><option>tsp</option><option>tbsp</option>
      <option>cup</option><option>piece</option><option>slice</option><option>bunch</option>
    </select>
    <input class="form-input" style="flex:1" placeholder="Ingredient name (e.g. Unsalted Butter)" id="ing-name-${ingredientCount}" />
    <button onclick="removeRow('ingredient-row-${ingredientCount}')" style="padding:8px;border-radius:8px;border:none;background:var(--cream-dark);color:var(--text-muted);cursor:pointer;font-size:1rem;flex-shrink:0">✕</button>`;
  list.appendChild(row);
};

// ── Steps ─────────────────────────────────────────────────────
window.addStep = function() {
  const list = document.getElementById('steps-list-upload');
  if (!list) return;
  stepCount++;
  const row = document.createElement('div');
  row.className = 'step-row';
  row.id = `step-row-${stepCount}`;
  row.style.alignItems = 'flex-start';
  row.innerHTML = `
    <div class="step-num-badge">${stepCount}</div>
    <textarea class="form-textarea" style="flex:1;min-height:80px" placeholder="Describe step ${stepCount} in detail…" id="step-text-${stepCount}"></textarea>
    <button onclick="removeRow('step-row-${stepCount}')" style="padding:8px;border-radius:8px;border:none;background:var(--cream-dark);color:var(--text-muted);cursor:pointer;font-size:1rem;flex-shrink:0;margin-top:4px">✕</button>`;
  list.appendChild(row);
};

window.removeRow = function(id) {
  document.getElementById(id)?.remove();
};

// ── Draft Save ────────────────────────────────────────────────
window.saveDraft = function() {
  const draft = collectFormData();
  localStorage.setItem('ek_draft', JSON.stringify(draft));
  showToast('Draft saved! You can return to it anytime 📝', 'success');
};

// ── Publish ───────────────────────────────────────────────────
window.publishRecipe = async function() {
  if (!Auth.isLoggedIn()) {
    showToast('Please sign in to publish your creation 👨‍🍳', 'warning');
    location.href = 'login.html'; return;
  }
  const btn = document.getElementById('publish-btn');
  const originalText = btn.textContent;
  btn.disabled = true; btn.textContent = 'Publishing to Flavora…';

  const data = collectFormData();
  if (!data.title) { 
    showToast('Please add a title in Step 1', 'warning'); 
    btn.disabled=false; btn.textContent=originalText; 
    showStep(1); return; 
  }

  try {
    const result = await apiFetch('/recipes', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (result) {
      showToast('Recipe published! 🎉 Welcome to the collective.', 'success');
      localStorage.removeItem('ek_draft');
      setTimeout(() => location.href = 'profile.html', 1200);
    } else {
      throw new Error('Failed to publish');
    }
  } catch(err) {
    console.error('Publish failed:', err);
    showToast('Publish failed. Please try again or check your connection.', 'error');
    btn.disabled = false; btn.textContent = originalText;
  }
};

// ── Collect form data ─────────────────────────────────────────
function collectFormData() {
  const tags = [...document.querySelectorAll('.upload-tag.active')].map(b=>b.dataset.tag).filter(Boolean);
  const ingredients = [];
  document.querySelectorAll('[id^="ing-name-"]').forEach((el,i) => {
    const num = el.id.split('-').pop();
    const name = el.value.trim();
    if (name) ingredients.push({ amount: document.getElementById(`ing-amount-${num}`)?.value||'', unit: document.getElementById(`ing-unit-${num}`)?.value||'', name });
  });
  const steps = [];
  document.querySelectorAll('[id^="step-text-"]').forEach(el => {
    if (el.value.trim()) steps.push(el.value.trim());
  });
  return {
    title:       document.getElementById('recipe-title')?.value.trim() || '',
    description: document.getElementById('recipe-story')?.value.trim() || '',
    cook_time:   document.getElementById('recipe-time')?.value || '',
    difficulty:  document.getElementById('recipe-difficulty')?.value || '',
    servings:    document.getElementById('recipe-servings')?.value || 4,
    tags, ingredients, steps
  };
}
