// Telegram WebApp initialization
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Variables globales
let appConfig = {};
let plugsData = {};
let adminConfig = {};
let currentPlugId = null;
let currentDepartmentFilter = 'all';

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
    
    // Vérifier si l'utilisateur est admin et afficher le bouton
    if (isAdmin()) {
        const adminBtn = document.querySelector('.admin-btn');
        if (adminBtn) {
            adminBtn.style.display = 'block';
        }
    }
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

// ===== SYSTÈME ADMIN =====

function isAdmin() {
    try {
        const user = tg?.initDataUnsafe?.user;
        if (!user) return false;
        
        const username = user.username?.toLowerCase();
        if (!username) return false;
        
        const whitelist = adminConfig?.whitelist || [];
        return whitelist.some(admin => admin.toLowerCase() === username);
    } catch (error) {
        return false;
    }
}

function openAdminPanel() {
    console.log('🔓 openAdminPanel appelé');
    
    if (!isAdmin()) {
        alert('❌ Accès refusé');
        return;
    }
    
    const panel = document.getElementById('adminPanel');
    if (!panel) {
        console.error('❌ Panel non trouvé');
        return;
    }
    
    panel.style.display = 'block';
    console.log('✅ Panel affiché');
    loadAdminPlugsList();
}

function closeAdminPanel() {
    const panel = document.getElementById('adminPanel');
    if (panel) {
        panel.style.display = 'none';
    }
}

function switchAdminTab(tab) {
    // Changer les boutons
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Afficher le bon contenu
    if (tab === 'plugs') {
        loadAdminPlugsList();
    } else if (tab === 'depts') {
        loadAdminDeptsList();
    }
}

function loadAdminPlugsList() {
    const content = document.getElementById('adminContent');
    
    let html = `
        <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0;">➕ Ajouter un Plug</h3>
            <input type="text" id="newPlugName" placeholder="Nom" style="width: 100%; padding: 10px; margin: 5px 0; background: #222; border: 1px solid #444; border-radius: 4px; color: #fff;">
            <input type="text" id="newPlugDepts" placeholder="Départements (54,57)" style="width: 100%; padding: 10px; margin: 5px 0; background: #222; border: 1px solid #444; border-radius: 4px; color: #fff;">
            <input type="text" id="newPlugDesc" placeholder="Description" style="width: 100%; padding: 10px; margin: 5px 0; background: #222; border: 1px solid #444; border-radius: 4px; color: #fff;">
            <input type="text" id="newPlugTg" placeholder="https://t.me/username" style="width: 100%; padding: 10px; margin: 5px 0; background: #222; border: 1px solid #444; border-radius: 4px; color: #fff;">
            <input type="text" id="newPlugEmoji" placeholder="Emoji" maxlength="2" style="width: 100%; padding: 10px; margin: 5px 0; background: #222; border: 1px solid #444; border-radius: 4px; color: #fff;">
            <input type="number" id="newPlugRating" placeholder="Note (0-5)" min="0" max="5" step="0.1" value="4.5" style="width: 100%; padding: 10px; margin: 5px 0; background: #222; border: 1px solid #444; border-radius: 4px; color: #fff;">
            <button onclick="addPlug()" style="width: 100%; padding: 12px; margin-top: 10px; background: #4caf50; border: none; border-radius: 4px; color: #fff; font-weight: bold; cursor: pointer;">Ajouter</button>
        </div>
        
        <h3>📋 Plugs Existants</h3>
    `;
    
    // Liste des plugs
    const allPlugs = new Map();
    Object.values(plugsData).forEach(deptPlugs => {
        deptPlugs?.forEach(plug => {
            if (!allPlugs.has(plug.id)) {
                allPlugs.set(plug.id, plug);
            }
        });
    });
    
    allPlugs.forEach(plug => {
        const depts = (plug.departments || [plug.department]).join(', ');
        html += `
            <div style="background: #1a1a1a; padding: 15px; margin: 10px 0; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong style="font-size: 16px;">${plug.emoji} ${plug.name}</strong>
                    <div style="color: #888; font-size: 13px; margin-top: 5px;">Depts: ${depts} | Note: ${plug.rating}</div>
                </div>
                <button onclick="deletePlug(${plug.id})" style="padding: 8px 16px; background: #f44336; border: none; border-radius: 4px; color: #fff; cursor: pointer;">🗑️</button>
            </div>
        `;
    });
    
    content.innerHTML = html;
}

