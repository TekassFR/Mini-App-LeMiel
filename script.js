// Telegram WebApp initialization
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Variables globales
let appConfig = {};
let plugsData = {};
let currentPlugId = null;
let currentDepartmentFilter = 'all';
let adminConfig = {};

// Chargement de la configuration
async function loadConfig() {
    try {
        const response = await fetch('./config.json');
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        appConfig = await response.json();
        plugsData = appConfig.plugs;
        adminConfig = appConfig.admins || {};
        console.log('Configuration chargée');
        initializeApp();
    } catch (error) {
        console.error('Erreur chargement config:', error);
    }
}

function initializeApp() {
    displayPlugsGrid('all');
    setupCategoryButtons();
    displayUserInfo();
    checkAdminStatus();
}

function displayUserInfo() {
    const userInfo = document.getElementById('user-info');
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        userInfo.textContent = `Bienvenue, ${user.first_name || 'Ami'} 👋`;
    }
}

function setupCategoryButtons() {
    const departmentSelect = document.getElementById('department-select');
    if (!departmentSelect) return;
    
    departmentSelect.addEventListener('change', function() {
        currentDepartmentFilter = this.value;
        displayPlugsGrid(this.value);
    });
}

function displayPlugsGrid(department = 'all') {
    const grid = document.getElementById('menu-grid');
    
    let plugsToDisplay = [];
    
    if (department === 'all') {
        // Tous les plugs, dédupliqués
        const seenIds = new Set();
        Object.values(plugsData).forEach(deptPlugs => {
            deptPlugs?.forEach(plug => {
                if (!seenIds.has(plug.id)) {
                    seenIds.add(plug.id);
                    plugsToDisplay.push(plug);
                }
            });
        });
    } else {
        plugsToDisplay = plugsData[department] || [];
    }
    
    if (plugsToDisplay.length === 0) {
        grid.innerHTML = '<div style="padding: 60px 20px; text-align: center; color: #666; font-size: 16px;">Aucun plug pour le moment 🤷‍♂️</div>';
        return;
    }
    
    grid.innerHTML = plugsToDisplay.map(plug => {
        const departments = plug.departments || [plug.department];
        const deptBadges = departments.map(dept => {
            const deptInfo = appConfig.departments[dept];
            return deptInfo ? `<span style="color: #ffffff; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; display: inline-block; margin: 2px;">${dept}</span>` : '';
        }).join(' ');
        
        // Générer les étoiles
        const fullStars = Math.floor(plug.rating);
        const hasHalfStar = plug.rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        let starsHTML = '⭐'.repeat(fullStars);
        if (hasHalfStar) starsHTML += '✨';
        starsHTML += '☆'.repeat(emptyStars);
        
        return `
            <div class="plug-card" onclick="openTelegramProfile('${plug.telegram}')">
                <div class="plug-dept-badge">${deptBadges}</div>
                <div class="plug-image" style="background-image: url('${plug.image}'); background-size: contain; background-repeat: no-repeat; background-position: center;"></div>
                <div class="plug-content">
                    <h3 class="plug-name">${plug.emoji} ${plug.name}</h3>
                    <p class="plug-description">${plug.description}</p>
                    <div class="plug-rating">${starsHTML} ${plug.rating}</div>
                </div>
            </div>
        `;
    }).join('');
}

function openTelegramProfile(telegramUrl) {
    if (!telegramUrl) return;
    
    try {
        if (tg.openTelegramLink) {
            tg.openTelegramLink(telegramUrl);
        } else {
            window.open(telegramUrl, '_blank');
        }
    } catch (error) {
        console.error('Erreur ouverture Telegram:', error);
        window.open(telegramUrl, '_blank');
    }
}

// Fonctions Admin
function checkAdminStatus() {
    const adminBtn = document.getElementById('admin-btn');
    if (isAdmin()) {
        adminBtn.style.display = 'block';
    }
}

