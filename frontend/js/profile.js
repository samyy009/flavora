/* profile.js — User profile with tabs, follow, liked/saved views */

const DEMO_PROFILES = {
  1: { id:1, name:'Clara Vigne',   bio:'French Fusion Chef · 18K followers · Maison Vigne',     role:'tastemaker', recipes:162, followers:18600, following:42 },
  2: { id:2, name:'Marcus Thorne', bio:'Modern Nordic cuisine innovator · 32.8K followers',     role:'tastemaker', recipes:90,  followers:32800, following:18 },
  3: { id:3, name:'Elena Rossi',   bio:'Plant-Based food artist · 52K followers',               role:'tastemaker', recipes:210, followers:52000, following:63 },
  4: { id:4, name:'Julien Blanc',  bio:'Pastry Artistry · Confection & precision',              role:'tastemaker', recipes:78,  followers:13600, following:29 },
  5: { id:5, name:'Sameer',        bio:'Home cook & food explorer. Learning every day.',        role:'user',       recipes:13,  followers:482,   following:29 },
};

const DEMO_USER_RECIPES = [
  { id:1, title:'Braised Short Ribs', author_name:'Elena', cook_time:'3.5h', difficulty:'Intermediate', like_count:342, comment_count:142, image_url:'images/braised_ribs.png' },
  { id:2, title:'Spring Buddha Bowl', author_name:'Elena', cook_time:'25min', difficulty:'Beginner',    like_count:142, comment_count:18,  image_url:'images/buddha_bowl.png' },
  { id:3, title:'Pesto Genovese',     author_name:'Clara', cook_time:'35min', difficulty:'Intermediate', like_count:98, comment_count:31,  image_url:'images/pesto_pasta.png' },
  { id:4, title:'Neapolitan Pizza',   author_name:'Marcus',cook_time:'45min', difficulty:'Intermediate', like_count:215, comment_count:42, image_url:'images/pizza.png' },
  { id:5, title:'Tomato Burrata',     author_name:'Julian',cook_time:'20min', difficulty:'Beginner',     like_count:124, comment_count:9,  image_url:'images/tomato_burrata.png' },
  { id:7, title:'Spring Risotto',     author_name:'Elena', cook_time:'40min', difficulty:'Intermediate', like_count:203, comment_count:27, image_url:'images/hero_carrots.png' },
];

let profileUser = null;
let isSelf = false;

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(location.search);
  const id  = parseInt(params.get('id')) || null;
  const tab = params.get('tab') || 'recipes';
  await loadProfile(id);
  switchTab(tab);
});

async function loadProfile(id) {
  const authUser = Auth.user;

  // Determine which profile to show
  if (!id && authUser) {
    profileUser = authUser;
    isSelf = true;
    // Fetch fresh stats from API
    try {
      const fresh = await apiFetch(`/users/${authUser.id}`);
      if (fresh) profileUser = { ...profileUser, ...fresh };
    } catch(_) {}
  } else if (id) {
    try { profileUser = await apiFetch(`/users/${id}`); } catch(_) {}
    if (!profileUser) profileUser = DEMO_PROFILES[id] || DEMO_PROFILES[5];
    isSelf = authUser && authUser.id === id;
  } else {
    location.href = 'login.html';
    return;
  }

  renderHeader(profileUser);
  // Pre-load recipes
  profileUser.recipes_list = await loadUserRecipes(profileUser.id);
}

async function loadUserRecipes(userId) {
  try {
    const recipes = await apiFetch(`/recipes?user_id=${userId}`);
    return recipes || [];
  } catch(_) {
    return DEMO_USER_RECIPES.filter(r => r.author_id === userId);
  }
}

function renderHeader(u) {
  const el = document.getElementById('profile-header');
  if (!el) return;
  const initials = (u.name||'U').split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
  const isFollowing = Auth.isFollowing(u.id);

  el.innerHTML = `
    <div class="profile-header-inner">
      <div class="profile-avatar" style="background:var(--green);color:#fff">${initials}</div>
      <div class="profile-info">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:6px">
          <h1 style="font-size:1.6rem;font-family:var(--font-serif)">${u.name||'Chef'}</h1>
          ${u.role==='tastemaker'?`<span class="badge badge-green">✦ Tastemaker</span>`:''}
          ${u.role==='admin'?`<span style="background:rgba(194,68,68,0.1);color:#C44;border:1px solid rgba(194,68,68,0.3);border-radius:999px;padding:2px 12px;font-size:0.72rem;font-weight:700">Admin</span>`:''}
        </div>
        <p style="color:var(--text-muted);font-size:0.88rem;margin-bottom:1rem">${u.bio||''}</p>
        <div class="profile-stats">
          <div class="stat-item"><span class="stat-num">${(u.recipes||0).toLocaleString()}</span><span class="stat-label">Recipes</span></div>
          <div class="stat-item"><span class="stat-num">${(u.followers||0).toLocaleString()}</span><span class="stat-label">Followers</span></div>
          <div class="stat-item"><span class="stat-num">${(u.following||0).toLocaleString()}</span><span class="stat-label">Following</span></div>
          ${isSelf ? `<div class="stat-item"><span class="stat-num">${Auth.getLikes().size}</span><span class="stat-label">Liked</span></div>` : ''}
          ${isSelf ? `<div class="stat-item"><span class="stat-num">${Auth.getBookmarks().size}</span><span class="stat-label">Saved</span></div>` : ''}
        </div>
        <div class="profile-actions">
          ${isSelf
            ? `<button class="btn btn-primary" onclick="location.href='upload.html'">📤 New Recipe</button>
               <button class="btn btn-outline" onclick="editProfile()">✏️ Edit Profile</button>
               ${Auth.user?.role==='admin'?`<button class="btn btn-outline" onclick="location.href='admin.html'">🔧 Admin Panel</button>`:''}`
            : `<button class="btn btn-primary follow-toggle-btn ${isFollowing?'following':''}" id="follow-btn" onclick="handleFollow(${u.id})">
                 ${isFollowing ? '✓ Following' : '+ Follow'}
               </button>
               <button class="btn btn-outline" onclick="openShareModal('${u.name} on Flavora','${location.href}')">🔗 Share</button>`
          }
        </div>
      </div>
    </div>`;
}

