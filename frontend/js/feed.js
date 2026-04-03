/* feed.js — Social feed with personalized auth state, real images, comments */

const DEMO_POSTS = [
  {
    id: 1, author:'Julian Marc', authorInitials:'JM', subtitle:'Harvest Collective · 2h ago',
    badge:'FARM TO TABLE', image:'images/tomato_burrata.png',
    caption:'The secret to these heirloom tomatoes is the temperature. Never refrigerate. Served with a handmade burrata and a touch of smoked sea salt.',
    hashtags:'#HeirloomSummer #CulinaryArt',
    likes:48, saves:12, comments:[
      { author:'Sofia K.',  initials:'SK', text:'This looks divine! What burrata brand?' , time:'1h ago' },
      { author:'Liam Gao',  initials:'LG', text:'The colours are incredible 🍅',            time:'45m ago' },
    ]
  },
  {
    id: 2, author:'Elena Rossi', authorInitials:'ER', subtitle:'Plant-Based Kitchen · 5h ago',
    badge:'PLANT-BASED', image:'images/buddha_bowl.png',
    caption:'My spring harvest bowl is all about contrasts — warm and cold, creamy and crunchy, earthy and bright. Simple produce, infinite possibility.',
    hashtags:'#PlantBased #SpringEats #BowlFood',
    likes:134, saves:56, comments:[
      { author:'Nadia S.', initials:'NS', text:'Adding this to this week\'s meal prep!', time:'4h ago' },
      { author:'Marcus T.',initials:'MT', text:'The tahini drizzle is everything 🙌',     time:'3h ago' },
    ]
  },
  {
    id: 4, author:'Marcus Thorne', authorInitials:'MT', subtitle:'Nordic Table · 8h ago',
    badge:'WOOD-FIRED', image:'images/pizza.png',
    caption:'Our wood-fired setup reaches 480°C. That char, that leopard crust — it can only come from true Neapolitan tradition. The dough rests 72 hours.',
    hashtags:'#WoodFired #Neapolitan #PizzaLife',
    likes:215, saves:89, comments:[
      { author:'Julian M.', initials:'JM', text:'72 hours! The patience of a true artisan.', time:'7h ago' },
      { author:'Clara V.',  initials:'CV', text:'I can almost smell this 🔥',                time:'6h ago' },
    ]
  },
  {
    id: 3, author:'Clara Vigne', authorInitials:'CV', subtitle:'Maison Vigne · 1d ago',
    badge:'CLASSIC ITALIAN', image:'images/pesto_pasta.png',
    caption:'Pesto Genovese is a meditation, not a recipe. The basil must be young, the pine nuts toasted just enough, and the Parmesan — always freshly grated.',
    hashtags:'#PestoGenovese #Basilico #SlowFood',
    likes:98, saves:31, comments:[
      { author:'Elena R.', initials:'ER', text:'What variety of basil do you use, Clara?', time:'22h ago' },
    ]
  },
];

const DEMO_SIDEBAR_TASTEMAKERS = [
  { id:1, name:'Sofia K.',   role:'Pastry devotee',    initials:'SK' },
  { id:2, name:'Liam Gao',   role:'Nordic cooking',    initials:'LG' },
  { id:3, name:'Nadia S.',   role:'Vegan Gastronomy',  initials:'NS' },
];

const TRENDING_TAGS = ['#HeirloomSummer','#PlantBased','#WoodFired','#PestoGenovese','#BowlFood','#FarmToTable','#CulinaryArt','#SpringEats'];

document.addEventListener('DOMContentLoaded', () => {
  renderSidebarProfile();
  renderSidebarTastemakers();
  renderSidebarTags();
  // Render demo posts IMMEDIATELY — no waiting
  const container = document.getElementById('feed-posts');
  if (container) {
    container.innerHTML = '';
    DEMO_POSTS.forEach(post => {
      const normalized = { ...post, author: post.author||'Chef', caption: post.caption||'', image_url: post.image||null, image: post.image||null, likes: post.likes||0, comments: post.comments||[] };
      container.insertAdjacentHTML('beforeend', buildPost(normalized));
    });
  }
  // Silently update from API in background
  loadFeedPosts();
});

