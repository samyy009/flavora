/* home.js — Home page with real images and auth-aware interactions */

const DIET_CATEGORIES = [
  { icon:'⚡', label:'Quick & Easy', tag:'quick' },
  { icon:'🌿', label:'Vegan',        tag:'vegan' },
  { icon:'🥩', label:'Keto',         tag:'keto' },
  { icon:'🍰', label:'Desserts',     tag:'dessert' },
  { icon:'🍳', label:'Breakfast',    tag:'breakfast' },
  { icon:'🐟', label:'Seafood',      tag:'seafood' },
  { icon:'🌶️', label:'Spicy',        tag:'spicy' },
];

const DEMO_TRENDING = [
  { id:2, title:'Spring Harvest Buddha Bowl',     author_name:'Elena Rossi',  cook_time:'25 MINS', difficulty:'Beginner',     like_count:142, comment_count:18,  image_url:'images/buddha_bowl.png',  rating:4.8 },
  { id:3, title:'Midnight Pesto Genovese',        author_name:'Clara Vigne',  cook_time:'35 MINS', difficulty:'Intermediate', like_count:98,  comment_count:31,  image_url:'images/pesto_pasta.png',  rating:4.6 },
  { id:4, title:'Wood-Fired Neapolitan Pizza',    author_name:'Marcus Thorne',cook_time:'45 MINS', difficulty:'Intermediate', like_count:215, comment_count:42,  image_url:'images/pizza.png',        rating:4.9 },
];

const DEMO_TASTEMAKERS = [
  { id:1, name:'Clara Vigne',   role:'French Fusion',    initials:'CV', bg:'#3A1A2D' },
  { id:2, name:'Marcus Thorne', role:'Modern Nordic',    initials:'MT', bg:'#1A2535' },
  { id:3, name:'Elena Rossi',   role:'Plant-Based',      initials:'ER', bg:'#1A3A10' },
  { id:4, name:'Julien Blanc',  role:'Pastry Artistry',  initials:'JB', bg:'#2A1A35' },
];

document.addEventListener('DOMContentLoaded', () => {
  renderDietCategories();
  renderTastemakers();
  // Render demo immediately — no buffering
  const grid = document.getElementById('trending-grid');
  if (grid) grid.innerHTML = DEMO_TRENDING.map(r => buildRecipeCard(r)).join('');
  // Silently update from API in background
  loadTrending();
});

function renderDietCategories() {
  const container = document.getElementById('diet-categories');
  if (!container) return;
  container.innerHTML = DIET_CATEGORIES.map(d => `
    <div class="diet-cat" onclick="location.href='feed.html?diet=${d.tag}'">
      <span class="diet-icon">${d.icon}</span>
      <span>${d.label}</span>
    </div>
  `).join('');
}

async function loadTrending() {
  const grid = document.getElementById('trending-grid');
  if (!grid) return;

  let recipes = null;
  try {
    const data = await apiFetch('/recipes?limit=3&sort=trending');
    if (data && data.length) recipes = data;
  } catch(_) {}

  if (!recipes) recipes = DEMO_TRENDING;

  grid.innerHTML = recipes.map(r => buildRecipeCard(r)).join('');
}

function renderTastemakers() {
  const row = document.getElementById('tastemakers-row');
  if (!row) return;
  row.innerHTML = DEMO_TASTEMAKERS.map(tm => `
    <div class="tastemaker-item" onclick="location.href='profile.html?id=${tm.id}'">
      <div class="tastemaker-avatar" style="background:${tm.bg};color:#fff;font-size:1.2rem;font-weight:700">${tm.initials}</div>
      <div class="tastemaker-name">${tm.name}</div>
      <div class="tastemaker-role">${tm.role}</div>
    </div>
  `).join('');
}
