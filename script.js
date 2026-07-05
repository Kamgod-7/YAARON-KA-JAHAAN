/* ============================================================
   Yaaron Ka Jahaan — Main JavaScript
   Tabs, login, chat, contests, rewards, support widget
   Generated from yaaron-ka-jahaan.html
   ============================================================ */

/*
  ╔══════════════════════════════════════════════════════════════════════╗
  ║          ONE-TIME EMAILJS SETUP (takes 3 minutes)                   ║
  ║                                                                      ║
  ║  1. Go to https://www.emailjs.com → Sign Up (free)                  ║
  ║  2. Add Email Service → Choose Gmail                                 ║
  ║     → Connect kamcricket77@gmail.com → Click "Connect Account"      ║
  ║     → Note your SERVICE ID (e.g. service_abc123)                    ║
  ║  3. Email Templates → Create New Template                           ║
  ║     → Set To Email: kamcricket77@gmail.com                          ║
  ║     → Subject: E-Commerce Contest Registration — YKJ                ║
  ║     → Body:                                                          ║
  ║       New Registration!                                              ║
  ║       Name: {{from_name}}                                            ║
  ║       YKJ ID: {{ykj_id}}                                             ║
  ║       Email: {{from_email}}                                          ║
  ║       Time: {{registered_at}}                                        ║
  ║     → Note your TEMPLATE ID (e.g. template_xyz789)                  ║
  ║  4. Account → API Keys → Copy your PUBLIC KEY                       ║
  ║  5. Replace the 3 values below with your actual IDs                 ║
  ╚══════════════════════════════════════════════════════════════════════╝
  */
  const EMAILJS_PUBLIC_KEY  = 'YOUR_PUBLIC_KEY';   // ← paste here
  const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID';   // ← paste here
  const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';  // ← paste here

  if(EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY'){
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
    console.log('EmailJS initialised ✓');
  }

/* ── Main application JS ─────────────────────────────────── */

let currentUser = null;

/* ── Global state — hoisted to top so all functions can access them ── */
// Chat widget
const CHAT_KEY = 'ykj-chat-messages';
const CHAT_MAX_MESSAGES = 150;
let chatOpen = false;
let chatPollTimer = null;
let lastSeenCount = 0;
let chatMessagesCache = [];

// Contest & Rewards widget
const CR_POINTS_PREFIX = 'ykj-points:';
let crOpen = false;
let crActiveTab = 'contests';
let crUserPoints = null;

// Support chat widget
const WA_STORAGE_KEY = 'ykj-support-chat';
let waOpen = false;
let waReplying = false;

/* ---------- Background twinkle dots ---------- */
(function buildSky(){
  const sky = document.getElementById('sky');
  for(let i=0;i<46;i++){
    const d = document.createElement('div');
    d.className='dot';
    d.style.left = Math.random()*100+'%';
    d.style.top = Math.random()*100+'%';
    d.style.animationDelay = (Math.random()*4)+'s';
    sky.appendChild(d);
  }
})();

/* ---------- Tabs ---------- */
function switchTab(tab){
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('#tabsNav button').forEach(b=>b.classList.remove('active'));
  document.getElementById(tab).classList.add('active');
  document.querySelector(`#tabsNav button[data-tab="${tab}"]`).classList.add('active');
  if(tab==='profile') renderProfile();
  if(tab==='about') loadMemberDirectory();
  window.scrollTo({top:0, behavior:'smooth'});
}
document.querySelectorAll('#tabsNav button').forEach(b=>{
  b.addEventListener('click', ()=> {
    if(b.dataset.tab==='profile' && !currentUser){ openLogin(); return; }
    switchTab(b.dataset.tab);
  });
});
document.getElementById('joinNowBtn').addEventListener('click', ()=>{
  if(currentUser){ showToast(`You're already in the Jahaan, ${currentUser.name}! 🎉`); }
  else openLogin();
});

/* ---------- Toast ---------- */
function showToast(msg){
  const t = document.createElement('div');
  t.className='toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(), 3000);
}

/* ---------- Header right (avatar / login button) ---------- */
function renderHeader(){
  const el = document.getElementById('headerRight');
  if(currentUser){
    const initial = currentUser.name.trim().charAt(0).toUpperCase();
    el.innerHTML = `
      <div class="user-pill">
        <div class="avatar">${initial}</div>
        <div>
          <div class="name">${escapeHtml(currentUser.name)}</div>
          <div class="tag">${currentUser.tag ? '@'+escapeHtml(currentUser.tag) : 'Jahaan member'}</div>
        </div>
        <button class="btn-ghost" id="logoutBtn">Log out</button>
      </div>`;
    document.getElementById('logoutBtn').addEventListener('click', logout);
  } else {
    el.innerHTML = `<button class="btn-primary" id="loginBtn" style="padding:10px 22px; font-size:.85rem;">Log In</button>`;
    document.getElementById('loginBtn').addEventListener('click', openLogin);
  }
}

function escapeHtml(s){
  const d = document.createElement('div');
  d.textContent = s ?? '';
  return d.innerHTML;
}