function handleFollow(id) {
  if (!Auth.isLoggedIn()) { showToast('Sign in to follow', 'warning'); location.href='login.html'; return; }
  const now = Auth.toggleFollow(id);
  const btn = document.getElementById('follow-btn');
  if (btn) {
    btn.textContent = now ? '✓ Following' : '+ Follow';
    btn.classList.toggle('following', now);
  }
  showToast(now ? `Following ${profileUser?.name||'Chef'} 🎉` : 'Unfollowed', now?'success':'info');
}

function editProfile() {
  const u = profileUser || Auth.user;
  document.getElementById('edit-name').value  = u.name || '';
  document.getElementById('edit-bio').value   = u.bio || '';
  document.getElementById('edit-phone').value = u.phone || '';
  document.getElementById('edit-profile-modal').style.display = 'flex';
}

function closeEditModal() {
  document.getElementById('edit-profile-modal').style.display = 'none';
}

async function saveProfile() {
  const name  = document.getElementById('edit-name').value.trim();
  const bio   = document.getElementById('edit-bio').value.trim();
  const phone = document.getElementById('edit-phone').value.trim();
  const btn   = document.getElementById('save-profile-btn');

  if (!name) { showToast('Name is required', 'warning'); return; }

  btn.disabled = true; btn.textContent = 'Saving…';
  try {
    const res = await apiFetch('/users/me', {
      method: 'PATCH',
      body: JSON.stringify({ name, bio, phone })
    });
    
    if (res && res.id) {
      // 1. Update Auth state and LocalStorage
      Auth.user = { ...Auth.user, ...res };
      localStorage.setItem('ek_user', JSON.stringify(Auth.user));
      
      // 2. Update current profile view
      profileUser = { ...profileUser, ...res };
      renderHeader(profileUser);
      if (typeof buildNav === 'function') buildNav(); // Refresh global nav
      
      closeEditModal();
      showToast('Profile updated! ✨', 'success');
    } else {
      showToast('Failed to save changes.', 'error');
    }
  } catch (err) {
    showToast('Connection error.', 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Save Changes';
  }
}

// ── Tabs ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.profile-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
});

function switchTab(name) {
  document.querySelectorAll('.profile-tab').forEach(t => t.classList.toggle('active', t.dataset.tab===name));
  const grid = document.getElementById('recipe-grid');
  if (!grid) return;
  grid.innerHTML = '';

  let recipes = [];
  if (name === 'recipes') {
    recipes = DEMO_USER_RECIPES.slice(0, 6);
  } else if (name === 'bookmarks') {
    if (!Auth.isLoggedIn()) { grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted)"><p>Sign in to see your saved recipes 🔖</p><a href="login.html" class="btn btn-primary" style="margin-top:1rem;display:inline-block">Sign In</a></div>'; return; }
    const saved = Auth.getBookmarks();
    recipes = DEMO_USER_RECIPES.filter(r => saved.has(r.id));
  } else if (name === 'liked') {
    if (!Auth.isLoggedIn()) { grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted)"><p>Sign in to see your liked recipes ❤️</p><a href="login.html" class="btn btn-primary" style="margin-top:1rem;display:inline-block">Sign In</a></div>'; return; }
    const liked = Auth.getLikes();
    recipes = DEMO_USER_RECIPES.filter(r => liked.has(r.id));
  }

  if (!recipes.length) {
    const labels = { recipes:'recipes yet', bookmarks:'saved recipes yet', liked:'liked recipes yet' };
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted)">
      <div style="font-size:3rem;margin-bottom:1rem">${name==='liked'?'❤️':name==='bookmarks'?'🔖':'🍽️'}</div>
      <p>No ${labels[name]||'recipes'}.</p>
      ${name==='recipes'?`<a href="upload.html" class="btn btn-primary" style="margin-top:1rem;display:inline-block">Upload First Recipe</a>`:`<a href="feed.html" class="btn btn-outline" style="margin-top:1rem;display:inline-block">Explore Recipes</a>`}
    </div>`;
    return;
  }

  grid.innerHTML = recipes.map(r => buildRecipeCard(r)).join('');
}

