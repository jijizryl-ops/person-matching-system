// ============================================================
// APP.JS — Main Application Logic
// ============================================================

// ── STATE ──
let allResidents = [];
let allBlotters  = [];
let allAccounts  = [];
let chartGender  = null;

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.isLoggedIn()) {
    window.location.replace('index.html');
    return;
  }
  initUser();
  updateDate();
  loadAll();
});

function initUser() {
  const u = Auth.get();
  if (!u) return;
  document.getElementById('userName').textContent   = u.name || u.username;
  document.getElementById('userRole').textContent   = u.role;
  document.getElementById('userAvatar').textContent = (u.name || u.username).charAt(0).toUpperCase();

  // Hide admin-only nav items for staff
  if (!Auth.isAdmin()) {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
  }
}

function updateDate() {
  document.getElementById('topbarDate').textContent =
    new Date().toLocaleDateString('en-PH', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
}

async function loadAll() {
  await Promise.all([loadResidents(), loadBlotters()]);
  if (Auth.isAdmin()) loadAccounts();
  updateDashboard();
}

// ── NAVIGATION ──
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');
  const nav = document.getElementById(`nav-${page}`);
  if (nav) nav.classList.add('active');

  const titles = {
    dashboard: 'Dashboard',
    residents: 'Manage Residents',
    search:    'Search / Match',
    blotter:   'Blotter Records',
    reports:   'Reports',
    accounts:  'Manage Accounts',
  };
  document.getElementById('pageTitle').textContent = titles[page] || page;
}

// ── TOAST ──
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (type ? ` ${type}` : '');
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── MODAL ──
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ── LOGOUT ──
function logout() {
  Auth.clear();
  window.location.href = 'index.html';
}

// ══════════════════════════════════════════════════════
// RESIDENTS
// ══════════════════════════════════════════════════════
async function loadResidents() {
  const res = await Sheets.getResidents();
  allResidents = res.success ? (res.data || []) : [];
  renderResidentsTable(allResidents);
}

// Resident columns:
// 0:id, 1:fname, 2:lname, 3:mname, 4:nickname, 5:dob, 6:pob,
// 7:gender, 8:contact, 9:address, 10:skin, 11:build, 12:haircolor,
// 13:hairtype, 14:hairlength, 15:eyes, 16:face, 17:nose, 18:ear,
// 19:marks, 20:complications, 21:dateCreated

function calcAge(dob) {
  if (!dob) return '—';
  const b = new Date(dob), n = new Date();
  let age = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) age--;
  return age;
}

function getInitials(fname, lname) {
  return ((fname||'').charAt(0) + (lname||'').charAt(0)).toUpperCase();
}