/* ---------- Login Modal ---------- */
function openLogin(){
  const overlay = document.createElement('div');
  overlay.className='modal-overlay';
  overlay.id='loginOverlay';
  overlay.innerHTML = `
    <div class="modal">
      <h2>Welcome to the Jahaan 👋</h2>
      <p class="lead">Tell us a bit about yourself — your details are saved so you never have to fill this out twice.</p>
      <div class="field">
        <label>Your Name</label>
        <input type="text" id="loginName" placeholder="e.g. Riya Sharma" autocomplete="off">
        <div class="field-error" id="errName">Please enter your name</div>
      </div>
      <div class="field">
        <label>Your Hobby</label>
        <input type="text" id="loginHobby" placeholder="e.g. Cricket, Singing, Gaming" autocomplete="off">
        <div class="field-error" id="errHobby">Please enter a hobby</div>
      </div>
      <div class="field">
        <label>User Tag</label>
        <input type="text" id="loginTag" placeholder="e.g. riya_vibes (no spaces)" autocomplete="off">
        <div class="field-error" id="errTag">Please enter a user tag</div>
      </div>
      <div class="field">
        <label>Email <span class="opt">(optional)</span></label>
        <input type="email" id="loginEmail" placeholder="you@example.com" autocomplete="off">
      </div>
      <button class="btn-primary" id="submitLogin">Enter the Jahaan</button>
      <div class="small-note">By joining you agree to vibe responsibly with your yaars 🤝</div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e)=>{ if(e.target===overlay) overlay.remove(); });
  document.getElementById('submitLogin').addEventListener('click', submitLogin);
  [...overlay.querySelectorAll('input')].forEach(inp=>{
    inp.addEventListener('keydown', e=>{ if(e.key==='Enter') submitLogin(); });
  });
  document.getElementById('loginName').focus();
}

async function submitLogin(){
  const name = document.getElementById('loginName').value.trim();
  const hobby = document.getElementById('loginHobby').value.trim();
  const tag = document.getElementById('loginTag').value.trim().replace(/\s+/g,'_');
  const email = document.getElementById('loginEmail').value.trim();

  let valid = true;
  document.getElementById('errName').style.display = name ? 'none':'block';
  document.getElementById('errHobby').style.display = hobby ? 'none':'block';
  document.getElementById('errTag').style.display = tag ? 'none':'block';
  if(!name || !hobby || !tag) valid = false;
  if(!valid) return;

  const btn = document.getElementById('submitLogin');
  btn.disabled = true;
  btn.textContent = 'Saving your details…';

  const user = { name, hobby, tag, email, joinedAt: new Date().toISOString() };
  const saved = await saveMember(user);

  if(!saved){
    btn.disabled = false;
    btn.textContent = 'Enter the Jahaan';
    showToast("Couldn't save right now — check your connection and try again.");
    return;
  }

  currentUser = user;
  document.getElementById('loginOverlay').remove();
  renderHeader();
  showToast(`Welcome to the Jahaan, ${name}! 🎉`);
  switchTab('profile');
  loadMemberDirectory();
  renderChatGate();
  crUserPoints = null;
  updateCRPointsPill();
  if(crOpen) loadCRPoints();
}

/* Writes the member to the permanent, full-permission community database
   (shared = true, so every member's record lives in one shared directory
   that persists forever) and marks them as the active session
   (shared = false, private to this browser/account). Retries once on
   transient failure before giving up. */
async function saveMember(user, attempt = 1){
  try{
    const key = 'ykj-member:' + user.tag.toLowerCase();
    const memberResult = await window.storage.set(key, JSON.stringify(user), true);
    const sessionResult = await window.storage.set('ykj-current-user', JSON.stringify(user), false);
    if(!memberResult || !sessionResult) throw new Error('Storage returned no result');
    return true;
  }catch(err){
    console.error('Storage error (attempt ' + attempt + ')', err);
    if(attempt < 2){
      await new Promise(r => setTimeout(r, 400));
      return saveMember(user, attempt + 1);
    }
    return false;
  }
}

async function logout(){
  try{
    await window.storage.delete('ykj-current-user', false);
  }catch(e){
    console.error('Logout storage error', e);
  }
  currentUser = null;
  renderHeader();
  switchTab('home');
  showToast('Logged out. Aa jaana phir se! 👋');
  renderChatGate();
  crUserPoints = null;
  updateCRPointsPill();
  renderCRBody();
}
function renderProfile(){
  const el = document.getElementById('profileContent');
  if(!currentUser){
    el.innerHTML = `<div class="card" style="text-align:center; padding:60px 30px;">
      <h3 style="margin-bottom:10px;">You're not logged in yet</h3>
      <p style="color:var(--muted); margin-bottom:20px;">Log in to see your Jahaan profile.</p>
      <button class="btn-primary" onclick="openLogin()">Log In</button>
    </div>`;
    return;
  }
  const initial = currentUser.name.trim().charAt(0).toUpperCase();
  const joined = new Date(currentUser.joinedAt);
  const joinedStr = joined.toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric'});

  el.innerHTML = `
    <div class="profile-header">
      <div class="big-avatar"><div class="inner">${initial}</div></div>
      <div>
        <h2>${escapeHtml(currentUser.name)}</h2>
        <div class="sub">${currentUser.tag ? '@'+escapeHtml(currentUser.tag) : ''} &nbsp;•&nbsp; Member since ${joinedStr}</div>
      </div>
    </div>

    <div class="section-head"><div><h2 style="font-size:1.4rem;">Your Details</h2><p>Saved straight from your sign-up — stored just for you.</p></div></div>
    <div class="profile-detail-grid" style="margin-bottom:44px;">
      <div class="detail-box"><div class="label">Name</div><div class="value">${escapeHtml(currentUser.name)}</div></div>
      <div class="detail-box"><div class="label">Hobby</div><div class="value">${escapeHtml(currentUser.hobby)}</div></div>
      <div class="detail-box"><div class="label">User Tag</div><div class="value">@${escapeHtml(currentUser.tag)}</div></div>
      <div class="detail-box"><div class="label">Email</div><div class="value">${currentUser.email ? escapeHtml(currentUser.email) : 'Not provided'}</div></div>
    </div>

    <div class="section-head"><div><h2 style="font-size:1.4rem;">From the News Desk</h2><p>A quick pick from the news tab, just for you.</p></div></div>
    <div class="card">
      <span class="tag-chip chip-news">Latest Pick</span>
      <h3>Bouncer Game Returns This Weekend</h3>
      <p>Since you're into ${escapeHtml(currentUser.hobby) || 'good times'}, you might enjoy this — squads are forming fast for the Bouncer Game. Don't miss out!</p>
      <div class="meta"><span>🏏 Game Night</span><span>📍 Community Ground</span></div>
    </div>
  `;
}

/* ---------- Restore session on load (keeps the member logged in forever, across visits/devices that share this account) ---------- */
async function restoreSession(attempt = 1){
  try{
    const result = await window.storage.get('ykj-current-user', false);
    if(result && result.value){
      currentUser = JSON.parse(result.value);
    } else {
      currentUser = null;
    }
  }catch(e){
    console.error('Session restore error (attempt ' + attempt + ')', e);
    if(attempt < 2){
      await new Promise(r => setTimeout(r, 400));
      return restoreSession(attempt + 1);
    }
    currentUser = null;
  }
  renderHeader();
  if(currentUser) renderProfile();
  if(currentUser) loadCRPoints();
  renderChatGate();
}

/* ---------- Community member directory (reads the full shared database) ---------- */
async function loadMemberDirectory(){
  const el = document.getElementById('memberDirectory');
  if(!el) return;
  try{
    const list = await window.storage.list('ykj-member:', true);
    if(!list || !list.keys || list.keys.length === 0){
      el.innerHTML = `<p style="color:var(--muted); font-size:.88rem;">No yaars have joined yet — be the first to hit "Join Now" on the Home tab!</p>`;
      return;
    }
    const records = await Promise.all(list.keys.map(async k => {
      try{
        const r = await window.storage.get(k, true);
        return r && r.value ? JSON.parse(r.value) : null;
      }catch(e){ return null; }
    }));
    const members = records.filter(Boolean).sort((a,b) => new Date(b.joinedAt) - new Date(a.joinedAt));
    if(members.length === 0){
      el.innerHTML = `<p style="color:var(--muted); font-size:.88rem;">No yaars have joined yet — be the first to hit "Join Now" on the Home tab!</p>`;
      return;
    }
    el.innerHTML = `<div class="member-grid">` + members.map(m => `
      <div class="member-chip">
        <div class="member-avatar">${escapeHtml(m.name.trim().charAt(0).toUpperCase())}</div>
        <div>
          <div class="member-name">${escapeHtml(m.name)}</div>
          <div class="member-meta">@${escapeHtml(m.tag)} · ${escapeHtml(m.hobby)}</div>
        </div>
      </div>`).join('') + `</div>`;
  }catch(e){
    console.error('Directory load error', e);
    el.innerHTML = `<p style="color:var(--muted); font-size:.88rem;">Couldn't load the member directory right now — refresh to try again.</p>`;
  }
}

