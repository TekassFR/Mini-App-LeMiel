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

// Constantes localStorage
const STORAGE_KEY_REVIEWS = 'lemiel_reviews';
const STORAGE_KEY_PLUGS = 'lemiel_plugs';
const STORAGE_KEY_DEPARTMENTS = 'lemiel_departments';

// Chargement de la configuration
async function loadConfig() {
    try {
        const response = await fetch('./config.json');
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        appConfig = await response.json();
        
        // Charger les plugs et départements depuis localStorage ou config
        loadPlugsFromStorage();
        loadDepartmentsFromStorage();
        
        adminConfig = appConfig.admins || {};
        
        // Charger les reviews depuis le localStorage ou depuis la config
        loadReviewsFromStorage();
        
        console.log('Configuration chargée');
        initializeApp();
    } catch (error) {
        console.error('Erreur chargement config:', error);
    }
}

// Charger les plugs depuis localStorage
function loadPlugsFromStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_PLUGS);
        if (stored) {
            plugsData = JSON.parse(stored);
            console.log('Plugs chargés depuis le stockage local');
        } else {
            plugsData = appConfig.plugs;
        }
    } catch (error) {
        console.error('Erreur chargement plugs:', error);
        plugsData = appConfig.plugs;
    }
}

// Charger les départements depuis localStorage
function loadDepartmentsFromStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_DEPARTMENTS);
        if (stored) {
            appConfig.departments = JSON.parse(stored);
            console.log('Départements chargés depuis le stockage local');
        }
    } catch (error) {
        console.error('Erreur chargement départements:', error);
    }
}

// Sauvegarder les plugs dans localStorage
function savePlugsToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY_PLUGS, JSON.stringify(plugsData));
        console.log('Plugs sauvegardés');
    } catch (error) {
        console.error('Erreur sauvegarde plugs:', error);
    }
}

// Sauvegarder les départements dans localStorage
function saveDepartmentsToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY_DEPARTMENTS, JSON.stringify(appConfig.departments));
        console.log('Départements sauvegardés');
    } catch (error) {
        console.error('Erreur sauvegarde départements:', error);
    }
}

// Charger les reviews depuis localStorage
function loadReviewsFromStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_REVIEWS);
        if (stored) {
            reviewsConfig = JSON.parse(stored);
            console.log('Reviews chargées depuis le stockage local');
        } else {
            // Sinon, utiliser la config par défaut
            reviewsConfig = appConfig.reviews || { pending: [], approved: [] };
        }
    } catch (error) {
        console.error('Erreur chargement reviews:', error);
        reviewsConfig = appConfig.reviews || { pending: [], approved: [] };
    }
}

// Sauvegarder les reviews dans localStorage
function saveReviewsToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(reviewsConfig));
        console.log('Reviews sauvegardées');
    } catch (error) {
        console.error('Erreur sauvegarde reviews:', error);
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
        const name = user.first_name || user.username || 'Ami';
        userInfo.textContent = `Bienvenue, ${name} 👋`;
    } else {
        userInfo.textContent = `Bienvenue 👋`;
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
            <div class="plug-card">
                <div class="plug-dept-badge">${deptBadges}</div>
                <div class="plug-image" style="background-image: url('${plug.image}'); background-size: contain; background-repeat: no-repeat; background-position: center;" onclick="openTelegramProfile('${plug.telegram}')"></div>
                <div class="plug-content">
                    <h3 class="plug-name" onclick="openTelegramProfile('${plug.telegram}')">${plug.emoji} ${plug.name}</h3>
                    <p class="plug-description" onclick="openTelegramProfile('${plug.telegram}')">${plug.description}</p>
                    <div class="plug-rating" onclick="openTelegramProfile('${plug.telegram}')">${starsHTML} ${plug.rating}</div>
                    <button class="review-btn" onclick="event.stopPropagation(); openReviewModal(${plug.id})">⭐ Laisser un avis</button>
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
    } else if (tab === 'reviews') {
        loadAdminReviews();
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
    
    // Sauvegarder
    savePlugsToStorage();
    
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
    
    // Sauvegarder
    savePlugsToStorage();
    
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
    
    // Sauvegarder
    saveDepartmentsToStorage();
    
    alert('✅ Département ajouté!');
    document.getElementById('newDeptNum').value = '';
    document.getElementById('newDeptName').value = '';
    document.getElementById('newDeptEmoji').value = '';
    displayExistingDepts();
}

