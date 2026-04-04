/* recipe.js — Recipe detail with real images, auth-gated interactions, comments */

const DEMO_RECIPE = {
  id: 1,
  title: 'Braised Short Ribs with Saffron Risotto',
  tags: ['Classic Italian', 'Seasonal'],
  cook_time: '3.5 Hours', difficulty: 'Intermediate', servings: 4,
  image_url: 'images/braised_ribs.png',
  author_name: 'Elena Rossi', author_handle: '@elenarossi',
  author_bio: '"The secret to great braised ribs is in the patience — and the quality of the wine."',
  like_count: 342, comment_count: 142,
  ingredients: [
    '2.5 kg Bone-in Short Ribs', '750ml Robust Red Wine (Chianti)',
    '4 cups Housemade Beef Stock', '2 Carrots, 1 Onion, 2 Celery Stalks',
    '4 cloves Garlic, crushed', '2 tbsp Tomato Paste',
    '1 tsp Saffron Threads', '1 cup Arborio Rice',
    '½ cup Dry White Wine', 'Aged Parmigiano-Reggiano',
    'Fresh Thyme & Rosemary', 'Sea Salt & Cracked Pepper'
  ],
  steps: [
    { title: 'Searing the Meat', text: 'Generously season the short rib with sea salt and cracked pepper. In a heavy-bottomed Dutch oven, heat olive oil over medium-high heat. Sear the ribs on all sides until a deep, mahogany crust develops. Remove and set aside.' },
    { title: 'The Mirepoix & Braise', text: 'Add finely diced onion, celery, and carrot to the same pot. Sauté until translucent. Deglaze with the red wine, scraping the flavor-full bits from the bottom. Return the ribs, add stock until half-submerged, and simmer low for 3 hours.' },
    { title: 'Saffron Infusion', text: 'While the beef braises, bloom your saffron in a small bowl of warm water. This releases the essential oils and develops that signature golden hue. Start your risotto base with toasted arborio rice and shallots.' },
    { title: 'Final Assembly', text: 'Fold the risotto with cold butter and a mountain of Parmigiano-Reggiano. Plate a generous scoop of risotto, nestle the tender short rib on top, and finish with a reduction of the braising liquid.' },
  ],
  comments: [
    { id: 1, author: 'Sofia K.', initials: 'SK', avatar_bg: '#5A2E8A', text: 'The saffron tip is golden! I bloomed it in chicken stock — incredible depth.', time: '2h ago', likes: 12 },
    { id: 2, author: 'Liam Gao', initials: 'LG', avatar_bg: '#2E5A8A', text: 'Made this last Sunday. The braise took 4 hours but so worth it. My family was speechless.', time: '5h ago', likes: 8 },
    { id: 3, author: 'Nadia S.', initials: 'NS', avatar_bg: '#2E8A5A', text: 'Any substitute for Chianti? I have a nice Burgundy.', time: '8h ago', likes: 3 },
    { id: 4, author: 'Marcus T.', initials: 'MT', avatar_bg: '#8A5A2E', text: 'I teach this in my course now. Absolute classic — students love the flavour bomb.', time: '1d ago', likes: 22 },
  ]
};

const DEMO_RELATED = [
  { id: 3, title: 'Midnight Pesto Genovese', author_name: 'Clara Vigne', cook_time: '35 MINS', difficulty: 'Intermediate', like_count: 98, comment_count: 31, image_url: 'images/pesto_pasta.png' },
  { id: 2, title: 'Spring Harvest Buddha Bowl', author_name: 'Elena Rossi', cook_time: '25 MINS', difficulty: 'Beginner', like_count: 142, comment_count: 18, image_url: 'images/buddha_bowl.png' },
  { id: 4, title: 'Wood-Fired Neapolitan Pizza', author_name: 'Marcus Thorne', cook_time: '45 MINS', difficulty: 'Intermediate', like_count: 215, comment_count: 42, image_url: 'images/pizza.png' },
];

let currentRecipe = null;

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(location.search);
  const id = parseInt(params.get('id')) || 1;
  await loadRecipe(id);
});

async function loadRecipe(id) {
  // 1. Render demo data IMMEDIATELY — no waiting, no buffering
  const demoMatch = id === DEMO_RECIPE.id
    ? DEMO_RECIPE
    : { ...DEMO_RECIPE, ...(DEMO_RELATED.find(r => r.id === id) || {}), id };
  currentRecipe = demoMatch;
  renderHero(demoMatch);
  renderIngredients(demoMatch);
  renderSteps(demoMatch);
  renderComments(demoMatch);
  loadRelated(id);

  // 2. Silently fetch real data from API and update if available
  try {
    const real = await apiFetch(`/recipes/${id}`);
    if (real && real.id) {
      currentRecipe = real;
      renderHero(real);
      renderIngredients(real);
      renderSteps(real);
      renderComments(real);
    }
  } catch (_) { }
}

