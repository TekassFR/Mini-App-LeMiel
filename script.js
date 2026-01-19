// Telegram WebApp initialization
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Variables globales
let appConfig = {};
let plugsData = {};
let currentPlugId = null;
let currentDepartmentFilter = 'all';

// Chargement de la configuration
async function loadConfig() {
    try {
        const response = await fetch('./config.json');
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        appConfig = await response.json();
        plugsData = appConfig.plugs;
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
}

function displayUserInfo() {
    const userInfo = document.getElementById('user-info');
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        userInfo.textContent = `Bienvenue, ${user.first_name || 'Ami'} 👋`;
    }
}

function setupCategoryButtons() {
    const select = document.getElementById('department-select');
    select.addEventListener('change', function() {
        currentDepartmentFilter = this.value;
        displayPlugsGrid(this.value);
    });
}

function displayPlugsGrid(department) {
    const grid = document.getElementById('menu-grid');
    grid.innerHTML = '';
    let plugsToDisplay = [];

    if (department === 'all') {
        Object.values(plugsData).forEach(deptPlugs => {
            plugsToDisplay = plugsToDisplay.concat(deptPlugs);
        });
    } else {
        plugsToDisplay = plugsData[department] || [];
    }

    if (plugsToDisplay.length === 0) {
        grid.innerHTML = '<div class="no-results">Aucun plug trouvé</div>';
        return;
    }

    plugsToDisplay.forEach(plug => {
        const card = createPlugCard(plug);
        grid.appendChild(card);
    });
}

function createPlugCard(plug) {
    const card = document.createElement('div');
    card.className = 'menu-item';
    card.style.cursor = 'pointer';
    card.onclick = () => openTelegram(plug.telegram);
    
    const ratingStars = '⭐'.repeat(Math.floor(plug.rating)) + (plug.rating % 1 !== 0 ? '✨' : '');
    const departments = plug.departments || [plug.department];
    const deptBadges = departments.join(' ');
    
    card.innerHTML = `
        <div class="menu-item-image">
            <img src="${plug.image}" alt="${plug.name}" class="product-img">
            <div class="product-emoji">${plug.emoji}</div>
            <div class="product-badge">${deptBadges}</div>
        </div>
        <div class="menu-item-content">
            <h3 class="product-name">${plug.name}</h3>
            <p class="product-description">${plug.description}</p>
            <div class="product-footer">
                <span class="rating">${ratingStars} ${plug.rating}</span>
            </div>
        </div>
    `;
    return card;
}

function openTelegram(telegramUrl) {
    try {
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.openTelegramLink) {
            window.Telegram.WebApp.openTelegramLink(telegramUrl);
        } else {
            window.open(telegramUrl, '_blank');
        }
    } catch (error) {
        console.error('Erreur Telegram:', error);
        window.location.href = telegramUrl;
    }
}

// ===== PANEL ADMIN =====

function openAdminPanel() {
    console.log('openAdminPanel() appelé');
    
    const overlay = document.getElementById('adminPanelOverlay');
    if (!overlay) {
        console.error('Overlay non trouvé');
        alert('Erreur: Panel admin non trouvé');
        return;
    }
    
    // Afficher le panel
    overlay.style.display = 'block';
    console.log('Panel admin affiché');
    
    setTimeout(() => {
        switchAdminTab('plugs');
    }, 50);
}