restoreSession();
loadMemberDirectory();
initChatWidget();
initCRWidget();

/* ======================================================================
   Chat Widget — a WhatsApp-style live group chat for Jahaan members.
   Messages are stored in the shared community database (shared = true)
   under a single capped key, so every member sees the same conversation,
   and it persists forever. Open chats poll every few seconds for new
   messages so it feels live without needing a real-time backend.
   ====================================================================== */

function initChatWidget(){
  const fab = document.getElementById('chatFab');
  const panel = document.getElementById('chatPanel');
  const closeBtn = document.getElementById('chatCloseBtn');
  const sendBtn = document.getElementById('chatSendBtn');
  const input = document.getElementById('chatInput');

  fab.addEventListener('click', () => chatOpen ? closeChat() : openChat());
  closeBtn.addEventListener('click', closeChat);
  sendBtn.addEventListener('click', sendChatMessage);
  input.addEventListener('keydown', e => { if(e.key === 'Enter') sendChatMessage(); });

  renderChatGate();
  // Light background poll even while closed, just to keep the badge count fresh
  chatPollTimer = setInterval(pollChatMessages, 6000);
  pollChatMessages();
}

function openChat(){
  chatOpen = true;
  document.getElementById('chatPanel').classList.add('open');
  document.getElementById('chatBadge').style.display = 'none';
  lastSeenCount = chatMessagesCache.length;
  renderChatGate();
  scrollChatToBottom();
  if(currentUser) document.getElementById('chatInput').focus();
}

function closeChat(){
  chatOpen = false;
  document.getElementById('chatPanel').classList.remove('open');
}

function renderChatGate(){
  const footInput = document.getElementById('chatFootInput');
  const body = document.getElementById('chatBody');
  const fab = document.getElementById('chatFab');
  const lockPill = document.getElementById('chatLockPill');
  const label = document.getElementById('chatFabLabel');
  const statusText = document.getElementById('chatStatusText');

  if(!currentUser){
    footInput.style.display = 'none';
    body.innerHTML = `<div class="chat-locked"><span>🔒</span><p>Jahaan Chat is for logged-in members only. Log in to read and send messages with your yaars.</p>
      <button class="btn-primary" style="padding:10px 22px; font-size:.85rem;" onclick="closeChat(); openLogin();">Log In to Chat</button></div>`;
    fab.classList.add('locked-state');
    lockPill.style.display = 'flex';
    label.innerHTML = 'Jahaan Chat — members only <span class="lock-dot">🔒</span>';
    statusText.textContent = 'Members only · log in to chat';
  } else {
    footInput.style.display = 'flex';
    fab.classList.remove('locked-state');
    lockPill.style.display = 'none';
    label.textContent = `Chatting as @${currentUser.tag}`;
    statusText.textContent = 'Live · members only';
    renderChatMessages();
  }
}

async function pollChatMessages(){
  try{
    const result = await window.storage.get(CHAT_KEY, true);
    const messages = result && result.value ? JSON.parse(result.value) : [];
    chatMessagesCache = messages;

    if(chatOpen){
      renderChatGate();
      scrollChatToBottom();
      lastSeenCount = messages.length;
    } else if(messages.length > lastSeenCount){
      const badge = document.getElementById('chatBadge');
      const unread = messages.length - lastSeenCount;
      badge.textContent = unread > 9 ? '9+' : unread;
      badge.style.display = 'flex';
    }
  }catch(e){
    console.error('Chat poll error', e);
    if(chatOpen && currentUser && chatMessagesCache.length === 0){
      document.getElementById('chatBody').innerHTML =
        `<div class="chat-empty"><span>⚠️</span>Couldn't load messages. They'll appear once your connection is back.</div>`;
    }
  }
}