function deleteDeptAdmin(num) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce département?')) return;
    
    delete appConfig.departments[num];
    
    // Sauvegarder
    saveDepartmentsToStorage();
    
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
                <input type="text" id="newAdminUsername" placeholder="lamentale57">
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

// ========== SYSTÈME D'AVIS ==========

let currentReviewPlugId = null;
let selectedRating = 0;
let reviewsConfig = { pending: [], approved: [] };

function openReviewModal(plugId) {
    const plug = findPlugById(plugId);
    if (!plug) return;
    
    currentReviewPlugId = plugId;
    selectedRating = 0;
    document.getElementById('review-comment').value = '';
    
    // Reset étoiles
    document.querySelectorAll('.star-rating').forEach(star => {
        star.textContent = '☆';
        star.style.color = 'rgba(255,255,255,0.3)';
    });
    
    document.getElementById('review-modal').style.display = 'flex';
}

function closeReviewModal() {
    document.getElementById('review-modal').style.display = 'none';
    currentReviewPlugId = null;
    selectedRating = 0;
}

function selectRating(rating) {
    selectedRating = rating;
    
    document.querySelectorAll('.star-rating').forEach((star, index) => {
        if (index < rating) {
            star.textContent = '★';
            star.style.color = '#FFD700';
        } else {
            star.textContent = '☆';
            star.style.color = 'rgba(255,255,255,0.3)';
        }
    });
}

function submitReview() {
    if (!selectedRating) {
        alert('⚠️ Veuillez sélectionner une note');
        return;
    }
    
    const comment = document.getElementById('review-comment').value.trim();
    if (!comment) {
        alert('⚠️ Veuillez écrire un commentaire');
        return;
    }
    
    const user = tg.initDataUnsafe?.user;
    const username = user?.username || user?.first_name || 'Anonyme';
    
    const review = {
        id: Date.now(),
        plugId: currentReviewPlugId,
        username: username,
        rating: selectedRating,
        comment: comment,
        date: new Date().toISOString(),
        status: 'pending'
    };
    
    // Ajouter aux avis en attente
    if (!reviewsConfig.pending) reviewsConfig.pending = [];
    reviewsConfig.pending.push(review);
    
    // Sauvegarder
    saveReviewsToStorage();
    
    alert('✅ Votre avis a été envoyé! Il sera publié après validation par un administrateur.');
    closeReviewModal();
}

function findPlugById(plugId) {
    for (const dept in plugsData) {
        const plug = plugsData[dept]?.find(p => p.id === plugId);
        if (plug) return plug;
    }
    return null;
}

function loadAdminReviews() {
    const content = document.getElementById('admin-content');
    
    const pendingReviews = reviewsConfig.pending || [];
    const approvedReviews = reviewsConfig.approved || [];
    
    let html = `
        <div style="margin-bottom: 30px;">
            <h3 style="color: #fff; margin-bottom: 15px;">⏳ Avis en Attente (${pendingReviews.length})</h3>
            <div style="max-height: 300px; overflow-y: auto;">
    `;
    
    if (pendingReviews.length === 0) {
        html += '<p style="color: rgba(255,255,255,0.5); text-align: center; padding: 20px;">Aucun avis en attente</p>';
    } else {
        pendingReviews.forEach(review => {
            const plug = findPlugById(review.plugId);
            const plugName = plug ? plug.name : `Plug #${review.plugId}`;
            const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
            
            html += `
                <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; margin-bottom: 10px; border: 1px solid rgba(255,255,255,0.1);">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                        <div>
                            <strong style="color: #fff;">${plugName}</strong>
                            <div style="color: #FFD700; font-size: 16px; margin: 5px 0;">${stars}</div>
                            <small style="color: rgba(255,255,255,0.6);">Par @${review.username}</small>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button onclick="approveReview(${review.id})" style="background: #4CAF50; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">✓ Approuver</button>
                            <button onclick="rejectReview(${review.id})" style="background: #f44336; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">✕ Rejeter</button>
                        </div>
                    </div>
                    <p style="color: rgba(255,255,255,0.8); font-size: 14px; line-height: 1.5;">${review.comment}</p>
                </div>
            `;
        });
    }
    
    html += `
            </div>
        </div>
        <div>
            <h3 style="color: #fff; margin-bottom: 15px;">✅ Avis Approuvés (${approvedReviews.length})</h3>
            <div style="max-height: 300px; overflow-y: auto;">
    `;
    
    if (approvedReviews.length === 0) {
        html += '<p style="color: rgba(255,255,255,0.5); text-align: center; padding: 20px;">Aucun avis approuvé</p>';
    } else {
        approvedReviews.forEach(review => {
            const plug = findPlugById(review.plugId);
            const plugName = plug ? plug.name : `Plug #${review.plugId}`;
            const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
            
            html += `
                <div style="background: rgba(76, 175, 80, 0.1); padding: 15px; border-radius: 10px; margin-bottom: 10px; border: 1px solid rgba(76, 175, 80, 0.3);">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                        <div>
                            <strong style="color: #fff;">${plugName}</strong>
                            <div style="color: #FFD700; font-size: 16px; margin: 5px 0;">${stars}</div>
                            <small style="color: rgba(255,255,255,0.6);">Par @${review.username}</small>
                        </div>
                        <button onclick="deleteReview(${review.id})" style="background: #f44336; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">🗑️ Supprimer</button>
                    </div>
                    <p style="color: rgba(255,255,255,0.8); font-size: 14px; line-height: 1.5;">${review.comment}</p>
                </div>
            `;
        });
    }
    
    html += '</div></div>';
    content.innerHTML = html;
}