function loadAdminDeptsList() {
    const content = document.getElementById('adminContent');
    
    let html = `
        <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0;">➕ Ajouter un Département</h3>
            <input type="text" id="newDeptNum" placeholder="Numéro (57)" style="width: 100%; padding: 10px; margin: 5px 0; background: #222; border: 1px solid #444; border-radius: 4px; color: #fff;">
            <input type="text" id="newDeptName" placeholder="Nom (Moselle)" style="width: 100%; padding: 10px; margin: 5px 0; background: #222; border: 1px solid #444; border-radius: 4px; color: #fff;">
            <input type="text" id="newDeptEmoji" placeholder="Emoji" maxlength="2" style="width: 100%; padding: 10px; margin: 5px 0; background: #222; border: 1px solid #444; border-radius: 4px; color: #fff;">
            <button onclick="addDept()" style="width: 100%; padding: 12px; margin-top: 10px; background: #4caf50; border: none; border-radius: 4px; color: #fff; font-weight: bold; cursor: pointer;">Ajouter</button>
        </div>
        
        <h3>📋 Départements</h3>
    `;
    
    Object.entries(appConfig.departments || {}).forEach(([num, dept]) => {
        const plugCount = (plugsData[num] || []).length;
        html += `
            <div style="background: #1a1a1a; padding: 15px; margin: 10px 0; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong style="font-size: 16px;">${dept.emoji} ${dept.name} (${num})</strong>
                    <div style="color: #888; font-size: 13px; margin-top: 5px;">Plugs: ${plugCount}</div>
                </div>
                <button onclick="deleteDept('${num}')" style="padding: 8px 16px; background: #f44336; border: none; border-radius: 4px; color: #fff; cursor: pointer;">🗑️</button>
            </div>
        `;
    });
    
    content.innerHTML = html;
}

function addPlug() {
    const name = document.getElementById('newPlugName')?.value.trim();
    const depts = document.getElementById('newPlugDepts')?.value.trim();
    const desc = document.getElementById('newPlugDesc')?.value.trim();
    const tg = document.getElementById('newPlugTg')?.value.trim();
    const emoji = document.getElementById('newPlugEmoji')?.value.trim() || '📍';
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
        departments,
        description: desc,
        telegram: tg,
        emoji,
        image: 'https://i.ibb.co/mCTpqd9y/88f76eb4-a1ad-42ae-a853-2af312179d86-removebg-preview.png',
        rating,
        active: true
    };
    
    departments.forEach(dept => {
        if (!plugsData[dept]) plugsData[dept] = [];
        plugsData[dept].push(newPlug);
    });
    
    alert('✅ Plug ajouté!');
    loadAdminPlugsList();
    displayPlugsGrid(currentDepartmentFilter);
}

function deletePlug(plugId) {
    if (!confirm('Supprimer ce plug ?')) return;
    
    Object.keys(plugsData).forEach(dept => {
        plugsData[dept] = plugsData[dept].filter(p => p.id !== plugId);
    });
    
    alert('✅ Plug supprimé!');
    loadAdminPlugsList();
    displayPlugsGrid(currentDepartmentFilter);
}

function addDept() {
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
    loadAdminDeptsList();
}

function deleteDept(num) {
    if (!confirm('Supprimer ce département ?')) return;
    
    delete appConfig.departments[num];
    alert('✅ Département supprimé!');
    loadAdminDeptsList();
}

// Thème Telegram
if (tg.setBackgroundColor) tg.setBackgroundColor('#000000');
if (tg.setHeaderColor) tg.setHeaderColor('#1a1a1a');

// Démarrage
document.addEventListener('DOMContentLoaded', loadConfig);
