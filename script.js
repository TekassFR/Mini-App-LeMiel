// Telegram WebApp initialization
const tg = window.Telegram.WebApp;

// Configuration
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
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        appConfig = await response.json();
        plugsData = appConfig.plugs;
        console.log('Configuration chargée avec succès');
        initializeApp();
    } catch (error) {
        console.error('Erreur lors du chargement de la configuration:', error);
        showError('Impossible de charger les données. Veuillez rafraîchir.');
    }
}

// Initialisation de l'app
function initializeApp() {
    displayPlugsGrid('all');
    setupCategoryButtons();
    displayUserInfo();
}

// Affichage des informations utilisateur
function displayUserInfo() {
    const userInfo = document.getElementById('user-info');
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        userInfo.textContent = `Bienvenue, ${user.first_name || 'Ami'} 👋`;
    }
}

// Configuration du sélecteur de départements
function setupCategoryButtons() {
    const select = document.getElementById('department-select');
    select.addEventListener('change', function() {
        const dept = this.value;
        currentDepartmentFilter = dept;
        displayPlugsGrid(dept);
    });
}

// Affichage de la grille des plugs
function displayPlugsGrid(department) {
    const grid = document.getElementById('menu-grid');
    grid.innerHTML = '';

    let plugsToDisplay = [];

    if (department === 'all') {
        // Tous les plugs
        Object.values(plugsData).forEach(departmentPlugs => {
            plugsToDisplay = plugsToDisplay.concat(departmentPlugs);
        });
    } else {
        // Plugs d'un département spécifique
        plugsToDisplay = plugsData[department] || [];
    }

    if (plugsToDisplay.length === 0) {
        grid.innerHTML = '<div class="no-results">Aucun plug trouvé dans cette région.</div>';
        return;
    }

    plugsToDisplay.forEach(plug => {
        const plugCard = createPlugCard(plug);
        grid.appendChild(plugCard);
    });
}

