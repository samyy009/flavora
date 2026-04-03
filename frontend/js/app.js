/* ============================================================
   app.js — Global utilities for Flavora
   Auth, API, Toast, Share, Nav, Guards, Easter Egg
   ============================================================ */

const API_BASE = 'http://127.0.0.1:5000/api';
const UPLOAD_BASE = 'http://127.0.0.1:5000/uploads';

// ─── Auth ────────────────────────────────────────────────────
const Auth = {
  get user() { try { return JSON.parse(localStorage.getItem('ek_user')); } catch { return null; } },
  set user(v) { v ? localStorage.setItem('ek_user', JSON.stringify(v)) : localStorage.removeItem('ek_user'); },
  isLoggedIn() { return !!this.user; },
  logout() {
    localStorage.removeItem('ek_user');
    localStorage.removeItem('ek_likes');
    localStorage.removeItem('ek_bookmarks');
  },

  getLikes() {
    const u = this.user; if (!u) return new Set();
    return new Set(JSON.parse(localStorage.getItem(`ek_likes_${u.id}`) || '[]'));
  },
  addLike(id)    { const s=this.getLikes(); s.add(id);    this._saveLikes(s); },
  removeLike(id) { const s=this.getLikes(); s.delete(id); this._saveLikes(s); },
  hasLike(id)    { return this.getLikes().has(id); },
  _saveLikes(s)  { const u=this.user; if(u) localStorage.setItem(`ek_likes_${u.id}`, JSON.stringify([...s])); },

  getBookmarks() {
    const u = this.user; if (!u) return new Set();
    return new Set(JSON.parse(localStorage.getItem(`ek_bookmarks_${u.id}`) || '[]'));
  },
  addBookmark(id)    { const s=this.getBookmarks(); s.add(id);    this._saveBookmarks(s); },
  removeBookmark(id) { const s=this.getBookmarks(); s.delete(id); this._saveBookmarks(s); },
  hasBookmark(id)    { return this.getBookmarks().has(id); },
  _saveBookmarks(s)  { const u=this.user; if(u) localStorage.setItem(`ek_bookmarks_${u.id}`, JSON.stringify([...s])); },

  getFollows() {
    const u = this.user; if (!u) return new Set();
    return new Set(JSON.parse(localStorage.getItem(`ek_follows_${u.id}`) || '[]'));
  },
  toggleFollow(id) {
    const s = this.getFollows();
    s.has(id) ? s.delete(id) : s.add(id);
    const u = this.user; if(u) localStorage.setItem(`ek_follows_${u.id}`, JSON.stringify([...s]));
    return s.has(id);
  },
  isFollowing(id) { return this.getFollows().has(id); },

  getComments() {
    const u = this.user; if (!u) return {};
    return JSON.parse(localStorage.getItem(`ek_comments_${u.id}`) || '{}');
  },
  addComment(recipeId, text) {
    const u = this.user; if (!u) return;
    const c = this.getComments();
    if (!c[recipeId]) c[recipeId] = [];
    const comment = { id: Date.now(), text, author: u.name, avatar: (u.name||'U')[0].toUpperCase(), time: 'Just now' };
    c[recipeId].push(comment);
    localStorage.setItem(`ek_comments_${u.id}`, JSON.stringify(c));
    return comment;
  },

  // ── Auth Guard: redirects to login if not signed in ──────────
  // Call on protected pages (index, feed, upload, profile)
  requireLogin() {
    if (!this.isLoggedIn()) {
      localStorage.setItem('ek_return_to', location.pathname + location.search);
      location.replace('login.html');
      return false;
    }
    return true;
  }
};

// ─── API Fetch ───────────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500); // 2.5s timeout
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      signal: controller.signal,
      ...options
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`${res.status}`);
    return await res.json();
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      console.warn(`[API] ${endpoint} timed out after 5s — using demo data`);
    } else {
      console.warn(`[API] ${endpoint} failed:`, err.message);
    }
    return null;
  }
}