function renderChatMessages(){
  const body = document.getElementById('chatBody');
  if(chatMessagesCache.length === 0){
    body.innerHTML = `<div class="chat-empty"><span>💬</span>No messages yet — say salaam to your yaars!</div>`;
    return;
  }
  body.innerHTML = chatMessagesCache.map(m => {
    const mine = currentUser && m.tag === currentUser.tag;
    const time = formatChatTime(m.sentAt);
    return `<div class="bubble-row ${mine ? 'mine' : 'theirs'}">
      ${mine ? '' : `<div class="bubble-author">${escapeHtml(m.name)}</div>`}
      <div class="bubble">${escapeHtml(m.text)}</div>
      <div class="bubble-time">${time}</div>
    </div>`;
  }).join('');
}

function formatChatTime(iso){
  try{
    const d = new Date(iso);
    return d.toLocaleTimeString('en-IN', { hour:'numeric', minute:'2-digit' });
  }catch(e){ return ''; }
}

function scrollChatToBottom(){
  const body = document.getElementById('chatBody');
  requestAnimationFrame(() => { body.scrollTop = body.scrollHeight; });
}

async function sendChatMessage(){
  if(!currentUser) return;
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if(!text) return;

  const sendBtn = document.getElementById('chatSendBtn');
  sendBtn.disabled = true;
  input.value = '';

  const newMessage = {
    name: currentUser.name,
    tag: currentUser.tag,
    text,
    sentAt: new Date().toISOString()
  };

  // Optimistic update so it feels instant
  chatMessagesCache = [...chatMessagesCache, newMessage];
  renderChatMessages();
  scrollChatToBottom();

  try{
    const latest = await window.storage.get(CHAT_KEY, true).catch(() => null);
    const existing = latest && latest.value ? JSON.parse(latest.value) : [];
    let updated = [...existing, newMessage];
    if(updated.length > CHAT_MAX_MESSAGES){
      updated = updated.slice(updated.length - CHAT_MAX_MESSAGES);
    }
    const result = await window.storage.set(CHAT_KEY, JSON.stringify(updated), true);
    if(!result) throw new Error('No result from storage.set');
    chatMessagesCache = updated;
    lastSeenCount = updated.length;
  }catch(e){
    console.error('Send message error', e);
    showToast("Message couldn't be saved — check your connection.");
  }finally{
    sendBtn.disabled = false;
    input.focus();
  }
}

/* ======================================================================
   Contest & Rewards Widget — members enter contests to earn points,
   redeem points for rewards, and see a live leaderboard. Points and
   redemptions are stored in the shared community database so the
   leaderboard reflects every member, and progress persists forever.
   ====================================================================== */

const CR_CONTESTS = [
  { id: 'bouncer-2026', title: 'Bouncer Game Challenge', desc: 'Survive the most bouncers without flinching and win bragging rights plus contest points.', prize: '+50 pts', reward: 50 },
  { id: 'tdl-predict', title: 'TDL 2026 Prediction Contest', desc: 'Predict the winner between Dhurandhar Indians and 6er Super Kings before the season starts.', prize: '+75 pts', reward: 75 },
  { id: 'selfie-yaar', title: '#YaaronKaJahaan Selfie Contest', desc: 'Post a selfie with your yaars using the community hashtag for a shot at the spotlight.', prize: '+40 pts', reward: 40 }
];

const CR_REWARDS = [
  { id: 'badge-bronze', title: 'Bronze Yaar Badge', desc: 'A shiny badge for your profile to show you are an active member.', cost: 50 },
  { id: 'badge-gold', title: 'Gold Yaar Badge', desc: 'The top-tier badge — only for the most active members of the Jahaan.', cost: 150 },
  { id: 'shoutout', title: 'Community Shoutout', desc: 'Get featured in the next Big Update on the Home tab.', cost: 100 },
  { id: 'merch', title: 'YKJ Merch Voucher', desc: 'Redeem for official Yaaron Ka Jahaan merchandise.', cost: 250 }
];

function initCRWidget(){
  const fab     = document.getElementById('crFab');
  const closeBtn= document.getElementById('crCloseBtn');
  const tabs    = document.getElementById('crTabs');

  if(!fab || !closeBtn || !tabs){ console.error('CR widget elements not found'); return; }

  fab.addEventListener('click', () => crOpen ? closeCR() : openCR());
  closeBtn.addEventListener('click', closeCR);
  tabs.addEventListener('click', e => {
    const btn = e.target.closest('.cr-tab-btn');
    if(!btn) return;
    crActiveTab = btn.dataset.crTab;
    [...tabs.children].forEach(b => b.classList.toggle('active', b === btn));
    renderCRBody();
  });

  // Safe initial render — don't try to show user data until session is ready
  document.getElementById('crBody').innerHTML =
    '<div class="cr-locked"><span>&#127942;</span><p>Log in to play and earn rewards!</p>' +
    '<button class="btn-primary" style="padding:10px 22px;font-size:.85rem;" onclick="closeCR();openLogin();">Log In</button></div>';
}

function openCR(){
  crOpen = true;
  document.getElementById('crPanel').classList.add('open');
  if(currentUser) loadCRPoints();
}

function closeCR(){
  crOpen = false;
  document.getElementById('crPanel').classList.remove('open');
}