function isAdmin() {
    if (!tg.initDataUnsafe || !tg.initDataUnsafe.user) return false;
    const username = tg.initDataUnsafe.user.username;
    if (!username || !adminConfig.whitelist) return false;
    return adminConfig.whitelist.map(u => u.toLowerCase()).includes(username.toLowerCase());
}

function openAdminPanel() {
    if (!isAdmin()) {
        alert('⛔ Accès refusé');
        return;
    }
    document.getElementById('admin-panel').style.display = 'flex';
    switchAdminTab('plugs');
}

function closeAdminPanel() {
    document.getElementById('admin-panel').style.display = 'none';
}

function switchAdminTab(tab) {
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    const content = document.getElementById('admin-content');
    if (tab === 'plugs') {
        loadAdminPlugs();
    } else if (tab === 'depts') {
        loadAdminDepts();
    } else if (tab === 'admins') {
        loadAdminAdmins();
    }
}

function loadAdminPlugs() {
    const content = document.getElementById('admin-content');
    let html = `
        <div>
            <h3 style="color: #ffffff; margin-top: 0;">➕ Ajouter un Plug</h3>
            <div class="admin-form-group">
                <label>Nom</label>
                <input type="text" id="newPlugName" placeholder="Nom du plug">
            </div>
            <div class="admin-form-group">
                <label>Emoji</label>
                <input type="text" id="newPlugEmoji" placeholder="Emoji" maxlength="2" value="📍">
            </div>
            <div class="admin-form-group">
                <label>Image URL</label>
                <input type="text" id="newPlugImage" placeholder="https://i.ibb.co/..." value="https://i.ibb.co/mCTpqd9y/88f76eb4-a1ad-42ae-a853-2af312179d86-removebg-preview.png">
            </div>
            <div class="admin-form-group">
                <label>Départements (ex: 54,57,88)</label>
                <input type="text" id="newPlugDepts" placeholder="54,57">
            </div>
            <div class="admin-form-group">
                <label>Description</label>
                <textarea id="newPlugDesc" placeholder="Description du plug"></textarea>
            </div>
            <div class="admin-form-group">
                <label>Lien Telegram</label>
                <input type="text" id="newPlugTg" placeholder="https://t.me/username">
            </div>
            <div class="admin-form-group">
                <label>Note (0-5)</label>
                <input type="number" id="newPlugRating" placeholder="4.5" min="0" max="5" step="0.1" value="4.5">
            </div>
            <button class="admin-btn-primary" onclick="addNewPlug()">✅ Ajouter Plug</button>
        </div>
        <div class="admin-divider"></div>
        <div>
            <h3 style="color: #ffffff;">📋 Plugs Existants</h3>
            <div id="plugs-list"></div>
        </div>
    `;
    content.innerHTML = html;
    displayExistingPlugs();
}

function displayExistingPlugs() {
    const plugsList = document.getElementById('plugs-list');
    const allPlugs = new Map();
    
    Object.values(plugsData).forEach(deptPlugs => {
        deptPlugs?.forEach(plug => {
            if (!allPlugs.has(plug.id)) {
                allPlugs.set(plug.id, plug);
            }
        });
    });
    
    let html = '';
    allPlugs.forEach(plug => {
        const depts = (plug.departments || [plug.department]).join(', ');
        html += `
            <div class="admin-item">
                <div class="admin-item-info">
                    <strong>${plug.emoji} ${plug.name}</strong>
                    <small>Depts: ${depts} | Note: ${plug.rating}</small>
                </div>
                <button class="admin-btn-danger" onclick="deletePlugAdmin(${plug.id})">🗑️ Supprimer</button>
            </div>
        `;
    });
    
    plugsList.innerHTML = html || '<p style="color: #888;">Aucun plug</p>';
}