function renderResidentsTable(data) {
  const tbody = document.getElementById('residentsTable');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="icon">👥</div><p>No residents found</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(r => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div class="res-avatar">${getInitials(r[1],r[2])}</div>
          <div>
            <div style="font-weight:600">${r[2]||''}, ${r[1]||''} ${r[3]||''}</div>
            <div style="font-size:11px;color:var(--text-muted)">${r[4]||''}</div>
          </div>
        </div>
      </td>
      <td><span class="badge ${r[7]==='MALE'?'badge-blue':'badge-red'}">${r[7]||'—'}</span></td>
      <td>${calcAge(r[5])}</td>
      <td>${r[8]||'—'}</td>
      <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r[9]||'—'}</td>
      <td>${r[10]||'—'}</td>
      <td>${r[11]||'—'}</td>
      <td>
        <div style="display:flex;gap:4px">
          <button class="btn btn-secondary btn-sm btn-icon" onclick="viewResident('${r[0]}')" title="View">👁</button>
          <button class="btn btn-secondary btn-sm btn-icon" onclick="editResident('${r[0]}')" title="Edit">✏️</button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="deleteResident('${r[0]}')" title="Delete">🗑</button>
        </div>
      </td>
    </tr>`).join('');
}

function filterResidents() {
  const q  = document.getElementById('residentSearch').value.toLowerCase();
  const g  = document.getElementById('filterGender').value;
  const filtered = allResidents.filter(r => {
    const name = `${r[1]} ${r[2]} ${r[3]}`.toLowerCase();
    const matchQ = !q || name.includes(q);
    const matchG = !g || r[7] === g;
    return matchQ && matchG;
  });
  renderResidentsTable(filtered);
}

function openAddResident() {
  clearResidentForm();
  document.getElementById('residentModalTitle').textContent = 'Add Resident';
  document.getElementById('r_id').value = '';
  openModal('modalResident');
}

function clearResidentForm() {
  ['r_fname','r_lname','r_mname','r_nickname','r_dob','r_pob',
   'r_contact','r_address','r_marks','r_complications'].forEach(id => {
    document.getElementById(id).value = '';
  });
  ['r_gender','r_skin','r_build','r_haircolor','r_hairtype',
   'r_hairlength','r_eyes','r_face','r_nose','r_ear'].forEach(id => {
    document.getElementById(id).value = '';
  });
}

function editResident(id) {
  const r = allResidents.find(x => String(x[0]) === String(id));
  if (!r) return;
  document.getElementById('residentModalTitle').textContent = 'Edit Resident';
  document.getElementById('r_id').value           = r[0];
  document.getElementById('r_fname').value        = r[1]  || '';
  document.getElementById('r_lname').value        = r[2]  || '';
  document.getElementById('r_mname').value        = r[3]  || '';
  document.getElementById('r_nickname').value     = r[4]  || '';
  document.getElementById('r_dob').value          = r[5]  || '';
  document.getElementById('r_pob').value          = r[6]  || '';
  document.getElementById('r_gender').value       = r[7]  || '';
  document.getElementById('r_contact').value      = r[8]  || '';
  document.getElementById('r_address').value      = r[9]  || '';
  document.getElementById('r_skin').value         = r[10] || '';
  document.getElementById('r_build').value        = r[11] || '';
  document.getElementById('r_haircolor').value    = r[12] || '';
  document.getElementById('r_hairtype').value     = r[13] || '';
  document.getElementById('r_hairlength').value   = r[14] || '';
  document.getElementById('r_eyes').value         = r[15] || '';
  document.getElementById('r_face').value         = r[16] || '';
  document.getElementById('r_nose').value         = r[17] || '';
  document.getElementById('r_ear').value          = r[18] || '';
  document.getElementById('r_marks').value        = r[19] || '';
  document.getElementById('r_complications').value= r[20] || '';
  openModal('modalResident');
}

async function saveResident() {
  const fname = document.getElementById('r_fname').value.trim();
  const lname = document.getElementById('r_lname').value.trim();
  const dob   = document.getElementById('r_dob').value;
  const gender= document.getElementById('r_gender').value;
  const addr  = document.getElementById('r_address').value.trim();

  if (!fname || !lname || !dob || !gender || !addr) {
    showToast('Please fill in all required fields!', 'error'); return;
  }

  const row = [
    fname,
    lname,
    document.getElementById('r_mname').value.trim(),
    document.getElementById('r_nickname').value.trim(),
    dob,
    document.getElementById('r_pob').value.trim(),
    gender,
    document.getElementById('r_contact').value.trim(),
    addr,
    document.getElementById('r_skin').value,
    document.getElementById('r_build').value,
    document.getElementById('r_haircolor').value,
    document.getElementById('r_hairtype').value,
    document.getElementById('r_hairlength').value,
    document.getElementById('r_eyes').value,
    document.getElementById('r_face').value,
    document.getElementById('r_nose').value,
    document.getElementById('r_ear').value,
    document.getElementById('r_marks').value.trim(),
    document.getElementById('r_complications').value.trim(),
    new Date().toISOString(),
  ];

  const id = document.getElementById('r_id').value;
  let res;
  if (id) {
    res = await Sheets.updateResident(id, row);
  } else {
    res = await Sheets.addResident(row);
  }

  if (res.success) {
    showToast(id ? '✅ Resident updated!' : '✅ Resident added!');
    closeModal('modalResident');
    await loadResidents();
    updateDashboard();
  } else {
    showToast('❌ Failed to save. Try again.', 'error');
  }
}

async function deleteResident(id) {
  if (!confirm('Are you sure you want to delete this resident?')) return;
  const res = await Sheets.deleteResident(id);
  if (res.success) {
    showToast('🗑 Resident deleted.');
    await loadResidents();
    updateDashboard();
  } else {
    showToast('❌ Failed to delete.', 'error');
  }
}

function viewResident(id) {
  const r = allResidents.find(x => String(x[0]) === String(id));
  if (!r) return;
  document.getElementById('viewResidentContent').innerHTML = `
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid var(--border)">
      <div class="res-avatar" style="width:60px;height:60px;font-size:22px">${getInitials(r[1],r[2])}</div>
      <div>
        <div style="font-size:20px;font-weight:700">${r[2]||''}, ${r[1]||''} ${r[3]||''}</div>
        <div style="color:var(--text-muted);font-size:13px">${r[4]?'"'+r[4]+'"':''} &nbsp;|&nbsp; Age: ${calcAge(r[5])}</div>
      </div>
      <span class="badge ${r[7]==='MALE'?'badge-blue':'badge-red'}" style="margin-left:auto">${r[7]||'—'}</span>
    </div>
    <div class="form-grid">
      ${field('Date of Birth', r[5])} ${field('Place of Birth', r[6])}
      ${field('Contact No.', r[8])}   ${field('Address', r[9])}
    </div>
    <div style="margin:16px 0 12px;font-size:12px;font-weight:700;color:var(--green-dark);text-transform:uppercase;letter-spacing:.05em">Physical Description</div>
    <div class="form-grid">
      ${field('Skin Color', r[10])}   ${field('Body Build', r[11])}
      ${field('Hair Color', r[12])}   ${field('Hair Type', r[13])}
      ${field('Hair Length', r[14])}  ${field('Eye Type', r[15])}
      ${field('Face Shape', r[16])}   ${field('Nose Type', r[17])}
      ${field('Ear Type', r[18])}     ${field('Body Marks', r[19])}
      ${field('Complications', r[20])}
    </div>`;
  openModal('modalViewResident');
}

function field(label, val) {
  return `<div style="background:var(--bg);border-radius:8px;padding:10px 14px">
    <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px">${label}</div>
    <div style="font-weight:500">${val||'—'}</div>
  </div>`;
}

// ══════════════════════════════════════════════════════
// SEARCH / MATCH
// ══════════════════════════════════════════════════════
function doSearch() {
  const fname = document.getElementById('s_fname').value.trim().toLowerCase();
  const lname = document.getElementById('s_lname').value.trim().toLowerCase();
  const gender= document.getElementById('s_gender').value;
  const skin  = document.getElementById('s_skin').value;
  const build = document.getElementById('s_build').value;
  const hair  = document.getElementById('s_hair').value;
  const eyes  = document.getElementById('s_eyes').value;
  const face  = document.getElementById('s_face').value;

  const results = allResidents.filter(r => {
    if (fname  && !(r[1]||'').toLowerCase().includes(fname))  return false;
    if (lname  && !(r[2]||'').toLowerCase().includes(lname))  return false;
    if (gender && r[7]  !== gender) return false;
    if (skin   && r[10] !== skin)   return false;
    if (build  && r[11] !== build)  return false;
    if (hair   && r[12] !== hair)   return false;
    if (eyes   && r[15] !== eyes)   return false;
    if (face   && r[16] !== face)   return false;
    return true;
  });

  document.getElementById('searchCount').textContent = `— ${results.length} result(s) found`;
  const tbody = document.getElementById('searchResults');
  if (!results.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="icon">🔍</div><p>No matching residents found</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = results.map(r => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="res-avatar">${getInitials(r[1],r[2])}</div>
          <span style="font-weight:600">${r[2]||''}, ${r[1]||''}</span>
        </div>
      </td>
      <td><span class="badge ${r[7]==='MALE'?'badge-blue':'badge-red'}">${r[7]||'—'}</span></td>
      <td>${calcAge(r[5])}</td>
      <td>${r[10]||'—'}</td>
      <td>${r[11]||'—'}</td>
      <td>${r[12]||'—'}</td>
      <td>${r[15]||'—'}</td>
      <td>${r[9]||'—'}</td>
    </tr>`).join('');
}