async function loadCRPoints(attempt = 1){
  if(!currentUser) return;
  try{
    const key = CR_POINTS_PREFIX + currentUser.tag.toLowerCase();
    const result = await window.storage.get(key, true).catch(() => null);
    if(result && result.value){
      crUserPoints = JSON.parse(result.value);
    } else {
      crUserPoints = { tag: currentUser.tag, name: currentUser.name, points: 0, entries: [], redemptions: [] };
    }
    updateCRPointsPill();
    renderCRBody();
  }catch(e){
    console.error('Load points error (attempt ' + attempt + ')', e);
    if(attempt < 2){
      await new Promise(r => setTimeout(r, 400));
      return loadCRPoints(attempt + 1);
    }
  }
}

async function saveCRPoints(){
  if(!currentUser || !crUserPoints) return false;
  try{
    const key = CR_POINTS_PREFIX + currentUser.tag.toLowerCase();
    const result = await window.storage.set(key, JSON.stringify(crUserPoints), true);
    if(!result) throw new Error('No result from storage.set');
    updateCRPointsPill();
    return true;
  }catch(e){
    console.error('Save points error', e);
    showToast("Couldn't save your points — check your connection.");
    return false;
  }
}

function updateCRPointsPill(){
  const pill = document.getElementById('crPointsPill');
  if(currentUser && crUserPoints){
    pill.style.display = 'flex';
    pill.textContent = crUserPoints.points;
  } else {
    pill.style.display = 'none';
  }
}

function renderCRBody(){
  const body = document.getElementById('crBody');
  const status = document.getElementById('crStatusText');

  if(!currentUser){
    status.textContent = 'Log in to play';
    body.innerHTML = `<div class="cr-locked"><span>&#127942;</span><p>Log in to enter contests, earn points, and win exciting rewards!</p>
      <button class="btn-primary" style="padding:10px 22px;font-size:.85rem;" onclick="closeCR();openLogin();">Log In</button></div>`;
    return;
  }

  status.textContent = 'Play, earn, redeem';

  if(!crUserPoints){
    body.innerHTML = `<div class="cr-locked"><span>🏆</span><p>Loading your points…</p></div>`;
    loadCRPoints();
    return;
  }

  const pointsBanner = `<div class="cr-points-banner">
    <div><div class="pb-label">Your Points</div><div class="pb-value">${crUserPoints.points}</div></div>
    <div style="font-size:1.6rem;">🪙</div>
  </div>`;

  if(crActiveTab === 'contests'){
    const ecomRegistered = crUserPoints.entries.includes('ecom-register');
    const logoSrc = document.getElementById('crPromoLogoImg') ? document.getElementById('crPromoLogoImg').src : '';

    const ecomCard = `<div class="cr-item">
      <div class="cr-item-top">
        <h5 style="display:flex;align-items:center;gap:8px;">
          <img src="${logoSrc}" alt="ShopCart" style="width:22px;height:22px;border-radius:6px;object-fit:cover;background:#fff;flex-shrink:0;" onerror="this.style.display='none'">
          E-Commerce Platform Development
        </h5>
        <span class="cr-prize">+100 pts</span>
      </div>
      <p>Help us build the Yaaron Ka Jahaan ShopCart — a platform for first copy items. Register your interest, contribute ideas or skills and win exciting rewards!</p>
      <button class="cr-action-btn ${ecomRegistered ? 'done' : ''}" ${ecomRegistered ? 'disabled' : ''} onclick="openEcomRegModal()">
        ${ecomRegistered ? '✓ Registered!' : 'Register Now'}
      </button>
    </div>`;

    body.innerHTML = pointsBanner + ecomCard + CR_CONTESTS.map(c => {
      const entered = crUserPoints.entries.includes(c.id);
      return `<div class="cr-item">
        <div class="cr-item-top"><h5>${escapeHtml(c.title)}</h5><span class="cr-prize">${c.prize}</span></div>
        <p>${escapeHtml(c.desc)}</p>
        <button class="cr-action-btn ${entered ? 'done' : ''}" ${entered ? 'disabled' : ''} onclick="enterCRContest('${c.id}')">
          ${entered ? '✓ Entered' : 'Enter Contest'}
        </button>
      </div>`;
    }).join('');
  } else if(crActiveTab === 'rewards'){
    body.innerHTML = pointsBanner + CR_REWARDS.map(r => {
      const redeemed = crUserPoints.redemptions.includes(r.id);
      const affordable = crUserPoints.points >= r.cost;
      return `<div class="cr-item">
        <div class="cr-item-top"><h5>${escapeHtml(r.title)}</h5><span class="cr-cost">${r.cost} pts</span></div>
        <p>${escapeHtml(r.desc)}</p>
        <button class="cr-action-btn cr-coming-soon-btn" onclick="showRewardComingSoon()">
          🔜 Coming Soon
        </button>
      </div>`;
    }).join('');
  } else if(crActiveTab === 'leaderboard'){
    renderCRLeaderboard();
  }
}

async function renderCRLeaderboard(){
  const body = document.getElementById('crBody');
  body.innerHTML = `<div class="cr-locked"><span>🏆</span><p>Loading leaderboard…</p></div>`;
  try{
    const list = await window.storage.list(CR_POINTS_PREFIX, true);
    if(!list || !list.keys || list.keys.length === 0){
      body.innerHTML = `<p style="color:var(--muted); font-size:.85rem; text-align:center; padding:20px;">No points on the board yet — enter a contest to be the first!</p>`;
      return;
    }
    const records = await Promise.all(list.keys.map(async k => {
      try{
        const r = await window.storage.get(k, true);
        return r && r.value ? JSON.parse(r.value) : null;
      }catch(e){ return null; }
    }));
    const ranked = records.filter(Boolean).sort((a,b) => b.points - a.points).slice(0, 10);
    if(ranked.length === 0){
      body.innerHTML = `<p style="color:var(--muted); font-size:.85rem; text-align:center; padding:20px;">No points on the board yet — enter a contest to be the first!</p>`;
      return;
    }
    body.innerHTML = ranked.map((m, i) => `
      <div class="cr-leader-row">
        <div class="cr-rank ${i === 0 ? 'top1' : ''}">${i + 1}</div>
        <div class="cr-leader-name">${escapeHtml(m.name)} <span style="color:var(--muted); font-weight:400;">@${escapeHtml(m.tag)}</span></div>
        <div class="cr-leader-pts">${m.points} pts</div>
      </div>`).join('');
  }catch(e){
    console.error('Leaderboard error', e);
    body.innerHTML = `<p style="color:var(--muted); font-size:.85rem; text-align:center; padding:20px;">Couldn't load the leaderboard — refresh to try again.</p>`;
  }
}