// ── Sidebar ──────────────────────────────────────────────────
function renderSidebarProfile() {
  const el   = document.getElementById('sidebar-profile');
  const user = Auth.user;
  if (!el) return;
  if (!user) {
    el.innerHTML = `
      <div style="text-align:center;padding:1rem 0">
        <div style="font-size:2.5rem;margin-bottom:0.8rem">👨‍🍳</div>
        <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:1rem;line-height:1.5">Sign in to see your personalized feed and interact with recipes.</p>
        <a href="login.html" class="btn btn-primary" style="display:block;text-align:center">Sign In</a>
        <a href="login.html" class="btn btn-outline" style="display:block;text-align:center;margin-top:8px" onclick="localStorage.setItem('init_tab','register')">Create Account</a>
      </div>`;
    return;
  }
  const initials = (user.name||'U').split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
  const likes     = Auth.getLikes().size;
  const bookmarks = Auth.getBookmarks().size;
  const follows   = Auth.getFollows().size;
  el.innerHTML = `
    <div style="text-align:center">
      <div style="width:64px;height:64px;border-radius:50%;background:var(--green);color:#fff;font-size:1.4rem;font-weight:700;display:flex;align-items:center;justify-content:center;margin:0 auto 10px">${initials}</div>
      <div style="font-weight:700;font-size:1rem">${user.name}</div>
      <div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px">${user.bio||'Home Epicurean'}</div>
      <div style="display:flex;justify-content:center;gap:1.5rem;margin-top:12px;padding-top:12px;border-top:1px solid var(--border-light)">
        <div style="text-align:center"><div style="font-weight:700;font-size:1rem">${likes}</div><div style="font-size:0.68rem;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted)">Likes</div></div>
        <div style="text-align:center"><div style="font-weight:700;font-size:1rem">${bookmarks}</div><div style="font-size:0.68rem;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted)">Saved</div></div>
        <div style="text-align:center"><div style="font-weight:700;font-size:1rem">${follows}</div><div style="font-size:0.68rem;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted)">Following</div></div>
      </div>
      <a href="profile.html" class="btn btn-outline" style="display:block;text-align:center;margin-top:12px;font-size:0.82rem;padding:8px">View My Profile</a>
    </div>`;
}

function renderSidebarTastemakers() {
  const el = document.getElementById('sidebar-tastemakers');
  if (!el) return;
  el.innerHTML = DEMO_SIDEBAR_TASTEMAKERS.map(tm => `
    <div class="sidebar-tastemaker">
      <div style="width:36px;height:36px;border-radius:50%;background:var(--green);color:#fff;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0">${tm.initials}</div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;font-size:0.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${tm.name}</div>
        <div style="font-size:0.72rem;color:var(--text-muted)">${tm.role}</div>
      </div>
      <button onclick="handleFollow(this,${tm.id})" class="follow-toggle-btn sidebar-follow-${tm.id}" style="padding:4px 14px;border-radius:999px;border:1.5px solid var(--green);background:${Auth.isFollowing(tm.id)?'var(--green)':'transparent'};color:${Auth.isFollowing(tm.id)?'#fff':'var(--green)'};font-size:0.75rem;font-weight:600;cursor:pointer;transition:all 0.2s;white-space:nowrap">
        ${Auth.isFollowing(tm.id)?'Following':'Follow'}
      </button>
    </div>
  `).join('');
}

function handleFollow(btn, id) {
  if (!Auth.isLoggedIn()) { showToast('Sign in to follow chefs', 'warning'); location.href='login.html'; return; }
  const now = Auth.toggleFollow(id);
  btn.textContent  = now ? 'Following' : 'Follow';
  btn.style.background = now ? 'var(--green)' : 'transparent';
  btn.style.color      = now ? '#fff' : 'var(--green)';
  showToast(now ? 'Following! Their recipes will appear in your feed 🎉' : 'Unfollowed', now ? 'success' : 'info');
}