function clearSearch() {
  ['s_fname','s_lname','s_gender','s_skin','s_build','s_hair','s_eyes','s_face']
    .forEach(id => document.getElementById(id).value = '');
  document.getElementById('searchCount').textContent = '';
  document.getElementById('searchResults').innerHTML =
    `<tr><td colspan="8"><div class="empty-state"><div class="icon">🔍</div><p>Use filters above to search</p></div></td></tr>`;
}

// ══════════════════════════════════════════════════════
// BLOTTER
// ══════════════════════════════════════════════════════
// Blotter columns:
// 0:id, 1:incident, 2:place, 3:datetime, 4:cname, 5:caddress,
// 6:ccontact, 7:sname, 8:saddress, 9:wname, 10:waddress,
// 11:narrative, 12:dateCreated

async function loadBlotters() {
  const res = await Sheets.getBlotters();
  allBlotters = res.success ? (res.data || []) : [];
  renderBlotterTable(allBlotters);
}

function renderBlotterTable(data) {
  const tbody = document.getElementById('blotterTable');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="icon">📋</div><p>No blotter records found</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map((b, i) => `
    <tr>
      <td><span class="badge badge-gray">#${i+1}</span></td>
      <td style="font-weight:600">${b[1]||'—'}</td>
      <td>${b[2]||'—'}</td>
      <td>${b[4]||'—'}</td>
      <td>${b[7]||'Unknown'}</td>
      <td style="font-size:12px;color:var(--text-muted)">${b[3]?new Date(b[3]).toLocaleDateString('en-PH'):'—'}</td>
      <td>
        <div style="display:flex;gap:4px">
          <button class="btn btn-secondary btn-sm btn-icon" onclick="editBlotter('${b[0]}')" title="Edit">✏️</button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="deleteBlotter('${b[0]}')" title="Delete">🗑</button>
        </div>
      </td>
    </tr>`).join('');
}