function approveReview(reviewId) {
    const reviewIndex = reviewsConfig.pending.findIndex(r => r.id === reviewId);
    if (reviewIndex === -1) return;
    
    const review = reviewsConfig.pending[reviewIndex];
    review.status = 'approved';
    
    // Déplacer vers approuvés
    reviewsConfig.pending.splice(reviewIndex, 1);
    if (!reviewsConfig.approved) reviewsConfig.approved = [];
    reviewsConfig.approved.push(review);
    
    // Sauvegarder
    saveReviewsToStorage();
    
    // Recalculer la note du plug
    updatePlugRating(review.plugId);
    
    alert('✅ Avis approuvé!');
    loadAdminReviews();
}

function rejectReview(reviewId) {
    if (!confirm('Êtes-vous sûr de vouloir rejeter cet avis?')) return;
    
    reviewsConfig.pending = reviewsConfig.pending.filter(r => r.id !== reviewId);
    
    // Sauvegarder
    saveReviewsToStorage();
    
    alert('✅ Avis rejeté!');
    loadAdminReviews();
}

function deleteReview(reviewId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet avis?')) return;
    
    const review = reviewsConfig.approved.find(r => r.id === reviewId);
    reviewsConfig.approved = reviewsConfig.approved.filter(r => r.id !== reviewId);
    
    // Sauvegarder
    saveReviewsToStorage();
    
    if (review) {
        updatePlugRating(review.plugId);
    }
    
    alert('✅ Avis supprimé!');
    loadAdminReviews();
}

function updatePlugRating(plugId) {
    // Calculer la moyenne des avis approuvés pour ce plug
    const plugReviews = reviewsConfig.approved.filter(r => r.plugId === plugId);
    
    if (plugReviews.length === 0) return;
    
    const avgRating = plugReviews.reduce((sum, r) => sum + r.rating, 0) / plugReviews.length;
    const roundedRating = Math.round(avgRating * 10) / 10; // Arrondi à 1 décimale
    
    // Mettre à jour la note du plug
    for (const dept in plugsData) {
        const plug = plugsData[dept]?.find(p => p.id === plugId);
        if (plug) {
            plug.rating = roundedRating;
            break;
        }
    }
    
    // Rafraîchir l'affichage
    displayPlugsGrid(currentDepartmentFilter);
}