async function enterCRContest(contestId){
  if(!currentUser || !crUserPoints) return;
  const contest = CR_CONTESTS.find(c => c.id === contestId);
  if(!contest || crUserPoints.entries.includes(contestId)) return;

  crUserPoints.entries.push(contestId);
  crUserPoints.points += contest.reward;
  renderCRBody();

  const ok = await saveCRPoints();
  if(ok){
    showToast(`Entered "${contest.title}" — +${contest.reward} points! 🎉`);
  } else {
    crUserPoints.entries = crUserPoints.entries.filter(id => id !== contestId);
    crUserPoints.points -= contest.reward;
    renderCRBody();
  }
}

async function redeemCRReward(rewardId){
  if(!currentUser || !crUserPoints) return;
  const reward = CR_REWARDS.find(r => r.id === rewardId);
  if(!reward || crUserPoints.redemptions.includes(rewardId) || crUserPoints.points < reward.cost) return;

  crUserPoints.redemptions.push(rewardId);
  crUserPoints.points -= reward.cost;
  renderCRBody();

  const ok = await saveCRPoints();
  if(ok){
    showToast(`Redeemed "${reward.title}"! 🏆`);
  } else {
    crUserPoints.redemptions = crUserPoints.redemptions.filter(id => id !== rewardId);
    crUserPoints.points += reward.cost;
    renderCRBody();
  }
}

/* ======================================================================
   WhatsApp Support Chat Widget — full JS logic
   Uses localStorage so chat history survives tab switches and refreshes.
   ====================================================================== */

const WA_AUTO_REPLIES = [
  "Thank you for contacting YKJ Support! 🎧 We've received your message and will respond shortly. For urgent queries, reach us at kamcricket77@gmail.com or +91 97529 28115.",
  "Hi there! 👋 Our support team has noted your message. We typically respond within a few hours. You can also call us at +91 97529 28115.",
  "Thanks for reaching out! 🙌 Your query is important to us. Feel free to email us at kamcricket77@gmail.com for faster assistance.",
  "Message received! ✅ A YKJ support agent will be with you shortly. Meanwhile, feel free to browse our tabs for updates.",
  "We've got your message! 📩 For immediate help, drop us a line at kamcricket77@gmail.com or dial +91 97529 28115. We're here for you!",
];

function waInit(){
  const fab  = document.getElementById('waFab');
  const cls  = document.getElementById('waClose');
  const send = document.getElementById('waSend');
  const inp  = document.getElementById('waInput');

  fab.addEventListener('click', waToggle);
  cls.addEventListener('click', waClose);
  send.addEventListener('click', waSendMessage);
  inp.addEventListener('keydown', e => { if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); waSendMessage(); }});
  inp.addEventListener('input', () => { inp.style.height = 'auto'; inp.style.height = Math.min(inp.scrollHeight, 100) + 'px'; });

  waLoadHistory();
}

function waToggle(){
  waOpen ? waClose() : waOpenPanel();
}

function waOpenPanel(){
  waOpen = true;
  document.getElementById('waPanel').classList.add('open');
  document.getElementById('waNotifDot').style.display = 'none';
  document.getElementById('waInput').focus();
  waScrollBottom();
}

function waClose(){
  waOpen = false;
  document.getElementById('waPanel').classList.remove('open');
}