function filterBlotters() {
  const q = document.getElementById('blotterSearch').value.toLowerCase();
  const filtered = allBlotters.filter(b =>
    (b[1]||'').toLowerCase().includes(q) ||
    (b[4]||'').toLowerCase().includes(q) ||
    (b[2]||'').toLowerCase().includes(q)
  );
  renderBlotterTable(filtered);
}

function openAddBlotter() {
  clearBlotterForm();
  document.getElementById('blotterModalTitle').textContent = 'Add Blotter Record';
  document.getElementById('b_id').value = '';
  openModal('modalBlotter');
}

function clearBlotterForm() {
  ['b_incident','b_place','b_datetime','b_cname','b_caddress','b_ccontact',
   'b_sname','b_saddress','b_wname','b_waddress','b_narrative']
    .forEach(id => document.getElementById(id).value = '');
}

function editBlotter(id) {
  const b = allBlotters.find(x => String(x[0]) === String(id));
  if (!b) return;
  document.getElementById('blotterModalTitle').textContent = 'Edit Blotter Record';
  document.getElementById('b_id').value        = b[0];
  document.getElementById('b_incident').value  = b[1]  || '';
  document.getElementById('b_place').value     = b[2]  || '';
  document.getElementById('b_datetime').value  = b[3]  || '';
  document.getElementById('b_cname').value     = b[4]  || '';
  document.getElementById('b_caddress').value  = b[5]  || '';
  document.getElementById('b_ccontact').value  = b[6]  || '';
  document.getElementById('b_sname').value     = b[7]  || '';
  document.getElementById('b_saddress').value  = b[8]  || '';
  document.getElementById('b_wname').value     = b[9]  || '';
  document.getElementById('b_waddress').value  = b[10] || '';
  document.getElementById('b_narrative').value = b[11] || '';
  openModal('modalBlotter');
}

async function saveBlotter() {
  const incident  = document.getElementById('b_incident').value.trim();
  const place     = document.getElementById('b_place').value.trim();
  const datetime  = document.getElementById('b_datetime').value;
  const cname     = document.getElementById('b_cname').value.trim();
  const narrative = document.getElementById('b_narrative').value.trim();

  if (!incident || !place || !datetime || !cname || !narrative) {
    showToast('Please fill in all required fields!', 'error'); return;
  }

  const row = [
    incident, place, datetime,
    cname,
    document.getElementById('b_caddress').value.trim(),
    document.getElementById('b_ccontact').value.trim(),
    document.getElementById('b_sname').value.trim(),
    document.getElementById('b_saddress').value.trim(),
    document.getElementById('b_wname').value.trim(),
    document.getElementById('b_waddress').value.trim(),
    narrative,
    new Date().toISOString(),
  ];

  const id = document.getElementById('b_id').value;
  const res = id
    ? await Sheets.updateBlotter(id, row)
    : await Sheets.addBlotter(row);

  if (res.success) {
    showToast(id ? '✅ Blotter updated!' : '✅ Blotter record added!');
    closeModal('modalBlotter');
    await loadBlotters();
    updateDashboard();
  } else {
    showToast('❌ Failed to save. Try again.', 'error');
  }
}