// Navigation entre les pages
function switchPage(page) {
    // Redirection directe vers le canal Telegram
    if (page === 'canal') {
        const canalUrl = 'https://t.me/+1h_HSbnz1hIyN2E0';
        try {
            if (tg.openTelegramLink) {
                tg.openTelegramLink(canalUrl);
            } else {
                window.open(canalUrl, '_blank');
            }
        } catch (error) {
            console.error('Erreur ouverture canal:', error);
            window.open(canalUrl, '_blank');
        }
        return;
    }
    
    // Masquer toutes les pages
    document.getElementById('plugs-page').style.display = 'none';
    document.getElementById('avis-page').style.display = 'none';
    document.getElementById('infos-page').style.display = 'none';
    document.getElementById('canal-page').style.display = 'none';
    
    // Afficher la page sélectionnée
    const pageId = page + '-page';
    const selectedPage = document.getElementById(pageId);
    if (selectedPage) {
        selectedPage.style.display = 'block';
    }
    
    // Charger les avis si c'est la page "avis"
    if (page === 'avis') {
        displayReviews();
    }
    
    // Charger les infos si c'est la page "infos"
    if (page === 'infos') {
        displayInfos();
    }
    
    // Mettre à jour les onglets actifs
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-page="${page}"]`).classList.add('active');
}

// Fonction pour afficher les infos
function displayInfos() {
    const infosPage = document.getElementById('infos-page');
    
    infosPage.innerHTML = `
        <div class="page-content">
            <h2>ℹ️ Infos</h2>
            <div class="infos-container">
                <div class="info-card">
                    <h3>📍 À propos</h3>
                    <p>Nous sommes spécialisé dans tout le <strong>Grand-Est</strong>!</p>
                </div>
                
                <div class="info-card">
                    <h3>💬 Contacter</h3>
                    <p>Rejoins notre canal :</p>
                    <a href="https://t.me/+1h_HSbnz1hIyN2E0" class="info-link" onclick="openTelegramLink(event, 'https://t.me/+1h_HSbnz1hIyN2E0')">
                        📱 Accéder au canal
                    </a>
                </div>
                
                <div class="info-card">
                    <h3>🚀 Rejoindre le réseau</h3>
                    <p>Pour être affiché sur notre MiniApp, faut voir avec:</p>
                    <a href="https://t.me/sousouwsofficiel" class="info-link" onclick="openTelegramLink(event, 'https://t.me/sousouwsofficiel')">
                        👤 @sousouwsofficiel
                    </a>
                </div>
            </div>
        </div>
    `;
}

// Fonction helper pour ouvrir les liens Telegram
function openTelegramLink(event, url) {
    event.preventDefault();
    try {
        if (tg.openTelegramLink) {
            tg.openTelegramLink(url);
        } else {
            window.open(url, '_blank');
        }
    } catch (error) {
        console.error('Erreur ouverture Telegram:', error);
        window.open(url, '_blank');
    }
}

// Fonction pour afficher les avis
function displayReviews() {
    const avisPage = document.getElementById('avis-page');
    
    // Récupérer tous les avis approuvés
    const approvedReviews = reviewsConfig.approved || [];
    
    if (approvedReviews.length === 0) {
        avisPage.innerHTML = `
            <div class="page-content">
                <h2>⭐ Avis</h2>
                <div style="padding: 40px 20px; text-align: center; color: rgba(255,255,255,0.6);">
                    <p>Aucun avis pour le moment 🤷‍♂️</p>
                    <p style="font-size: 0.9rem; margin-top: 10px;">Soyez le premier à laisser un avis!</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Générer le HTML des avis
    const reviewsHTML = approvedReviews.map(review => {
        const plug = findPlugById(review.plugId);
        const plugName = plug ? plug.name : 'Plug inconnu';
        const plugEmoji = plug ? plug.emoji : '📍';
        
        // Générer les étoiles
        let starsHTML = '⭐'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
        
        // Formater la date
        const date = new Date(review.date);
        const dateStr = date.toLocaleDateString('fr-FR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <div class="review-card">
                <div class="review-header">
                    <div class="review-plug-info">
                        <h3 class="review-plug-name">${plugEmoji} ${plugName}</h3>
                        <div class="review-rating">${starsHTML}</div>
                    </div>
                    <div class="review-date">${dateStr}</div>
                </div>
                <div class="review-author">Par <strong>${review.username}</strong></div>
                <div class="review-comment">${review.comment}</div>
            </div>
        `;
    }).join('');
    
    avisPage.innerHTML = `
        <div class="page-content">
            <h2>⭐ Avis</h2>
            <div class="reviews-container">
                ${reviewsHTML}
            </div>
        </div>
    `;
}

// Thème Telegram
if (tg.setBackgroundColor) tg.setBackgroundColor('#000000');
if (tg.setHeaderColor) tg.setHeaderColor('#1a1a1a');

// Démarrage
document.addEventListener('DOMContentLoaded', loadConfig);