function addNewPlug() {
    const name = document.getElementById('newPlugName')?.value.trim();
    const emoji = document.getElementById('newPlugEmoji')?.value.trim() || '📍';
    const image = document.getElementById('newPlugImage')?.value.trim() || 'https://i.ibb.co/mCTpqd9y/88f76eb4-a1ad-42ae-a853-2af312179d86-removebg-preview.png';
    const depts = document.getElementById('newPlugDepts')?.value.trim();
    const desc = document.getElementById('newPlugDesc')?.value.trim();
    const tg = document.getElementById('newPlugTg')?.value.trim();
    const rating = parseFloat(document.getElementById('newPlugRating')?.value) || 4.5;
    
    if (!name || !depts || !desc || !tg) {
        alert('⚠️ Veuillez remplir tous les champs');
        return;
    }
    
    const departments = depts.split(',').map(d => d.trim());
    let maxId = 0;
    Object.values(plugsData).forEach(deptPlugs => {
        deptPlugs?.forEach(p => { if (p.id > maxId) maxId = p.id; });
    });
    
    const newPlug = {
        id: maxId + 1,
        name,
        emoji,
        departments,
        description: desc,
        telegram: tg,
        image,
        rating,
        active: true
    };
    
    departments.forEach(dept => {
        if (!plugsData[dept]) plugsData[dept] = [];
        plugsData[dept].push(newPlug);
    });
    
    alert('✅ Plug ajouté avec succès!');
    document.getElementById('newPlugName').value = '';
    document.getElementById('newPlugImage').value = 'https://i.ibb.co/mCTpqd9y/88f76eb4-a1ad-42ae-a853-2af312179d86-removebg-preview.png';
    document.getElementById('newPlugDepts').value = '';
    document.getElementById('newPlugDesc').value = '';
    document.getElementById('newPlugTg').value = '';
    displayExistingPlugs();
    displayPlugsGrid(currentDepartmentFilter);
}

function deletePlugAdmin(plugId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce plug?')) return;
    
    Object.keys(plugsData).forEach(dept => {
        plugsData[dept] = plugsData[dept].filter(p => p.id !== plugId);
    });
    
    alert('✅ Plug supprimé!');
    displayExistingPlugs();
    displayPlugsGrid(currentDepartmentFilter);
}

function loadAdminDepts() {
    const content = document.getElementById('admin-content');
    let html = `
        <div>
            <h3 style="color: #ffffff; margin-top: 0;">➕ Ajouter un Département</h3>
            <div class="admin-form-group">
                <label>Numéro</label>
                <input type="text" id="newDeptNum" placeholder="57">
            </div>
            <div class="admin-form-group">
                <label>Nom</label>
                <input type="text" id="newDeptName" placeholder="Moselle">
            </div>
            <div class="admin-form-group">
                <label>Emoji</label>
                <input type="text" id="newDeptEmoji" placeholder="🏭" maxlength="2">
            </div>
            <button class="admin-btn-primary" onclick="addNewDept()">✅ Ajouter Département</button>
        </div>
        <div class="admin-divider"></div>
        <div>
            <h3 style="color: #ffffff;">📋 Départements Existants</h3>
            <div id="depts-list"></div>
        </div>
    `;
    content.innerHTML = html;
    displayExistingDepts();
}

function displayExistingDepts() {
    const deptsList = document.getElementById('depts-list');
    let html = '';
    
    Object.entries(appConfig.departments || {}).forEach(([num, dept]) => {
        const plugCount = (plugsData[num] || []).length;
        html += `
            <div class="admin-item">
                <div class="admin-item-info">
                    <strong>${dept.emoji} ${dept.name} (${num})</strong>
                    <small>${plugCount} plug(s)</small>
                </div>
                <button class="admin-btn-danger" onclick="deleteDeptAdmin('${num}')">🗑️ Supprimer</button>
            </div>
        `;
    });
    
    deptsList.innerHTML = html || '<p style="color: #888;">Aucun département</p>';
}