function waGetHistory(){
  try{
    const raw = localStorage.getItem(WA_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){ return []; }
}

function waSaveHistory(messages){
  try{ localStorage.setItem(WA_STORAGE_KEY, JSON.stringify(messages.slice(-120))); }catch(e){}
}

function waLoadHistory(){
  const msgs = waGetHistory();
  if(msgs.length === 0) return;
  document.getElementById('waEmpty').style.display = 'none';
  msgs.forEach(m => waRenderBubble(m, false));
  waScrollBottom();
}

function waNow(){
  return new Date().toLocaleTimeString('en-IN',{hour:'numeric', minute:'2-digit'});
}

function waDateLabel(){
  const d = new Date();
  const today = new Date();
  return d.toDateString() === today.toDateString() ? 'Today' : d.toLocaleDateString('en-IN',{day:'numeric',month:'short'});
}

function waRenderBubble(msg, scroll = true){
  const container = document.getElementById('waMsgs');
  const typing = document.getElementById('waTyping');

  const needsDate = (() => {
    const chips = container.querySelectorAll('.wa-date-chip');
    if(chips.length === 0) return true;
    return chips[chips.length-1].textContent !== waDateLabel();
  })();

  if(needsDate){
    const chip = document.createElement('div');
    chip.className = 'wa-date-chip';
    chip.textContent = waDateLabel();
    container.insertBefore(chip, typing);
  }

  const wrap = document.createElement('div');
  wrap.className = `wa-bubble-wrap ${msg.type === 'sent' ? 'sent' : 'recv'}`;
  wrap.innerHTML = `
    <div class="wa-bubble">${escapeWaHtml(msg.text)}</div>
    <div class="wa-time">${msg.time}${msg.type === 'sent' ? '<span class="wa-tick">✓✓</span>' : ''}</div>`;
  container.insertBefore(wrap, typing);

  if(scroll) waScrollBottom();
}

function escapeWaHtml(s){
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function waScrollBottom(){
  const c = document.getElementById('waMsgs');
  requestAnimationFrame(() => { c.scrollTop = c.scrollHeight; });
}

function waSendMessage(){
  if(waReplying) return;
  const inp = document.getElementById('waInput');
  const text = inp.value.trim();
  if(!text) return;

  document.getElementById('waEmpty').style.display = 'none';

  const msg = { type:'sent', text, time: waNow() };
  const history = waGetHistory();
  history.push(msg);
  waSaveHistory(history);
  waRenderBubble(msg);

  inp.value = '';
  inp.style.height = 'auto';

  // Show typing indicator and send auto-reply
  waReplying = true;
  document.getElementById('waSend').disabled = true;
  const typing = document.getElementById('waTyping');
  typing.classList.add('show');
  waScrollBottom();

  const delay = 1200 + Math.random() * 800;
  setTimeout(() => {
    typing.classList.remove('show');
    const replyText = WA_AUTO_REPLIES[Math.floor(Math.random() * WA_AUTO_REPLIES.length)];
    const reply = { type:'recv', text: replyText, time: waNow() };
    const h2 = waGetHistory();
    h2.push(reply);
    waSaveHistory(h2);
    waRenderBubble(reply);

    waReplying = false;
    document.getElementById('waSend').disabled = false;

    // Show notif dot if panel is closed
    if(!waOpen){
      document.getElementById('waNotifDot').style.display = 'block';
    }
    inp.focus();
  }, delay);
}

/* ======================================================================
   E-Commerce Contest Registration — modal, validation, storage
   ====================================================================== */
function showRewardComingSoon(){
  // Show a styled in-panel coming soon popup
  if(document.getElementById('rewardComingSoonPop')) return;
  const pop = document.createElement('div');
  pop.id = 'rewardComingSoonPop';
  pop.style.cssText = `
    position:fixed; inset:0; background:rgba(8,6,16,.8); backdrop-filter:blur(8px);
    z-index:300; display:flex; align-items:center; justify-content:center; padding:20px;
    animation:fadeIn .2s ease;
  `;
  pop.innerHTML = `
    <div style="
      width:100%; max-width:340px; background:linear-gradient(160deg,var(--night-3),var(--night-2));
      border:1px solid rgba(183,168,255,.35); border-radius:22px; padding:36px 28px;
      text-align:center; position:relative; overflow:hidden;
      animation:popIn .3s cubic-bezier(.2,.9,.3,1.2);
    ">
      <div style="position:absolute;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(155,140,255,.18),transparent 70%);top:-60px;right:-50px;pointer-events:none;"></div>
      <div style="font-size:2.8rem;margin-bottom:14px;">🔜</div>
      <h3 style="font-family:'Baloo 2',cursive;font-size:1.3rem;font-weight:800;color:var(--cream);margin-bottom:10px;">Coming Soon!</h3>
      <p style="color:var(--muted);font-size:.86rem;line-height:1.65;margin-bottom:24px;">
        Reward redemptions are being set up by the YKJ team.<br>
        Keep earning points — exciting rewards are on their way! 🏆
      </p>
      <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(183,168,255,.12);border:1px solid rgba(183,168,255,.3);border-radius:999px;padding:6px 16px;font-size:.74rem;font-weight:700;color:#B7A8FF;margin-bottom:22px;">
        ⏳ Launching very soon
      </div><br>
      <button onclick="document.getElementById('rewardComingSoonPop').remove()"
        style="background:linear-gradient(95deg,#6366f1,#0ea5e9);border:none;border-radius:12px;padding:11px 28px;color:#fff;font-family:'Poppins';font-weight:700;font-size:.9rem;cursor:pointer;box-shadow:0 4px 14px rgba(99,102,241,.4);">
        Got it!
      </button>
    </div>`;
  pop.addEventListener('click', e => { if(e.target === pop) pop.remove(); });
  document.body.appendChild(pop);
}

function openEcomRegModal(){
  if(document.getElementById('ecomRegOverlay')) return;
  const logoSrc = document.getElementById('crPromoLogoImg')
                ? document.getElementById('crPromoLogoImg').src : '';
  const prefillName = currentUser ? currentUser.name : '';
  const prefillTag  = currentUser ? '@' + currentUser.tag : '';

  const overlay = document.createElement('div');
  overlay.className = 'cr-reg-overlay';
  overlay.id = 'ecomRegOverlay';
  overlay.innerHTML = `
    <div class="cr-reg-modal">
      <div class="modal-logo-row">
        <img src="${logoSrc}" alt="ShopCart" style="width:46px;height:46px;border-radius:12px;object-fit:cover;background:#fff;box-shadow:0 3px 10px rgba(0,0,0,.3);" onerror="this.style.display='none'">
        <div>
          <h3>E-Commerce Contest</h3>
          <div style="font-size:.74rem;color:rgba(165,180,252,.8);margin-top:2px;">Help build the future of YKJ ShopCart</div>
        </div>
      </div>
      <p class="modal-sub">Fill in your details. Our team will reach out with next steps — also send us an email directly!</p>
      <div class="cr-reg-field">
        <label>Your Full Name</label>
        <input type="text" id="ecomRegName" placeholder="e.g. Riya Sharma" value="${escapeHtml(prefillName)}" autocomplete="off">
        <div id="ecomRegNameErr" style="color:var(--pink);font-size:.72rem;margin-top:5px;display:none;">Please enter your name</div>
      </div>
      <div class="cr-reg-field">
        <label>Yaaron Ka Jahaan ID</label>
        <input type="text" id="ecomRegId" placeholder="e.g. @riya_vibes" value="${escapeHtml(prefillTag)}" autocomplete="off">
        <div id="ecomRegIdErr" style="color:var(--pink);font-size:.72rem;margin-top:5px;display:none;">Please enter your YKJ ID</div>
      </div>
      <div class="cr-reg-email-note">
        <strong>📧 Also email us directly!</strong>
        Send your <b>Name</b> and <b>Yaaron Ka Jahaan ID</b> to:<br>
        <a href="mailto:kamcricket77@gmail.com">kamcricket77@gmail.com</a><br>
        Subject: <b>"E-Commerce Contest Registration"</b>
      </div>
      <button class="cr-reg-submit" id="ecomRegSubmit" onclick="submitEcomReg()">Register &amp; Open Email ✉️</button>
      <button class="cr-reg-cancel" onclick="closeEcomRegModal()">Cancel</button>
    </div>`;

  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if(e.target === overlay) closeEcomRegModal(); });
  setTimeout(() => { const n = document.getElementById('ecomRegName'); if(n) n.focus(); }, 100);
}