async function deleteBlotter(id) {
  if (!confirm('Delete this blotter record?')) return;
  const res = await Sheets.deleteBlotter(id);
  if (res.success) {
    showToast('🗑 Blotter record deleted.');
    await loadBlotters();
    updateDashboard();
  } else {
    showToast('❌ Failed to delete.', 'error');
  }
}

// ══════════════════════════════════════════════════════
// ACCOUNTS
// ══════════════════════════════════════════════════════
async function loadAccounts() {
  const res = await Sheets.getUsers();
  allAccounts = res.success ? (res.data || []) : [];
  renderAccountsTable();
}

function renderAccountsTable() {
  const tbody = document.getElementById('accountsTable');
  if (!tbody) return;
  if (!allAccounts.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="icon">👤</div><p>No accounts found</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = allAccounts.map(a => `
    <tr>
      <td style="font-weight:600">${a[4]||'—'}</td>
      <td>${a[1]||'—'}</td>
      <td><span class="badge ${a[3]==='ADMINISTRATOR'?'badge-green':'badge-blue'}">${a[3]||'—'}</span></td>
      <td>${a[5]||'—'}</td>
      <td>${a[7]||'—'}</td>
      <td>
        <div style="display:flex;gap:4px">
          <button class="btn btn-danger btn-sm btn-icon" onclick="deleteAccount('${a[0]}')" title="Delete">🗑</button>
        </div>
      </td>
    </tr>`).join('');
}

function openAddAccount() {
  ['a_name','a_username','a_password','a_contact','a_address'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('a_role').value   = 'STAFF';
  document.getElementById('a_gender').value = 'MALE';
  document.getElementById('a_id').value     = '';
  openModal('modalAccount');
}

async function saveAccount() {
  const name     = document.getElementById('a_name').value.trim();
  const username = document.getElementById('a_username').value.trim();
  const password = document.getElementById('a_password').value.trim();
  const role     = document.getElementById('a_role').value;

  if (!name || !username || !password || !role) {
    showToast('Please fill in all required fields!', 'error'); return;
  }

  const row = [
    username, password, role, name,
    document.getElementById('a_gender').value,
    '', // dob
    document.getElementById('a_contact').value.trim(),
    document.getElementById('a_address').value.trim(),
    new Date().toISOString(),
  ];

  const res = await Sheets.addUser(row);
  if (res.success) {
    showToast('✅ Account created!');
    closeModal('modalAccount');
    loadAccounts();
  } else {
    showToast('❌ Failed to create account.', 'error');
  }
}

async function deleteAccount(id) {
  const me = Auth.get();
  if (String(me.id) === String(id)) {
    showToast('❌ You cannot delete your own account!', 'error'); return;
  }
  if (!confirm('Delete this account?')) return;
  const res = await Sheets.deleteUser(id);
  if (res.success) {
    showToast('🗑 Account deleted.');
    loadAccounts();
  } else {
    showToast('❌ Failed to delete.', 'error');
  }
}

// ══════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════
function updateDashboard() {
  const total  = allResidents.length;
  const male   = allResidents.filter(r => r[7] === 'MALE').length;
  const female = allResidents.filter(r => r[7] === 'FEMALE').length;

  document.getElementById('statResidents').textContent = total;
  document.getElementById('statBlotters').textContent  = allBlotters.length;
  document.getElementById('statMale').textContent      = male;
  document.getElementById('statFemale').textContent    = female;

  // Chart
  const ctx = document.getElementById('chartGender').getContext('2d');
  if (chartGender) chartGender.destroy();
  chartGender = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Male', 'Female'],
      datasets: [{
        data: [male, female],
        backgroundColor: ['#1e88e5', '#e91e63'],
        borderWidth: 0,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: 'Outfit', size: 13 } } }
      }
    }
  });

  // Recent residents
  const recent5 = [...allResidents].slice(-5).reverse();
  const rBody   = document.getElementById('recentResidents');
  rBody.innerHTML = recent5.length ? recent5.map(r => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="res-avatar">${getInitials(r[1],r[2])}</div>
          <span style="font-weight:600">${r[2]||''}, ${r[1]||''}</span>
        </div>
      </td>
      <td><span class="badge ${r[7]==='MALE'?'badge-blue':'badge-red'}">${r[7]||'—'}</span></td>
      <td>${calcAge(r[5])}</td>
      <td>${r[9]||'—'}</td>
      <td style="font-size:12px;color:var(--text-muted)">${r[21]?new Date(r[21]).toLocaleDateString('en-PH'):'—'}</td>
    </tr>`).join('') :
    `<tr><td colspan="5"><div class="empty-state"><div class="icon">👥</div><p>No residents yet</p></div></td></tr>`;

  // Recent blotters
  const recent3  = [...allBlotters].slice(-3).reverse();
  const bDiv     = document.getElementById('recentBlotters');
  bDiv.innerHTML = recent3.length ? `
    <div style="display:flex;flex-direction:column;gap:10px">
      ${recent3.map(b => `
        <div style="display:flex;align-items:center;gap:12px;padding:10px;background:var(--bg);border-radius:8px">
          <div style="font-size:22px">📋</div>
          <div style="flex:1">
            <div style="font-weight:600;font-size:13px">${b[1]||'—'}</div>
            <div style="font-size:12px;color:var(--text-muted)">${b[2]||''} &nbsp;·&nbsp; ${b[4]||''}</div>
          </div>
          <span style="font-size:11px;color:var(--text-muted)">${b[3]?new Date(b[3]).toLocaleDateString('en-PH'):'—'}</span>
        </div>`).join('')}
    </div>` :
    `<div class="empty-state"><div class="icon">📋</div><p>No blotter records yet</p></div>`;
}

// ══════════════════════════════════════════════════════
// REPORTS
// ══════════════════════════════════════════════════════
function printResidentsReport() {
  const area    = document.getElementById('printArea');
  const content = document.getElementById('printContent');
  area.style.display = 'block';
  content.innerHTML = `
    <div style="text-align:center;margin-bottom:24px">
      <div style="font-size:32px">🏛️</div>
      <h2 style="font-family:'Playfair Display',serif;color:var(--green-dark);margin:4px 0">Person Matching System</h2>
      <p style="color:var(--text-muted);font-size:13px">Barangay Resident Report &nbsp;·&nbsp; Generated: ${new Date().toLocaleDateString('en-PH')}</p>
    </div>
    <table>
      <thead><tr>
        <th>#</th><th>Name</th><th>Gender</th><th>Age</th><th>Address</th><th>Contact</th><th>Skin</th><th>Build</th>
      </tr></thead>
      <tbody>
        ${allResidents.map((r,i) => `
          <tr>
            <td>${i+1}</td>
            <td>${r[2]||''}, ${r[1]||''} ${r[3]||''}</td>
            <td>${r[7]||'—'}</td>
            <td>${calcAge(r[5])}</td>
            <td>${r[9]||'—'}</td>
            <td>${r[8]||'—'}</td>
            <td>${r[10]||'—'}</td>
            <td>${r[11]||'—'}</td>
          </tr>`).join('')}
      </tbody>
    </table>
    <p style="margin-top:16px;font-size:12px;color:var(--text-muted)">Total: ${allResidents.length} resident(s)</p>`;
  area.scrollIntoView({ behavior: 'smooth' });
}

function printBlotterReport() {
  const area    = document.getElementById('printArea');
  const content = document.getElementById('printContent');
  area.style.display = 'block';
  content.innerHTML = `
    <div style="text-align:center;margin-bottom:24px">
      <div style="font-size:32px">🏛️</div>
      <h2 style="font-family:'Playfair Display',serif;color:var(--green-dark);margin:4px 0">Person Matching System</h2>
      <p style="color:var(--text-muted);font-size:13px">Blotter Records Report &nbsp;·&nbsp; Generated: ${new Date().toLocaleDateString('en-PH')}</p>
    </div>
    <table>
      <thead><tr>
        <th>#</th><th>Incident</th><th>Place</th><th>Date</th><th>Complainant</th><th>Suspect</th><th>Narrative</th>
      </tr></thead>
      <tbody>
        ${allBlotters.map((b,i) => `
          <tr>
            <td>${i+1}</td>
            <td>${b[1]||'—'}</td>
            <td>${b[2]||'—'}</td>
            <td>${b[3]?new Date(b[3]).toLocaleDateString('en-PH'):'—'}</td>
            <td>${b[4]||'—'}</td>
            <td>${b[7]||'Unknown'}</td>
            <td style="font-size:11px">${b[11]||'—'}</td>
          </tr>`).join('')}
      </tbody>
    </table>
    <p style="margin-top:16px;font-size:12px;color:var(--text-muted)">Total: ${allBlotters.length} record(s)</p>`;
  area.scrollIntoView({ behavior: 'smooth' });
}

function closePrint() {
  document.getElementById('printArea').style.display = 'none';
}