function addNewDept() {
    const num = document.getElementById('newDeptNum')?.value.trim();
    const name = document.getElementById('newDeptName')?.value.trim();
    const emoji = document.getElementById('newDeptEmoji')?.value.trim() || '📍';
    
    if (!num || !name) {
        alert('⚠️ Veuillez remplir tous les champs');
        return;
    }
    
    if (appConfig.departments[num]) {
        alert('⚠️ Ce département existe déjà');
        return;
    }
    
    appConfig.departments[num] = { name, emoji };
    if (!plugsData[num]) plugsData[num] = [];
    
    alert('✅ Département ajouté!');
    document.getElementById('newDeptNum').value = '';
    document.getElementById('newDeptName').value = '';
    document.getElementById('newDeptEmoji').value = '';
    displayExistingDepts();
}

function deleteDeptAdmin(num) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce département?')) return;
    
    delete appConfig.departments[num];
    
    alert('✅ Département supprimé!');
    displayExistingDepts();
}

function loadAdminAdmins() {
    const content = document.getElementById('admin-content');
    let html = `
        <div>
            <h3 style="color: #ffffff; margin-top: 0;">➕ Ajouter un Administrateur</h3>
            <div class="admin-form-group">
                <label>Username Telegram (sans @)</label>
                <input type="text" id="newAdminUsername" placeholder="lemiel54">
            </div>
            <button class="admin-btn-primary" onclick="addNewAdmin()">✅ Ajouter Admin</button>
        </div>
        <div class="admin-divider"></div>
        <div>
            <h3 style="color: #ffffff;">📋 Administrateurs Existants</h3>
            <div id="admins-list"></div>
        </div>
    `;
    content.innerHTML = html;
    displayExistingAdmins();
}

function displayExistingAdmins() {
    const adminsList = document.getElementById('admins-list');
    const currentUser = tg.initDataUnsafe?.user?.username || '';
    let html = '';
    
    if (!adminConfig.whitelist || adminConfig.whitelist.length === 0) {
        adminsList.innerHTML = '<p style="color: #888;">Aucun administrateur</p>';
        return;
    }
    
    adminConfig.whitelist.forEach(username => {
        const isCurrent = username.toLowerCase() === currentUser.toLowerCase();
        html += `
            <div class="admin-item">
                <div class="admin-item-info">
                    <strong>@${username}</strong>
                    <small>${isCurrent ? '(Vous)' : ''}</small>
                </div>
                ${!isCurrent ? `<button class="admin-btn-danger" onclick="deleteAdminUser('${username}')">🗑️ Supprimer</button>` : '<span style="color: #888; font-size: 12px;">Actuellement connecté</span>'}
            </div>
        `;
    });
    
    adminsList.innerHTML = html;
}

function addNewAdmin() {
    const username = document.getElementById('newAdminUsername')?.value.trim();
    
    if (!username) {
        alert('⚠️ Veuillez entrer un username');
        return;
    }
    
    if (!adminConfig.whitelist) {
        adminConfig.whitelist = [];
    }
    
    if (adminConfig.whitelist.map(u => u.toLowerCase()).includes(username.toLowerCase())) {
        alert('⚠️ Cet utilisateur est déjà administrateur');
        return;
    }
    
    adminConfig.whitelist.push(username);
    
    alert('✅ Administrateur ajouté!');
    document.getElementById('newAdminUsername').value = '';
    displayExistingAdmins();
}

function deleteAdminUser(username) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer @${username} comme administrateur?`)) return;
    
    adminConfig.whitelist = adminConfig.whitelist.filter(u => u.toLowerCase() !== username.toLowerCase());
    
    alert('✅ Administrateur supprimé!');
    displayExistingAdmins();
}

// Thème Telegram
if (tg.setBackgroundColor) tg.setBackgroundColor('#000000');
if (tg.setHeaderColor) tg.setHeaderColor('#1a1a1a');

// Démarrage
document.addEventListener('DOMContentLoaded', loadConfig);