// ─── Toast ───────────────────────────────────────────────────
function showToast(msg, type = 'info', duration = 3000) {
  let wrap = document.getElementById('ek-toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'ek-toast-wrap';
    wrap.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px';
    document.body.appendChild(wrap);
  }
  const colors = { info:'#2D5016', success:'#3A7020', error:'#8A2020', warning:'#7A5A10' };
  const toast = document.createElement('div');
  toast.style.cssText = `background:${colors[type]||colors.info};color:#fff;padding:12px 18px;border-radius:10px;font-size:0.85rem;font-weight:500;box-shadow:0 4px 16px rgba(0,0,0,0.25);animation:slideIn 0.3s ease;max-width:320px;line-height:1.4`;
  toast.textContent = msg;
  wrap.appendChild(toast);
  setTimeout(() => { toast.style.opacity='0'; toast.style.transition='opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, duration);
}

// ─── Share Modal ─────────────────────────────────────────────
function openShareModal(title, url) {
  url   = url   || location.href;
  title = title || document.title;
  let modal = document.getElementById('ek-share-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'ek-share-modal';
    modal.innerHTML = `
      <div style="position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:1000;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.2s" onclick="closeShareModal()">
        <div style="background:var(--cream);border-radius:20px;padding:2rem;width:360px;max-width:90vw" onclick="event.stopPropagation()">
          <h3 style="font-family:var(--font-serif);font-size:1.2rem;margin-bottom:0.4rem">Share this Recipe</h3>
          <p id="share-modal-title" style="font-size:0.83rem;color:var(--text-muted);margin-bottom:1.5rem"></p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <button onclick="shareVia('whatsapp')" style="padding:12px;border-radius:12px;border:1.5px solid var(--border);background:transparent;cursor:pointer;font-size:0.85rem;font-weight:500;display:flex;align-items:center;gap:8px;justify-content:center;transition:all 0.2s" onmouseover="this.style.background='#DCF8C6'" onmouseout="this.style.background='transparent'">💬 WhatsApp</button>
            <button onclick="shareVia('twitter')"  style="padding:12px;border-radius:12px;border:1.5px solid var(--border);background:transparent;cursor:pointer;font-size:0.85rem;font-weight:500;display:flex;align-items:center;gap:8px;justify-content:center;transition:all 0.2s" onmouseover="this.style.background='#E8F5FE'" onmouseout="this.style.background='transparent'">🐦 Twitter</button>
            <button onclick="shareVia('facebook')" style="padding:12px;border-radius:12px;border:1.5px solid var(--border);background:transparent;cursor:pointer;font-size:0.85rem;font-weight:500;display:flex;align-items:center;gap:8px;justify-content:center;transition:all 0.2s" onmouseover="this.style.background='#E8F0FE'" onmouseout="this.style.background='transparent'">📘 Facebook</button>
            <button onclick="copyLink()" id="copy-link-btn" style="padding:12px;border-radius:12px;border:1.5px solid var(--border);background:transparent;cursor:pointer;font-size:0.85rem;font-weight:500;display:flex;align-items:center;gap:8px;justify-content:center;transition:all 0.2s">🔗 Copy Link</button>
          </div>
          <button onclick="closeShareModal()" style="width:100%;margin-top:1rem;padding:10px;border-radius:999px;border:1.5px solid var(--border);background:transparent;cursor:pointer;font-size:0.83rem;color:var(--text-muted)">Close</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }
  document.getElementById('share-modal-title').textContent = title;
  modal._shareUrl   = url;
  modal._shareTitle = title;
  modal.style.display = 'block';
}
function closeShareModal() { const m=document.getElementById('ek-share-modal'); if(m) m.style.display='none'; }
function shareVia(platform) {
  const m=document.getElementById('ek-share-modal');
  const url=m?._shareUrl||location.href, t=m?._shareTitle||document.title;
  const u=encodeURIComponent(url), tt=encodeURIComponent(t);
  const links = { whatsapp:`https://wa.me/?text=${tt}%20${u}`, twitter:`https://twitter.com/intent/tweet?url=${u}&text=${tt}`, facebook:`https://www.facebook.com/sharer/sharer.php?u=${u}` };
  if(links[platform]) window.open(links[platform],'_blank');
  closeShareModal();
}
function copyLink() {
  const m=document.getElementById('ek-share-modal');
  navigator.clipboard.writeText(m?._shareUrl||location.href).then(()=>{
    const btn=document.getElementById('copy-link-btn');
    btn.textContent='✓ Copied!'; btn.style.background='var(--green-pale)';
    setTimeout(()=>{btn.innerHTML='🔗 Copy Link'; btn.style.background='transparent';},2000);
  });
}

// ─── Shared recipe card helpers ───────────────────────────────
const IMAGES = {
  1:'images/braised_ribs.png', 2:'images/buddha_bowl.png',
  3:'images/pesto_pasta.png',  4:'images/pizza.png',
  5:'images/tomato_burrata.png', 6:'images/pesto_pasta.png',
  7:'images/hero_carrots.png'
};
const FALLBACK_EMOJI = ['🥗','🍝','🍕','🥘','🍖','🍣','🌿'];

function resolveImageSrc(recipe) {
  // 1. Explicit image_url (already full path)
  if (recipe.image_url) return recipe.image_url;
  // 2. Raw filename from DB — could be 'pizza.png' or 'images/pizza.png'
  if (recipe.image) {
    if (recipe.image.startsWith('http'))   return recipe.image;
    if (recipe.image.startsWith('images/')) return recipe.image;
    // Try static images folder first, then uploads
    return `images/${recipe.image}`;
  }
  // 3. ID-based static map (demo data)
  if (IMAGES[recipe.id]) return IMAGES[recipe.id];
  return null;
}

function recipeImgEl(recipe, height=200) {
  const src = resolveImageSrc(recipe);
  if (src) return `<img src="${src}" alt="${recipe.title||''}" style="width:100%;height:${height}px;object-fit:cover;display:block" onerror="this.parentElement.innerHTML=getFallbackEmoji(${recipe.id||1},${height})" />`;
  return getFallbackEmoji(recipe.id||1, height);
}

function getFallbackEmoji(id, height=200) {
  const emoji = FALLBACK_EMOJI[(id||1) % FALLBACK_EMOJI.length];
  const grads = ['#1A3A10,#3D8A20','#3A1A10,#8A4A20','#1A1A3A,#3A3A8A','#2A3A1A,#5A8A2A','#3A2A1A,#8A5A2A','#1A3A35,#2A8A7A'];
  const g = grads[(id||1) % grads.length];
  return `<div style="width:100%;height:${height}px;background:linear-gradient(135deg,${g});display:flex;align-items:center;justify-content:center;font-size:${Math.round(height/4)}px">${emoji}</div>`;
}

function buildRecipeCard(recipe) {
  const liked    = Auth.hasLike(recipe.id);
  const saved    = Auth.hasBookmark(recipe.id);
  const likes    = recipe.like_count    || recipe.likes    || 0;
  const comments = recipe.comment_count || recipe.comments || 0;
  return `
    <div class="recipe-card" onclick="location.href='recipe.html?id=${recipe.id}'" style="cursor:pointer">
      <div class="recipe-image" style="overflow:hidden;border-radius:var(--radius-md) var(--radius-md) 0 0;position:relative">
        ${recipeImgEl(recipe)}
        <div style="position:absolute;top:10px;right:10px;display:flex;gap:6px">
          <button class="icon-btn ${liked?'liked':''}" onclick="event.stopPropagation();toggleCardLike(this,${recipe.id})" title="Like">${liked?'❤️':'🤍'}</button>
          <button class="icon-btn ${saved?'saved':''}" onclick="event.stopPropagation();toggleCardSave(this,${recipe.id})" title="Save">${saved?'🔖':'🏷️'}</button>
        </div>
      </div>
      <div class="recipe-info">
        <div style="display:flex;gap:8px;margin-bottom:6px">
          ${recipe.cook_time ? `<span class="recipe-meta">${recipe.cook_time}</span>` : ''}
          ${recipe.difficulty ? `<span class="recipe-meta">${recipe.difficulty}</span>` : ''}
        </div>
        <h3 class="recipe-title">${recipe.title}</h3>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px">
          <div style="font-size:0.8rem;color:var(--text-muted)">${recipe.author_name||recipe.author||''}</div>
          <div style="display:flex;gap:12px;font-size:0.8rem;color:var(--text-muted)">
            <span>❤️ ${likes}</span><span>💬 ${comments}</span>
          </div>
        </div>
      </div>
    </div>`;
}

function toggleCardLike(btn, id) {
  if (!Auth.isLoggedIn()) { showToast('Sign in to like recipes ❤️','warning'); location.href='login.html'; return; }
  const liked = Auth.hasLike(id);
  if (liked) { Auth.removeLike(id);  btn.innerHTML='🤍'; btn.classList.remove('liked'); showToast('Removed from likes'); }
  else        { Auth.addLike(id);    btn.innerHTML='❤️'; btn.classList.add('liked');   showToast('Added ❤️','success'); btn.style.transform='scale(1.4)'; setTimeout(()=>btn.style.transform='',300); }
}
function toggleCardSave(btn, id) {
  if (!Auth.isLoggedIn()) { showToast('Sign in to save recipes','warning'); location.href='login.html'; return; }
  const saved = Auth.hasBookmark(id);
  if (saved) { Auth.removeBookmark(id); btn.innerHTML='🏷️'; btn.classList.remove('saved'); showToast('Removed from saved'); }
  else        { Auth.addBookmark(id);   btn.innerHTML='🔖'; btn.classList.add('saved');   showToast('Saved 🔖','success'); }
}

// ─── Rating Stars ─────────────────────────────────────────────
function renderStars(rating) {
  const f=Math.floor(rating||4); return '★'.repeat(f)+'☆'.repeat(5-f);
}

// ─── Admin Easter Egg — 5 clicks on Flavora logo → Admin ─────
let _logoClickCount = 0;
let _logoClickTimer = null;
function _handleLogoClick() {
  _logoClickCount++;
  clearTimeout(_logoClickTimer);
  if (_logoClickCount >= 5) {
    _logoClickCount = 0;
    showToast('🔧 Admin access granted!', 'success');
    setTimeout(() => location.href = 'admin.html', 500);
    return;
  }
  const remaining = 5 - _logoClickCount;
  if (_logoClickCount >= 2) showToast(`${remaining} more click${remaining>1?'s':''} for admin…`, 'info', 1500);
  _logoClickTimer = setTimeout(() => { _logoClickCount = 0; }, 3000);
}

// ─── Build Auth-aware Nav ─────────────────────────────────────
function buildNav() {
  const nav  = document.getElementById('nav-right-placeholder') || document.querySelector('.nav-right');
  const user = Auth.user;

  // Wire up LOGO easter egg (5 clicks → admin)
  const logoEl = document.querySelector('.nav-logo, .logo');
  if (logoEl) {
    logoEl.style.cursor = 'pointer';
    logoEl.addEventListener('click', _handleLogoClick);
  }

  // Search bar
  const searchHtml = `<div class="nav-search"><span class="icon">🔍</span><input type="search" placeholder="Search for flavors…" id="nav-search-input" onkeydown="if(event.key==='Enter')searchRecipes(this.value)" /></div>`;

  if (!user) {
    if (nav) nav.innerHTML = `${searchHtml}
      <a href="login.html" class="btn btn-outline btn-sm" style="padding:8px 20px;font-weight:600">Sign In</a>
      <a href="login.html" class="btn btn-primary btn-sm" style="padding:8px 20px;font-weight:600" onclick="setTimeout(()=>switchTab&&switchTab('register'),100)">Join</a>`;
  } else {
    const initials  = (user.name||'U').split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
    const adminLink = user.role==='admin'
      ? `<div class="nav-dropdown-item" onclick="location.href='admin.html'" style="color:#C44">🔧 Admin Panel</div>`
      : '';
    if (nav) nav.innerHTML = `${searchHtml}
      <div style="position:relative" id="nav-user-menu">
        <div class="nav-avatar" onclick="toggleUserMenu()" title="${user.name}" style="cursor:pointer">${initials}</div>
        <div id="user-dropdown" style="display:none;position:absolute;right:0;top:52px;background:var(--white);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow-md);min-width:210px;z-index:200;overflow:hidden">
          <div style="padding:14px 16px;border-bottom:1px solid var(--border-light)">
            <div style="font-weight:700;font-size:0.9rem">${user.name}</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">${user.email||''}</div>
            <div style="font-size:0.7rem;margin-top:2px;color:var(--green);font-weight:600;text-transform:uppercase;letter-spacing:0.05em">${user.role}</div>
          </div>
          <div class="nav-dropdown-item" onclick="location.href='index.html'">🏠 Home</div>
          <div class="nav-dropdown-item" onclick="location.href='feed.html'">📰 My Feed</div>
          <div class="nav-dropdown-item" onclick="location.href='profile.html'">👤 My Profile</div>
          <div class="nav-dropdown-item" onclick="location.href='profile.html?tab=bookmarks'">🔖 Saved Recipes</div>
          <div class="nav-dropdown-item" onclick="location.href='profile.html?tab=liked'">❤️ Liked Recipes</div>
          <div class="nav-dropdown-item" onclick="location.href='upload.html'">📤 Upload Recipe</div>
          <div class="nav-dropdown-item" onclick="location.href='tastemakers.html'">🌟 Tastemakers</div>
          ${adminLink}
          <div style="border-top:1px solid var(--border-light)">
            <div class="nav-dropdown-item" onclick="doSignOut()" style="color:#C44444">🚪 Sign Out</div>
          </div>
        </div>
      </div>`;

    document.querySelectorAll('.nav-dropdown-item').forEach(el => {
      el.style.cssText += 'padding:10px 16px;font-size:0.85rem;cursor:pointer;transition:background 0.15s';
      el.addEventListener('mouseover', () => el.style.background='var(--cream)');
      el.addEventListener('mouseout',  () => el.style.background='');
    });
  }

  // Close dropdown on outside click
  document.addEventListener('click', e => {
    const menu = document.getElementById('nav-user-menu');
    if (menu && !menu.contains(e.target)) hideUserMenu();
  });

  // Search handler
  document.getElementById('nav-search-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      location.href = `feed.html?q=${encodeURIComponent(e.target.value.trim())}`;
    }
  });
}

function toggleUserMenu() {
  const d = document.getElementById('user-dropdown');
  if (d) d.style.display = d.style.display==='none' ? 'block' : 'none';
}
function hideUserMenu() {
  const d = document.getElementById('user-dropdown');
  if (d) d.style.display = 'none';
}
function doSignOut() {
  Auth.logout();
  showToast('Signed out from Flavora 👋', 'info');
  setTimeout(() => location.href = 'login.html', 600);
}

// ─── Run on every page ────────────────────────────────────────
// Global search handler — usable from any page
function searchRecipes(q) {
  if (!q || !q.trim()) return;
  location.href = `feed.html?q=${encodeURIComponent(q.trim())}`;
}

document.addEventListener('DOMContentLoaded', () => {
  // Inject utility styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn { from { transform:translateX(100%); opacity:0; } to { transform:translateX(0); opacity:1; } }
    @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
    @keyframes spin    { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
    .icon-btn { width:34px;height:34px;border-radius:50%;border:none;background:rgba(255,255,255,0.85);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1rem;transition:transform 0.2s,background 0.2s;backdrop-filter:blur(4px); }
    .icon-btn:hover { transform:scale(1.15); background:white; }
    .icon-btn.liked,.icon-btn.saved { background:white; }
    .nav-dropdown-item { padding:10px 16px;font-size:0.85rem;cursor:pointer;transition:background 0.15s; }
    .nav-dropdown-item:hover { background:var(--cream,#F5F0E8); }
  `;
  document.head.appendChild(style);
  buildNav();
});