function closeEcomRegModal(){
  const el = document.getElementById('ecomRegOverlay');
  if(el) el.remove();
}

async function submitEcomReg(){
  const nameEl = document.getElementById('ecomRegName');
  const idEl   = document.getElementById('ecomRegId');
  const name   = nameEl ? nameEl.value.trim() : '';
  const ykjId  = idEl  ? idEl.value.trim()   : '';

  // Validate
  document.getElementById('ecomRegNameErr').style.display = name  ? 'none' : 'block';
  document.getElementById('ecomRegIdErr').style.display   = ykjId ? 'none' : 'block';
  if(!name || !ykjId) return;

  const btn = document.getElementById('ecomRegSubmit');
  if(btn){ btn.disabled = true; btn.innerHTML = '<span style="opacity:.7">Sending registration…</span>'; }

  const registeredAt = new Date().toLocaleString('en-IN', {
    day:'numeric', month:'long', year:'numeric',
    hour:'numeric', minute:'2-digit', hour12:true
  });
  const userEmail = currentUser && currentUser.email ? currentUser.email : 'Not provided';

  // ── 1. Save to shared community database ────────────────────────────────
  try{
    const regKey = 'ykj-ecom-reg:' + (currentUser ? currentUser.tag.toLowerCase() : Date.now());
    await window.storage.set(regKey, JSON.stringify({
      name, ykjId, email: userEmail, registeredAt: new Date().toISOString()
    }), true);
  }catch(e){ console.error('Ecom reg DB error:', e); }

  // ── 2. Award +100 points ─────────────────────────────────────────────────
  if(currentUser && crUserPoints && !crUserPoints.entries.includes('ecom-register')){
    crUserPoints.entries.push('ecom-register');
    crUserPoints.points += 100;
    await saveCRPoints();
  }

  // ── 3. Send email automatically via EmailJS ──────────────────────────────
  let emailSent = false;
  if(typeof emailjs !== 'undefined' && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY'){
    try{
      const templateParams = {
        to_email:      'kamcricket77@gmail.com',
        from_name:     name,
        ykj_id:        ykjId,
        from_email:    userEmail,
        registered_at: registeredAt,
        message:
          '🎉 New E-Commerce Contest Registration on Yaaron Ka Jahaan!\n\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
          '👤 Name         : ' + name          + '\n' +
          '🆔 YKJ ID       : ' + ykjId         + '\n' +
          '📧 Email        : ' + userEmail      + '\n' +
          '🕐 Registered At: ' + registeredAt  + '\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
          'Please reach out to this member with next steps.'
      };
      const response = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
      if(response.status === 200){ emailSent = true; console.log('Email sent via EmailJS ✓'); }
    }catch(err){
      console.warn('EmailJS send failed, falling back to mailto:', err);
    }
  }

  // ── 4. Fallback — open mailto if EmailJS not configured or failed ────────
  if(!emailSent){
    const subject = encodeURIComponent('E-Commerce Contest Registration — YKJ');
    const body = encodeURIComponent(
      '🎉 New Registration — Yaaron Ka Jahaan E-Commerce Contest\n\n' +
      'Name         : ' + name         + '\n' +
      'YKJ ID       : ' + ykjId        + '\n' +
      'Email        : ' + userEmail    + '\n' +
      'Registered At: ' + registeredAt + '\n\n' +
      'Please follow up with this member.'
    );
    window.open('mailto:kamcricket77@gmail.com?subject=' + subject + '&body=' + body, '_blank');
  }

  // ── 5. Show success screen ───────────────────────────────────────────────
  const modal = document.querySelector('#ecomRegOverlay .cr-reg-modal');
  if(modal){
    modal.innerHTML = `
      <div class="cr-reg-success">
        <span class="success-icon">&#127881;</span>
        <h4>You're Registered!</h4>
        <p style="margin-bottom:14px;">
          ${emailSent
            ? '<span style="color:#4ade80;font-weight:700;">✓ Registration email sent automatically to the YKJ team!</span>'
            : 'Your email app has opened — please hit <b>Send</b> to complete your registration.'}
        </p>
        <div style="background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.25);border-radius:12px;padding:12px 14px;font-size:.8rem;color:var(--muted);line-height:1.7;margin-bottom:20px;text-align:left;">
          <div style="color:#a5b4fc;font-weight:700;margin-bottom:6px;">📋 Details Submitted</div>
          <div>👤 <b>Name:</b> ${escapeHtml(name)}</div>
          <div>🆔 <b>YKJ ID:</b> ${escapeHtml(ykjId)}</div>
          <div>📧 <b>Sent to:</b> kamcricket77@gmail.com</div>
          <div>🕐 <b>Time:</b> ${registeredAt}</div>
        </div>
        <p style="font-size:.8rem;color:var(--muted);margin-bottom:20px;">
          You've also earned <b style="color:var(--gold);">+100 points</b>! 🏆
        </p>
        <button class="cr-reg-submit" onclick="closeEcomRegModal(); renderCRBody();">Awesome, Done! ✓</button>
      </div>`;
  }
}

document.addEventListener("DOMContentLoaded", waInit);