// Création d'une carte de plug
function createPlugCard(plug) {
    const card = document.createElement('div');
    card.className = 'menu-item';
    card.style.cursor = 'pointer';
    card.onclick = () => openTelegram(plug.telegram);
    
    const ratingStars = '⭐'.repeat(Math.floor(plug.rating)) + (plug.rating % 1 !== 0 ? '✨' : '');
    
    // Gérer plusieurs départements
    const departments = plug.departments || [plug.department];
    const deptBadges = departments.join(' ');
    
    card.innerHTML = `
        <div class="menu-item-image">
            <img src="${plug.image}" alt="${plug.name}" class="product-img">
            <div class="product-emoji">${plug.emoji}</div>
            <div class="product-badge">
                ${deptBadges}
            </div>
        </div>
        <div class="menu-item-content">
            <h3 class="product-name">${plug.name}</h3>
            <p class="product-description">${plug.description}</p>
            <div class="product-footer">
                <div class="product-price">
                    <span class="rating">${ratingStars} ${plug.rating}</span>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

// Affichage du détail d'un plug
function showPlugDetail(plugId) {
    // Rechercher le plug dans tous les départements
    let plug = null;
    for (let dept in plugsData) {
        const found = plugsData[dept].find(p => p.id === plugId);
        if (found) {
            plug = found;
            break;
        }
    }

    if (!plug) return;

    currentPlugId = plug.id;
    const detailPage = document.getElementById('product-detail-page');
    
    // Remplir les informations
    document.getElementById('detail-product-name').textContent = plug.name;
    document.getElementById('detail-product-description').textContent = plug.description;
    document.getElementById('detail-product-img').src = plug.image;
    document.getElementById('detail-product-emoji').textContent = plug.emoji;
    
    // Afficher la note
    const ratingStars = '⭐'.repeat(Math.floor(plug.rating)) + (plug.rating % 1 !== 0 ? '✨' : '');
    const ratingDiv = document.getElementById('detail-rating');
    ratingDiv.innerHTML = `<strong>Note:</strong> ${ratingStars} ${plug.rating}/5`;
    
    // Afficher le département
    const deptName = appConfig.departments[plug.department]?.name || 'Inconnu';
    const deptDiv = document.getElementById('detail-department');
    deptDiv.innerHTML = `<strong>Localisation:</strong> ${appConfig.departments[plug.department]?.emoji || ''} ${deptName}`;
    
    // Afficher le lien Telegram
    const telegramLinkDiv = document.getElementById('plug-telegram-link');
    const telegramUsername = plug.telegram.replace('https://t.me/', '').replace('http://t.me/', '');
    const telegramLink = document.createElement('a');
    telegramLink.href = '#';
    telegramLink.textContent = telegramUsername;
    telegramLink.style.color = '#4a90e2';
    telegramLink.style.textDecoration = 'none';
    telegramLink.style.fontWeight = '600';
    telegramLink.style.borderBottom = '2px solid transparent';
    telegramLink.style.transition = 'all 0.3s ease';
    telegramLink.dataset.telegram = plug.telegram;
    telegramLink.onclick = (e) => {
        e.preventDefault();
        openTelegram(plug.telegram);
    };
    
    telegramLinkDiv.innerHTML = '<strong>📱 Telegram:</strong> ';
    telegramLinkDiv.appendChild(telegramLink);
    
    detailPage.style.display = 'flex';
    window.scrollTo(0, 0);
}

// Fermeture du détail du plug
function closePlugDetail() {
    const detailPage = document.getElementById('product-detail-page');
    detailPage.style.display = 'none';
    currentPlugId = null;
}

// Ouverture du lien Telegram
function openTelegram(telegramUrl) {
    try {
        // Dans Telegram WebApp, utiliser openTelegramLink pour rester dans l'app
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.openTelegramLink) {
            window.Telegram.WebApp.openTelegramLink(telegramUrl);
        } else {
            // Fallback pour navigateur web normal
            window.open(telegramUrl, '_blank');
        }
    } catch (error) {
        console.error('Erreur ouverture Telegram:', error);
        window.location.href = telegramUrl;
    }
}

// Gestion des erreurs
function showError(message) {
    console.error(message);
    const grid = document.getElementById('menu-grid');
    grid.innerHTML = `<div class="error-message">${message}</div>`;
}

// Ouverture du panel admin
function openAdminPanel() {
    const modal = document.getElementById('admin-modal');
    
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const username = tg.initDataUnsafe.user.username || 'user';
        const whitelist = appConfig?.admins?.whitelist || [];
        
        if (!whitelist.includes(username)) {
            alert('❌ Accès refusé. Vous n\'êtes pas administrateur.');
            return;
        }
        
        modal.style.display = 'flex';
        loadAdminPlugsList();
    } else {
        alert('⚠️ Veuillez ouvrir cette page via Telegram');
    }
}

// Fermeture du panel admin
function closeAdminPanel() {
    document.getElementById('admin-modal').style.display = 'none';
}

// Afficher un message dans le panel admin
function showAdminMessage(message, type = 'success') {
    const container = document.getElementById('admin-message-container');
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'success' ? 'admin-success-message' : 'admin-error-message';
    messageDiv.textContent = message;
    container.innerHTML = '';
    container.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Changer d'onglet admin
function switchAdminTab(tabName) {
    const content = document.getElementById('admin-tabs-content');
    
    if (tabName === 'plugs') {
        loadAdminPlugsList();
    } else if (tabName === 'departments') {
        loadAdminDepartmentsList();
    }
    
    // Activer le bouton
    document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

// Charger la liste des plugs en admin
function loadAdminPlugsList() {
    const content = document.getElementById('admin-tabs-content');
    let html = '<div class="admin-form"><h3>➕ Ajouter un Plug</h3>';
    html += `
        <div class="admin-form-group">
            <label>Nom</label>
            <input type="text" id="admin-plug-name" placeholder="Nom du plug">
        </div>
        <div class="admin-form-group">
            <label>Départements (ex: 54,57,55)</label>
            <input type="text" id="admin-plug-depts" placeholder="54,57">
        </div>
        <div class="admin-form-group">
            <label>Description</label>
            <textarea id="admin-plug-desc" placeholder="Description"></textarea>
        </div>
        <div class="admin-form-group">
            <label>Lien Telegram</label>
            <input type="text" id="admin-plug-tg" placeholder="https://t.me/username">
        </div>
        <div class="admin-form-group">
            <label>Emoji</label>
            <input type="text" id="admin-plug-emoji" placeholder="🔥" maxlength="2">
        </div>
        <div class="admin-form-group">
            <label>Note (0-5)</label>
            <input type="number" id="admin-plug-rating" min="0" max="5" step="0.1" value="4.5">
        </div>
        <button class="admin-btn-primary" onclick="addAdminPlug()">Ajouter</button>
    </div>`;
    
    html += '<h3 style="margin-top: 30px;">📋 Plugs Existants</h3>';
    html += '<div class="admin-plugs-list">';
    
    // Afficher tous les plugs uniques
    const plugsMap = new Map();
    Object.values(appConfig.plugs).forEach(deptPlugs => {
        deptPlugs.forEach(plug => {
            if (!plugsMap.has(plug.id)) {
                plugsMap.set(plug.id, plug);
            }
        });
    });
    
    plugsMap.forEach(plug => {
        html += `
            <div class="admin-plug-item">
                <div>
                    <strong>${plug.emoji} ${plug.name}</strong>
                    <p>Depts: ${(plug.departments || [plug.department]).join(', ')}</p>
                </div>
                <button class="admin-btn-danger" onclick="deleteAdminPlug(${plug.id})">Supprimer</button>
            </div>
        `;
    });
    
    html += '</div>';
    content.innerHTML = html;
}

// Ajouter un plug via admin
function addAdminPlug() {
    const name = document.getElementById('admin-plug-name').value;
    const deptsStr = document.getElementById('admin-plug-depts').value;
    const description = document.getElementById('admin-plug-desc').value;
    const telegram = document.getElementById('admin-plug-tg').value;
    const emoji = document.getElementById('admin-plug-emoji').value || '📍';
    const rating = parseFloat(document.getElementById('admin-plug-rating').value) || 4.5;
    
    if (!name || !deptsStr || !description || !telegram) {
        showAdminMessage('⚠️ Veuillez remplir tous les champs obligatoires.', 'error');
        return;
    }
    
    const departments = deptsStr.split(',').map(d => d.trim());
    let maxId = 0;
    Object.values(appConfig.plugs).forEach(deptPlugs => {
        deptPlugs.forEach(p => { if (p.id > maxId) maxId = p.id; });
    });
    
    const newPlug = {
        id: maxId + 1,
        name, departments, description, telegram, emoji,
        image: 'https://i.ibb.co/mCTpqd9y/88f76eb4-a1ad-42ae-a853-2af312179d86-removebg-preview.png',
        rating, active: true
    };
    
    departments.forEach(dept => {
        if (!appConfig.plugs[dept]) appConfig.plugs[dept] = [];
        appConfig.plugs[dept].push(newPlug);
    });
    
    showAdminMessage('✅ Plug ajouté avec succès!');
    document.getElementById('admin-plug-name').value = '';
    document.getElementById('admin-plug-depts').value = '';
    document.getElementById('admin-plug-desc').value = '';
    document.getElementById('admin-plug-tg').value = '';
    loadAdminPlugsList();
}

// Supprimer un plug via admin
function deleteAdminPlug(plugId) {
    if (!confirm('Supprimer ce plug ?')) return;
    
    Object.keys(appConfig.plugs).forEach(dept => {
        appConfig.plugs[dept] = appConfig.plugs[dept].filter(p => p.id !== plugId);
    });
    
    showAdminMessage('✅ Plug supprimé!');
    loadAdminPlugsList();
}

// Charger la liste des départements en admin
function loadAdminDepartmentsList() {
    const content = document.getElementById('admin-tabs-content');
    let html = '<div class="admin-form"><h3>➕ Ajouter un Département</h3>';
    html += `
        <div class="admin-form-group">
            <label>Numéro</label>
            <input type="text" id="admin-dept-number" placeholder="57">
        </div>
        <div class="admin-form-group">
            <label>Nom</label>
            <input type="text" id="admin-dept-name" placeholder="Moselle">
        </div>
        <div class="admin-form-group">
            <label>Emoji</label>
            <input type="text" id="admin-dept-emoji" placeholder="🏭" maxlength="2">
        </div>
        <button class="admin-btn-primary" onclick="addAdminDept()">Ajouter</button>
    </div>`;
    
    html += '<h3 style="margin-top: 30px;">📋 Départements</h3>';
    html += '<div class="admin-depts-list">';
    
    Object.entries(appConfig.departments).forEach(([num, dept]) => {
        html += `
            <div class="admin-dept-item">
                <div>
                    <strong>${dept.emoji} ${dept.name} (${num})</strong>
                    <p>Plugs: ${(appConfig.plugs[num] || []).length}</p>
                </div>
                <button class="admin-btn-danger" onclick="deleteAdminDept('${num}')">Supprimer</button>
            </div>
        `;
    });
    
    html += '</div>';
    content.innerHTML = html;
}

// Ajouter un département
function addAdminDept() {
    const number = document.getElementById('admin-dept-number').value;
    const name = document.getElementById('admin-dept-name').value;
    const emoji = document.getElementById('admin-dept-emoji').value || '📍';
    
    if (!number || !name) {
        showAdminMessage('⚠️ Veuillez remplir tous les champs.', 'error');
        return;
    }
    
    if (appConfig.departments[number]) {
        showAdminMessage('⚠️ Ce département existe déjà.', 'error');
        return;
    }
    
    appConfig.departments[number] = { name, emoji };
    if (!appConfig.plugs[number]) appConfig.plugs[number] = [];
    
    showAdminMessage('✅ Département ajouté!');
    document.getElementById('admin-dept-number').value = '';
    document.getElementById('admin-dept-name').value = '';
    loadAdminDepartmentsList();
}

// Supprimer un département
function deleteAdminDept(number) {
    if (!confirm('Supprimer ce département ?')) return;
    delete appConfig.departments[number];
    showAdminMessage('✅ Département supprimé!');
    loadAdminDepartmentsList();
}

// Changement de thème selon le thème du système Telegram
if (tg.setBackgroundColor) {
    tg.setBackgroundColor('#000000');
}

if (tg.setHeaderColor) {
    tg.setHeaderColor('#1a1a1a');
}

// Chargement initial
document.addEventListener('DOMContentLoaded', loadConfig);