function renderHero(recipe) {
  const heroEl = document.getElementById('recipe-hero');
  if (!heroEl) return;
  const liked = Auth.hasLike(recipe.id);
  const saved = Auth.hasBookmark(recipe.id);
  const likes = recipe.like_count || 0;

  let tagsObj = recipe.tags || [];
  if (typeof tagsObj === 'string') {
    tagsObj = tagsObj.split(',').map(t => t.trim()).filter(Boolean);
  }

  heroEl.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:3rem;padding:2rem 0;align-items:start">
      <div>
        <div style="display:flex;gap:8px;margin-bottom:1rem;flex-wrap:wrap">
          ${tagsObj.map(t => `<span style="padding:4px 14px;border-radius:999px;background:var(--green-pale);color:var(--green);font-size:0.72rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase">${t}</span>`).join('')}
        </div>
        <h1 style="font-family:var(--font-serif);font-size:clamp(1.8rem,3.5vw,2.6rem);line-height:1.15;margin-bottom:1.2rem">${recipe.title}</h1>
        <div style="display:flex;gap:2rem;padding:1rem 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border);margin-bottom:1.2rem;flex-wrap:wrap">
          <div><div style="font-size:0.68rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-muted)">⏱ Cook Time</div><div style="font-weight:600;margin-top:2px">${recipe.cook_time || '—'}</div></div>
          <div><div style="font-size:0.68rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-muted)">📊 Difficulty</div><div style="font-weight:600;margin-top:2px">${recipe.difficulty || '—'}</div></div>
          <div><div style="font-size:0.68rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-muted)">👥 Serves</div><div style="font-weight:600;margin-top:2px">${recipe.servings || 4}</div></div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="window.scrollTo({top:document.getElementById('method').offsetTop-30,behavior:'smooth'})">▶ Start Cooking</button>
          <button id="hero-like-btn" onclick="handleHeroLike(${recipe.id})" style="display:flex;align-items:center;gap:6px;padding:10px 18px;border-radius:999px;border:1.5px solid ${liked ? '#E05050' : ' var(--border)'};background:${liked ? '#FFF0F0' : 'transparent'};color:${liked ? '#E05050' : 'var(--charcoal-mid)'};font-size:0.88rem;font-weight:600;cursor:pointer;transition:all 0.2s">
            ${liked ? '❤️' : '🤍'} <span id="hero-like-count">${likes}</span>
          </button>
          <button id="hero-save-btn" onclick="handleHeroSave(${recipe.id})" style="padding:10px 18px;border-radius:999px;border:1.5px solid ${saved ? 'var(--green)' : ' var(--border)'};background:${saved ? 'var(--green-pale)' : 'transparent'};color:${saved ? 'var(--green)' : 'var(--charcoal-mid)'};font-size:0.88rem;font-weight:600;cursor:pointer;transition:all 0.2s">
            ${saved ? '🔖' : '🏷️'}
          </button>
          <button onclick="openShareModal('${recipe.title.replace(/'/g, "\\'")}','${location.href}')" style="padding:10px 18px;border-radius:999px;border:1.5px solid var(--border);background:transparent;color:var(--charcoal-mid);font-size:0.88rem;font-weight:600;cursor:pointer">🔗</button>
        </div>
      </div>
      <div style="border-radius:var(--radius-xl);overflow:hidden;position:relative">
        ${recipe.image_url
      ? `<img src="${recipe.image_url}" alt="${recipe.title}" style="width:100%;aspect-ratio:4/3;object-fit:cover;display:block;border-radius:var(--radius-xl)" />`
      : `<div style="width:100%;aspect-ratio:4/3;background:linear-gradient(135deg,#1A2D10,#2D5016,#3D7020);border-radius:var(--radius-xl);display:flex;align-items:center;justify-content:center;font-size:8rem">🍖</div>`}
        <div style="margin-top:1rem;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-md);padding:1rem 1.2rem">
          <p style="font-family:var(--font-serif);font-style:italic;font-size:0.88rem;color:var(--charcoal-mid);line-height:1.6">${recipe.author_bio || ''}</p>
          <div style="display:flex;align-items:center;gap:10px;margin-top:10px;cursor:pointer" onclick="location.href='profile.html?id=${recipe.author_id || 1}'">
            <div style="width:36px;height:36px;border-radius:50%;background:var(--green);color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center">${(recipe.author_name || 'Chef').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}</div>
            <div><div style="font-weight:600;font-size:0.85rem">${recipe.author_name || 'Chef'}</div><div style="font-size:0.72rem;color:var(--text-muted)">${recipe.author_handle || '@chef'} · ${recipe.recipe_count || recipe.recipes || 0} Recipes</div></div>
          </div>
        </div>
      </div>
    </div>`;

  // Update comment count badge
  const badge = document.getElementById('comment-count-badge');
  if (badge) badge.textContent = recipe.comment_count || (recipe.comments || []).length || 0;
}

function renderIngredients(recipe) {
  const list = document.getElementById('ingredients-list');
  if (!list) return;
  const items = recipe.ingredients || [];
  list.innerHTML = items.map(i => `
    <li class="ingredient-item">
      <span class="ingredient-bullet">●</span>
      <span>${i}</span>
    </li>`).join('');
}

function renderSteps(recipe) {
  const list = document.getElementById('steps-list');
  if (!list) return;
  const steps = recipe.steps || [];
  list.innerHTML = steps.map((s, i) => `
    <div class="step-item">
      <div class="step-number">${String(i + 1).padStart(2, '0')}</div>
      <div>
        <h4 style="font-family:var(--font-serif);font-size:1rem;margin-bottom:6px">${s.title || s}</h4>
        <p style="font-size:0.88rem;color:var(--charcoal-mid);line-height:1.7">${s.text || ''}</p>
      </div>
    </div>`).join('');
}

function renderComments(recipe) {
  const container = document.getElementById('community-comments');
  if (!container) return;
  // Merge demo + user-added comments
  const stored = Auth.user ? (Auth.getComments()[recipe.id] || []) : [];
  const all = [...(recipe.comments || []), ...stored];
  container.innerHTML = all.map(c => buildDetailComment(c)).join('');
}

function buildDetailComment(c) {
  const initials = (c.author || 'U').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  return `
    <div style="display:flex;gap:12px;padding:1rem 0;border-bottom:1px solid var(--border-light)">
      <div style="width:40px;height:40px;border-radius:50%;background:${c.avatar_bg || 'var(--green)'};color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">${c.initials || initials}</div>
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <span style="font-weight:600;font-size:0.88rem">${c.author || 'User'}</span>
          <span style="font-size:0.75rem;color:var(--text-muted)">${c.time || 'Just now'}</span>
          ${c.likes ? `<span style="margin-left:auto;font-size:0.78rem;color:var(--text-muted)">❤️ ${c.likes}</span>` : ''}
        </div>
        <p style="font-size:0.85rem;line-height:1.6;margin-top:5px;color:var(--charcoal)">${c.text || c.content || ''}</p>
      </div>
    </div>`;
}

function postRecipeComment() {
  if (!Auth.isLoggedIn()) { showToast('Sign in to comment 💬', 'warning'); location.href = 'login.html'; return; }
  const input = document.getElementById('recipe-comment-input');
  const text = input?.value?.trim();
  if (!text) { showToast('Write something first!', 'warning'); return; }
  const id = currentRecipe?.id || 1;
  const comment = Auth.addComment(id, text);
  const container = document.getElementById('community-comments');
  container?.insertAdjacentHTML('beforeend', buildDetailComment(comment));
  input.value = '';
  showToast('Comment posted! 💬', 'success');
  // Scroll to it
  container?.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function handleHeroLike(id) {
  if (!Auth.isLoggedIn()) { showToast('Sign in to like recipes ❤️', 'warning'); location.href = 'login.html'; return; }
  const liked = Auth.hasLike(id);
  const btn = document.getElementById('hero-like-btn');
  const countEl = document.getElementById('hero-like-count');
  const current = parseInt(countEl?.textContent || '0');
  if (liked) {
    Auth.removeLike(id);
    btn.innerHTML = `🤍 <span id="hero-like-count">${current - 1}</span>`;
    btn.style.background = 'transparent'; btn.style.borderColor = 'var(--border)'; btn.style.color = 'var(--charcoal-mid)';
  } else {
    Auth.addLike(id);
    btn.innerHTML = `❤️ <span id="hero-like-count">${current + 1}</span>`;
    btn.style.background = '#FFF0F0'; btn.style.borderColor = '#E05050'; btn.style.color = '#E05050';
    btn.style.transform = 'scale(1.1)'; setTimeout(() => btn.style.transform = '', 200);
    showToast('Recipe liked! ❤️', 'success');
  }
}

function handleHeroSave(id) {
  if (!Auth.isLoggedIn()) { showToast('Sign in to save recipes 🔖', 'warning'); location.href = 'login.html'; return; }
  const saved = Auth.hasBookmark(id);
  const btn = document.getElementById('hero-save-btn');
  if (saved) {
    Auth.removeBookmark(id);
    btn.innerHTML = '🏷️'; btn.style.background = 'transparent'; btn.style.borderColor = 'var(--border)'; btn.style.color = 'var(--charcoal-mid)';
    showToast('Removed from saved');
  } else {
    Auth.addBookmark(id);
    btn.innerHTML = '🔖'; btn.style.background = 'var(--green-pale)'; btn.style.borderColor = 'var(--green)'; btn.style.color = 'var(--green)';
    showToast('Saved to your collection 🔖', 'success');
  }
}

async function loadRelated(currentId) {
  const grid = document.getElementById('more-recipes');
  if (!grid) return;
  let data = null;
  try { data = await apiFetch(`/recipes?exclude=${currentId}&limit=3`); } catch (_) { }
  if (!data || !data.length) data = DEMO_RELATED.filter(r => r.id !== currentId).slice(0, 3);
  grid.innerHTML = data.map(r => buildRecipeCard(r)).join('');
}