function closeAdminPanel() {
    const overlay = document.getElementById('adminPanelOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

function showAdminMessage(text, type = 'success') {
    const msgDiv = document.getElementById('adminMessage');
    if (!msgDiv) return;
    
    msgDiv.textContent = text;
    msgDiv.style.display = 'block';
    msgDiv.style.background = type === 'success' ? '#4caf50' : '#f44336';
    
    setTimeout(() => {
        msgDiv.style.display = 'none';
    }, 3000);
}

function switchAdminTab(tab) {
    console.log('switchAdminTab:', tab);
    
    const btnPlugs = document.querySelector('.admin-tab-btn-plugs');
    const btnDepts = document.querySelector('.admin-tab-btn-depts');
    
    if (tab === 'plugs') {
        if (btnPlugs) btnPlugs.style.background = '#4a90e2';
        if (btnDepts) btnDepts.style.background = '#333';
        loadAdminPlugs();
    } else {
        if (btnPlugs) btnPlugs.style.background = '#333';
        if (btnDepts) btnDepts.style.background = '#4a90e2';
        loadAdminDepts();
    }
}

function loadAdminPlugs() {
    const content = document.getElementById('adminContent');
    let html = `
        <div style="margin-bottom: 20px;">
            <h3>➕ Ajouter un Plug</h3>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <input type="text" id="plugName" placeholder="Nom" style="padding: 8px; border-radius: 4px; border: 1px solid #444; background: #222; color: #fff;">
                <input type="text" id="plugDepts" placeholder="Départements (54,57)" style="padding: 8px; border-radius: 4px; border: 1px solid #444; background: #222; color: #fff;">
                <input type="text" id="plugDesc" placeholder="Description" style="padding: 8px; border-radius: 4px; border: 1px solid #444; background: #222; color: #fff;">
                <input type="text" id="plugTg" placeholder="https://t.me/username" style="padding: 8px; border-radius: 4px; border: 1px solid #444; background: #222; color: #fff;">
                <input type="text" id="plugEmoji" placeholder="Emoji" maxlength="2" style="padding: 8px; border-radius: 4px; border: 1px solid #444; background: #222; color: #fff;">
                <input type="number" id="plugRating" placeholder="Note" min="0" max="5" step="0.1" value="4.5" style="padding: 8px; border-radius: 4px; border: 1px solid #444; background: #222; color: #fff;">
                <button onclick="addNewPlug()" style="padding: 10px; background: #4caf50; border: none; color: #fff; border-radius: 6px; cursor: pointer; font-weight: bold;">Ajouter Plug</button>
            </div>
        </div>
        
        <div>
            <h3>📋 Plugs Existants</h3>
            <div id="plugsList" style="display: flex; flex-direction: column; gap: 10px;"></div>
        </div>
    `;
    content.innerHTML = html;
    
    const plugsList = document.getElementById('plugsList');
    const allPlugs = new Map();
    Object.values(appConfig.plugs || {}).forEach(deptPlugs => {
        deptPlugs?.forEach(plug => {
            if (!allPlugs.has(plug.id)) {
                allPlugs.set(plug.id, plug);
            }
        });
    });
    
    allPlugs.forEach(plug => {
        const plugItem = document.createElement('div');
        plugItem.style.cssText = 'background: #222; padding: 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;';
        plugItem.innerHTML = `
            <div>
                <strong>${plug.emoji} ${plug.name}</strong>
                <div style="font-size: 12px; color: #aaa;">Depts: ${(plug.departments || [plug.department]).join(', ')}</div>
            </div>
            <button onclick="deletePlugAdmin(${plug.id})" style="padding: 6px 12px; background: #f44336; border: none; color: #fff; border-radius: 4px; cursor: pointer;">Supprimer</button>
        `;
        plugsList.appendChild(plugItem);
    });
}

function loadAdminDepts() {
    const content = document.getElementById('adminContent');
    let html = `
        <div style="margin-bottom: 20px;">
            <h3>➕ Ajouter un Département</h3>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <input type="text" id="deptNumber" placeholder="Numéro (57)" style="padding: 8px; border-radius: 4px; border: 1px solid #444; background: #222; color: #fff;">
                <input type="text" id="deptName" placeholder="Nom (Moselle)" style="padding: 8px; border-radius: 4px; border: 1px solid #444; background: #222; color: #fff;">
                <input type="text" id="deptEmoji" placeholder="Emoji" maxlength="2" style="padding: 8px; border-radius: 4px; border: 1px solid #444; background: #222; color: #fff;">
                <button onclick="addNewDept()" style="padding: 10px; background: #4caf50; border: none; color: #fff; border-radius: 6px; cursor: pointer; font-weight: bold;">Ajouter Département</button>
            </div>
        </div>
        
        <div>
            <h3>📋 Départements</h3>
            <div id="deptsList" style="display: flex; flex-direction: column; gap: 10px;"></div>
        </div>
    `;
    content.innerHTML = html;
    
    const deptsList = document.getElementById('deptsList');
    Object.entries(appConfig.departments || {}).forEach(([num, dept]) => {
        const deptItem = document.createElement('div');
        deptItem.style.cssText = 'background: #222; padding: 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;';
        deptItem.innerHTML = `
            <div>
                <strong>${dept.emoji} ${dept.name} (${num})</strong>
                <div style="font-size: 12px; color: #aaa;">Plugs: ${(appConfig.plugs?.[num] || []).length}</div>
            </div>
            <button onclick="deleteDeptAdmin('${num}')" style="padding: 6px 12px; background: #f44336; border: none; color: #fff; border-radius: 4px; cursor: pointer;">Supprimer</button>
        `;
        deptsList.appendChild(deptItem);
    });
}

function addNewPlug() {
    const name = document.getElementById('plugName')?.value;
    const depts = document.getElementById('plugDepts')?.value;
    const desc = document.getElementById('plugDesc')?.value;
    const tg = document.getElementById('plugTg')?.value;
    const emoji = document.getElementById('plugEmoji')?.value || '📍';
    const rating = parseFloat(document.getElementById('plugRating')?.value) || 4.5;
    
    if (!name || !depts || !desc || !tg) {
        showAdminMessage('⚠️ Veuillez remplir tous les champs', 'error');
        return;
    }
    
    const departments = depts.split(',').map(d => d.trim());
    let maxId = 0;
    Object.values(appConfig.plugs || {}).forEach(deptPlugs => {
        deptPlugs?.forEach(p => { if (p.id > maxId) maxId = p.id; });
    });
    
    const newPlug = {
        id: maxId + 1,
        name, departments, description: desc, telegram: tg, emoji,
        image: 'https://i.ibb.co/mCTpqd9y/88f76eb4-a1ad-42ae-a853-2af312179d86-removebg-preview.png',
        rating, active: true
    };
    
    departments.forEach(dept => {
        if (!appConfig.plugs[dept]) appConfig.plugs[dept] = [];
        appConfig.plugs[dept].push(newPlug);
    });
    
    showAdminMessage('✅ Plug ajouté!');
    loadAdminPlugs();
}

function deletePlugAdmin(plugId) {
    if (confirm('Supprimer ce plug ?')) {
        Object.keys(appConfig.plugs || {}).forEach(dept => {
            appConfig.plugs[dept] = appConfig.plugs[dept].filter(p => p.id !== plugId);
        });
        showAdminMessage('✅ Plug supprimé!');
        loadAdminPlugs();
    }
}

function addNewDept() {
    const num = document.getElementById('deptNumber')?.value;
    const name = document.getElementById('deptName')?.value;
    const emoji = document.getElementById('deptEmoji')?.value || '📍';
    
    if (!num || !name) {
        showAdminMessage('⚠️ Veuillez remplir tous les champs', 'error');
        return;
    }
    
    if (appConfig.departments?.[num]) {
        showAdminMessage('⚠️ Ce département existe déjà', 'error');
        return;
    }
    
    appConfig.departments[num] = { name, emoji };
    if (!appConfig.plugs[num]) appConfig.plugs[num] = [];
    
    showAdminMessage('✅ Département ajouté!');
    loadAdminDepts();
}

function deleteDeptAdmin(num) {
    if (confirm('Supprimer ce département ?')) {
        delete appConfig.departments[num];
        showAdminMessage('✅ Département supprimé!');
        loadAdminDepts();
    }
}

// Thème Telegram
if (tg.setBackgroundColor) tg.setBackgroundColor('#000000');
if (tg.setHeaderColor) tg.setHeaderColor('#1a1a1a');

// Démarrage
document.addEventListener('DOMContentLoaded', loadConfig);