function renderSidebarTags() {
  const el = document.getElementById('sidebar-tags');
  if (!el) return;
  el.innerHTML = TRENDING_TAGS.map(t => `
    <span onclick="location.href='feed.html?tag=${t.slice(1)}'" style="padding:4px 14px;border-radius:999px;background:var(--cream-dark);border:1px solid var(--border);font-size:0.78rem;color:var(--charcoal-mid);cursor:pointer;transition:all 0.2s;display:block"
    onmouseover="this.style.background='var(--green-pale)';this.style.color='var(--green)'"
    onmouseout="this.style.background='var(--cream-dark)';this.style.color='var(--charcoal-mid)'">${t}</span>
  `).join('');
}

// ── Feed Posts ───────────────────────────────────────────────
async function loadFeedPosts() {
  const container = document.getElementById('feed-posts');
  if (!container) return;

  // Show loading state immediately
  container.innerHTML = `
    <div style="text-align:center;padding:4rem;color:var(--text-muted)">
      <div style="font-size:2rem;margin-bottom:1rem;animation:spin 1s linear infinite;display:inline-block">⟳</div>
      <p>Loading your feed…</p>
    </div>`;

  const params = new URLSearchParams(location.search);
  const tag    = params.get('tag');
  const diet   = params.get('diet');
  const q      = params.get('q');

  // Show active search/filter banner
  if (q || tag || diet) {
    const filter = q ? `"${q}"` : tag ? `#${tag}` : diet;
    container.insertAdjacentHTML('beforebegin', `
      <div id="feed-filter-banner" style="padding:10px 16px;background:var(--green-pale);border:1px solid var(--border);border-radius:var(--radius-md);margin-bottom:1rem;display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:0.85rem;color:var(--green);font-weight:600">🔍 Showing results for: ${filter}</span>
        <a href="feed.html" style="font-size:0.78rem;color:var(--text-muted)">Clear ✕</a>
      </div>`);
  }

  let posts = null;
  try {
    let url = Auth.isLoggedIn() ? '/recipes/feed' : '/recipes?limit=10';
    if (tag)  url = `/recipes?tag=${tag}`;
    if (diet) url = `/recipes?diet=${diet}`;
    if (q)    url = `/recipes?q=${encodeURIComponent(q)}`;

    const data = await apiFetch(url);
    if (data && data.length) posts = data;
  } catch(_) {}

  if (!posts) posts = DEMO_POSTS;

  container.innerHTML = '';

  if (posts.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:4rem;color:var(--text-muted)">
      <div style="font-size:3rem;margin-bottom:1rem">🍽️</div>
      <p>No recipes found. Try a different search.</p>
      <a href="feed.html" class="btn btn-outline" style="margin-top:1rem;display:inline-block">Back to Feed</a>
    </div>`;
    return;
  }

  posts.forEach(post => {
    const normalized = {
      ...post,
      author:   post.author_name  || post.author   || 'Chef',
      caption:  post.description  || post.caption  || '',
      image_url: post.image_url   || post.image    || null,
      image:     post.image_url   || post.image    || null,
      likes:     post.like_count  || post.likes    || 0,
      comments:  post.comments    || []
    };
    container.insertAdjacentHTML('beforeend', buildPost(normalized));
  });
}

function buildPost(post) {
  const liked  = Auth.hasLike(post.id);
  const saved  = Auth.hasBookmark(post.id);
  const likes  = typeof post.likes === 'number' ? post.likes : (post.like_count||0);
  const author = post.author || post.author_name || 'Chef';
  const initials = (author).split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
  const subtitle = post.subtitle || `${post.cook_time||''} ${post.cook_time&&post.difficulty?'·':''} ${post.difficulty||''}`.trim() || 'Just now';

  // Use shared resolveImageSrc for consistent image handling
  const imgSrc = typeof resolveImageSrc === 'function'
    ? resolveImageSrc(post)
    : (post.image_url || post.image || null);

  const imgEl = imgSrc
    ? `<img src="${imgSrc}" alt="${post.title||''}" style="width:100%;height:360px;object-fit:cover;display:block" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><div style="display:none;width:100%;height:360px;background:linear-gradient(135deg,#1C2A14,#3D703A);align-items:center;justify-content:center;font-size:8rem">🍽️</div>`
    : `<div style="width:100%;height:320px;background:linear-gradient(135deg,#1C2A14,#3D703A);display:flex;align-items:center;justify-content:center;font-size:8rem">🍽️</div>`;

  const commentsHtml = (post.comments||[]).map(c => buildCommentRow(c)).join('');

  return `
    <div class="feed-post" id="post-${post.id}" style="background:var(--white)">
      <div class="feed-post-header">
        <div style="width:42px;height:42px;border-radius:50%;background:var(--green);color:#fff;font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0">${post.authorInitials||initials}</div>
        <div style="flex:1">
          <div class="feed-author-name">${author}</div>
          <div class="feed-author-sub">${subtitle}</div>
        </div>
        <button style="width:36px;height:36px;border-radius:50%;border:none;background:var(--cream-mid);cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center">⋯</button>
      </div>

      <div class="feed-post-image" style="position:relative;overflow:hidden">
        ${post.badge ? `<div style="position:absolute;top:14px;left:14px;z-index:1;padding:5px 14px;border-radius:999px;background:rgba(0,0,0,0.55);backdrop-filter:blur(6px);color:#fff;font-size:0.7rem;font-weight:700;letter-spacing:0.1em">${post.badge}</div>` : ''}
        ${imgEl}
      </div>

      <div class="feed-post-body">
        ${post.title ? `<h3 style="font-family:var(--font-serif);font-size:1.1rem;margin-bottom:6px;cursor:pointer" onclick="location.href='recipe.html?id=${post.id}'">${post.title}</h3>` : ''}
        <p class="feed-caption"><strong>${author}</strong> ${post.caption||post.description||''}</p>
        ${post.hashtags ? `<p style="margin-top:6px;font-size:0.82rem;color:var(--green-mid);font-weight:500">${post.hashtags}</p>` : ''}
      </div>

      <div class="feed-post-actions">
        <button onclick="handleFeedLike(this,${post.id})" id="like-btn-${post.id}" style="display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:999px;border:1.5px solid var(--border);background:${liked?'#FFF0F0':'transparent'};font-size:0.83rem;font-weight:500;cursor:pointer;transition:all 0.2s;color:${liked?'#E05050':'var(--charcoal-mid)'}">
          ${liked?'❤️':'🤍'} <span id="like-count-${post.id}">${likes}</span>
        </button>
        <button onclick="toggleComments(${post.id})" style="display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:999px;border:1.5px solid var(--border);background:transparent;font-size:0.83rem;font-weight:500;cursor:pointer;transition:all 0.2s;color:var(--charcoal-mid)">
          💬 <span id="comment-toggle-label-${post.id}">${(post.comments||[]).length} Comments</span>
        </button>
        <button onclick="handleFeedSave(this,${post.id})" id="save-btn-${post.id}" style="display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:999px;border:1.5px solid var(--border);background:${saved?'var(--green-pale)':'transparent'};font-size:0.83rem;font-weight:500;cursor:pointer;transition:all 0.2s;color:${saved?'var(--green)':'var(--charcoal-mid)'}">
          ${saved?'🔖':'🏷️'} Save
        </button>
        <button onclick="openShareModal('${(post.title||'A recipe').replace(/'/g,"\\'")}','${location.origin}/recipe.html?id=${post.id}')" style="display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:999px;border:1.5px solid var(--border);background:transparent;font-size:0.83rem;font-weight:500;cursor:pointer;color:var(--charcoal-mid)">
          🔗 Share
        </button>
        <a href="recipe.html?id=${post.id}" style="margin-left:auto;font-size:0.8rem;color:var(--green);font-weight:600;white-space:nowrap">View Recipe →</a>
      </div>

      <div class="feed-comments" id="comments-section-${post.id}" style="display:none">
        <div class="comments-list" id="comments-list-${post.id}">
          ${commentsHtml}
        </div>
        <div style="display:flex;gap:10px;align-items:flex-end;padding:10px 14px;border-top:1px solid var(--border-light)">
          <div style="width:34px;height:34px;border-radius:50%;background:var(--green);color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">${Auth.user?(Auth.user.name||'U')[0].toUpperCase():'?'}</div>
          <input type="text" id="comment-input-${post.id}" placeholder="Add a culinary note…" style="flex:1;padding:8px 14px;border-radius:999px;border:1.5px solid var(--border);background:var(--cream-mid);font-size:0.83rem;outline:none" onkeydown="if(event.key==='Enter')postFeedComment(${post.id})" />
          <button onclick="postFeedComment(${post.id})" style="padding:8px 16px;border-radius:999px;border:none;background:var(--green);color:#fff;font-size:0.8rem;font-weight:600;cursor:pointer">Post</button>
        </div>
      </div>
    </div>`;
}

function buildCommentRow(c) {
  const initials = (c.author||'U').split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
  return `
    <div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--border-light)" class="comment-row">
      <div style="width:32px;height:32px;border-radius:50%;background:var(--green-mid);color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">${c.initials||initials}</div>
      <div style="flex:1">
        <span style="font-weight:600;font-size:0.83rem">${c.author||'User'}</span>
        <span style="font-size:0.76rem;color:var(--text-muted);margin-left:8px">${c.time||'Just now'}</span>
        <p style="font-size:0.83rem;margin-top:3px;line-height:1.4;color:var(--charcoal)">${c.text||c.content||''}</p>
      </div>
    </div>`;
}

function handleFeedLike(btn, id) {
  if (!Auth.isLoggedIn()) { showToast('Sign in to like recipes ❤️', 'warning'); location.href='login.html'; return; }
  const liked = Auth.hasLike(id);
  const countEl = document.getElementById(`like-count-${id}`);
  const current = parseInt(countEl?.textContent||'0');
  if (liked) {
    Auth.removeLike(id);
    btn.innerHTML = `🤍 <span id="like-count-${id}">${current-1}</span>`;
    btn.style.background = 'transparent'; btn.style.color = 'var(--charcoal-mid)';
    showToast('Like removed');
  } else {
    Auth.addLike(id);
    btn.innerHTML = `❤️ <span id="like-count-${id}">${current+1}</span>`;
    btn.style.background = '#FFF0F0'; btn.style.color = '#E05050';
    btn.style.transform = 'scale(1.05)'; setTimeout(() => btn.style.transform='', 200);
    showToast('Recipe liked! ❤️', 'success');
  }
}

function handleFeedSave(btn, id) {
  if (!Auth.isLoggedIn()) { showToast('Sign in to save recipes', 'warning'); location.href='login.html'; return; }
  const saved = Auth.hasBookmark(id);
  if (saved) {
    Auth.removeBookmark(id);
    btn.innerHTML = '🏷️ Save'; btn.style.background='transparent'; btn.style.color='var(--charcoal-mid)';
    showToast('Removed from saved');
  } else {
    Auth.addBookmark(id);
    btn.innerHTML = '🔖 Saved'; btn.style.background='var(--green-pale)'; btn.style.color='var(--green)';
    showToast('Saved to your collection 🔖', 'success');
  }
}

function toggleComments(id) {
  const section = document.getElementById(`comments-section-${id}`);
  if (!section) return;
  const visible = section.style.display !== 'none';
  section.style.display = visible ? 'none' : 'block';
  if (!visible) section.scrollIntoView({ behavior:'smooth', block:'nearest' });
}

function postFeedComment(id) {
  if (!Auth.isLoggedIn()) { showToast('Sign in to comment', 'warning'); location.href='login.html'; return; }
  const input = document.getElementById(`comment-input-${id}`);
  const text  = input?.value?.trim();
  if (!text) return;
  const comment = Auth.addComment(id, text);
  const list = document.getElementById(`comments-list-${id}`);
  list?.insertAdjacentHTML('beforeend', buildCommentRow(comment));
  input.value = '';
  showToast('Comment posted! 💬', 'success');
  // Update comment count label
  const labelEl = document.getElementById(`comment-toggle-label-${id}`);
  if (labelEl) {
    const n = list.querySelectorAll('.comment-row').length;
    labelEl.textContent = `${n} Comments`;
  }
}
